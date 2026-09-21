import "server-only";
import sharp from "sharp";
import { artworkSvg } from "../artwork";
import type { ImageProvider, ProviderRequest } from "../types";

/**
 * Draws the artwork in-house instead of calling a model. It is what runs with
 * no credentials configured, and what bakes the curated gallery — so the page
 * has instant, free content on first load and a missing API key degrades the
 * studio rather than breaking it.
 */
export function createLocalProvider(): ImageProvider {
  return {
    name: "local",
    model: "house-svg",
    supportsReference: false,

    async generate({ subject, variant, width, height, seed }: ProviderRequest) {
      const svg = artworkSvg({ subject, variant, width, height, seed });
      const data = await sharp(Buffer.from(svg)).png().toBuffer();
      return { data, mimeType: "image/png", seed: seed?.toString() };
    },
  };
}
