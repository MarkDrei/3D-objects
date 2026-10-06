import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

/**
 * GLTF models (Kenney, CC0). All models are preloaded once, then cloned
 * synchronously while building the world. Paths are relative to /models/.
 */
const cache = new Map<string, THREE.Object3D>();
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
            const mats = Array.isArray(m.material) ? m.material : [m.material];
            for (const mat of mats) {
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
