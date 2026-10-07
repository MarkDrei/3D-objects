import * as THREE from 'three';
import { Parts } from '../core/parts';
import { selectable } from '../core/registry';
import { onTick } from '../core/anim';
import { pivot, seeded, TAU } from './city-util';

const SKIN = ['#f1c7a3', '#e0ac85', '#c68863', '#9a6440', '#6e4428', '#f6d9c0'];
const HAIR = ['#2a1b12', '#5a3a1e', '#c58a3e', '#e8d18a', '#8a8a8a', '#b83a1e', '#1b1b1b', '#ff5fa2', '#4ab8ff'];
const SHIRT = ['#e8403a', '#2c8ef8', '#2fbf71', '#ffd23f', '#b06bff', '#ff8f3a', '#ffffff', '#1b2a4a', '#ff5fa2', '#13c2a3', '#7a4b2a'];
const PANTS = ['#2b3a67', '#3b3b3b', '#6b5b45', '#1f4e79', '#4a4a4a', '#c9b48a', '#7a2a3a'];

/**
 * Person ~1.8 m, faces +Z. Random look from `seed` (skin, hair style, clothes, hat, backpack, umbrella, skirt).
 * Animation: obj.userData.walkSpeed (0 = idle, 1 = normal walk ≈ 1.4 m/s) swings arms and legs.
 * The world moves/rotates the root; the internal rig bobs. 5 meshes (body + 4 limb pivots).
 */
export function createPerson(seed = 1, opts: PersonOpts = {}): THREE.Object3D {
  const { root, variant } = buildPerson(seed, opts);
  return selectable(root, { type: 'Person', key: 'person', category: 'Lebewesen', source: 'prozedural', model: 'createPerson', variant: opts.variant ?? variant });
}

export interface PersonOpts {
  walkSpeed?: number;
  /** walk = normal, sit = seated, still = no automatic arm animation (caller animates userData.limbs) */
  pose?: 'walk' | 'sit' | 'still';
  variant?: string;
  shirt?: string;
  hat?: number;
}

