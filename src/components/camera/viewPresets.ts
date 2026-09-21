import { Spherical } from "three";

export type ViewName = "front" | "three-quarter" | "back";

export const VIEW_ORDER: ViewName[] = ["front", "three-quarter", "back"];

export const VIEW_LABELS: Record<ViewName, string> = {
  front: "Front",
  "three-quarter": "Three-quarter",
  back: "Back",
};

/** Polar angle is measured from straight up, azimuth from the front of the body. */
const ANGLES: Record<ViewName, { polar: number; azimuth: number }> = {
  front: { polar: 84, azimuth: 0 },
  "three-quarter": { polar: 74, azimuth: -33 },
  back: { polar: 84, azimuth: 180 },
};

export const POLAR_LIMITS = { min: (48 * Math.PI) / 180, max: (118 * Math.PI) / 180 };
export const FOV = 30;

/**
 * Pulls the camera back far enough that the body fills roughly the same share
 * of the frame on a phone in portrait as on a desktop panel.
 */
export function fitDistance(aspect: number): number {
  const widest = 11.8;
  const framed = 0.76;
  const distance = widest / (2 * Math.tan((FOV * Math.PI) / 360) * Math.max(aspect, 0.4) * framed);
  return Math.min(34, Math.max(17, distance));
}

export function sphericalFor(view: ViewName, aspect: number): Spherical {
  const { polar, azimuth } = ANGLES[view];
  return new Spherical(
    fitDistance(aspect),
    (polar * Math.PI) / 180,
    (azimuth * Math.PI) / 180,
  );
}

/** Shortest way round, so Front -> Back never spins the long way. */
export function shortestAzimuth(from: number, to: number): number {
  let delta = (to - from) % (Math.PI * 2);
  if (delta > Math.PI) delta -= Math.PI * 2;
  if (delta < -Math.PI) delta += Math.PI * 2;
  return from + delta;
}

export function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}
