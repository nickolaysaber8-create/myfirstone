import "server-only";
import sharp from "sharp";
import { TILE_PREVIEW_PX, TILE_PRINT_PX } from "@/lib/camera/dimensions";

export type RenderedTile = {
  print: Buffer;
  preview: Buffer;
  palette: string[];
  width: number;
  height: number;
};

/**
 * Takes whatever the model returned and produces the two files we keep.
 *
 * The crop is vertical only. Our tile is close to 3:1 and no image API offers
 * that, so the extra height is trimmed from the middle outward — taking it off
 * the sides instead would cut through the very edges the seamless join depends
 * on.
 */
export async function renderTile(source: Buffer): Promise<RenderedTile> {
  const image = sharp(source, { failOn: "none" });
  const meta = await image.metadata();
  const sourceWidth = meta.width ?? TILE_PRINT_PX.width;
  const sourceHeight = meta.height ?? TILE_PRINT_PX.height;

  const targetAspect = TILE_PRINT_PX.width / TILE_PRINT_PX.height;
  const cropHeight = Math.min(sourceHeight, Math.round(sourceWidth / targetAspect));
  const top = Math.max(0, Math.round((sourceHeight - cropHeight) / 2));

  const cropped = sharp(source, { failOn: "none" }).extract({
    left: 0,
    top,
    width: sourceWidth,
    height: cropHeight,
  });

  const print = await cropped
    .clone()
    .resize(TILE_PRINT_PX.width, TILE_PRINT_PX.height, { fit: "fill", kernel: "lanczos3" })
    .png({ compressionLevel: 9 })
    .withMetadata({ density: 300 })
    .toBuffer();

  // WebP at this quality is a fraction of the PNG and is what a phone on a
  // slow connection actually downloads.
  const preview = await cropped
    .clone()
    .resize(TILE_PREVIEW_PX.width, TILE_PREVIEW_PX.height, { fit: "fill", kernel: "lanczos3" })
    .webp({ quality: 82 })
    .toBuffer();

  return {
    print,
    preview,
    palette: await dominantColours(preview),
    width: TILE_PRINT_PX.width,
    height: TILE_PRINT_PX.height,
  };
}

/**
 * Four representative colours, kept so the studio can tint its own chrome to
 * match a design without re-downloading the artwork.
 */
async function dominantColours(preview: Buffer): Promise<string[]> {
  const size = 8;
  const { data } = await sharp(preview)
    .resize(size, size, { fit: "fill" })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const buckets = new Map<string, { count: number; r: number; g: number; b: number }>();
  for (let i = 0; i < data.length; i += 3) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    // Quantise so near-identical pixels land in one bucket.
    const key = `${r >> 5}-${g >> 5}-${b >> 5}`;
    const bucket = buckets.get(key) ?? { count: 0, r: 0, g: 0, b: 0 };
    bucket.count += 1;
    bucket.r += r;
    bucket.g += g;
    bucket.b += b;
    buckets.set(key, bucket);
  }

  const hex = (value: number) => value.toString(16).padStart(2, "0");
  return [...buckets.values()]
    .sort((a, b) => b.count - a.count)
    .slice(0, 4)
    .map(
      ({ count, r, g, b }) =>
        `#${hex(Math.round(r / count))}${hex(Math.round(g / count))}${hex(Math.round(b / count))}`,
    );
}
