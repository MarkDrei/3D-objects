import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

/**
 * GLTF models (Kenney, CC0). All models are preloaded once, then cloned
 * synchronously while building the world. Paths are relative to /models/.
 */
const cache = new Map<string, THREE.Object3D>();

/** The Kenney nature kit is very turquoise; nudge it towards the city palette. */
const RECOLOR: Record<string, string> = {
  leafsGreen: '#58a83c',
  leafsDark: '#2f7d3c',
  grass: '#62b043',
  stone: '#b4b8bd',
  stoneDark: '#8c9198',
};
const recolored = new Map<string, THREE.Material>();
const BASE = `${import.meta.env.BASE_URL}models/`;

export async function preloadModels(paths: string[], onProgress?: (done: number, total: number) => void) {
  const loader = new GLTFLoader();
  let done = 0;
  const unique = [...new Set(paths)].filter((p) => !cache.has(p));
  await Promise.all(
    unique.map(async (p) => {
      try {
        const gltf = await loader.loadAsync(BASE + p);
        gltf.scene.traverse((o) => {
          const m = o as THREE.Mesh;
          if (m.isMesh) {
            m.castShadow = true;
            m.receiveShadow = true;
            if (p.startsWith('nature/')) {
              const swap = (mat: THREE.Material) => {
                const hex = RECOLOR[mat.name];
                if (!hex) return mat;
                if (!recolored.has(mat.name)) {
                  const c = (mat as THREE.MeshStandardMaterial).clone();
                  c.color.set(hex);
                  recolored.set(mat.name, c);
                }
                return recolored.get(mat.name)!;
              };
              m.material = Array.isArray(m.material) ? m.material.map(swap) : swap(m.material);
            }
            for (const mat of Array.isArray(m.material) ? m.material : [m.material]) {
              const sm = mat as THREE.MeshStandardMaterial;
              if (sm.map) sm.map.anisotropy = 4;
              if ('metalness' in sm) sm.metalness = Math.min(sm.metalness, 0.2);
            }
          }
        });
        cache.set(p, gltf.scene);
      } catch (e) {
        console.warn('Model failed to load', p, e);
        cache.set(p, new THREE.Group());
      }
      done++;
      onProgress?.(done, unique.length);
    }),
  );
}

/** Clone a preloaded model. Geometry + materials are shared between clones. */
export function model(path: string): THREE.Object3D {
  const src = cache.get(path);
  if (!src) throw new Error(`Model not preloaded: ${path}`);
  return src.clone(true);
}

/**
 * Wrap a model so that its footprint fits `size` (largest of X/Z) or its height
 * equals `height`, its base sits on y=0 and it is centered in X/Z.
 */
export function fitModel(obj: THREE.Object3D, opts: { size?: number; height?: number; scale?: number }): THREE.Group {
  const box = new THREE.Box3().setFromObject(obj);
  const dim = box.getSize(new THREE.Vector3());
  let s = opts.scale ?? 1;
  if (opts.size) s = opts.size / Math.max(dim.x, dim.z);
  if (opts.height) s = opts.height / dim.y;
  const center = box.getCenter(new THREE.Vector3());
  obj.position.set(-center.x * s, -box.min.y * s, -center.z * s);
  obj.scale.setScalar(s);
  const g = new THREE.Group();
  g.add(obj);
  return g;
}

/**
 * Bake many copies of a model into one mesh per material (for crops, hedges …).
 * Returns a Group positioned at the origin; transforms are in the group's space.
 */
export function mergeInstances(path: string, transforms: THREE.Matrix4[]): THREE.Group {
  const src = cache.get(path);
  if (!src) throw new Error(`Model not preloaded: ${path}`);
  src.updateMatrixWorld(true);
  const byMat = new Map<THREE.Material, THREE.BufferGeometry[]>();
  src.traverse((o) => {
    const m = o as THREE.Mesh;
    if (!m.isMesh || Array.isArray(m.material)) return;
    for (const t of transforms) {
      const g = m.geometry.clone();
      g.applyMatrix4(new THREE.Matrix4().multiplyMatrices(t, m.matrixWorld));
      if (!byMat.has(m.material)) byMat.set(m.material, []);
      byMat.get(m.material)!.push(g);
    }
  });
  const group = new THREE.Group();
  for (const [mat, geos] of byMat) {
    const merged = mergeGeometries(geos, false);
    geos.forEach((g) => g.dispose());
    if (!merged) continue;
    const mesh = new THREE.Mesh(merged, mat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
  }
  return group;
}
