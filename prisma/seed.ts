import { PrismaClient } from "@prisma/client";
import sharp from "sharp";
import { TILE_PREVIEW_PX, TILE_PRINT_PX } from "../src/lib/camera/dimensions";
import { artworkSvg, PALETTES } from "../src/lib/generation/artwork";
import type { VariantKey } from "../src/lib/generation/types";

const prisma = new PrismaClient();

/**
 * The curated gallery. Each entry is drawn in-house, so the page opens with
 * real content that costs nothing and needs no model credentials.
 */
const CURATED: { slug: string; name: string; subject: string; variant: VariantKey; palette: string }[] = [
  { slug: "batroun-blue", name: "Batroun Blue", subject: "dolphins over waves", variant: "scattered", palette: "ocean" },
  { slug: "cedar-ridge", name: "Cedar Ridge", subject: "cedar trees on a mountain", variant: "band", palette: "cedar" },
  { slug: "nazar", name: "Nazar", subject: "nazar evil eye charms", variant: "repeat", palette: "nazar" },
  { slug: "raouche-gold", name: "Raouché Gold", subject: "sun over sea rocks", variant: "hero", palette: "sunset" },
  { slug: "chrome-party", name: "Chrome Party", subject: "stars and disco night", variant: "scattered", palette: "party" },
  { slug: "rosewater", name: "Rosewater", subject: "cherries and hearts", variant: "repeat", palette: "rose" },
  { slug: "tropic-heat", name: "Tropic Heat", subject: "palm trees on a summer beach", variant: "band", palette: "tropic" },
  { slug: "class-of", name: "Class Of", subject: "graduation stars", variant: "repeat", palette: "classy" },
];

async function main() {
  const { keys, storage } = await import("../src/lib/storage");
  const store = await storage();

  for (const entry of CURATED) {
    const palette = PALETTES.find((item) => item.id === entry.palette);
    const svg = artworkSvg({
      subject: entry.subject,
      variant: entry.variant,
      width: TILE_PRINT_PX.width,
      height: TILE_PRINT_PX.height,
      palette,
      seed: entry.slug.length * 7919,
    });

    const print = await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toBuffer();
    const preview = await sharp(Buffer.from(svg))
      .resize(TILE_PREVIEW_PX.width, TILE_PREVIEW_PX.height, { fit: "fill" })
      .webp({ quality: 82 })
      .toBuffer();

    const printKey = keys.curatedPrint(entry.slug);
    const previewKey = keys.curatedPreview(entry.slug);
    await store.put(printKey, print, "image/png");
    await store.put(previewKey, preview, "image/webp");

    await prisma.design.upsert({
      where: { slug: entry.slug },
      create: {
        slug: entry.slug,
        source: "CURATED",
        name: entry.name,
        variant: entry.variant,
        palette: palette?.colours ?? [],
        printKey,
        previewKey,
        width: TILE_PRINT_PX.width,
        height: TILE_PRINT_PX.height,
      },
      update: {
        name: entry.name,
        variant: entry.variant,
        palette: palette?.colours ?? [],
        printKey,
        previewKey,
        width: TILE_PRINT_PX.width,
        height: TILE_PRINT_PX.height,
      },
    });

    console.log(
      `${entry.slug}: print ${(print.byteLength / 1024).toFixed(0)} kB, preview ${(preview.byteLength / 1024).toFixed(0)} kB`,
    );
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
