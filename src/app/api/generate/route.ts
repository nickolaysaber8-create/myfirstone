import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { screenPrompt } from "@/lib/generation/housePrompt";
import { RateLimitError, runGeneration, startGeneration, toDTO } from "@/lib/generation/pipeline";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const { sessionId } = await import("@/lib/session");
  const session = await sessionId();

  let body: { prompt?: string; referenceId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Expected a JSON body." }, { status: 400 });
  }

  const screened = screenPrompt(body.prompt ?? "");
  if (!screened.ok) {
    return NextResponse.json({ error: screened.reason }, { status: 422 });
  }

  try {
    const { generation, cached, started } = await startGeneration({
      sessionId: session,
      subject: screened.prompt,
      referenceId: body.referenceId ?? null,
    });

    if (cached) {
      return NextResponse.json(await toDTO(generation, true));
    }

    // Already running for this session — hand back the same one to poll.
    if (!started) {
      return NextResponse.json(await toDTO(generation), { status: 202 });
    }

    // Kick the work off without blocking the response, so the studio can show
    // progress instead of holding a request open for a minute.
    void runGeneration(generation.id).catch(async (error) => {
      console.error("generation failed", error);
      await prisma.generation.update({
        where: { id: generation.id },
        data: {
          status: "FAILED",
          error: "The studio couldn't draw that. Try again in a moment.",
          finishedAt: new Date(),
        },
      });
    });

    return NextResponse.json(await toDTO({ ...generation, designs: [] }), { status: 202 });
  } catch (error) {
    if (error instanceof RateLimitError) {
      return NextResponse.json(
        {
          error: `That's a lot of designs. Try again in ${error.retryAfterMinutes} minute${
            error.retryAfterMinutes === 1 ? "" : "s"
          }.`,
        },
        { status: 429 },
      );
    }
    console.error("generation could not start", error);
    return NextResponse.json(
      { error: "We couldn't start that design. Try again in a moment." },
      { status: 500 },
    );
  }
}
