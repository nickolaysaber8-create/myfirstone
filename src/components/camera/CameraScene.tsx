"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ContactShadows, OrbitControls } from "@react-three/drei";
import {
  NeutralToneMapping,
  type PerspectiveCamera as PerspectiveCameraType,
  Spherical,
  type Texture,
  Vector3,
} from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { CameraModel } from "./CameraModel";
import { createStudioEnvironment } from "@/lib/camera/studioEnvironment";
import type { WrapSource } from "@/lib/camera/wrapMaps";
import {
  easeInOutCubic,
  fitDistance,
  FOV,
  POLAR_LIMITS,
  shortestAzimuth,
  sphericalFor,
  type ViewName,
} from "./viewPresets";

const ORIGIN = new Vector3(0, 0, 0);
const TRANSITION_MS = 780;
const IDLE_SPEED = 0.085; // radians per second

function StudioEnvironment() {
  const gl = useThree((state) => state.gl);
  const environment: Texture = useMemo(() => createStudioEnvironment(gl), [gl]);

  useEffect(() => () => environment.dispose(), [environment]);

  return <primitive object={environment} attach="environment" />;
}

type DirectorProps = {
  view: ViewName;
  idle: boolean;
  onUserInteract: () => void;
};

/**
 * Owns where the camera is pointing. Preset changes are eased rather than
 * snapped, and the idle turn gives up the moment someone takes hold of it.
 */
function ViewDirector({ view, idle, onUserInteract }: DirectorProps) {
  const camera = useThree((state) => state.camera) as PerspectiveCameraType;
  const controls = useThree((state) => state.controls) as OrbitControlsImpl | null;
  const size = useThree((state) => state.size);
  const aspect = size.width / Math.max(1, size.height);

  const tween = useRef<{ from: Spherical; to: Spherical; start: number } | null>(null);
  const scratch = useRef(new Spherical());
  const firstPlacement = useRef(true);

  useEffect(() => {
    if (!controls) return;
    const stop = () => {
      tween.current = null;
      onUserInteract();
    };
    controls.addEventListener("start", stop);
    return () => controls.removeEventListener("start", stop);
  }, [controls, onUserInteract]);

  useEffect(() => {
    const target = sphericalFor(view, aspect);

    if (firstPlacement.current) {
      firstPlacement.current = false;
      camera.position.setFromSpherical(target).add(ORIGIN);
      camera.lookAt(ORIGIN);
      return;
    }

    const from = new Spherical().setFromVector3(camera.position.clone().sub(ORIGIN));
    target.theta = shortestAzimuth(from.theta, target.theta);
    // Keep whatever zoom the customer chose; only the angle is a preset.
    target.radius = from.radius;
    tween.current = { from, to: target, start: performance.now() };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, camera]);

  // Re-fit when the panel changes shape, but never mid-gesture.
  useEffect(() => {
    if (firstPlacement.current) return;
    const spherical = new Spherical().setFromVector3(camera.position.clone().sub(ORIGIN));
    spherical.radius = fitDistance(aspect);
    camera.position.setFromSpherical(spherical).add(ORIGIN);
    camera.lookAt(ORIGIN);
  }, [aspect, camera]);

  useFrame((_, delta) => {
    const active = tween.current;

    if (active) {
      const t = Math.min(1, (performance.now() - active.start) / TRANSITION_MS);
      const eased = easeInOutCubic(t);
      const s = scratch.current;
      s.radius = active.from.radius + (active.to.radius - active.from.radius) * eased;
      s.phi = active.from.phi + (active.to.phi - active.from.phi) * eased;
      s.theta = active.from.theta + (active.to.theta - active.from.theta) * eased;
      camera.position.setFromSpherical(s).add(ORIGIN);
      camera.lookAt(ORIGIN);
      if (t >= 1) tween.current = null;
      return;
    }

    if (!idle) return;
    // Turns toward the front first. Starting at three-quarter and drifting the
    // other way would open on the back, which is the least interesting side.
    const s = scratch.current.setFromVector3(camera.position.clone().sub(ORIGIN));
    s.theta += IDLE_SPEED * delta;
    camera.position.setFromSpherical(s).add(ORIGIN);
    camera.lookAt(ORIGIN);
  });

  return null;
}

export type CameraSceneProps = {
  wrapSource: WrapSource | null;
  view: ViewName;
  active: boolean;
  reducedMotion: boolean;
  onReady?: () => void;
};

export function CameraScene({ wrapSource, view, active, reducedMotion, onReady }: CameraSceneProps) {
  const [touched, setTouched] = useState(false);
  // This component is only ever imported client-side, so reading the device
  // pixel ratio during the first render is safe.
  const [dpr, setDpr] = useState(() => Math.min(2, window.devicePixelRatio || 1));
  const readyRef = useRef(false);

  const initial = useMemo(() => sphericalFor(view, 1.35), []); // eslint-disable-line react-hooks/exhaustive-deps
  const initialPosition = useMemo(
    () => new Vector3().setFromSpherical(initial).toArray() as [number, number, number],
    [initial],
  );

  const idle = !touched && !reducedMotion && active;

  return (
    <Canvas
      dpr={dpr}
      frameloop={active ? "always" : "never"}
      camera={{ fov: FOV, near: 1, far: 120, position: initialPosition }}
      gl={{
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
        toneMapping: NeutralToneMapping,
      }}
      onCreated={({ gl }) => {
        gl.toneMappingExposure = 1;
        if (!readyRef.current) {
          readyRef.current = true;
          onReady?.();
        }
      }}
    >
      <StudioEnvironment />

      {/* Key light picks out the top chamfer; the rim separates the body from
          the panel behind it. Contact shadow does the rest. */}
      <ambientLight intensity={0.08} />
      <directionalLight position={[-9, 14, 11]} intensity={1.35} color="#fff4ea" />
      <directionalLight position={[10, 5, -9]} intensity={1.15} color="#dceaff" />
      <directionalLight position={[8, -2, 9]} intensity={0.22} color="#ffffff" />

      <CameraModel wrapSource={wrapSource} />

      <ContactShadows
        position={[0, -3.02, 0]}
        scale={22}
        blur={2.2}
        opacity={0.7}
        far={4.5}
        resolution={384}
      />

      <OrbitControls
        makeDefault
        enablePan={false}
        enableDamping
        dampingFactor={0.075}
        rotateSpeed={0.85}
        zoomSpeed={0.7}
        minDistance={14}
        maxDistance={38}
        minPolarAngle={POLAR_LIMITS.min}
        maxPolarAngle={POLAR_LIMITS.max}
        target={[0, 0, 0]}
      />

      <ViewDirector view={view} idle={idle} onUserInteract={() => setTouched(true)} />

      <PerformanceGuard onDrop={() => setDpr((current) => Math.max(1, current - 0.5))} />
    </Canvas>
  );
}

/** Drops resolution once rather than letting a slow phone stutter for ever. */
function PerformanceGuard({ onDrop }: { onDrop: () => void }) {
  const slowFrames = useRef(0);
  const fired = useRef(false);

  useFrame((_, delta) => {
    if (fired.current) return;
    if (delta > 1 / 40) slowFrames.current += 1;
    else slowFrames.current = Math.max(0, slowFrames.current - 1);
    if (slowFrames.current > 45) {
      fired.current = true;
      onDrop();
    }
  });

  return null;
}