/** Unregistered person rig (used inside composite objects). userData.limbs = { lL, lR, aL, aR }. */
export function buildPerson(seed = 1, opts: PersonOpts = {}): { root: THREE.Group; variant?: string } {
  const r = seeded(seed + 17);
  const pk = <T,>(a: T[]) => a[Math.floor(r() * a.length)];
  const skin = pk(SKIN), hair = pk(HAIR), pants = pk(PANTS);
  const shirt = opts.shirt ?? pk(SHIRT);
  const skirt = r() < 0.25, backpack = r() < 0.3, umbrella = r() < 0.1;
  let hatKind = r() < 0.45 ? Math.floor(r() * 4) : -1;
  if (opts.hat !== undefined) hatKind = opts.hat;
  const shoe = r() < 0.5 ? '#222' : pk(['#ffffff', '#e8403a', '#2c8ef8']);
  const scale = 0.92 + r() * 0.16;

  const root = new THREE.Group();
  const rig = new THREE.Group();
  rig.scale.setScalar(scale);
  root.add(rig);

  const b = new Parts();
  // torso + hips
  b.box(0.46, 0.56, 0.26, shirt, { y: 1.17 });
  b.box(0.42, 0.18, 0.24, skirt ? shirt : pants, { y: 0.88 });
  if (skirt) b.cone(0.36, 0.5, shirt, { y: 0.72, seg: 8 });
  b.box(0.14, 0.1, 0.14, skin, { y: 1.49 });
  // head
  b.box(0.3, 0.32, 0.3, skin, { y: 1.69 });
  b.box(0.05, 0.05, 0.02, '#1b1b1b', { x: -0.07, y: 1.72, z: 0.155 });
  b.box(0.05, 0.05, 0.02, '#1b1b1b', { x: 0.07, y: 1.72, z: 0.155 });
  b.box(0.1, 0.025, 0.02, '#a0463a', { y: 1.6, z: 0.155 });
  const hairStyle = Math.floor(r() * 4);
  if (hatKind === -1) {
    if (hairStyle !== 3) b.box(0.33, 0.1, 0.33, hair, { y: 1.88 });
    if (hairStyle === 1) b.box(0.33, 0.35, 0.08, hair, { y: 1.72, z: -0.15 }); // long hair
    if (hairStyle === 2) b.sphere(0.12, hair, { y: 1.9, z: -0.14 }); // bun
    if (hairStyle !== 3) b.box(0.33, 0.14, 0.05, hair, { y: 1.81, z: -0.15 });
  } else if (hatKind === 0) { // cap
    b.box(0.33, 0.1, 0.33, '#e8403a', { y: 1.88 });
    b.box(0.26, 0.03, 0.18, '#e8403a', { y: 1.84, z: 0.22 });
  } else if (hatKind === 1) { // top hat
    b.cyl(0.25, 0.25, 0.03, '#1b1b1b', { y: 1.86, seg: 10 });
    b.cyl(0.15, 0.15, 0.32, '#1b1b1b', { y: 2.03, seg: 10 });
    b.cyl(0.155, 0.155, 0.05, '#c8322b', { y: 1.92, seg: 10 });
  } else if (hatKind === 2) { // beanie with pompom
    b.sphere(0.18, pk(SHIRT), { y: 1.84, sy: 0.75, hseg: 5 });
    b.sphere(0.06, '#ffffff', { y: 1.99 });
  } else { // sun hat
    b.cyl(0.3, 0.3, 0.03, '#f2dfa0', { y: 1.86, seg: 12 });
    b.cyl(0.16, 0.17, 0.12, '#f2dfa0', { y: 1.92, seg: 12 });
    b.cyl(0.172, 0.172, 0.04, '#e8403a', { y: 1.89, seg: 12 });
  }
  if (backpack) {
    const bp = pk(['#ffd23f', '#2fbf71', '#ff5fa2', '#4ab8ff']);
    b.box(0.36, 0.42, 0.18, bp, { y: 1.18, z: -0.22 });
    b.box(0.3, 0.14, 0.06, bp, { y: 1.06, z: -0.33 });
  }
  if (umbrella) {
    const uc = pk(['#e8403a', '#ffd23f', '#4ab8ff', '#b06bff']);
    b.cyl(0.015, 0.015, 1.0, '#333', { x: 0.3, y: 1.55, z: 0.25, seg: 4 });
    b.cone(0.65, 0.3, uc, { x: 0.3, y: 2.15, z: 0.25, seg: 8 });
  }
  rig.add(b.build());

  const leg = (x: number) => {
    const p = new Parts();
    p.box(0.17, 0.72, 0.19, skirt ? skin : pants, { y: -0.38 });
    p.box(0.18, 0.1, 0.28, shoe, { y: -0.77, z: 0.04 });
    return pivot(p, x, 0.82, 0);
  };
  const arm = (x: number) => {
    const p = new Parts();
    p.box(0.12, 0.5, 0.14, shirt, { y: -0.25 });
    p.box(0.1, 0.12, 0.11, skin, { y: -0.56 });
    return pivot(p, x, 1.42, 0);
  };
  const lL = leg(-0.11), lR = leg(0.11), aL = arm(-0.3), aR = arm(0.3);
  rig.add(lL, lR, aL, aR);
  if (umbrella) aR.rotation.x = -0.9;
  if (opts.pose === 'sit') {
    lL.rotation.x = lR.rotation.x = -Math.PI / 2;
    rig.position.y = -0.38;
  }

  root.userData.walkSpeed = opts.walkSpeed ?? 0;
  root.userData.limbs = { lL, lR, aL, aR };
  let phase = r() * TAU;
  onTick((dt, t) => {
    if (opts.pose === 'still') return;
    if (opts.pose === 'sit') {
      aL.rotation.x = -0.4 + Math.sin(t * 2 + seed) * 0.1;
      return;
    }
    const ws = root.userData.walkSpeed as number;
    if (ws > 0.01) {
      phase += dt * ws * 7.5;
      const a = Math.sin(phase) * 0.6 * Math.min(ws, 1.3);
      lL.rotation.x = a; lR.rotation.x = -a;
      aL.rotation.x = -a * 0.8;
      if (!umbrella) aR.rotation.x = a * 0.8;
      rig.position.y = Math.abs(Math.cos(phase)) * 0.05;
    } else {
      lL.rotation.x *= 0.85; lR.rotation.x *= 0.85;
      aL.rotation.x = Math.sin(t * 1.3 + seed) * 0.06;
      if (!umbrella) aR.rotation.x = -Math.sin(t * 1.3 + seed) * 0.06;
      rig.position.y = 0;
    }
  });
  const variant = umbrella ? 'mit Regenschirm' : backpack ? 'mit Rucksack' : hatKind === 1 ? 'mit Zylinder' : undefined;
  return { root, variant };
}

