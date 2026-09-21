/**
 * Every dimension below is in millimetres and matches the blank body we buy.
 * Scene units are centimetres (MM_TO_UNIT), which keeps the camera roughly
 * 11 units wide — a comfortable scale for three.js default light falloff.
 */

export const MM_TO_UNIT = 0.1;
export const mm = (v: number) => v * MM_TO_UNIT;

export const BODY = {
  width: 112,
  height: 60,
  depth: 38,
  /** Radius of the four vertical corners, seen from above. */
  cornerRadius: 4.5,
  /** Radius of the chamfer that rolls the wrap over onto the top/bottom deck. */
  edgeChamfer: 2.6,
} as const;

const { width: W, depth: D, cornerRadius: R } = BODY;

/** Straight run lengths of the rounded-rect cross-section. */
const FLAT_X = W - 2 * R;
const FLAT_Z = D - 2 * R;
const CORNER_ARC = (Math.PI / 2) * R;

/** Distance around the body the printed wrap has to travel. */
export const PERIMETER_MM = 2 * FLAT_X + 2 * FLAT_Z + 4 * CORNER_ARC;

/**
 * The wrap is one continuous strip. u = 0 sits where the front-left corner
 * stops curving and the flat front begins; u then runs
 * front -> right -> back -> left, so the glue seam lands on the front-left
 * corner where a seamless tile hides it.
 */
function span(start: number, length: number) {
  return { start: start / PERIMETER_MM, end: (start + length) / PERIMETER_MM };
}

let cursor = 0;
const frontSpan = span(cursor, FLAT_X);
cursor += FLAT_X + CORNER_ARC;
const rightSpan = span(cursor, FLAT_Z);
cursor += FLAT_Z + CORNER_ARC;
const backSpan = span(cursor, FLAT_X);
cursor += FLAT_X + CORNER_ARC;
const leftSpan = span(cursor, FLAT_Z);

/** Where each flat face lands along the strip, as 0..1 of the full width. */
export const FACE_SPANS = {
  front: frontSpan,
  right: rightSpan,
  back: backSpan,
  left: leftSpan,
} as const;

export type FaceName = keyof typeof FACE_SPANS;

/** Printed area: all the way around, full body height. */
export const WRAP_MM = { width: PERIMETER_MM, height: BODY.height } as const;
export const WRAP_ASPECT = WRAP_MM.width / WRAP_MM.height;

export const PRINT_DPI = 300;
export const BLEED_MM = 3;

const pxAt = (dpi: number, millimetres: number) => Math.round((millimetres / 25.4) * dpi);

/** Full-bleed print file the lab receives. */
export const PRINT_PX = {
  width: pxAt(PRINT_DPI, WRAP_MM.width + 2 * BLEED_MM),
  height: pxAt(PRINT_DPI, WRAP_MM.height + 2 * BLEED_MM),
} as const;

/** What the browser downloads for the 3D preview. */
export const PREVIEW_PX = { width: 1536, height: Math.round(1536 / WRAP_ASPECT) } as const;

/**
 * The generated artwork is a tile, not the whole band. The print shop quotes a
 * 112 x 38 mm footprint, which is narrower than the 292.3 mm the wrap has to
 * travel, so the tile is stood up to the full body height and repeated around.
 * That is why house style demands seamless left and right edges: the join is
 * not one glue seam, it recurs.
 */
export const TILE_MM = { width: 112, height: 38 } as const;
export const TILE_ASPECT = TILE_MM.width / TILE_MM.height;

/** The tile once scaled to cover the full height of the body. */
export const TILE_ON_WRAP_MM = {
  width: TILE_MM.width * (WRAP_MM.height / TILE_MM.height),
  height: WRAP_MM.height,
} as const;

/** How many times the tile goes round. Fractional, which seamlessness allows. */
export const TILE_REPEATS = PERIMETER_MM / TILE_ON_WRAP_MM.width;

/**
 * Rendered at the size the tile actually occupies once placed, so the wrap
 * lands at a true 300 DPI rather than 300 DPI of a footprint that then gets
 * enlarged.
 */
export const TILE_PRINT_PX = {
  width: pxAt(PRINT_DPI, TILE_ON_WRAP_MM.width),
  height: pxAt(PRINT_DPI, TILE_ON_WRAP_MM.height),
} as const;

/** Downscaled copy the browser gets. The print file never leaves the server. */
export const TILE_PREVIEW_PX = {
  width: 1024,
  height: Math.round(1024 / TILE_ASPECT),
} as const;

/**
 * Hardware that punches through the wrap. Positions are in body space:
 * x right, y up, z toward the front, all measured from the body centre.
 */
export const CUTOUTS = {
  lens: { face: "front" as FaceName, x: -31, y: -1, diameter: 24 },
  flash: { face: "front" as FaceName, x: 34, y: 6, width: 17, height: 13 },
  viewfinderFront: { face: "front" as FaceName, x: 43, y: 21, width: 9, height: 6.5 },
  viewfinderBack: { face: "back" as FaceName, x: 43, y: 21, width: 11, height: 8 },
} as const;

export const HALF = {
  x: W / 2,
  y: BODY.height / 2,
  z: D / 2,
} as const;
