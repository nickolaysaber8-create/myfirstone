import { BODY, CUTOUTS, FACE_SPANS, type FaceName } from "@/lib/camera/dimensions";

/**
 * Converts body coordinates to positions on the flat wrap, in 0..1 of the
 * strip. The 3D preview, the proof view and the print file all read from
 * here so a cutout cannot drift between them.
 */

const FLAT_X = BODY.width - 2 * BODY.cornerRadius;
const FLAT_Z = BODY.depth - 2 * BODY.cornerRadius;

/** Horizontal position on the strip for a point on one of the flat faces. */
export function uOnFace(face: FaceName, along: number): number {
  const span = FACE_SPANS[face];
  const run = face === "front" || face === "back" ? FLAT_X : FLAT_Z;
  // Going front -> right -> back -> left, x rises across the front and falls
  // across the back, while z falls down the right side and rises up the left.
  const forward = face === "front" || face === "left" ? along : -along;
  const t = (forward + run / 2) / run;
  return span.start + t * (span.end - span.start);
}

/** Vertical position on the strip. v = 0 is the bottom edge of the body. */
export function vForY(y: number): number {
  return (y + BODY.height / 2) / BODY.height;
}

/** Strip-space width of a span measured in millimetres along a flat face. */
export function uLength(face: FaceName, millimetres: number): number {
  const span = FACE_SPANS[face];
  const run = face === "front" || face === "back" ? FLAT_X : FLAT_Z;
  return (millimetres / run) * (span.end - span.start);
}

export function vLength(millimetres: number): number {
  return millimetres / BODY.height;
}

export type CutoutRect = {
  id: string;
  label: string;
  shape: "circle" | "rect";
  /** Centre and size in 0..1 of the strip, y measured down from the top. */
  cx: number;
  cy: number;
  w: number;
  h: number;
};

/**
 * Where the die cuts fall on the flat wrap, with y measured downward so the
 * numbers drop straight into canvas and PDF coordinates.
 */
export function cutoutRects(): CutoutRect[] {
  const { lens, flash, viewfinderFront, viewfinderBack } = CUTOUTS;
  return [
    {
      id: "lens",
      label: "Lens",
      shape: "circle",
      cx: uOnFace("front", lens.x),
      cy: 1 - vForY(lens.y),
      w: uLength("front", lens.diameter),
      h: vLength(lens.diameter),
    },
    {
      id: "flash",
      label: "Flash",
      shape: "rect",
      cx: uOnFace("front", flash.x),
      cy: 1 - vForY(flash.y),
      w: uLength("front", flash.width),
      h: vLength(flash.height),
    },
    {
      id: "viewfinder-front",
      label: "Viewfinder",
      shape: "rect",
      cx: uOnFace("front", viewfinderFront.x),
      cy: 1 - vForY(viewfinderFront.y),
      w: uLength("front", viewfinderFront.width),
      h: vLength(viewfinderFront.height),
    },
    {
      id: "viewfinder-back",
      label: "Eyepiece",
      shape: "rect",
      cx: uOnFace("back", viewfinderBack.x),
      cy: 1 - vForY(viewfinderBack.y),
      w: uLength("back", viewfinderBack.width),
      h: vLength(viewfinderBack.height),
    },
  ];
}

/**
 * The clear area on the front face for customer text: below the lens and
 * flash, inside the flat run so nothing bends around a corner.
 */
export function frontTextBox() {
  const left = uOnFace("front", -BODY.width / 2 + BODY.cornerRadius + 4);
  const right = uOnFace("front", BODY.width / 2 - BODY.cornerRadius - 4);
  const top = 1 - vForY(-12);
  const bottom = 1 - vForY(-BODY.height / 2 + 4);
  return { left, right, top, bottom, width: right - left, height: bottom - top };
}
