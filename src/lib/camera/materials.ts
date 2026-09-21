import { Color, DoubleSide, MeshPhysicalMaterial, MeshStandardMaterial, Texture, Vector2 } from "three";
import type { WrapMaps } from "./wrapMaps";

export type CameraMaterials = ReturnType<typeof createCameraMaterials>;

/**
 * One material per real-world part. The blank bodies are moulded in the same
 * black ABS throughout, so the shell, decks and winder share a base and differ
 * only in finish — the deck is handled more, the winder is textured to grip.
 */
export function createCameraMaterials(shellNormalMap: Texture) {
  const shell = new MeshPhysicalMaterial({
    color: new Color(0x16141a),
    roughness: 0.5,
    metalness: 0,
    clearcoat: 0.45,
    clearcoatRoughness: 0.42,
    normalMap: shellNormalMap,
    normalScale: new Vector2(0.28, 0.28),
    envMapIntensity: 0.75,
  });

  const shellMatte = new MeshPhysicalMaterial({
    color: new Color(0x121017),
    roughness: 0.68,
    metalness: 0,
    clearcoat: 0.2,
    clearcoatRoughness: 0.6,
    normalMap: shellNormalMap,
    normalScale: new Vector2(0.4, 0.4),
    envMapIntensity: 0.8,
  });

  // Printed wrap. Roughness comes entirely from the map so the laminate's
  // variation survives; the clearcoat is the thin matte laminate on top.
  const wrap = new MeshPhysicalMaterial({
    color: new Color(0xffffff),
    roughness: 1,
    metalness: 0,
    clearcoat: 0.2,
    clearcoatRoughness: 0.72,
    envMapIntensity: 0.38,
  });

  // Plastic meniscus lens with an anti-reflective coating. specularColor tints
  // the reflection blue the way a real coating does, without a transmission
  // pass that a mid-range phone cannot afford.
  const lensGlass = new MeshPhysicalMaterial({
    color: new Color(0x05070c),
    roughness: 0.07,
    metalness: 0,
    ior: 1.9,
    clearcoat: 1,
    clearcoatRoughness: 0.03,
    specularIntensity: 1,
    specularColor: new Color(0x8ec2ff),
    // A real anti-reflective coating is a thin film, which is exactly what
    // iridescence models — it puts the faint blue-violet sheen on the glass.
    iridescence: 0.45,
    iridescenceIOR: 1.38,
    iridescenceThicknessRange: [130, 270],
    envMapIntensity: 2.2,
  });

  // Glossy black, not grey: a matte collar washes out to mid-grey under a
  // softbox and the barrel stops reading as a barrel.
  const lensCollar = new MeshPhysicalMaterial({
    color: new Color(0x0d0c10),
    roughness: 0.28,
    metalness: 0,
    clearcoat: 0.9,
    clearcoatRoughness: 0.12,
    envMapIntensity: 1.15,
  });

  const lensBarrel = new MeshStandardMaterial({
    color: new Color(0x08070a),
    roughness: 0.82,
    metalness: 0,
    side: DoubleSide,
    envMapIntensity: 0.35,
  });

  const flashReflector = new MeshStandardMaterial({
    color: new Color(0xe8e4da),
    roughness: 0.28,
    metalness: 1,
    side: DoubleSide,
    envMapIntensity: 1.7,
  });

  const flashTube = new MeshStandardMaterial({
    color: new Color(0xf2efe4),
    roughness: 0.22,
    metalness: 0,
    envMapIntensity: 1.1,
  });

  const flashWindow = new MeshPhysicalMaterial({
    color: new Color(0xf7f4e8),
    roughness: 0.1,
    metalness: 0,
    transparent: true,
    opacity: 0.2,
    clearcoat: 1,
    clearcoatRoughness: 0.05,
    envMapIntensity: 1.4,
  });

  const viewfinderGlass = new MeshPhysicalMaterial({
    color: new Color(0x0b0d12),
    roughness: 0.08,
    metalness: 0,
    clearcoat: 1,
    clearcoatRoughness: 0.04,
    specularColor: new Color(0x9fd0ff),
    envMapIntensity: 1.5,
  });

  const winder = new MeshPhysicalMaterial({
    color: new Color(0x1a171f),
    roughness: 0.54,
    metalness: 0,
    clearcoat: 0.25,
    clearcoatRoughness: 0.45,
    envMapIntensity: 0.85,
  });

  const shutter = new MeshPhysicalMaterial({
    color: new Color(0xb3005c),
    roughness: 0.34,
    metalness: 0,
    clearcoat: 0.8,
    clearcoatRoughness: 0.18,
    envMapIntensity: 1.1,
  });

  const counterWindow = new MeshStandardMaterial({
    color: new Color(0x0d0c11),
    roughness: 0.25,
    metalness: 0,
    envMapIntensity: 0.9,
  });

  const all = [
    shell,
    shellMatte,
    wrap,
    lensGlass,
    lensCollar,
    lensBarrel,
    flashReflector,
    flashTube,
    flashWindow,
    viewfinderGlass,
    winder,
    shutter,
    counterWindow,
  ];

  return {
    shell,
    shellMatte,
    wrap,
    lensGlass,
    lensCollar,
    lensBarrel,
    flashReflector,
    flashTube,
    flashWindow,
    viewfinderGlass,
    winder,
    shutter,
    counterWindow,
    dispose() {
      for (const material of all) material.dispose();
    },
  };
}

/** Swaps the printed artwork on the wrap material and releases the old maps. */
export function applyWrapMaps(material: MeshPhysicalMaterial, maps: WrapMaps, anisotropy: number) {
  for (const texture of [maps.map, maps.roughnessMap, maps.normalMap]) {
    texture.anisotropy = anisotropy;
  }
  material.map = maps.map;
  material.roughnessMap = maps.roughnessMap;
  material.normalMap = maps.normalMap;
  material.normalScale.copy(maps.normalScale);
  material.needsUpdate = true;
}