/** Cow ~2.5 m long (head at +Z), black/white spots, grazing head + tail swish. 3 meshes. */
export function createCow(seed = 1): THREE.Object3D {
  const r = seeded(seed + 3);
  const brown = r() < 0.3;
  const spot = brown ? '#7a4a2a' : '#1d1d1d';
  const b = new Parts();
  b.box(0.95, 0.85, 1.8, '#f5f2ea', { y: 1.15 });
  for (let i = 0; i < 7; i++) {
    const side = r() < 0.5 ? -1 : 1;
    b.box(0.03, 0.3 + r() * 0.3, 0.35 + r() * 0.4, spot, { x: side * 0.48, y: 1.0 + r() * 0.45, z: -0.6 + r() * 1.2 });
  }
  b.box(0.5 + r() * 0.3, 0.03, 0.5, spot, { y: 1.58, z: -0.3 + r() * 0.6 });
  for (const [x, z] of [[-0.32, 0.7], [0.32, 0.7], [-0.32, -0.7], [0.32, -0.7]]) {
    b.box(0.2, 0.75, 0.2, '#f5f2ea', { x, y: 0.42, z });
    b.box(0.21, 0.12, 0.21, '#3a3a3a', { x, y: 0.06, z });
  }
  b.sphere(0.2, '#f4a6b4', { y: 0.72, z: -0.45, sy: 0.7 });
  const body = b.build();
  const h = new Parts();
  h.box(0.46, 0.5, 0.6, '#f5f2ea', { y: 0, z: 0.25 });
  h.box(0.42, 0.3, 0.2, '#f4a6b4', { y: -0.13, z: 0.6 });
  h.box(0.05, 0.05, 0.02, '#333', { x: -0.1, y: -0.1, z: 0.71 });
  h.box(0.05, 0.05, 0.02, '#333', { x: 0.1, y: -0.1, z: 0.71 });
  h.box(0.06, 0.07, 0.03, '#111', { x: -0.16, y: 0.1, z: 0.55 });
  h.box(0.06, 0.07, 0.03, '#111', { x: 0.16, y: 0.1, z: 0.55 });
  h.box(0.25, 0.1, 0.1, spot, { x: -0.33, y: 0.1, z: 0.1 });
  h.box(0.25, 0.1, 0.1, spot, { x: 0.33, y: 0.1, z: 0.1 });
  h.cone(0.05, 0.22, '#f2e6c0', { x: -0.17, y: 0.33, z: 0.1, rz: 0.4 });
  h.cone(0.05, 0.22, '#f2e6c0', { x: 0.17, y: 0.33, z: 0.1, rz: -0.4 });
  h.cyl(0.1, 0.12, 0.16, '#e6b422', { y: -0.38, z: 0.1, seg: 6 }); // bell
  const head = pivot(h, 0, 1.35, 0.85);
  const t = new Parts();
  t.box(0.06, 0.8, 0.06, '#f5f2ea', { y: -0.4 });
  t.box(0.12, 0.18, 0.12, spot, { y: -0.85 });
  const tail = pivot(t, 0, 1.5, -0.92);
  const g = new THREE.Group();
  g.add(body, head, tail);
  const off = r() * 10;
  onTick((dt, tt) => {
    const k = (tt + off) % 8;
    const down = k < 5 ? Math.min(1, k) * Math.min(1, 5 - k) : 0;
    head.rotation.x = 0.1 + down * 0.85 + (down > 0.9 ? Math.sin(tt * 8) * 0.05 : 0);
    tail.rotation.z = Math.sin(tt * 2.5 + off) * 0.35;
  });
  return selectable(g, { type: 'Kuh', key: 'cow', category: 'Lebewesen', source: 'prozedural', model: 'createCow', variant: brown ? 'Braunvieh' : 'Holstein' });
}

