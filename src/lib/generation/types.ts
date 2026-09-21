/** Shared between the server pipeline and the studio, so no `server-only` here. */

export const VARIANTS = ["scattered", "hero", "repeat", "band"] as const;
export type VariantKey = (typeof VARIANTS)[number];

export const VARIANT_LABELS: Record<VariantKey, string> = {
  scattered: "Scattered",
  hero: "Hero",
  repeat: "Repeat",
  band: "Band",
};

export type GenerationState = "PENDING" | "RUNNING" | "READY" | "FAILED";

export type DesignDTO = {
  id: string;
  name: string;
  variant: VariantKey;
  palette: string[];
  previewUrl: string;
  source: "GENERATED" | "CURATED";
};

export type GenerationDTO = {
  id: string;
  status: GenerationState;
  /** Variants finished, so the bar moves on real work rather than a timer. */
  completed: number;
  total: number;
  designs: DesignDTO[];
  /** Present only when status is FAILED. Written for a customer to read. */
  error?: string;
  /** True when the result came from the cache and cost nothing. */
  cached?: boolean;
};

export type ReferenceImageInput = {
  data: Buffer;
  mimeType: string;
};

export type ProviderRequest = {
  /** Fully composed prompt, house style already applied. */
  prompt: string;
  /** The customer's own words, for adapters that draw rather than prompt. */
  subject: string;
  variant: VariantKey;
  width: number;
  height: number;
  reference?: ReferenceImageInput;
  seed?: number;
};

export type ProviderResult = {
  data: Buffer;
  mimeType: string;
  seed?: string;
};

export interface ImageProvider {
  readonly name: string;
  readonly model: string;
  /** Whether a customer photo can be passed as an image input. */
  readonly supportsReference: boolean;
  generate(request: ProviderRequest): Promise<ProviderResult>;
}

/** Thrown with text that is safe to show a customer. */
export class GenerationError extends Error {
  readonly userMessage: string;

  constructor(userMessage: string, cause?: unknown) {
    super(userMessage);
    this.name = "GenerationError";
    this.userMessage = userMessage;
    this.cause = cause;
  }
}
