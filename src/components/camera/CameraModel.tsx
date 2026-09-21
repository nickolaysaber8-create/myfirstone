"use client";

import { useEffect, useMemo } from "react";
import { useThree } from "@react-three/fiber";
import { DoubleSide, type MeshPhysicalMaterial } from "three";
import { buildBodyGeometry } from "@/lib/camera/bodyGeometry";
import { HALF, mm } from "@/lib/camera/dimensions";
import { applyWrapMaps, createCameraMaterials } from "@/lib/camera/materials";
import {
  buildBezelGeometry,
  buildCounterTexture,
  buildRidgedWheel,
  lensCap,
} from "@/lib/camera/parts";
import { buildShellNormalMap, buildWrapMaps, type WrapSource } from "@/lib/camera/wrapMaps";

const FRONT = mm(HALF.z);
const BACK = -mm(HALF.z);
const DECK = mm(HALF.y);

const LENS = { x: mm(-31), y: mm(-1) };
const FLASH = { x: mm(34), y: mm(6) };
const FINDER = { x: mm(43), y: mm(21) };

type Props = {
  wrapSource: WrapSource | null;
};

export function CameraModel({ wrapSource }: Props) {
  const gl = useThree((state) => state.gl);
  const maxAnisotropy = useMemo(() => gl.capabilities.getMaxAnisotropy(), [gl]);

  const shellNormalMap = useMemo(() => buildShellNormalMap(), []);
  const materials = useMemo(() => createCameraMaterials(shellNormalMap), [shellNormalMap]);

  const bodyGeometry = useMemo(() => buildBodyGeometry(), []);
  const flashBezel = useMemo(() => buildBezelGeometry(20, 16, 17, 13, 2), []);
  const finderFrontBezel = useMemo(() => buildBezelGeometry(12.5, 9.5, 9, 6.5, 1.5, 0.9), []);
  const finderBackBezel = useMemo(() => buildBezelGeometry(14.5, 11.5, 11, 8, 1.6, 0.9), []);
  const winderWheel = useMemo(() => buildRidgedWheel(9.5, 5.2), []);
  const glass = useMemo(() => lensCap(16, 2.4), []);

  const counter = useMemo(() => buildCounterTexture(), []);

  // The wrap is the one texture that changes while the page is open, so it is
  // the one that has to be released explicitly when it does.
  useEffect(() => {
    if (!wrapSource) return;
    const maps = buildWrapMaps(wrapSource);
    applyWrapMaps(materials.wrap as MeshPhysicalMaterial, maps, Math.min(8, maxAnisotropy));
    return () => {
      materials.wrap.map = null;
      materials.wrap.roughnessMap = null;
      materials.wrap.normalMap = null;
      maps.dispose();
    };
  }, [wrapSource, materials, maxAnisotropy]);

  useEffect(() => {
    return () => {
      bodyGeometry.dispose();
      flashBezel.dispose();
      finderFrontBezel.dispose();
      finderBackBezel.dispose();
      winderWheel.dispose();
      shellNormalMap.dispose();
      counter.dispose();
      materials.dispose();
    };
  }, [
    bodyGeometry,
    flashBezel,
    finderFrontBezel,
    finderBackBezel,
    winderWheel,
    shellNormalMap,
    counter,
    materials,
  ]);

  return (
    <group>
      {/* Body: wrapped band + bare plastic decks, in that material order. */}
      <mesh geometry={bodyGeometry} material={[materials.wrap, materials.shell]} />

      {/* Lens assembly */}
      <group position={[LENS.x, LENS.y, 0]}>
        <mesh
          rotation={[Math.PI / 2, 0, 0]}
          position={[0, 0, mm(19.6)]}
          material={materials.lensCollar}
        >
          <cylinderGeometry args={[mm(10.2), mm(11.6), mm(3.2), 56, 1]} />
        </mesh>
        {/* Chamfered front edge. The bright line it catches is what tells the
            eye this is a barrel and not a circle printed on the wrap. */}
        <mesh
          rotation={[Math.PI / 2, 0, 0]}
          position={[0, 0, mm(21.6)]}
          material={materials.lensCollar}
        >
          <cylinderGeometry args={[mm(9.4), mm(10.2), mm(0.9), 56, 1, true]} />
        </mesh>
        <mesh
          rotation={[Math.PI / 2, 0, 0]}
          position={[0, 0, mm(18.6)]}
          material={materials.lensBarrel}
        >
          <cylinderGeometry args={[mm(9.4), mm(8.2), mm(4.4), 48, 1, true]} />
        </mesh>
        <mesh position={[0, 0, mm(16.4)]} material={materials.lensBarrel}>
          <circleGeometry args={[mm(8.4), 48]} />
        </mesh>
        <mesh
          rotation={[Math.PI / 2, 0, 0]}
          position={[0, 0, mm(19.4) - glass.rimOffset]}
          material={materials.lensGlass}
        >
          <sphereGeometry args={[glass.radius, 56, 24, 0, Math.PI * 2, 0, glass.theta]} />
        </mesh>
      </group>

      {/* Flash: rough metal reflector and tube behind a clear window. */}
      <group position={[FLASH.x, FLASH.y, 0]}>
        <mesh position={[0, 0, mm(16.6)]} material={materials.flashReflector}>
          <boxGeometry args={[mm(16), mm(12), mm(0.6)]} />
        </mesh>
        <mesh rotation={[0, 0, Math.PI / 2]} position={[0, 0, mm(17.6)]} material={materials.flashTube}>
          <cylinderGeometry args={[mm(0.9), mm(0.9), mm(11), 16]} />
        </mesh>
        <mesh geometry={flashBezel} position={[0, 0, FRONT - mm(0.7)]} material={materials.shellMatte} />
        <mesh position={[0, 0, FRONT + mm(0.3)]} material={materials.flashWindow}>
          <boxGeometry args={[mm(17), mm(13), mm(1)]} />
        </mesh>
      </group>

      {/* Viewfinder: a straight tube, so both windows share one x. */}
      <group position={[FINDER.x, FINDER.y, 0]}>
        <mesh material={materials.lensBarrel}>
          <boxGeometry args={[mm(8), mm(5.5), mm(34)]} />
        </mesh>
        <mesh geometry={finderFrontBezel} position={[0, 0, FRONT - mm(0.45)]} material={materials.shell} />
        <mesh position={[0, 0, FRONT + mm(0.2)]} material={materials.viewfinderGlass}>
          <boxGeometry args={[mm(9), mm(6.5), mm(0.8)]} />
        </mesh>
        <mesh
          geometry={finderBackBezel}
          rotation={[0, Math.PI, 0]}
          position={[0, 0, BACK + mm(0.45)]}
          material={materials.shell}
        />
        <mesh position={[0, 0, BACK - mm(0.2)]} material={materials.viewfinderGlass}>
          <boxGeometry args={[mm(11), mm(8), mm(0.8)]} />
        </mesh>
      </group>

      {/* Top deck controls */}
      <group position={[0, DECK, 0]}>
        <mesh position={[mm(-34), mm(-0.2), mm(4)]} material={materials.shellMatte}>
          <cylinderGeometry args={[mm(6.4), mm(6.8), mm(1.6), 40]} />
        </mesh>
        <mesh position={[mm(-34), mm(1.1), mm(4)]} material={materials.shutter}>
          <cylinderGeometry args={[mm(4.4), mm(4.6), mm(2.4), 40]} />
        </mesh>

        <mesh position={[mm(33), mm(-0.4), mm(-4)]} material={materials.shellMatte}>
          <cylinderGeometry args={[mm(12), mm(12), mm(1.2), 44]} />
        </mesh>
        <mesh
          geometry={winderWheel}
          position={[mm(33), mm(-1.2), mm(-4)]}
          material={materials.winder}
        />

        <mesh position={[mm(12), mm(0.35), mm(-3)]} material={materials.counterWindow}>
          <boxGeometry args={[mm(12), mm(0.7), mm(8)]} />
        </mesh>
        <mesh position={[mm(12), mm(0.72), mm(-3)]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[mm(10), mm(6.6)]} />
          <meshStandardMaterial map={counter} roughness={0.35} side={DoubleSide} />
        </mesh>
      </group>
    </group>
  );
}
