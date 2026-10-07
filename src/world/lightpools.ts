import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { onTick, env } from '../core/anim';

/**
 * Warm light pools on the ground below street lamps at night. All pools are merged into ONE
 * additive mesh (one draw call). Not selectable – it is light, not an object.
 */
export function buildLightPools(scene: THREE.Scene, spots: THREE.Vector3[], radius = 4.5) {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const ctx = c.getContext('2d')!;
  const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.45, 'rgba(255,255,255,0.45)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 64);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;

  const geos = spots.map((p) => {
    const pg = new THREE.PlaneGeometry(radius * 2, radius * 2);
    pg.rotateX(-Math.PI / 2);
    pg.translate(p.x, p.y, p.z);
    return pg;
  });
  if (!geos.length) return;
  const mat = new THREE.MeshBasicMaterial({
    map: tex, color: '#ffc46b', transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false,
  });
  const mesh = new THREE.Mesh(mergeGeometries(geos), mat);
  mesh.raycast = () => {};
  mesh.renderOrder = 2;
  mesh.userData.noHighlight = true;
  scene.add(mesh);
  onTick(() => {
    mat.opacity = env.night * 0.42;
    mesh.visible = env.night > 0.02;
  });
}
