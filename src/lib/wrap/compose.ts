import { PREVIEW_PX, TILE_REPEATS } from "@/lib/camera/dimensions";
import { frontTextBox, uOnFace } from "./layout";

export type Personalisation = { name?: string; date?: string };

/**
 * Turns a generated tile into the strip that wraps the body.
 *
 * The artwork arrives as one seamless tile; the wrap needs it repeated round
 * the perimeter. The customer's text goes on afterwards as its own layer, so
 * typing a name repaints the text without touching the artwork underneath.
 */
export function composeWrap(
  canvas: HTMLCanvasElement,
  tile: CanvasImageSource,
  personalisation: Personalisation = {},
  width = PREVIEW_PX.width,
  height = PREVIEW_PX.height,
): HTMLCanvasElement {
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;

  ctx.clearRect(0, 0, width, height);

  const tileWidth = width / TILE_REPEATS;
  // One past the end: the last repeat is partial, which is exactly what a
  // seamless tile is for.
  for (let x = 0; x < width; x += tileWidth) {
    ctx.drawImage(tile, x, 0, tileWidth, height);
  }

  drawFilmStockLine(ctx, width, height);
  drawPersonalisation(ctx, width, height, personalisation);

  return canvas;
}

/**
 * Average brightness of what the text will sit on. Reading the artwork beats
 * guessing from a palette: a dark design can still put its lightest band
 * exactly where the name goes.
 */
function backdropIsLight(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
): boolean {
  const left = Math.max(0, Math.round(x));
  const top = Math.max(0, Math.round(y));
  const width = Math.max(1, Math.round(w));
  const height = Math.max(1, Math.round(h));

  let pixels: Uint8ClampedArray;
  try {
    pixels = ctx.getImageData(left, top, width, height).data;
  } catch {
    return false;
  }

  let sum = 0;
  let samples = 0;
  for (let i = 0; i < pixels.length; i += 4 * 7) {
    sum += 0.299 * pixels[i] + 0.587 * pixels[i + 1] + 0.114 * pixels[i + 2];
    samples++;
  }
  return samples > 0 && sum / samples / 255 > 0.55;
}

/**
 * Film-stock line along the bottom of the back face. On a real single-use
 * camera this is printed on the wrap itself, so it goes into the artwork
 * rather than onto a separate sticker.
 */
function drawFilmStockLine(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const x = uOnFace("back", 42) * w;
  const baseline = h * 0.925;
  const size = h * 0.055;

  ctx.save();
  ctx.textBaseline = "alphabetic";
  const light = backdropIsLight(ctx, x, baseline - size, w * 0.16, size * 1.3);
  ctx.font = `500 ${size}px "DM Mono", ui-monospace, monospace`;
  ctx.shadowColor = light ? "rgba(255,255,255,.8)" : "rgba(0,0,0,.55)";
  ctx.shadowBlur = h * 0.025;
  ctx.fillStyle = light ? "rgba(20,16,24,.78)" : "rgba(255,255,255,.8)";
  ctx.fillText("27 EXP · ISO 400 · DO NOT OPEN", x, baseline);
  ctx.restore();
}

/** Customer text, laid into the clear area of the front face. */
function drawPersonalisation(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  personalisation: Personalisation,
) {
  const { name, date } = personalisation;
  if (!name && !date) return;

  const box = frontTextBox();
  const left = box.left * w;
  const maxWidth = box.width * w;
  const boxTop = box.top * h;
  const boxBottom = box.bottom * h;

  // Both lines live inside the clear zone, with the date on the last line and
  // the name sitting on top of it.
  const dateSize = h * 0.055;
  const dateBaseline = date ? boxBottom - dateSize * 0.25 : boxBottom;
  const nameRoom = (date ? dateBaseline - dateSize * 1.35 : boxBottom) - boxTop;
  const nameSize = Math.min(nameRoom * 0.86, (maxWidth / Math.max(name?.length ?? 5, 5)) * 1.7);
  const nameBaseline = boxTop + nameRoom * 0.9;

  ctx.save();
  ctx.textBaseline = "alphabetic";

  if (name) {
    const size = nameSize;
    const light = backdropIsLight(ctx, left, nameBaseline - size, maxWidth, size * 1.2);
    ctx.font = `800 ${size}px Archivo, ui-sans-serif, sans-serif`;
    // Printed type, not a sticker: a soft halo carries it over busy artwork
    // without boxing it in.
    ctx.shadowColor = light ? "rgba(255,255,255,.85)" : "rgba(0,0,0,.6)";
    ctx.shadowBlur = h * 0.04;
    ctx.fillStyle = light ? "#141018" : "#ffffff";
    ctx.fillText(name, left, nameBaseline);
  }

  if (date) {
    const size = dateSize;
    const light = backdropIsLight(ctx, left, dateBaseline - size, maxWidth * 0.5, size * 1.2);
    ctx.font = `500 ${size}px "DM Mono", ui-monospace, monospace`;
    ctx.shadowColor = light ? "rgba(255,255,255,.85)" : "rgba(0,0,0,.6)";
    ctx.shadowBlur = h * 0.03;
    ctx.fillStyle = light ? "rgba(20,16,24,.92)" : "rgba(255,255,255,.94)";
    ctx.fillText(date, left, dateBaseline);
  }

  ctx.restore();
}

/** Loads a stored preview for compositing. */
export function loadTile(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Could not load ${url}`));
    image.src = url;
  });
}
