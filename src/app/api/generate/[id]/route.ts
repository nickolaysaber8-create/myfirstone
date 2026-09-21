import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { toDTO } from "@/lib/generation/pipeline";
import { sessionId } from "@/lib/session";

export const runtime = "nodejs";

/** Polled by the studio for progress. One row read, no model calls. */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await sessionId();

  const generation = await prisma.generation.findFirst({
    where: { id, sessionId: session },
    include: { designs: { orderBy: { createdAt: "asc" } } },
  });

  if (!generation) {
    return NextResponse.json({ error: "That design isn't here." }, { status: 404 });
  }

  return NextResponse.json(await toDTO(generation), {
    headers: { "Cache-Control": "no-store" },
  });
}
