import {
  BoxGeometry,
  Color,
  Mesh,
  MeshStandardMaterial,
  PMREMGenerator,
  Scene,
  Texture,
  WebGLRenderer,
} from "three";

type Emitter = {
  size: [number, number, number];
  position: [number, number, number];
  rotation?: [number, number, number];
  color: number;
  intensity: number;
};

/**
 * A three-light product table, built as geometry rather than fetched as an
 * .hdr file. Customers on a slow connection get studio reflections without
 * downloading a couple of megabytes of environment map.
 */
const SHELL = 0x1e1c22;

const EMITTERS: Emitter[] = [
  // Key softbox: large, high, front-left.
  {
    size: [9, 0.1, 6],
    position: [-4.5, 8.5, 4.5],
    rotation: [-0.42, 0, 0.34],
    color: 0xfff6ee,
    intensity: 7.5,
  },
  // Fill: broad, low, camera right. Keeps the shadow side readable.
  {
    size: [7, 5, 0.1],
    position: [7.5, 2.4, 4.5],
    rotation: [0, -0.7, 0],
    color: 0xf2f4ff,
    intensity: 1.5,
  },
  // Rim strip behind, cool, to separate the body from the backdrop.
  {
    size: [0.1, 7, 5],
    position: [-6.5, 4, -6],
    rotation: [0, 0.5, 0],
    color: 0xdceaff,
    intensity: 5.5,
  },
  // Low bounce off the table.
  {
    size: [12, 0.1, 9],
    position: [0, -3.4, 1],
    color: 0xe8e2e4,
    intensity: 0.9,
  },
  // Narrow top-back kicker that draws a highlight along the top chamfer.
  {
    size: [5, 0.1, 2],
    position: [2.5, 7, -4.5],
    rotation: [0.5, 0, 0],
    color: 0xffffff,
    intensity: 4,
  },
  // Back softbox. People turn the body right round, so the far side needs a
  // light of its own rather than whatever spills past the rim.
  {
    size: [12, 7, 0.1],
    position: [2, 3.5, -9],
    rotation: [0.45, 0, 0],
    color: 0xf4f7ff,
    intensity: 3.2,
  },
  // Front softbox. Without something in front of the body the lens has
  // nothing to reflect and reads as a hole punched in the camera.
  {
    size: [15, 9, 0.1],
    position: [-1.5, 4, 9],
    rotation: [-0.5, 0, 0],
    color: 0xfffaf2,
    intensity: 5,
  },
];

function buildScene(): Scene {
  const scene = new Scene();
  const box = new BoxGeometry();
  box.deleteAttribute("uv");

  const room = new Mesh(
    box,
    new MeshStandardMaterial({ side: 1 /* BackSide */, color: SHELL, roughness: 1, metalness: 0 }),
  );
  room.scale.set(34, 24, 34);
  scene.add(room);

  for (const emitter of EMITTERS) {
    const material = new MeshStandardMaterial({
      color: 0x000000,
      emissive: new Color(emitter.color),
      emissiveIntensity: emitter.intensity,
      roughness: 1,
      metalness: 0,
    });
    const mesh = new Mesh(box, material);
    mesh.scale.set(...emitter.size);
    mesh.position.set(...emitter.position);
    if (emitter.rotation) mesh.rotation.set(...emitter.rotation);
    scene.add(mesh);
  }

  return scene;
}

/**
 * Builds the pre-filtered environment map. The intermediate scene is thrown
 * away immediately; only the cubemap render target survives.
 */
export function createStudioEnvironment(renderer: WebGLRenderer): Texture {
  const pmrem = new PMREMGenerator(renderer);
  pmrem.compileEquirectangularShader();

  const scene = buildScene();
  const target = pmrem.fromScene(scene, 0.035);

  scene.traverse((object) => {
    if (object instanceof Mesh) {
      object.geometry.dispose();
      (object.material as MeshStandardMaterial).dispose();
    }
  });
  pmrem.dispose();

  return target.texture;
}
