import "server-only";
import { createLocalProvider } from "./providers/local";
import { createOpenAIProvider } from "./providers/openai";
import { createReplicateProvider } from "./providers/replicate";
import type { ImageProvider } from "./types";

let cached: ImageProvider | null = null;

/**
 * Picks the adapter from the environment. Anything unrecognised, or a provider
 * whose key is missing, falls back to drawing in-house rather than failing —
 * the studio keeps working, it just stops calling a model.
 */
export function imageProvider(): ImageProvider {
  if (cached) return cached;

  const choice = (process.env.IMAGE_PROVIDER ?? "local").toLowerCase();

  if (choice === "openai" && process.env.OPENAI_API_KEY) {
    cached = createOpenAIProvider();
  } else if (choice === "replicate" && process.env.REPLICATE_API_TOKEN) {
    cached = createReplicateProvider();
  } else {
    cached = createLocalProvider();
  }

  return cached;
}

/** True when a real model is wired up, which the studio tells the customer. */
export function isModelConfigured(): boolean {
  return imageProvider().name !== "local";
}