/** Pig ~1.4 m long (snout +Z). 2 meshes. */
export function createPig(): THREE.Object3D {
  const P = '#f6a8b8', D = '#e48a9e';
  const b = new Parts();
  b.box(0.75, 0.65, 1.15, P, { y: 0.62 });
  for (const [x, z] of [[-0.24, 0.4], [0.24, 0.4], [-0.24, -0.4], [0.24, -0.4]]) b.box(0.16, 0.35, 0.16, D, { x, y: 0.18, z });
  b.torus(0.08, 0.03, D, { y: 0.85, z: -0.62, ry: Math.PI / 2, rs: 4, ts: 8 });
  b.box(0.15, 0.04, 0.2, '#8a5a3a', { x: 0.2, y: 0.95, z: -0.2 }); // mud splash
  const body = b.build();
  const h = new Parts();
  h.box(0.55, 0.5, 0.4, P, { z: 0.1 });
  h.cyl(0.16, 0.16, 0.12, D, { z: 0.35, rx: Math.PI / 2, seg: 8 });
  h.box(0.04, 0.06, 0.02, '#7a3a4a', { x: -0.06, z: 0.42 });
  h.box(0.04, 0.06, 0.02, '#7a3a4a', { x: 0.06, z: 0.42 });
  h.box(0.05, 0.06, 0.02, '#111', { x: -0.14, y: 0.1, z: 0.31 });
  h.box(0.05, 0.06, 0.02, '#111', { x: 0.14, y: 0.1, z: 0.31 });
  h.box(0.16, 0.04, 0.18, D, { x: -0.2, y: 0.28, z: 0.12, rx: 0.5, rz: 0.4 });
  h.box(0.16, 0.04, 0.18, D, { x: 0.2, y: 0.28, z: 0.12, rx: 0.5, rz: -0.4 });
  const head = pivot(h, 0, 0.7, 0.62);
  const g = new THREE.Group();
  g.add(body, head);
  const off = Math.random() * 9;
  onTick((dt, t) => (head.rotation.x = Math.max(0, Math.sin(t * 0.9 + off)) * 0.5 + Math.sin(t * 9) * 0.02));
  return selectable(g, { type: 'Schwein', key: 'pig', category: 'Lebewesen', source: 'prozedural', model: 'createPig' });
}

/** Chicken ~0.55 m, pecks periodically. 1 mesh. */
export function createChicken(): THREE.Object3D {
  const brown = Math.random() < 0.4;
  const C = brown ? '#b8662e' : '#fafafa';
  const b = new Parts();
  b.ico(0.2, C, { y: 0.33, sz: 1.3 });
  b.box(0.1, 0.18, 0.14, C, { y: 0.42, z: -0.22, rx: -0.6 });
  b.ico(0.11, C, { y: 0.55, z: 0.17 });
  b.box(0.04, 0.09, 0.1, '#e8322b', { y: 0.67, z: 0.17 });
  b.cone(0.04, 0.1, '#ffb11a', { y: 0.54, z: 0.29, rx: Math.PI / 2, seg: 4 });
  b.box(0.04, 0.06, 0.03, '#e8322b', { y: 0.47, z: 0.25 });
  b.box(0.03, 0.18, 0.03, '#ffb11a', { x: -0.07, y: 0.09 });
  b.box(0.03, 0.18, 0.03, '#ffb11a', { x: 0.07, y: 0.09 });
  const body = b.build();
  const g = new THREE.Group();
  const p = new THREE.Group();
  p.add(body);
  g.add(p);
  const off = Math.random() * 7;
  onTick((dt, t) => {
    const k = (t + off) % 2.4;
    p.rotation.x = k < 0.4 ? Math.sin((k / 0.4) * Math.PI) * 0.7 : 0;
    p.rotation.y = Math.sin(t * 0.7 + off) * 0.8;
  });
  return selectable(g, { type: 'Huhn', key: 'chicken', category: 'Lebewesen', source: 'prozedural', model: 'createChicken' });
}

