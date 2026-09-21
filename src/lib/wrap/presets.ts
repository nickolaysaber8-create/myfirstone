import { PREVIEW_PX } from "@/lib/camera/dimensions";
import { frontTextBox, uOnFace } from "./layout";

/**
 * Placeholder artwork for the 3D preview. These stand in for the curated
 * gallery of pre-generated designs, so the page has something to show before
 * anyone spends money on a generation. Every design tiles horizontally: the
 * strip is a loop, and the left and right edges have to meet on the seam.
 */

export type WrapPreset = {
  id: string;
  name: string;
  palette: string[];
  draw: (ctx: CanvasRenderingContext2D, w: number, h: number, rand: () => number) => void;
};

export type Personalisation = { name?: string; date?: string };

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashString(value: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Runs a draw call three times so shapes crossing the seam appear on both sides. */
function looped(ctx: CanvasRenderingContext2D, w: number, x: number, drawAt: (x: number) => void) {
  drawAt(x);
  if (x < w * 0.25) drawAt(x + w);
  if (x > w * 0.75) drawAt(x - w);
}

function fillBackground(ctx: CanvasRenderingContext2D, w: number, h: number, colour: string) {
  ctx.fillStyle = colour;
  ctx.fillRect(0, 0, w, h);
}

/** A horizontally looping wave band — the period divides the width exactly. */
function waveBand(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  baseline: number,
  amplitude: number,
  cycles: number,
  phase: number,
  colour: string,
) {
  ctx.fillStyle = colour;
  ctx.beginPath();
  ctx.moveTo(0, h);
  const steps = 240;
  for (let i = 0; i <= steps; i++) {
    const x = (i / steps) * w;
    const y = baseline + Math.sin((i / steps) * Math.PI * 2 * cycles + phase) * amplitude;
    ctx.lineTo(x, y);
  }
  ctx.lineTo(w, h);
  ctx.closePath();
  ctx.fill();
}

function circle(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, colour: string) {
  ctx.fillStyle = colour;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

export const WRAP_PRESETS: WrapPreset[] = [
  {
    id: "batroun-blue",
    name: "Batroun Blue",
    palette: ["#04283C", "#0B6E8F", "#49C4D6", "#EAF4EE"],
    draw(ctx, w, h, rand) {
      const [deep, mid, light, foam] = this.palette;
      fillBackground(ctx, w, h, deep);
      waveBand(ctx, w, h, h * 0.52, h * 0.09, 3, 0, mid);
      waveBand(ctx, w, h, h * 0.68, h * 0.07, 5, 1.7, light);
      waveBand(ctx, w, h, h * 0.86, h * 0.04, 8, 3.1, foam);

      for (let i = 0; i < 26; i++) {
        const x = rand() * w;
        const y = h * (0.08 + rand() * 0.3);
        const r = h * (0.012 + rand() * 0.02);
        looped(ctx, w, x, (px) => circle(ctx, px, y, r, foam));
      }

      // Dolphin silhouettes arcing over the crest.
      for (let i = 0; i < 6; i++) {
        const x = ((i + 0.5) / 6) * w + (rand() - 0.5) * w * 0.04;
        const y = h * (0.3 + rand() * 0.16);
        const s = h * (0.26 + rand() * 0.08);
        looped(ctx, w, x, (px) => {
          ctx.save();
          ctx.translate(px, y);
          ctx.rotate(-0.22);
          ctx.scale(s, s);
          ctx.fillStyle = foam;
          ctx.beginPath();
          ctx.moveTo(-0.52, -0.01);
          ctx.quadraticCurveTo(-0.42, -0.09, -0.31, -0.12);
          ctx.bezierCurveTo(-0.22, -0.21, -0.1, -0.25, -0.02, -0.23);
          ctx.lineTo(0.07, -0.41);
          ctx.quadraticCurveTo(0.15, -0.27, 0.21, -0.18);
          ctx.bezierCurveTo(0.31, -0.13, 0.38, -0.06, 0.42, 0.02);
          ctx.lineTo(0.55, -0.11);
          ctx.quadraticCurveTo(0.48, 0.03, 0.53, 0.19);
          ctx.lineTo(0.4, 0.09);
          ctx.bezierCurveTo(0.3, 0.17, 0.16, 0.21, 0.04, 0.19);
          ctx.lineTo(-0.05, 0.34);
          ctx.quadraticCurveTo(-0.15, 0.26, -0.17, 0.14);
          ctx.bezierCurveTo(-0.31, 0.12, -0.44, 0.06, -0.52, -0.01);
          ctx.closePath();
          ctx.fill();
          ctx.restore();
        });
      }
    },
  },
  {
    id: "cedar-ridge",
    name: "Cedar Ridge",
    palette: ["#0E2A1E", "#1F6B44", "#89B85F", "#EDE7CE"],
    draw(ctx, w, h, rand) {
      const [night, deep, leaf, sky] = this.palette;
      fillBackground(ctx, w, h, sky);
      circle(ctx, w * 0.12, h * 0.3, h * 0.2, "#F2C44A");
      waveBand(ctx, w, h, h * 0.55, h * 0.12, 2, 0.6, leaf);
      waveBand(ctx, w, h, h * 0.72, h * 0.09, 3, 2.4, deep);

      const drawCedar = (px: number, y: number, s: number, colour: string) => {
        ctx.save();
        ctx.translate(px, y);
        ctx.scale(s, s);
        ctx.fillStyle = colour;
        ctx.fillRect(-0.04, 0.2, 0.08, 0.3);
        const widths = [0.5, 0.43, 0.33, 0.19];
        const ys = [0.22, 0.06, -0.11, -0.28];
        for (let i = 0; i < 4; i++) {
          const yy = ys[i];
          const ww = widths[i];
          ctx.beginPath();
          ctx.moveTo(-ww, yy);
          ctx.quadraticCurveTo(-ww * 0.55, yy - 0.1, 0, yy - 0.115);
          ctx.quadraticCurveTo(ww * 0.55, yy - 0.1, ww, yy);
          ctx.quadraticCurveTo(ww * 0.45, yy + 0.048, 0, yy + 0.038);
          ctx.quadraticCurveTo(-ww * 0.45, yy + 0.048, -ww, yy);
          ctx.closePath();
          ctx.fill();
        }
        ctx.restore();
      };

      for (let i = 0; i < 14; i++) {
        const x = ((i + 0.5) / 14) * w + (rand() - 0.5) * w * 0.03;
        looped(ctx, w, x, (px) => drawCedar(px, h * (0.62 + rand() * 0.05), h * 0.34, deep));
      }
      for (let i = 0; i < 18; i++) {
        const x = ((i + 0.2) / 18) * w + (rand() - 0.5) * w * 0.03;
        looped(ctx, w, x, (px) => drawCedar(px, h * (0.86 + rand() * 0.06), h * 0.42, night));
      }
    },
  },
  {
    id: "nazar",
    name: "Nazar",
    palette: ["#071633", "#123C8C", "#3E9BE0", "#F2F4F8"],
    draw(ctx, w, h, rand) {
      const [night, blue, sky, white] = this.palette;
      fillBackground(ctx, w, h, night);

      const eye = (px: number, y: number, r: number) => {
        circle(ctx, px, y, r, blue);
        circle(ctx, px, y, r * 0.72, white);
        circle(ctx, px, y, r * 0.46, sky);
        circle(ctx, px, y, r * 0.2, night);
      };

      const cols = 11;
      const rows = 3;
      for (let row = 0; row < rows; row++) {
        const y = ((row + 0.5) / rows) * h;
        const offset = row % 2 ? w / cols / 2 : 0;
        for (let c = 0; c < cols; c++) {
          const x = ((c + 0.5) / cols) * w + offset;
          const r = h * (0.13 + (row === 1 ? 0.03 : 0));
          looped(ctx, w, x % w, (px) => eye(px, y, r));
        }
      }
      for (let i = 0; i < 60; i++) {
        const x = rand() * w;
        const y = rand() * h;
        looped(ctx, w, x, (px) => circle(ctx, px, y, h * 0.008, sky));
      }
    },
  },
  {
    id: "raouche-gold",
    name: "Raouché Gold",
    palette: ["#2B1236", "#8E1B52", "#E0553C", "#F7B267"],
    draw(ctx, w, h, rand) {
      const [dusk, plum, ember, gold] = this.palette;
      fillBackground(ctx, w, h, dusk);

      for (let i = 0; i < 7; i++) {
        const y = h * (0.1 + i * 0.06);
        ctx.fillStyle = i % 2 ? ember : gold;
        ctx.globalAlpha = 0.9 - i * 0.07;
        ctx.fillRect(0, y, w, h * 0.035);
      }
      ctx.globalAlpha = 1;
      circle(ctx, w * 0.3, h * 0.34, h * 0.19, gold);

      waveBand(ctx, w, h, h * 0.66, h * 0.05, 4, 1.2, plum);

      // Sea stacks, as flat silhouettes.
      const stack = (px: number, base: number, width: number, height: number) => {
        ctx.fillStyle = dusk;
        ctx.beginPath();
        ctx.moveTo(px - width / 2, base);
        ctx.lineTo(px - width * 0.32, base - height);
        ctx.lineTo(px + width * 0.18, base - height * 0.86);
        ctx.lineTo(px + width / 2, base);
        ctx.closePath();
        ctx.fill();
      };
      for (let i = 0; i < 9; i++) {
        const x = ((i + 0.5) / 9) * w + (rand() - 0.5) * w * 0.02;
        looped(ctx, w, x, (px) => stack(px, h * 0.82, h * (0.3 + rand() * 0.2), h * (0.3 + rand() * 0.25)));
      }
      ctx.fillStyle = dusk;
      ctx.fillRect(0, h * 0.8, w, h * 0.2);
    },
  },
  {
    id: "chrome-party",
    name: "Chrome Party",
    palette: ["#120B2E", "#5B21D6", "#FF2E8B", "#25E8D0"],
    draw(ctx, w, h, rand) {
      const [night, violet, pink, mint] = this.palette;
      fillBackground(ctx, w, h, night);

      const cycles = 12;
      ctx.lineWidth = h * 0.035;
      ctx.lineCap = "square";
      for (const [phase, colour] of [
        [0, violet],
        [Math.PI * 0.5, pink],
        [Math.PI, mint],
      ] as const) {
        ctx.strokeStyle = colour;
        ctx.beginPath();
        for (let i = 0; i <= cycles * 4; i++) {
          const x = (i / (cycles * 4)) * w;
          const y = h * 0.5 + Math.sin((i / (cycles * 4)) * Math.PI * 2 * cycles + phase) * h * 0.3;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      for (let i = 0; i < 9; i++) {
        const x = ((i + 0.5) / 9) * w;
        const y = h * (0.2 + rand() * 0.6);
        const r = h * 0.11;
        looped(ctx, w, x, (px) => {
          circle(ctx, px, y, r, mint);
          ctx.save();
          ctx.beginPath();
          ctx.arc(px, y, r, 0, Math.PI * 2);
          ctx.clip();
          ctx.fillStyle = violet;
          for (let q = -3; q <= 3; q++) {
            ctx.fillRect(px + q * r * 0.34, y - r, r * 0.17, r * 2);
          }
          ctx.restore();
        });
      }
      for (let i = 0; i < 90; i++) {
        const x = rand() * w;
        const y = rand() * h;
        looped(ctx, w, x, (px) => circle(ctx, px, y, h * (0.005 + rand() * 0.008), pink));
      }
    },
  },
  {
    id: "rosewater",
    name: "Rosewater",
    palette: ["#3A1024", "#B5246B", "#F587B0", "#FDE8EF"],
    draw(ctx, w, h, rand) {
      const [wine, rose, blush, cream] = this.palette;
      fillBackground(ctx, w, h, cream);

      ctx.fillStyle = blush;
      const cycles = 6;
      for (let band = 0; band < 2; band++) {
        ctx.beginPath();
        const base = band === 0 ? h * 0.18 : h * 0.82;
        for (let i = 0; i <= 200; i++) {
          const x = (i / 200) * w;
          const y = base + Math.sin((i / 200) * Math.PI * 2 * cycles + band * 2) * h * 0.06;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.lineTo(w, band === 0 ? 0 : h);
        ctx.lineTo(0, band === 0 ? 0 : h);
        ctx.closePath();
        ctx.fill();
      }

      const cherry = (px: number, y: number, s: number) => {
        ctx.save();
        ctx.translate(px, y);
        ctx.scale(s, s);
        ctx.strokeStyle = wine;
        ctx.lineWidth = 0.045;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(-0.26, 0.18);
        ctx.quadraticCurveTo(-0.05, -0.34, 0.1, -0.4);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0.26, 0.16);
        ctx.quadraticCurveTo(0.16, -0.26, 0.1, -0.4);
        ctx.stroke();
        circle(ctx, -0.26, 0.3, 0.2, rose);
        circle(ctx, 0.27, 0.28, 0.19, rose);
        ctx.fillStyle = wine;
        ctx.beginPath();
        ctx.ellipse(0.24, -0.42, 0.2, 0.08, -0.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      };

      for (let i = 0; i < 22; i++) {
        const x = rand() * w;
        const y = h * (0.12 + rand() * 0.76);
        looped(ctx, w, x, (px) => cherry(px, y, h * (0.2 + rand() * 0.12)));
      }
    },
  },
];

/**
 * Average brightness of what the text will sit on. Reading the artwork beats
 * guessing from the palette: a dark design can still put its lightest band
 * exactly where the name goes.
 */
/**
 * Film-stock line along the bottom of the back face. On a real single-use
 * camera this is printed on the wrap itself, so it goes into the artwork
 * rather than onto a separate sticker — and it stays on the flat run of the
 * back, clear of both rear corners.
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
 * Customer text, laid into the clear area of the front face. The overlay is a
 * separate pass over the artwork so it can be restyled without regenerating.
 */
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

  const nameBaseline = h * (date ? 0.8 : 0.85);
  const dateBaseline = h * 0.902;

  ctx.save();
  ctx.textBaseline = "alphabetic";

  if (name) {
    const size = Math.min(h * 0.145, (maxWidth / Math.max(name.length, 5)) * 1.7);
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
    const size = h * 0.062;
    const light = backdropIsLight(ctx, left, dateBaseline - size, maxWidth * 0.5, size * 1.2);
    ctx.font = `500 ${size}px "DM Mono", ui-monospace, monospace`;
    ctx.shadowColor = light ? "rgba(255,255,255,.85)" : "rgba(0,0,0,.6)";
    ctx.shadowBlur = h * 0.03;
    ctx.fillStyle = light ? "rgba(20,16,24,.92)" : "rgba(255,255,255,.94)";
    ctx.fillText(date, left, dateBaseline);
  }

  ctx.restore();
}

export type RenderOptions = {
  preset: WrapPreset;
  personalisation?: Personalisation;
  width?: number;
  height?: number;
  seed?: number;
};

/** Draws one wrap strip. Returns the canvas it drew into. */
export function renderWrap(
  canvas: HTMLCanvasElement,
  { preset, personalisation = {}, width = PREVIEW_PX.width, height = PREVIEW_PX.height, seed }: RenderOptions,
): HTMLCanvasElement {
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  const rand = mulberry32(seed ?? hashString(preset.id));

  ctx.clearRect(0, 0, width, height);
  preset.draw(ctx, width, height, rand);
  drawFilmStockLine(ctx, width, height);
  drawPersonalisation(ctx, width, height, personalisation);

  return canvas;
}

export function presetById(id: string): WrapPreset {
  return WRAP_PRESETS.find((preset) => preset.id === id) ?? WRAP_PRESETS[0];
}
