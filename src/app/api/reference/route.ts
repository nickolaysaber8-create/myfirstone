import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import sharp from "sharp";
import { prisma } from "@/lib/db";
import { sessionId } from "@/lib/session";
import { keys, storage } from "@/lib/storage";

export const runtime = "nodejs";

const MAX_BYTES = 10 * 1024 * 1024;
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"]);

/**
 * Takes the customer's reference photo and keeps it server-side. It is passed
 * to the model as an image input later; it never becomes a colour swatch and
 * it never goes back to the browser.
 */
export async function POST(request: Request) {
  const session = await sessionId();

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Attach a photo first." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "That photo is over 10 MB. Try a smaller one." }, { status: 413 });
  }
  if (!ALLOWED.has(file.type)) {
    return NextResponse.json({ error: "Use a JPEG, PNG or WebP photo." }, { status: 415 });
  }

  const original = Buffer.from(await file.arrayBuffer());

  let normalised: Buffer;
  try {
    // Re-encode rather than trust the upload: it strips EXIF (including the
    // location the phone wrote into it) and guarantees a format the model takes.
    normalised = await sharp(original, { failOn: "none" })
      .rotate()
      .resize(1024, 1024, { fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 88 })
      .toBuffer();
  } catch {
    return NextResponse.json({ error: "We couldn't read that photo." }, { status: 422 });
  }

  const contentHash = createHash("sha256").update(normalised).digest("hex");
  const store = await storage();

  const reference = await prisma.referenceImage.create({
    data: {
      sessionId: session,
      storageKey: "",
      mimeType: "image/jpeg",
      bytes: normalised.byteLength,
      contentHash,
    },
  });

  const storageKey = keys.reference(reference.id, "jpg");
  await store.put(storageKey, normalised, "image/jpeg");
  await prisma.referenceImage.update({ where: { id: reference.id }, data: { storageKey } });

  return NextResponse.json({ referenceId: reference.id, name: file.name });
}