/** Sheep ~1.3 m long, fluffy. 2 meshes. */
export function createSheep(): THREE.Object3D {
  const b = new Parts();
  const r = seeded(Math.floor(Math.random() * 1000));
  for (let i = 0; i < 9; i++) b.ico(0.3 + r() * 0.08, '#f4f1ea', { x: (r() - 0.5) * 0.4, y: 0.75 + (r() - 0.5) * 0.25, z: -0.45 + (i / 8) * 0.9, detail: 0 });
  for (const [x, z] of [[-0.2, 0.32], [0.2, 0.32], [-0.2, -0.32], [0.2, -0.32]]) b.box(0.11, 0.5, 0.11, '#2a2a2a', { x, y: 0.25, z });
  const body = b.build();
  const h = new Parts();
  h.box(0.3, 0.32, 0.4, '#2a2a2a', { z: 0.12 });
  h.ico(0.17, '#f4f1ea', { y: 0.17, z: 0.05 });
  h.box(0.04, 0.04, 0.02, '#fff', { x: -0.09, y: 0.04, z: 0.3 });
  h.box(0.04, 0.04, 0.02, '#fff', { x: 0.09, y: 0.04, z: 0.3 });
  h.box(0.2, 0.06, 0.1, '#2a2a2a', { x: -0.2, y: 0.08, rz: -0.4 });
  h.box(0.2, 0.06, 0.1, '#2a2a2a', { x: 0.2, y: 0.08, rz: 0.4 });
  const head = pivot(h, 0, 0.85, 0.55);
  const g = new THREE.Group();
  g.add(body, head);
  const off = Math.random() * 9;
  onTick((dt, t) => {
    head.rotation.x = 0.3 + Math.max(0, Math.sin(t * 0.6 + off)) * 0.6;
    head.rotation.y = Math.sin(t * 6) * 0.04;
  });
  return selectable(g, { type: 'Schaf', key: 'sheep', category: 'Lebewesen', source: 'prozedural', model: 'createSheep' });
}

/** Dog ~0.9 m long (head +Z), wagging tail. Supports userData.walkSpeed (legs trot). 2 meshes (+legs merged in body). */
export function createDog(seed = 1): THREE.Object3D {
  const r = seeded(seed + 99);
  const C = ['#b8742e', '#3a2a1e', '#e8d8b8', '#ffffff', '#8a8a8a'][Math.floor(r() * 5)];
  const D = '#2a1b12';
  const b = new Parts();
  b.box(0.3, 0.28, 0.65, C, { y: 0.45 });
  for (const [x, z] of [[-0.1, 0.24], [0.1, 0.24], [-0.1, -0.24], [0.1, -0.24]]) b.box(0.09, 0.32, 0.09, C, { x, y: 0.16, z });
  b.box(0.32, 0.06, 0.08, '#e8322b', { y: 0.62, z: 0.36 }); // collar
  b.box(0.26, 0.28, 0.3, C, { y: 0.72, z: 0.42 });
  b.box(0.16, 0.13, 0.16, C, { y: 0.66, z: 0.62 });
  b.box(0.07, 0.06, 0.04, '#111', { y: 0.71, z: 0.71 });
  b.box(0.05, 0.05, 0.02, '#111', { x: -0.07, y: 0.8, z: 0.575 });
  b.box(0.05, 0.05, 0.02, '#111', { x: 0.07, y: 0.8, z: 0.575 });
  b.box(0.08, 0.18, 0.1, D, { x: -0.15, y: 0.78, z: 0.4, rz: 0.3 });
  b.box(0.08, 0.18, 0.1, D, { x: 0.15, y: 0.78, z: 0.4, rz: -0.3 });
  b.box(0.04, 0.08, 0.06, '#ff7a9a', { y: 0.57, z: 0.66 });
  const body = b.build();
  const t = new Parts();
  t.box(0.06, 0.3, 0.06, C, { y: 0.14 });
  const tail = pivot(t, 0, 0.55, -0.32);
  tail.rotation.x = -0.6;
  const rig = new THREE.Group();
  rig.add(body, tail);
  const g = new THREE.Group();
  g.add(rig);
  g.userData.walkSpeed = 0;
  onTick((dt, tt) => {
    tail.rotation.z = Math.sin(tt * 14) * 0.6;
    const ws = g.userData.walkSpeed as number;
    rig.position.y = ws > 0 ? Math.abs(Math.sin(tt * 12)) * 0.05 : 0;
  });
  return selectable(g, { type: 'Hund', key: 'dog', category: 'Lebewesen', source: 'prozedural', model: 'createDog' });
}

