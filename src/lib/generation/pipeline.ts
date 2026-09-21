import "server-only";
import { prisma } from "@/lib/db";
import { keys, storage } from "@/lib/storage";
import { TILE_PRINT_PX } from "@/lib/camera/dimensions";
import { composePrompt, designName, promptHash } from "./housePrompt";
import { imageProvider } from "./provider";
import { renderTile } from "./render";
import { GenerationError, VARIANTS, type DesignDTO, type GenerationDTO, type VariantKey } from "./types";

const RATE_WINDOW_MS = 60 * 60 * 1000;

function rateLimit(): number {
  const parsed = Number.parseInt(process.env.GENERATION_RATE_LIMIT ?? "12", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 12;
}

export class RateLimitError extends Error {
  constructor(readonly retryAfterMinutes: number) {
    super("rate limited");
    this.name = "RateLimitError";
  }
}

/**
 * Generations already started by this session in the last hour. Counted from
 * the generations themselves, so there is no counter to drift out of sync.
 */
export async function assertWithinRateLimit(sessionId: string): Promise<void> {
  const since = new Date(Date.now() - RATE_WINDOW_MS);
  const recent = await prisma.generation.findMany({
    where: { sessionId, createdAt: { gte: since } },
    orderBy: { createdAt: "asc" },
    select: { createdAt: true },
  });

  if (recent.length < rateLimit()) return;

  const oldest = recent[0].createdAt.getTime();
  const freesUpIn = Math.max(1, Math.ceil((oldest + RATE_WINDOW_MS - Date.now()) / 60000));
  throw new RateLimitError(freesUpIn);
}

/** A ready generation for the same prompt and photo. Costs nothing to serve. */
export async function findCached(hash: string) {
  return prisma.generation.findFirst({
    where: { promptHash: hash, status: "READY" },
    orderBy: { createdAt: "desc" },
    include: { designs: { orderBy: { createdAt: "asc" } } },
  });
}

/**
 * The same prompt, already running for this session. Someone who submits twice
 * should be reconnected to the work in progress rather than charged a second
 * slot for it — or told they have hit the limit their own first click set off.
 */
async function findInFlight(hash: string, sessionId: string) {
  return prisma.generation.findFirst({
    where: { promptHash: hash, sessionId, status: { in: ["PENDING", "RUNNING"] } },
    orderBy: { createdAt: "desc" },
    include: { designs: { orderBy: { createdAt: "asc" } } },
  });
}

export type StartOptions = {
  sessionId: string;
  subject: string;
  referenceId?: string | null;
};

/**
 * Creates the generation row and returns immediately. The work runs after the
 * response so the customer sees progress rather than a hanging request.
 */
export async function startGeneration({ sessionId, subject, referenceId }: StartOptions) {
  const reference = referenceId
    ? await prisma.referenceImage.findFirst({ where: { id: referenceId, sessionId } })
    : null;

  const hash = promptHash(subject, reference?.contentHash);

  const cached = await findCached(hash);
  if (cached) return { generation: cached, cached: true as const, started: false as const };

  const inFlight = await findInFlight(hash, sessionId);
  if (inFlight) return { generation: inFlight, cached: false as const, started: false as const };

  await assertWithinRateLimit(sessionId);

  const provider = imageProvider();
  const generation = await prisma.generation.create({
    data: {
      sessionId,
      prompt: subject,
      promptHash: hash,
      status: "PENDING",
      provider: provider.name,
      model: provider.model,
      total: VARIANTS.length,
      referenceId: reference?.id ?? null,
    },
    include: { designs: true },
  });

  return { generation, cached: false as const, started: true as const };
}

/**
 * Draws the four variants one at a time, committing each as it lands so the
 * progress the customer sees is work that actually finished. A variant that
 * fails does not discard the ones that worked.
 */
export async function runGeneration(generationId: string): Promise<void> {
  const generation = await prisma.generation.findUnique({
    where: { id: generationId },
    include: { reference: true },
  });
  if (!generation || generation.status !== "PENDING") return;

  await prisma.generation.update({
    where: { id: generationId },
    data: { status: "RUNNING" },
  });

  const provider = imageProvider();
  const store = await storage();

  let reference: { data: Buffer; mimeType: string } | undefined;
  if (generation.reference && provider.supportsReference) {
    const stored = await store.get(generation.reference.storageKey);
    if (stored) reference = { data: stored.body, mimeType: stored.contentType };
  }

  let failure: string | null = null;
  let produced = 0;

  for (const variant of VARIANTS) {
    try {
      const result = await provider.generate({
        prompt: composePrompt(generation.prompt, variant, Boolean(reference)),
        subject: generation.prompt,
        variant,
        width: TILE_PRINT_PX.width,
        height: TILE_PRINT_PX.height,
        reference,
        // Distinct seeds per variant, on top of distinct composition briefs.
        seed: hashSeed(`${generation.promptHash}:${variant}`),
      });

      const tile = await renderTile(result.data);

      const design = await prisma.design.create({
        data: {
          source: "GENERATED",
          name: designName(generation.prompt, variant),
          variant,
          palette: tile.palette,
          printKey: "",
          previewKey: "",
          width: tile.width,
          height: tile.height,
          seed: result.seed ?? null,
          generationId,
        },
      });

      const printKey = keys.print(design.id);
      const previewKey = keys.preview(design.id);
      await store.put(printKey, tile.print, "image/png");
      await store.put(previewKey, tile.preview, "image/webp");

      await prisma.design.update({ where: { id: design.id }, data: { printKey, previewKey } });
      produced += 1;
      await prisma.generation.update({
        where: { id: generationId },
        data: { completed: produced },
      });
    } catch (error) {
      failure =
        error instanceof GenerationError
          ? error.userMessage
          : "Something went wrong drawing that design.";
      // Keep going: three good designs beat none.
    }
  }

  await prisma.generation.update({
    where: { id: generationId },
    data: {
      status: produced > 0 ? "READY" : "FAILED",
      error: produced > 0 ? null : (failure ?? "The studio couldn't draw that."),
      completed: produced,
      finishedAt: new Date(),
    },
  });
}

function hashSeed(value: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) % 2_000_000_000;
}

type GenerationRow = {
  id: string;
  status: string;
  completed: number;
  total: number;
  error: string | null;
  designs: {
    id: string;
    name: string;
    variant: string;
    palette: string[];
    previewKey: string;
    source: string;
  }[];
};

export async function toDTO(generation: GenerationRow, cached = false): Promise<GenerationDTO> {
  const store = await storage();

  const designs: DesignDTO[] = generation.designs
    .filter((design) => design.previewKey)
    .map((design) => ({
      id: design.id,
      name: design.name,
      variant: design.variant as VariantKey,
      palette: design.palette,
      previewUrl: store.publicUrl(design.previewKey),
      source: design.source as DesignDTO["source"],
    }));

  return {
    id: generation.id,
    status: generation.status as GenerationDTO["status"],
    completed: generation.completed,
    total: generation.total,
    designs,
    error: generation.error ?? undefined,
    cached,
  };
}
