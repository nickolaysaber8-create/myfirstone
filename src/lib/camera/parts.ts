import {
  BufferGeometry,
  CanvasTexture,
  CylinderGeometry,
  ExtrudeGeometry,
  Path,
  Shape,
  SRGBColorSpace,
} from "three";
import { MM_TO_UNIT, mm } from "./dimensions";

function roundedRectPoints(target: Shape | Path, w: number, h: number, r: number) {
  const x = -w / 2;
  const y = -h / 2;
  const radius = Math.min(r, w / 2, h / 2);
  target.moveTo(x + radius, y);
  target.lineTo(x + w - radius, y);
  target.quadraticCurveTo(x + w, y, x + w, y + radius);
  target.lineTo(x + w, y + h - radius);
  target.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  target.lineTo(x + radius, y + h);
  target.quadraticCurveTo(x, y + h, x, y + h - radius);
  target.lineTo(x, y + radius);
  target.quadraticCurveTo(x, y, x + radius, y);
}

export function roundedRectShape(w: number, h: number, r: number): Shape {
  const shape = new Shape();
  roundedRectPoints(shape, w, h, r);
  return shape;
}

/**
 * The raised plastic frame around the flash and viewfinder windows. Extruding
 * a shape with a hole gives a real opening, so the recess reads as depth
 * rather than as a darker rectangle painted on the front.
 */
export function buildBezelGeometry(
  outerW: number,
  outerH: number,
  innerW: number,
  innerH: number,
  depth: number,
  radius = 1.2,
): BufferGeometry {
  const shape = roundedRectShape(mm(outerW), mm(outerH), mm(radius));
  const hole = new Path();
  roundedRectPoints(hole, mm(innerW), mm(innerH), mm(Math.max(0.4, radius - 0.6)));
  shape.holes.push(hole);

  const geometry = new ExtrudeGeometry(shape, {
    depth: mm(depth),
    bevelEnabled: true,
    bevelThickness: mm(0.3),
    bevelSize: mm(0.3),
    bevelSegments: 2,
    curveSegments: 6,
  });
  geometry.computeVertexNormals();
  return geometry;
}

/**
 * Thumb winder. Real ones are knurled so a thumb can catch them, and that
 * knurling is what makes the part read as a wheel from any angle.
 */
export function buildRidgedWheel(
  radiusMm: number,
  heightMm: number,
  ridges = 26,
  depth = 0.075,
): BufferGeometry {
  const geometry = new CylinderGeometry(mm(radiusMm), mm(radiusMm), mm(heightMm), 144, 1, false);
  const position = geometry.attributes.position;

  for (let i = 0; i < position.count; i++) {
    const x = position.getX(i);
    const z = position.getZ(i);
    const r = Math.hypot(x, z);
    if (r < 1e-6) continue;
    const angle = Math.atan2(z, x);
    // Leave the flat caps alone; only the rim is knurled.
    const onRim = r > mm(radiusMm) * 0.97;
    const scale = onRim ? 1 - depth * (0.5 + 0.5 * Math.cos(angle * ridges)) : 1;
    position.setX(i, x * scale);
    position.setZ(i, z * scale);
  }

  position.needsUpdate = true;
  geometry.computeVertexNormals();
  return geometry;
}

/** Geometry parameters for a shallow meniscus lens element. */
export function lensCap(apertureMm: number, sagittaMm: number) {
  const a = mm(apertureMm) / 2;
  const s = mm(sagittaMm);
  const radius = (a * a + s * s) / (2 * s);
  const theta = Math.asin(Math.min(1, a / radius));
  return { radius, theta, rimOffset: radius * Math.cos(theta) };
}

/** Frame counter dial, seen through the small window on the top deck. */
export function buildCounterTexture(exposures = 27): CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 96;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = "#0d0c11";
  ctx.fillRect(0, 0, 128, 96);
  ctx.fillStyle = "#f0e6c8";
  ctx.font = '500 56px "DM Mono", ui-monospace, monospace';
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(String(exposures), 64, 52);

  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

export const UNIT = MM_TO_UNIT;