/** Red barn with gambrel roof (gable faces +Z) and a silo on the left. Footprint ~17 x 13, ~13 m (silo). 3 meshes. */
export function createBarn(): THREE.Object3D {
  const b = new Parts();
  const RED = '#b8322a', W = '#f4efe4', D = 12;
  const sh = new THREE.Shape();
  const pts: [number, number][] = [[-5, 0], [5, 0], [5, 5], [3.5, 7.6], [0, 8.8], [-3.5, 7.6], [-5, 5]];
  sh.moveTo(...pts[0]);
  for (const p of pts.slice(1)) sh.lineTo(...p);
  b.extrude(sh, D, RED, { z: -D / 2, x: 2 });
  // roof slabs
  const roof: [number, number][] = [[5.4, 4.7], [3.7, 7.9], [0, 9.15], [-3.7, 7.9], [-5.4, 4.7]];
  for (let i = 0; i < roof.length - 1; i++) {
    const [x1, y1] = roof[i], [x2, y2] = roof[i + 1];
    const L = Math.hypot(x2 - x1, y2 - y1);
    b.box(L + 0.3, 0.3, D + 0.8, '#5b4f48', { x: 2 + (x1 + x2) / 2, y: (y1 + y2) / 2, rz: Math.atan2(y2 - y1, x2 - x1) });
  }
  // front: big doors with white X
  const fz = D / 2 + 0.05;
  b.box(5, 4.6, 0.1, RED, { x: 2, y: 2.3, z: fz });
  b.box(5.3, 0.3, 0.15, W, { x: 2, y: 4.65, z: fz + 0.02 });
  for (const s of [-1, 1]) {
    const cx = 2 + s * 1.25;
    b.box(0.25, 4.6, 0.15, W, { x: cx + s * 1.1, y: 2.3, z: fz + 0.02 });
    b.beam({ x: cx - 1.1, y: 0.2, z: fz + 0.04 }, { x: cx + 1.1, y: 4.4, z: fz + 0.04 }, 0.2, W);
    b.beam({ x: cx + 1.1, y: 0.2, z: fz + 0.04 }, { x: cx - 1.1, y: 4.4, z: fz + 0.04 }, 0.2, W);
  }
  // hayloft door with hay
  b.box(2, 1.8, 0.1, '#5a2a1e', { x: 2, y: 6.6, z: fz });
  b.box(2.3, 0.2, 0.15, W, { x: 2, y: 7.6, z: fz + 0.02 });
  b.box(1.6, 0.6, 0.6, '#e8c860', { x: 2, y: 6.0, z: fz + 0.1 });
  b.beam({ x: 2, y: 8.6, z: fz }, { x: 2, y: 8.6, z: fz + 1.2 }, 0.2, '#5b4f48'); // hoist beam
  // white trim edges
  for (const s of [-1, 1]) b.box(0.25, 5, 0.25, W, { x: 2 + s * 5, y: 2.5, z: fz });
  // side windows
  for (const z of [-3, 0, 3]) b.box(0.1, 1, 1, '#ffe7b0', { x: 7.02, y: 2.8, z, mat: 'lamp' });
  // weathervane rooster
  b.cyl(0.05, 0.05, 1.4, '#333', { x: 2, y: 9.8, seg: 5 });
  b.box(0.6, 0.4, 0.08, '#333', { x: 2, y: 10.5 });
  b.box(0.2, 0.3, 0.08, '#333', { x: 2.25, y: 10.8 });
  b.box(0.3, 0.4, 0.08, '#333', { x: 1.7, y: 10.75, rz: 0.5 });
  // silo
  b.cyl(2.1, 2.1, 12, '#c9cfd4', { x: -5.6, y: 6, z: -2, seg: 14 });
  for (let k = 0; k < 4; k++) b.cyl(2.15, 2.15, 0.15, '#9aa1a6', { x: -5.6, y: 2 + k * 3, z: -2, seg: 14 });
  b.sphere(2.1, '#b8322a', { x: -5.6, y: 12, z: -2, hseg: 6, w: 14, sy: 0.6 });
  b.beam({ x: -4.1, y: 0.3, z: -0.4 }, { x: -4.1, y: 11.5, z: -0.4 }, 0.1, '#555');
  const g = b.build();
  g.position.x = 0;
  return selectable(g, { type: 'Scheune', key: 'barn', category: 'Gebäude', source: 'prozedural', model: 'createBarn' });
}

