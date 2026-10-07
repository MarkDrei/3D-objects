import * as THREE from 'three';
import { Parts, type ColorLike } from '../core/parts';
import { selectable, type Category } from '../core/registry';

/** Shorthand for tagging a procedural sky/sea object. */
export function tag<T extends THREE.Object3D>(o: T, type: string, key: string, category: Category, model: string, variant?: string): T {
  return selectable(o, { type, key, category, source: 'prozedural', model, variant });
}

/** Wrap an object and its `userData.extras` in one plain group (for the gallery viewer). */
export function withExtras(o: THREE.Object3D): THREE.Object3D {
  const g = new THREE.Group();
  g.add(o);
  for (const e of (o.userData.extras ?? []) as THREE.Object3D[]) g.add(e);
  return g;
}

/**
 * Home position for self-animating objects: captured from the placement position
 * on the first frame. To relocate such an object later, set `userData.home`.
 */
export function homeOf(o: THREE.Object3D): THREE.Vector3 {
  return (o.userData.home ??= o.position.clone()) as THREE.Vector3;
}

export function canvasTexture(w: number, h: number, draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  draw(c.getContext('2d')!, w, h);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

/** Decorative mesh that never blocks picking and is not tinted on selection. */
export function ghost<T extends THREE.Object3D>(o: T): T {
  o.traverse((c) => {
    c.raycast = () => {};
    c.userData.noHighlight = true;
  });
  return o;
}

/** Additive translucent material for beams, glows, rays. */
export function glowMat(color: ColorLike, opacity: number) {
  return new THREE.MeshBasicMaterial({
    color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, toneMapped: false, fog: false,
  });
}

/** A tiny low-poly person (≈1.8 m tall at s=1), facing +Z, feet at (x, y, z). */
export function tinyPerson(b: Parts, x: number, y: number, z: number, shirt: ColorLike, s = 1, ry = 0) {
  const c = Math.cos(ry), sn = Math.sin(ry);
  const at = (dx: number, dy: number, dz: number) => ({ x: x + (dx * c + dz * sn) * s, y: y + dy * s, z: z + (-dx * sn + dz * c) * s, ry });
  b.box(0.18 * s, 0.8 * s, 0.2 * s, '#2f3a5a', at(-0.12, 0.4, 0));
  b.box(0.18 * s, 0.8 * s, 0.2 * s, '#2f3a5a', at(0.12, 0.4, 0));
  b.box(0.5 * s, 0.65 * s, 0.28 * s, shirt, at(0, 1.12, 0));
  b.sphere(0.2 * s, '#f1c27d', { ...at(0, 1.62, 0), w: 8, hseg: 6 });
}

/** Low-poly cow (≈2.4 m long), feet at y=0, facing +Z. */
export function cowParts(b: Parts) {
  const W = '#f7f4ee', K = '#1f1f22', P = '#f2a7b5';
  b.box(1.1, 1.0, 2.2, W, { y: 1.35 });
  b.box(1.13, 0.5, 0.6, K, { y: 1.55, z: -0.45 });
  b.box(0.7, 1.03, 0.55, K, { x: 0.22, y: 1.38, z: 0.45 });
  b.box(0.5, 0.4, 0.5, K, { x: -0.32, y: 1.7, z: 0.2 });
  b.box(0.72, 0.72, 0.8, W, { y: 1.8, z: 1.4 });
  b.box(0.74, 0.4, 0.34, P, { y: 1.58, z: 1.82 });
  b.box(0.08, 0.08, 0.04, K, { x: 0.15, y: 1.62, z: 2.0 });
  b.box(0.08, 0.08, 0.04, K, { x: -0.15, y: 1.62, z: 2.0 });
  b.box(0.1, 0.12, 0.05, K, { x: 0.22, y: 1.96, z: 1.81 });
  b.box(0.1, 0.12, 0.05, K, { x: -0.22, y: 1.96, z: 1.81 });
  b.box(0.36, 0.12, 0.2, W, { x: 0.5, y: 2.0, z: 1.25 });
  b.box(0.36, 0.12, 0.2, W, { x: -0.5, y: 2.0, z: 1.25 });
  b.cone(0.08, 0.32, '#f3e2a9', { x: 0.25, y: 2.3, z: 1.3, rz: -0.3 });
  b.cone(0.08, 0.32, '#f3e2a9', { x: -0.25, y: 2.3, z: 1.3, rz: 0.3 });
  for (const [lx, lz] of [[0.35, 0.75], [-0.35, 0.75], [0.35, -0.75], [-0.35, -0.75]]) {
    b.box(0.22, 0.85, 0.22, W, { x: lx, y: 0.43, z: lz });
    b.box(0.24, 0.15, 0.24, '#3b2a20', { x: lx, y: 0.07, z: lz });
  }
  b.sphere(0.28, P, { y: 0.85, z: -0.45, sy: 0.7 });
  b.rod({ x: 0, y: 1.7, z: -1.1 }, { x: 0, y: 1.0, z: -1.35 }, 0.05, W);
  b.sphere(0.12, K, { y: 0.95, z: -1.37 });
}
