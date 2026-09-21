import type { VariantKey } from "./types";

/**
 * House-style artwork as SVG. Flat fills, bold shapes, a limited palette and
 * edges that meet when tiled — the same brief the image model is given, which
 * is what makes this usable both as the curated gallery and as the fallback
 * when no model credentials are configured.
 */

export type Palette = { id: string; name: string; colours: string[] };

/** The studio's palettes, carried over from the original demo. */
export const PALETTES: Palette[] = [
  { id: "ocean", name: "Batroun Blue", colours: ["#04283C", "#0B6E8F", "#49C4D6", "#EAF4EE"] },
  { id: "cedar", name: "Cedar Ridge", colours: ["#0E2A1E", "#1F6B44", "#89B85F", "#EDE7CE"] },
  { id: "nazar", name: "Nazar", colours: ["#071633", "#123C8C", "#3E9BE0", "#F2F4F8"] },
  { id: "sunset", name: "Raouché Gold", colours: ["#2B1236", "#8E1B52", "#E0553C", "#F7B267"] },
  { id: "party", name: "Chrome Party", colours: ["#120B2E", "#5B21D6", "#FF2E8B", "#25E8D0"] },
  { id: "rose", name: "Rosewater", colours: ["#3A1024", "#B5246B", "#F587B0", "#FDE8EF"] },
  { id: "tropic", name: "Tropic Heat", colours: ["#0B3B2E", "#188C6B", "#F2B138", "#FFF1CF"] },
  { id: "stone", name: "Quarry", colours: ["#221E1C", "#5B534C", "#9A8F84", "#E4DCCF"] },
  { id: "classy", name: "Class Of", colours: ["#101A3D", "#27408F", "#E8B02B", "#F4F2EA"] },
  { id: "retro", name: "Super 8", colours: ["#3A2416", "#A8562A", "#E0A24B", "#F0E3C6"] },
];

/**
 * Motifs live in a unit box roughly -0.5..0.5 around the origin, so a layout
 * can place one at any size without knowing what it is.
 */
type Motif = {
  id: string;
  words: string[];
  palette: string;
  /** Returns markup, not just path data, so a motif can carry its own colours. */
  render: (fill: string, accent: string) => string;
};

const path = (d: string, fill: string) => `<path d="${d}" fill="${fill}"/>`;