/** Dutch windmill ~17 m (to sail tips), sails on +Z side rotate. Footprint ~7 x 7. 4 meshes. */
export function createWindmill(): THREE.Object3D {
  const b = new Parts();
  b.cyl(3.4, 3.6, 1.2, '#8a8178', { y: 0.6, seg: 8 });
  b.cyl(2.2, 3.1, 9, '#4a5a4e', { y: 5.7, seg: 8 });
  // gallery
  b.cyl(3.6, 3.6, 0.2, '#6b4a2b', { y: 4.0, seg: 8 });
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * TAU;
    b.box(0.06, 0.8, 0.06, '#f4efe4', { x: Math.cos(a) * 3.5, y: 4.5, z: Math.sin(a) * 3.5 });
  }
  b.torus(3.5, 0.04, '#f4efe4', { y: 4.9, rx: Math.PI / 2, rs: 3, ts: 16 });
  // door + windows (white frames)
  b.box(1.2, 2, 0.15, '#f4efe4', { y: 2.2, z: 3.2, rx: -0.03 });
  b.box(0.9, 1.7, 0.18, '#7a3a2a', { y: 2.1, z: 3.22, rx: -0.03 });
  for (const y of [6.2, 8.4]) {
    b.box(0.8, 0.9, 0.15, '#f4efe4', { y, z: 2.9 - (y - 6) * 0.06, rx: -0.1 });
    b.box(0.6, 0.7, 0.18, '#ffe7b0', { y, z: 2.92 - (y - 6) * 0.06, rx: -0.1, mat: 'lamp' });
  }
  // cap
  b.sphere(2.6, '#3a3330', { y: 10.2, hseg: 5, w: 8, sy: 0.9, sz: 1.15 });
  const g = b.build();
  // sails
  const s = new Parts();
  s.cyl(0.35, 0.35, 1.2, '#3a3330', { rx: Math.PI / 2, seg: 8 });
  s.sphere(0.4, '#c8322b', { z: 0.6 });
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * TAU + Math.PI / 4;
    const dx = Math.cos(a), dy = Math.sin(a);
    s.beam({ x: 0, y: 0, z: 0.3 }, { x: dx * 7.2, y: dy * 7.2, z: 0.3 }, 0.22, '#6b4a2b');
    // lattice + cloth on one side
    const px = -dy, py = dx;
    for (let k = 0; k < 6; k++) {
      const d = 1.8 + k * 1.0;
      s.beam({ x: dx * d, y: dy * d, z: 0.32 }, { x: dx * d + px * 1.4, y: dy * d + py * 1.4, z: 0.32 }, 0.08, '#f4efe4');
    }
    s.beam({ x: dx * 1.8 + px * 1.4, y: dy * 1.8 + py * 1.4, z: 0.32 }, { x: dx * 7 + px * 1.4, y: dy * 7 + py * 1.4, z: 0.32 }, 0.08, '#f4efe4');
    s.box(5.2, 1.3, 0.05, '#f2ecdc', { x: dx * 4.4 + px * 0.72, y: dy * 4.4 + py * 0.72, z: 0.25, rz: a });
  }
  const sails = pivot(s, 0, 10.4, 2.8);
  sails.rotation.x = -0.12;
  const spin = new THREE.Group();
  spin.add(...sails.children);
  sails.add(spin);
  g.add(sails);
  onTick((dt) => (spin.rotation.z -= dt * 0.7));
  return selectable(g, { type: 'Windmühle', key: 'windmill', category: 'Gebäude', source: 'prozedural', model: 'createWindmill' });
}

