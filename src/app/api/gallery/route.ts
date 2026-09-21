import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { storage } from "@/lib/storage";
import type { DesignDTO, VariantKey } from "@/lib/generation/types";

export const runtime = "nodejs";
// Reads the database, so it must not be prerendered at build time — the
// Cache-Control header below is what actually keeps it cheap.
export const dynamic = "force-dynamic";

/**
 * The curated gallery: drawn in-house ahead of time, so the first thing a
 * visitor sees is free and instant rather than a model call.
 */
export async function GET() {
  const designs = await prisma.design.findMany({
    where: { source: "CURATED" },
    orderBy: { createdAt: "asc" },
  });

  const store = await storage();
  const payload: DesignDTO[] = designs.map((design) => ({
    id: design.slug ?? design.id,
    name: design.name,
    variant: design.variant as VariantKey,
    palette: design.palette,
    previewUrl: store.publicUrl(design.previewKey),
    source: "CURATED",
  }));

  return NextResponse.json(payload, {
    headers: { "Cache-Control": "public, max-age=300, stale-while-revalidate=86400" },
  });
}
