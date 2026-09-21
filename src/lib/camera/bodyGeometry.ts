import { BufferGeometry, BufferAttribute } from "three";
import { BODY, MM_TO_UNIT, PERIMETER_MM } from "./dimensions";

type Ring = { x: number; z: number; nx: number; nz: number; u: number };

/**
 * Samples the rounded-rect cross-section once, carrying the outward normal and
 * the cumulative arc length. Arc length is what makes the print land evenly:
 * a naive angular sweep would stretch the artwork across the corners.
 */
function crossSection(cornerSegments: number): Ring[] {
  const { width: W, depth: D, cornerRadius: R } = BODY;
  const hx = W / 2 - R;
  const hz = D / 2 - R;

  const pts: { x: number; z: number; nx: number; nz: number }[] = [];

  // Flat front (+z), running left to right.
  pts.push({ x: -hx, z: D / 2, nx: 0, nz: 1 });
  pts.push({ x: hx, z: D / 2, nx: 0, nz: 1 });

  const corners: { cx: number; cz: number; from: number }[] = [
    { cx: hx, cz: hz, from: Math.PI / 2 }, // front-right
    { cx: hx, cz: -hz, from: 0 }, // back-right
    { cx: -hx, cz: -hz, from: -Math.PI / 2 }, // back-left
    { cx: -hx, cz: hz, from: -Math.PI }, // front-left
  ];
  const flats: { x: number; z: number; nx: number; nz: number }[][] = [
    [
      { x: W / 2, z: hz, nx: 1, nz: 0 },
      { x: W / 2, z: -hz, nx: 1, nz: 0 },
    ],
    [
      { x: hx, z: -D / 2, nx: 0, nz: -1 },
      { x: -hx, z: -D / 2, nx: 0, nz: -1 },
    ],
    [
      { x: -W / 2, z: -hz, nx: -1, nz: 0 },
      { x: -W / 2, z: hz, nx: -1, nz: 0 },
    ],
    [],
  ];

  for (let c = 0; c < 4; c++) {
    const { cx, cz, from } = corners[c];
    for (let s = 1; s <= cornerSegments; s++) {
      const a = from - (s / cornerSegments) * (Math.PI / 2);
      const nx = Math.cos(a);
      const nz = Math.sin(a);
      pts.push({ x: cx + nx * R, z: cz + nz * R, nx, nz });
    }
    for (const p of flats[c]) pts.push(p);
  }

  // Close the loop by repeating the seam vertex with u = 1, so the texture
  // meets itself instead of snapping back across the whole strip.
  let travelled = 0;
  const ring: Ring[] = [{ ...pts[0], u: 0 }];
  for (let i = 1; i < pts.length; i++) {
    const prev = pts[i - 1];
    const cur = pts[i];
    travelled += Math.hypot(cur.x - prev.x, cur.z - prev.z);
    ring.push({ ...cur, u: travelled / PERIMETER_MM });
  }
  ring.push({ ...pts[0], u: 1 });

  return ring;
}

/**
 * Vertical profile of the body: a flat middle with a quarter-round chamfer
 * rolling onto the top and bottom decks. `inset` pulls the cross-section
 * inward, `ny` is the vertical part of the surface normal.
 */
function verticalProfile(chamferSegments: number) {
  const { height: H, edgeChamfer: C } = BODY;
  const rows: { y: number; inset: number; nRadial: number; ny: number; v: number }[] = [];

  for (let s = 0; s <= chamferSegments; s++) {
    const t = (s / chamferSegments) * (Math.PI / 2);
    rows.push({
      y: -H / 2 + C * (1 - Math.cos(t)),
      inset: C * (1 - Math.sin(t)),
      nRadial: Math.sin(t),
      ny: -Math.cos(t),
      v: 0,
    });
  }
  rows.push({ y: H / 2 - C, inset: 0, nRadial: 1, ny: 0, v: 0 });
  for (let s = chamferSegments; s >= 0; s--) {
    const t = (s / chamferSegments) * (Math.PI / 2);
    rows.push({
      y: H / 2 - C * (1 - Math.cos(t)),
      inset: C * (1 - Math.sin(t)),
      nRadial: Math.sin(t),
      ny: Math.cos(t),
      v: 0,
    });
  }

  // v follows the developed surface length, so the print does not compress
  // where it curls over the chamfer.
  let run = 0;
  rows[0].v = 0;
  for (let i = 1; i < rows.length; i++) {
    const a = rows[i - 1];
    const b = rows[i];
    run += Math.hypot(b.y - a.y, b.inset - a.inset);
    rows[i].v = run;
  }
  for (const r of rows) r.v /= run;

  return rows;
}