/** Scarecrow ~2.6 m with straw hat and a crow on its arm. Arms sway. 2 meshes. */
export function createScarecrow(): THREE.Object3D {
  const b = new Parts();
  b.box(0.15, 2.2, 0.15, '#7a5a3a', { y: 1.1 });
  const g = new THREE.Group();
  g.add(b.build());
  const u = new Parts();
  u.box(2.2, 0.12, 0.12, '#7a5a3a', { y: 0 });
  u.box(0.7, 0.8, 0.35, '#3a6ab8', { y: -0.3 });
  for (let i = 0; i < 3; i++) u.box(0.72, 0.06, 0.37, '#e8403a', { y: -0.5 + i * 0.22 });
  u.box(1.9, 0.25, 0.3, '#3a6ab8', { y: 0 });
  u.box(0.3, 0.35, 0.05, '#ffd23f', { x: 0.15, y: -0.35, z: 0.18 }); // patch
  for (const s of [-1, 1]) for (let k = 0; k < 3; k++) u.box(0.06, 0.25, 0.06, '#e8c860', { x: s * 1.0, y: -0.15 - k * 0.04, z: -0.08 + k * 0.08, rz: s * (0.3 + k * 0.3) });
  u.sphere(0.3, '#e8d4a0', { y: 0.45, w: 8, hseg: 6 });
  u.box(0.08, 0.08, 0.03, '#222', { x: -0.1, y: 0.5, z: 0.28 });
  u.box(0.08, 0.08, 0.03, '#222', { x: 0.1, y: 0.5, z: 0.28 });
  for (let i = 0; i < 4; i++) u.box(0.05, 0.02, 0.03, '#222', { x: -0.11 + i * 0.075, y: 0.35, z: 0.28 });
  u.cyl(0.55, 0.55, 0.05, '#d8b85a', { y: 0.7, seg: 10 });
  u.cyl(0.25, 0.3, 0.3, '#d8b85a', { y: 0.85, seg: 10 });
  u.cyl(0.31, 0.31, 0.06, '#c8322b', { y: 0.76, seg: 10 });
  // crow
  u.ico(0.16, '#151515', { x: 0.8, y: 0.2, sz: 1.4 });
  u.ico(0.1, '#151515', { x: 0.8, y: 0.34, z: 0.15 });
  u.cone(0.04, 0.12, '#e6b422', { x: 0.8, y: 0.33, z: 0.28, rx: Math.PI / 2, seg: 4 });
  u.box(0.06, 0.18, 0.2, '#151515', { x: 0.8, y: 0.18, z: -0.28, rx: 0.5 });
  const up = pivot(u, 0, 1.75, 0);
  g.add(up);
  onTick((dt, t) => {
    up.rotation.z = Math.sin(t * 1.4) * 0.05;
    up.rotation.y = Math.sin(t * 0.6) * 0.12;
  });
  return selectable(g, { type: 'Vogelscheuche', key: 'scarecrow', category: 'Kurioses', source: 'prozedural', model: 'createScarecrow' });
}

/** Round hay bale lying along X, Ø1.5 x 1.3 m. 1 mesh. */
export function createHayBale(): THREE.Object3D {
  const b = new Parts();
  b.cyl(0.75, 0.75, 1.3, '#e6c35a', { y: 0.75, rz: Math.PI / 2, seg: 12 });
  b.cyl(0.6, 0.6, 1.32, '#d4ad45', { y: 0.75, rz: Math.PI / 2, seg: 12 });
  for (const x of [-0.35, 0.35]) b.cyl(0.77, 0.77, 0.06, '#b8913a', { x, y: 0.75, rz: Math.PI / 2, seg: 12 });
  return selectable(b.build(), { type: 'Heuballen', key: 'hay_bale', category: 'Natur', source: 'prozedural', model: 'createHayBale' });
}