const MOTIFS: Motif[] = [
  {
    id: "dolphin",
    words: ["dolphin", "dolphins", "whale", "porpoise"],
    palette: "ocean",
    render: (fill) =>
      path(
        "M-.52,-.01 Q-.42,-.09 -.31,-.12 C-.22,-.21 -.10,-.25 -.02,-.23 L.07,-.41 Q.15,-.27 .21,-.18 C.31,-.13 .38,-.06 .42,.02 L.55,-.11 Q.48,.03 .53,.19 L.40,.09 C.30,.17 .16,.21 .04,.19 L-.05,.34 Q-.15,.26 -.17,.14 C-.31,.12 -.44,.06 -.52,-.01 Z",
        fill,
      ),
  },
  {
    id: "fish",
    words: ["fish", "fishes", "sardine", "tuna", "goldfish"],
    palette: "ocean",
    render: (fill, accent) =>
      path("M.30,0 C.10,-.26 -.18,-.26 -.34,0 C-.18,.26 .10,.26 .30,0 Z M.27,0 L.50,-.20 L.50,.20 Z", fill) +
      `<circle cx="-.18" cy="-.05" r=".045" fill="${accent}"/>`,
  },
  {
    id: "wave",
    words: ["wave", "waves", "surf", "swell", "tide", "water"],
    palette: "ocean",
    render: (fill) =>
      path(
        "M-.50,.24 C-.47,-.10 -.20,-.36 .07,-.29 C.32,-.24 .38,-.02 .23,.11 C.31,-.04 .22,-.17 .06,-.18 C-.14,-.19 -.31,.02 -.33,.24 Z",
        fill,
      ),
  },
  {
    id: "cedar",
    words: ["cedar", "cedars", "tree", "trees", "pine", "forest", "lebanon", "arz", "mountain"],
    palette: "cedar",
    render: (fill) =>
      path(
        "M-.04,.20 L.04,.20 L.04,.48 L-.04,.48 Z M-.50,.22 Q-.28,.12 0,.105 Q.28,.12 .50,.22 Q.22,.27 0,.258 Q-.22,.27 -.50,.22 Z M-.43,.06 Q-.24,-.04 0,-.05 Q.24,-.04 .43,.06 Q.19,.11 0,.098 Q-.19,.11 -.43,.06 Z M-.33,-.11 Q-.18,-.21 0,-.225 Q.18,-.21 .33,-.11 Q.15,-.06 0,-.072 Q-.15,-.06 -.33,-.11 Z M-.19,-.28 Q-.10,-.38 0,-.395 Q.10,-.38 .19,-.28 Q.09,-.23 0,-.242 Q-.09,-.23 -.19,-.28 Z",
        fill,
      ),
  },
  {
    id: "palm",
    words: ["palm", "palms", "beach", "tropical", "coconut", "summer"],
    palette: "tropic",
    render: (fill) =>
      path(
        "M.10,.48 Q-.02,.16 -.10,-.18 L-.02,-.20 Q.06,.14 .16,.48 Z M-.10,-.20 Q.14,-.35 .38,-.16 Q.16,-.19 -.10,-.13 Z M-.10,-.20 Q-.34,-.35 -.46,-.10 Q-.26,-.20 -.08,-.13 Z M-.10,-.22 Q-.04,-.46 .20,-.46 Q.02,-.36 -.04,-.18 Z M-.10,-.22 Q-.22,-.44 -.44,-.38 Q-.22,-.32 -.12,-.16 Z",
        fill,
      ),
  },
  {
    id: "eye",
    words: ["nazar", "eye", "eyes", "charm", "amulet", "protection"],
    palette: "nazar",
    render: (fill, accent) =>
      `<circle cx="0" cy="0" r=".46" fill="${fill}"/>` +
      `<circle cx="0" cy="0" r=".33" fill="${accent}"/>` +
      `<circle cx="0" cy="0" r=".20" fill="${fill}"/>` +
      `<circle cx="0" cy="0" r=".09" fill="#0B1020"/>`,
  },
  {
    id: "heart",
    words: ["heart", "hearts", "love", "wedding", "engagement", "valentine"],
    palette: "rose",
    render: (fill) => path("M0,.42 C-.50,.08 -.36,-.38 0,-.16 C.36,-.38 .50,.08 0,.42 Z", fill),
  },
  {
    id: "star",
    words: ["star", "stars", "night", "disco", "party", "sparkle", "graduation"],
    palette: "party",
    render: (fill) =>
      path(
        "M0,-.48 L.13,-.15 L.48,-.15 L.20,.06 L.30,.40 L0,.19 L-.30,.40 L-.20,.06 L-.48,-.15 L-.13,-.15 Z",
        fill,
      ),
  },
  {
    id: "flower",
    words: ["flower", "flowers", "floral", "daisy", "bloom", "rose", "roses", "garden"],
    palette: "rose",
    render: (fill, accent) => {
      const petals = Array.from({ length: 6 }, (_, i) =>
        `<ellipse cx="0" cy="-.28" rx=".115" ry=".20" fill="${fill}" transform="rotate(${i * 60})"/>`,
      ).join("");
      return `${petals}<circle cx="0" cy="0" r=".14" fill="${accent}"/>`;
    },
  },
  {
    id: "mountain",
    words: ["mountain", "mountains", "peak", "hike", "cliff", "rocks", "sannine", "snow"],
    palette: "stone",
    render: (fill, accent) =>
      path("M-.50,.32 L-.15,-.34 L.09,.02 L.24,-.18 L.50,.32 Z", fill) +
      path("M-.15,-.34 L-.02,-.10 L-.09,-.06 L-.15,-.14 L-.23,-.04 L-.28,-.11 Z", accent),
  },
  {
    id: "cherry",
    words: ["cherry", "cherries", "fruit", "berry", "sweet"],
    palette: "rose",
    render: (fill, accent) =>
      path(
        "M-.30,.12 Q-.08,-.34 .08,-.42 L.13,-.35 Q-.02,-.28 -.22,.15 Z M.23,.10 Q.14,-.28 .08,-.42 L.14,-.44 Q.22,-.28 .30,.08 Z",
        accent,
      ) +
      `<circle cx="-.26" cy=".30" r=".20" fill="${fill}"/><circle cx=".27" cy=".28" r=".19" fill="${fill}"/>`,
  },
  {
    id: "sun",
    words: ["sun", "sunset", "sunrise", "gold", "warm", "desert"],
    palette: "sunset",
    render: (fill) => `<circle cx="0" cy="0" r=".34" fill="${fill}"/>`,
  },
];

