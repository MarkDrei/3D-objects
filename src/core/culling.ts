import * as THREE from 'three';
import { registry } from './registry';
import { onTick } from './anim';

/**
 * Hide small selectable objects when the camera is far away (they would be a few
 * pixels anyway). Saves a lot of draw calls on phones in the overview.
 */
export function setupDistanceCulling(camera: THREE.Camera) {
  const items: { o: THREE.Object3D; d2: number }[] = [];
  const box = new THREE.Box3(), sphere = new THREE.Sphere();
  for (const o of registry) {
    if (o.userData.noCull) continue;
    box.setFromObject(o);
    if (box.isEmpty()) continue;
    box.getBoundingSphere(sphere);
    const r = sphere.radius;
    // tiny objects: their shadows are a few pixels – skip them in the shadow pass
    if (r < 1.3) o.traverse((m) => ((m as THREE.Mesh).isMesh && ((m as THREE.Mesh).castShadow = false)));
    const d = r < 1.5 ? 110 : r < 3 ? 170 : r < 6 ? 260 : 0;
    if (d) items.push({ o, d2: d * d });
  }
  let frame = 0;
  const p = new THREE.Vector3();
  onTick(() => {
    if (frame++ % 10) return;
    for (const it of items) {
      it.o.getWorldPosition(p);
      it.o.visible = p.distanceToSquared(camera.position) < it.d2;
    }
  });
  return items.length;
}