export type BodyGeometryOptions = {
  cornerSegments?: number;
  chamferSegments?: number;
};

/**
 * Body of the camera as one geometry with two draw groups:
 *   group 0 — the wrapped band (front, right, back, left plus both chamfers)
 *   group 1 — the top and bottom decks, which stay bare plastic
 */
export function buildBodyGeometry({
  cornerSegments = 10,
  chamferSegments = 5,
}: BodyGeometryOptions = {}): BufferGeometry {
  const ring = crossSection(cornerSegments);
  const rows = verticalProfile(chamferSegments);
  const cols = ring.length;

  const positions: number[] = [];
  const normals: number[] = [];
  const uvs: number[] = [];
  const bandIndices: number[] = [];
  const capIndices: number[] = [];

  for (const row of rows) {
    for (const col of ring) {
      const x = (col.x - col.nx * row.inset) * MM_TO_UNIT;
      const z = (col.z - col.nz * row.inset) * MM_TO_UNIT;
      positions.push(x, row.y * MM_TO_UNIT, z);

      const nx = col.nx * row.nRadial;
      const nz = col.nz * row.nRadial;
      const len = Math.hypot(nx, row.ny, nz) || 1;
      normals.push(nx / len, row.ny / len, nz / len);
      uvs.push(col.u, row.v);
    }
  }

  for (let r = 0; r < rows.length - 1; r++) {
    for (let c = 0; c < cols - 1; c++) {
      const a = r * cols + c;
      const b = a + 1;
      const d = (r + 1) * cols + c;
      const e = d + 1;
      bandIndices.push(a, b, d, b, e, d);
    }
  }

  // Decks. The rim sits on the innermost chamfer ring so the cap meets the
  // body exactly where the chamfer stops turning.
  const half = BODY.height / 2;
  const deckInset = BODY.edgeChamfer;
  for (const sign of [-1, 1] as const) {
    const centreIndex = positions.length / 3;
    positions.push(0, sign * half * MM_TO_UNIT, 0);
    normals.push(0, sign, 0);
    uvs.push(0.5, sign > 0 ? 1 : 0);

    const rimStart = positions.length / 3;
    for (let c = 0; c < cols - 1; c++) {
      const col = ring[c];
      positions.push(
        (col.x - col.nx * deckInset) * MM_TO_UNIT,
        sign * half * MM_TO_UNIT,
        (col.z - col.nz * deckInset) * MM_TO_UNIT,
      );
      normals.push(0, sign, 0);
      uvs.push(0.5 + (col.x / BODY.width) * 0.5, 0.5 + (col.z / BODY.depth) * 0.5);
    }

    const rimCount = cols - 1;
    for (let c = 0; c < rimCount; c++) {
      const a = rimStart + c;
      const b = rimStart + ((c + 1) % rimCount);
      if (sign > 0) capIndices.push(centreIndex, a, b);
      else capIndices.push(centreIndex, b, a);
    }
  }

  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new BufferAttribute(new Float32Array(positions), 3));
  geometry.setAttribute("normal", new BufferAttribute(new Float32Array(normals), 3));
  geometry.setAttribute("uv", new BufferAttribute(new Float32Array(uvs), 2));
  geometry.setIndex(bandIndices.concat(capIndices));
  geometry.addGroup(0, bandIndices.length, 0);
  geometry.addGroup(bandIndices.length, capIndices.length, 1);
  geometry.computeBoundingSphere();

  return geometry;
}
