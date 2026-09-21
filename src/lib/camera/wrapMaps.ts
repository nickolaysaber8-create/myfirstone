import { CanvasTexture, RepeatWrapping, SRGBColorSpace, Texture, Vector2 } from "three";
import { WRAP_ASPECT } from "./dimensions";

export type WrapMaps = {
  map: Texture;
  roughnessMap: Texture;
  normalMap: Texture;
  normalScale: Vector2;
  dispose: () => void;
};

export type WrapSource = HTMLCanvasElement | ImageBitmap | HTMLImageElement;

/** Aux maps do not need print resolution — surface detail reads fine at this size. */
const AUX_WIDTH = 1024;

function createCanvas(width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

function hash2(x: number, y: number, seed: number): number {
  let h = Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263) ^ Math.imul(seed, 2246822519);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

function valueNoise(x: number, y: number, seed: number): number {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;
  const sx = xf * xf * (3 - 2 * xf);
  const sy = yf * yf * (3 - 2 * yf);
  const a = hash2(xi, yi, seed);
  const b = hash2(xi + 1, yi, seed);
  const c = hash2(xi, yi + 1, seed);
  const d = hash2(xi + 1, yi + 1, seed);
  return (a + (b - a) * sx) * (1 - sy) + (c + (d - c) * sx) * sy;
}

/**
 * Derives the surface maps from the printed artwork.
 *
 * Ink laid on vinyl is not perfectly flat: the substrate carries a fine grain,
 * and the ink film sits a few microns proud of it, which is why a real wrap
 * catches the light along the edges of a shape. The normal map reconstructs
 * that relief from the artwork's own luminance, and the roughness map gives
 * saturated areas slightly more sheen than the bare laminate.
 */
export function buildWrapMaps(source: WrapSource, seed = 1): WrapMaps {
  const width = AUX_WIDTH;
  const height = Math.max(2, Math.round(AUX_WIDTH / WRAP_ASPECT));

  const sample = createCanvas(width, height);
  const sampleCtx = sample.getContext("2d", { willReadFrequently: true })!;
  sampleCtx.drawImage(source as CanvasImageSource, 0, 0, width, height);
  const pixels = sampleCtx.getImageData(0, 0, width, height).data;

  const luminance = new Float32Array(width * height);
  for (let i = 0, p = 0; i < luminance.length; i++, p += 4) {
    luminance[i] = (0.299 * pixels[p] + 0.587 * pixels[p + 1] + 0.114 * pixels[p + 2]) / 255;
  }

  const normalCanvas = createCanvas(width, height);
  const roughCanvas = createCanvas(width, height);
  const normalCtx = normalCanvas.getContext("2d")!;
  const roughCtx = roughCanvas.getContext("2d")!;
  const normalData = normalCtx.createImageData(width, height);
  const roughData = roughCtx.createImageData(width, height);

  // Horizontal wrap-around: the strip is a loop, so sampling must be too.
  const at = (x: number, y: number) => {
    const cx = ((x % width) + width) % width;
    const cy = y < 0 ? 0 : y >= height ? height - 1 : y;
    return luminance[cy * width + cx];
  };

  const INK_RELIEF = 1.5;
  const GRAIN = 0.16;
  const GRAIN_SCALE = 1.35;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = y * width + x;

      const gx =
        at(x - 1, y - 1) + 2 * at(x - 1, y) + at(x - 1, y + 1) -
        (at(x + 1, y - 1) + 2 * at(x + 1, y) + at(x + 1, y + 1));
      const gy =
        at(x - 1, y - 1) + 2 * at(x, y - 1) + at(x + 1, y - 1) -
        (at(x - 1, y + 1) + 2 * at(x, y + 1) + at(x + 1, y + 1));

      // Vinyl grain, sampled with the same wrap so the seam stays invisible.
      const gu = x * GRAIN_SCALE;
      const gv = y * GRAIN_SCALE;
      const grainX = valueNoise(gu, gv, seed) - valueNoise(gu + 1, gv, seed);
      const grainY = valueNoise(gu, gv, seed) - valueNoise(gu, gv + 1, seed);

      let nx = gx * INK_RELIEF + grainX * GRAIN;
      let ny = gy * INK_RELIEF + grainY * GRAIN;
      const nz = 1;
      const len = Math.hypot(nx, ny, nz);
      nx /= len;
      ny /= len;

      const p = i * 4;
      normalData.data[p] = Math.round((nx * 0.5 + 0.5) * 255);
      normalData.data[p + 1] = Math.round((ny * 0.5 + 0.5) * 255);
      normalData.data[p + 2] = Math.round((nz / len) * 255);
      normalData.data[p + 3] = 255;

      // Matte laminate sits high; dense ink polishes it a little.
      const ink = 1 - luminance[i];
      const blotch = valueNoise(x * 0.012, y * 0.012, seed + 17) - 0.5;
      const roughness = Math.min(0.9, Math.max(0.48, 0.76 - ink * 0.12 + blotch * 0.05));
      const byte = Math.round(roughness * 255);
      roughData.data[p] = byte;
      roughData.data[p + 1] = byte;
      roughData.data[p + 2] = byte;
      roughData.data[p + 3] = 255;
    }
  }

  normalCtx.putImageData(normalData, 0, 0);
  roughCtx.putImageData(roughData, 0, 0);

  const map = new CanvasTexture(source as HTMLCanvasElement);
  map.colorSpace = SRGBColorSpace;

  const normalMap = new CanvasTexture(normalCanvas);
  const roughnessMap = new CanvasTexture(roughCanvas);

  for (const texture of [map, normalMap, roughnessMap]) {
    texture.wrapS = RepeatWrapping;
    texture.needsUpdate = true;
  }

  return {
    map,
    roughnessMap,
    normalMap,
    normalScale: new Vector2(0.32, 0.32),
    dispose: () => {
      map.dispose();
      normalMap.dispose();
      roughnessMap.dispose();
    },
  };
}

/**
 * Injection-moulded ABS grain for the shell and decks. One small tiling map,
 * reused by every plastic part.
 */
export function buildShellNormalMap(size = 256): Texture {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext("2d")!;
  const data = ctx.createImageData(size, size);

  const height = new Float32Array(size * size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      height[y * size + x] =
        valueNoise(x * 0.9, y * 0.9, 91) * 0.6 + valueNoise(x * 0.22, y * 0.22, 47) * 0.4;
    }
  }

  const at = (x: number, y: number) =>
    height[(((y % size) + size) % size) * size + (((x % size) + size) % size)];

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let nx = (at(x - 1, y) - at(x + 1, y)) * 2.4;
      let ny = (at(x, y - 1) - at(x, y + 1)) * 2.4;
      const len = Math.hypot(nx, ny, 1);
      nx /= len;
      ny /= len;
      const p = (y * size + x) * 4;
      data.data[p] = Math.round((nx * 0.5 + 0.5) * 255);
      data.data[p + 1] = Math.round((ny * 0.5 + 0.5) * 255);
      data.data[p + 2] = Math.round((1 / len) * 255);
      data.data[p + 3] = 255;
    }
  }

  ctx.putImageData(data, 0, 0);
  const texture = new CanvasTexture(canvas);
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  texture.repeat.set(14, 8);
  return texture;
}