export const MOTIF_WORDS = MOTIFS.map((motif) => motif.words[0]);

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashString(value: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Reads the customer's words for a subject and a palette. */
export function readSubject(subject: string) {
  const text = ` ${subject.toLowerCase().replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ")} `;
  const hits = MOTIFS.map((motif) => {
    const positions = motif.words
      .map((word) => text.indexOf(` ${word} `))
      .filter((index) => index >= 0);
    return { motif, at: positions.length ? Math.min(...positions) : -1 };
  }).filter((hit) => hit.at >= 0);
  // Earliest mention leads: it is usually the subject, later words qualify it.
  const motifs = hits.sort((a, b) => a.at - b.at).map((hit) => hit.motif);

  const COLOUR_WORDS: Record<string, string> = {
    blue: "ocean", sea: "ocean", ocean: "ocean", turquoise: "ocean",
    green: "cedar", olive: "cedar", emerald: "cedar",
    navy: "classy", gold: "classy",
    pink: "rose", blush: "rose", rosewater: "rose",
    purple: "party", neon: "party", violet: "party",
    orange: "sunset", coral: "sunset", sunset: "sunset",
    grey: "stone", gray: "stone", sand: "stone", stone: "stone",
    vintage: "retro", sepia: "retro", retro: "retro",
    yellow: "tropic", lime: "tropic", tropical: "tropic",
  };
  const namedPalette = Object.keys(COLOUR_WORDS).find((word) => text.includes(` ${word} `));

  const paletteId = namedPalette ? COLOUR_WORDS[namedPalette] : motifs[0]?.palette;
  const palette = PALETTES.find((item) => item.id === paletteId) ?? PALETTES[hashString(subject) % PALETTES.length];

  return { motifs: motifs.length ? motifs : [MOTIFS[hashString(subject) % MOTIFS.length]], palette };
}

type Ctx = {
  w: number;
  h: number;
  rand: () => number;
  out: string[];
};

/** Emits a shape three times so anything crossing an edge reappears opposite. */
function tiled(ctx: Ctx, x: number, emit: (x: number) => void) {
  emit(x);
  if (x < ctx.w * 0.3) emit(x + ctx.w);
  if (x > ctx.w * 0.7) emit(x - ctx.w);
}

function motifAt(
  ctx: Ctx,
  motif: Motif,
  x: number,
  y: number,
  size: number,
  rotation: number,
  fill: string,
  accent: string,
) {
  const body = motif.render(fill, accent);
  tiled(ctx, x, (px) => {
    ctx.out.push(
      `<g transform="translate(${px.toFixed(1)} ${y.toFixed(1)}) rotate(${rotation.toFixed(1)}) scale(${size.toFixed(1)})">${body}</g>`,
    );
  });
}

/** A sine edge with a whole number of cycles, so it meets itself at the seam. */
function wavePath(w: number, h: number, baseline: number, amplitude: number, cycles: number, phase: number) {
  const steps = 96;
  const points: string[] = [`M0,${h.toFixed(1)}`, `L0,${baseline.toFixed(1)}`];
  for (let i = 1; i <= steps; i++) {
    const x = (i / steps) * w;
    const y = baseline + Math.sin((i / steps) * Math.PI * 2 * cycles + phase) * amplitude;
    points.push(`L${x.toFixed(1)},${y.toFixed(1)}`);
  }
  points.push(`L${w.toFixed(1)},${h.toFixed(1)}`, "Z");
  return points.join(" ");
}

export type ArtworkOptions = {
  subject: string;
  variant: VariantKey;
  width: number;
  height: number;
  /** Overrides the palette read from the subject. Used by the curated gallery. */
  palette?: Palette;
  seed?: number;
};

export function artworkSvg({ subject, variant, width, height, palette, seed }: ArtworkOptions): string {
  const read = readSubject(subject);
  const chosen = palette ?? read.palette;
  const [deep, mid, bright, light] = chosen.colours;
  const rand = mulberry32(seed ?? hashString(`${subject}|${variant}`));
  const ctx: Ctx = { w: width, h: height, rand, out: [] };

  const pick = () => read.motifs[Math.floor(rand() * read.motifs.length)];
  // A row reads as a deliberate pattern only if every instance is the same
  // shape; mixing them there looks like a mistake rather than a choice.
  const lead = read.motifs[0];

  if (variant === "band") {
    ctx.out.push(`<rect width="${width}" height="${height}" fill="${light}"/>`);
    ctx.out.push(`<rect y="${height * 0.26}" width="${width}" height="${height * 0.48}" fill="${deep}"/>`);
    ctx.out.push(`<rect y="${height * 0.245}" width="${width}" height="${height * 0.02}" fill="${bright}"/>`);
    ctx.out.push(`<rect y="${height * 0.735}" width="${width}" height="${height * 0.02}" fill="${bright}"/>`);
    const step = height * 0.42;
    for (let x = step * 0.5; x < width + step; x += step) {
      motifAt(ctx, lead, x, height * 0.5, height * 0.4, 0, x % (step * 2) < step ? bright : light, deep);
    }
  } else if (variant === "repeat") {
    ctx.out.push(`<rect width="${width}" height="${height}" fill="${deep}"/>`);
    const cols = 14;
    const rows = 3;
    const cellW = width / cols;
    for (let row = 0; row < rows; row++) {
      const y = ((row + 0.5) / rows) * height;
      const offset = row % 2 ? cellW / 2 : 0;
      for (let c = 0; c < cols; c++) {
        const x = (c * cellW + cellW / 2 + offset) % width;
        motifAt(ctx, lead, x, y, height * 0.26, 0, row % 2 ? mid : bright, light);
      }
    }
  } else if (variant === "hero") {
    ctx.out.push(`<rect width="${width}" height="${height}" fill="${deep}"/>`);
    ctx.out.push(`<path d="${wavePath(width, height, height * 0.62, height * 0.1, 2, 0.4)}" fill="${mid}"/>`);
    ctx.out.push(`<path d="${wavePath(width, height, height * 0.8, height * 0.06, 3, 2.1)}" fill="${bright}"/>`);
    const heroX = width * 0.22;
    ctx.out.push(
      `<circle cx="${heroX.toFixed(1)}" cy="${(height * 0.42).toFixed(1)}" r="${(height * 0.36).toFixed(1)}" fill="${bright}" opacity="0.28"/>`,
    );
    motifAt(ctx, lead, heroX, height * 0.42, height * 0.68, 0, light, deep);
    for (let i = 0; i < 12; i++) {
      const x = width * 0.45 + rand() * width * 0.55;
      motifAt(ctx, pick(), x, height * (0.15 + rand() * 0.6), height * (0.1 + rand() * 0.1), (rand() - 0.5) * 50, light, deep);
    }
  } else {
    ctx.out.push(`<rect width="${width}" height="${height}" fill="${deep}"/>`);
    ctx.out.push(`<path d="${wavePath(width, height, height * 0.58, height * 0.09, 3, 0)}" fill="${mid}"/>`);
    ctx.out.push(`<path d="${wavePath(width, height, height * 0.78, height * 0.06, 5, 1.6)}" fill="${bright}"/>`);
    const count = 22 + Math.floor(rand() * 8);
    for (let i = 0; i < count; i++) {
      const x = rand() * width;
      const fill = rand() > 0.4 ? light : bright;
      motifAt(ctx, pick(), x, rand() * height, height * (0.14 + rand() * 0.18), (rand() - 0.5) * 60, fill, deep);
    }
  }

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`,
    ctx.out.join(""),
    "</svg>",
  ].join("");
}

export function paletteFor(subject: string): Palette {
  return readSubject(subject).palette;
}
