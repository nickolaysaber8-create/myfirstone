import { NextResponse } from "next/server";
import { storage } from "@/lib/storage";

export const runtime = "nodejs";

/**
 * Serves stored previews. Print files are deliberately not reachable here —
 * they leave the server only through an order's print-file download.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ key: string[] }> }) {
  const { key } = await params;
  const path = key.map(decodeURIComponent).join("/");

  if (path.includes("..") || path.endsWith("print.png")) {
    return new NextResponse("Not found", { status: 404 });
  }

  const store = await storage();
  const object = await store.get(path);
  if (!object) return new NextResponse("Not found", { status: 404 });

  return new NextResponse(new Uint8Array(object.body), {
    headers: {
      "Content-Type": object.contentType,
      // Keys are per-design and never rewritten, so this can be cached hard.
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
