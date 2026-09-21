import { createHash } from "node:crypto";
import { TILE_MM } from "@/lib/camera/dimensions";
import { VARIANTS, type VariantKey } from "./types";

/**
 * Bump when the house style changes. It is part of the cache key, so old
 * results stop being served the moment the style moves on.
 */
export const HOUSE_STYLE_VERSION = 1;

const HOUSE_STYLE = [
  "Flat vector poster artwork.",
  "Bold simplified shapes with clean edges and generous negative space.",
  "Limited palette: four or five flat colours, no more.",
  "Solid fills only — no gradients, no soft shading, no noise, no texture.",
  "No photorealism, no 3D rendering, no depth of field, no drop shadows.",
  "Absolutely no text, letters, numbers, words, signatures, logos or watermarks.",
  "No borders, frames or margins — the artwork runs to all four edges.",
  "The left and right edges must meet seamlessly when the image is tiled",
  "horizontally: shapes crossing the right edge continue exactly at the left.",
  "Even visual weight across the whole width, nothing centred as a single focal point.",
].join(" ");

/**
 * Four compositions rather than four re-rolls. The variation is in the brief,
 * not in the seed, so the customer gets genuinely different layouts of their
 * subject instead of the same picture shaken.
 */
const VARIANT_BRIEFS: Record<VariantKey, string> = {
  scattered:
    "Composition: the subject repeated small and scattered loosely across the whole surface at varied sizes and angles, like a tossed pattern on wrapping paper.",
  hero: "Composition: one large statement rendering of the subject occupying most of the height, with a few much smaller supporting elements spread either side of it.",
  repeat:
    "Composition: a tight regular grid of the subject, evenly spaced in offset rows, every instance the same size, like a printed textile.",
  band: "Composition: the subject arranged in a single horizontal band across the middle, with plain flat colour above and below and a thin rule separating them.",
};

/**
 * Names we must never print. Selling a wrapped camera that carries another
 * manufacturer's marks is a trademark problem, and a prompt is the easiest
 * way for one to get onto the artwork.
 */
const PROTECTED_MARKS = [
  "kodak",
  "fujifilm",
  "fuji",
  "ilford",
  "polaroid",
  "instax",
  "lomography",
  "lomo",
  "agfa",
  "canon",
  "nikon",
  "leica",
  "gopro",
  "disney",
  "pixar",
  "marvel",
  "nike",
  "adidas",
  "supreme",
  "chanel",
  "gucci",
  "louis vuitton",
  "coca-cola",
  "coca cola",
  "pepsi",
  "starbucks",
];

export type PromptCheck =
  | { ok: true; prompt: string }
  | { ok: false; reason: string; matched: string[] };

/**
 * Screens what the customer typed before it reaches the model. A rejection is
 * better than a silent rewrite: the customer finds out now rather than when
 * the proof comes back missing what they asked for.
 */
export function screenPrompt(raw: string): PromptCheck {
  const prompt = raw.trim().replace(/\s+/g, " ");

  if (prompt.length < 3) {
    return { ok: false, reason: "Tell us what should be on the camera first.", matched: [] };
  }
  if (prompt.length > 400) {
    return {
      ok: false,
      reason: "That description is too long — keep it under 400 characters.",
      matched: [],
    };
  }

  const haystack = ` ${prompt.toLowerCase().replace(/[^a-z0-9 -]/g, " ")} `;
  const matched = PROTECTED_MARKS.filter((mark) => haystack.includes(` ${mark} `));
  if (matched.length > 0) {
    return {
      ok: false,
      matched,
      reason:
        "We can't print brand names or logos on a camera we sell. Describe the look you're after instead and we'll draw it.",
    };
  }

  return { ok: true, prompt };
}

/** The full prompt sent to the model for one variant. */
export function composePrompt(subject: string, variant: VariantKey, hasReference: boolean): string {
  const parts = [
    `Artwork for a camera wrap. Subject: ${subject}.`,
    HOUSE_STYLE,
    VARIANT_BRIEFS[variant],
    `Canvas is a wide horizontal strip, ${TILE_MM.width}mm by ${TILE_MM.height}mm, printed at 300 DPI.`,
    "Keep shapes clear of the extreme top and bottom edges, which curve over the body.",
  ];

  if (hasReference) {
    parts.push(
      "Match the palette and mood of the supplied photograph — take its colours and its feeling, not its content, and do not copy or trace it.",
    );
  }

  return parts.join(" ");
}

/**
 * Cache key. Covers everything that changes the output: the words, the photo,
 * and the style version. Two customers typing the same thing get the same four
 * designs for the price of one generation.
 */
export function promptHash(subject: string, referenceHash?: string | null): string {
  return createHash("sha256")
    .update(
      JSON.stringify({
        subject: subject.trim().toLowerCase().replace(/\s+/g, " "),
        reference: referenceHash ?? null,
        style: HOUSE_STYLE_VERSION,
        variants: VARIANTS,
      }),
    )
    .digest("hex");
}

/** A short name for the design, taken from the customer's own words. */
export function designName(subject: string, variant: VariantKey): string {
  const words = subject
    .split(/[\s,.;]+/)
    .filter((word) => word.length > 2)
    .slice(0, 3)
    .join(" ");
  const head = words || subject.slice(0, 24);
  return head.charAt(0).toUpperCase() + head.slice(1);
}
