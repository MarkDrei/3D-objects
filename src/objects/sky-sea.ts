import * as THREE from 'three';
import { Parts, type ColorLike } from '../core/parts';
import { onTick, env } from '../core/anim';
import { tag, ghost, glowMat, homeOf, tinyPerson } from './sky-util';

const TAU = Math.PI * 2;

/** Gentle bobbing/rocking for boats (applied to an inner group). */
function bob(g: THREE.Object3D, amp = 1) {
  const ph = Math.random() * 10;
  onTick((_dt, t) => {
    g.position.y = Math.sin(t * 1.1 + ph) * 0.14 * amp;
    g.rotation.z = Math.sin(t * 0.8 + ph) * 0.05 * amp;
    g.rotation.x = Math.sin(t * 0.6 + ph * 1.3) * 0.025 * amp;
  });
}

/** Top-view hull outline (x = width, y = length; bow towards +y). */
function hullShape(w: number, l: number, bowStart: number, sternW = w) {
  const s = new THREE.Shape();
  s.moveTo(-sternW / 2, -l / 2);
  s.lineTo(sternW / 2, -l / 2);
  s.lineTo(w / 2, bowStart);
  s.quadraticCurveTo(w / 2, l / 2 - (l / 2 - bowStart) * 0.15, 0, l / 2);
  s.quadraticCurveTo(-w / 2, l / 2 - (l / 2 - bowStart) * 0.15, -w / 2, bowStart);
  s.closePath();
  return s;
}

/** Extrude a hull outline downwards from `top` by `depth` (bow → +Z). */
function hull(b: Parts, shape: THREE.Shape, top: number, depth: number, color: ColorLike, s = 1) {
  b.extrude(shape, depth, color, { rx: Math.PI / 2, y: top, sx: s, sy: s });
}

// ────────────────────────────────────────────────────────── Lighthouse ──

/**
 * Leuchtturm, 22 m tall, footprint ≈14 x 10 m (rocks + keeper's cottage at +X).
 * Self-animating rotating light beam (stronger at night).
 */
export function createLighthouse(): THREE.Object3D {
  const b = new Parts();
  b.ico(5, '#8d9299', { y: 0.2, sy: 0.35, detail: 1 });
  b.ico(2.2, '#7c8189', { x: 4.2, y: 0.1, z: 3, sy: 0.5 });
  const bands = 6, bh = 2.6, r0 = 2.6, r1 = 1.7;
  for (let i = 0; i < bands; i++) {
    const ra = r0 + (r1 - r0) * (i / bands), rb = r0 + (r1 - r0) * ((i + 1) / bands);
    b.cyl(rb, ra, bh, i % 2 ? '#f5f5f5' : '#e63946', { y: 1.5 + bh * i + bh / 2, seg: 16 });
  }
  const top = 1.5 + bands * bh; // 17.1
  b.box(0.9, 1.7, 0.2, '#1d3557', { y: 2.4, z: 2.55 });
  for (const y of [6.5, 11.5]) b.box(0.5, 0.7, 0.2, '#ffe6a0', { y, z: r0 - ((y - 1.5) / 15.6) * (r0 - r1) + 0.02, mat: 'lamp' });
  b.cyl(2.5, 2.3, 0.4, '#2b3240', { y: top + 0.2, seg: 16 });
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * TAU;
    b.box(0.07, 0.8, 0.07, '#2b3240', { x: Math.cos(a) * 2.35, y: top + 0.8, z: Math.sin(a) * 2.35 });
  }
  b.torus(2.35, 0.05, '#2b3240', { rx: Math.PI / 2, y: top + 1.2, ts: 24 });
  b.cyl(1.4, 1.4, 2.4, '#bfefff', { y: top + 1.6, seg: 12, mat: 'glass' });
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * TAU;
    b.box(0.1, 2.4, 0.1, '#2b3240', { x: Math.cos(a) * 1.4, y: top + 1.6, z: Math.sin(a) * 1.4 });
  }
  b.sphere(0.75, '#fff6c8', { y: top + 1.6, mat: 'lamp' });
  b.cone(1.8, 1.5, '#e63946', { y: top + 3.55, seg: 12 });
  b.sphere(0.25, '#2b3240', { y: top + 4.4 });
  b.rod({ x: 0, y: top + 4.4, z: 0 }, { x: 0, y: top + 5.6, z: 0 }, 0.04, '#2b3240');
  b.box(0.9, 0.35, 0.05, '#2b3240', { y: top + 5.4, x: 0.4 });
  // keeper's cottage
  b.box(4, 3, 4, '#f5f1e6', { x: 5, y: 1.5, z: -1.2 });
  const roof = new THREE.Shape([new THREE.Vector2(-2.3, 0), new THREE.Vector2(2.3, 0), new THREE.Vector2(0, 1.8)]);
  b.extrude(roof, 4.4, '#c1121f', { x: 5, y: 3, z: 1.0, ry: 0 });
  b.box(0.9, 1.6, 0.1, '#1d3557', { x: 5, y: 0.8, z: 0.82 });
  b.box(0.8, 0.7, 0.1, '#ffe6a0', { x: 6.2, y: 1.9, z: 0.82, mat: 'lamp' });
  b.box(0.5, 1.4, 0.5, '#8d5a3b', { x: 6.2, y: 4.2, z: -2 });
  const root = new THREE.Group();
  root.add(b.build());

  // rotating beams (never block picking)
  const beamMat = glowMat('#fff3b0', 0.1);
  const beam = new THREE.Group();
  beam.position.y = top + 1.6;
  for (const dir of [1, -1]) {
    const len = 46;
    const m = new THREE.Mesh(new THREE.ConeGeometry(4.5, len, 16, 1, true), beamMat);
    m.rotation.z = dir * Math.PI / 2;
    m.position.x = -dir * len / 2;
    beam.add(m);
  }
  root.add(ghost(beam));
  onTick((dt) => {
    beam.rotation.y += dt * 0.9;
    beamMat.opacity = 0.04 + 0.26 * env.night;
  });
  return tag(root, 'Leuchtturm', 'lighthouse', 'Gebäude', 'createLighthouse');
}

// ─────────────────────────────────────────────────────────── Boats ──

/**
 * Segelboot ≈8.4 m long (bow +Z), mast 10 m. Origin = water level (y=0).
 * Self-animating bobbing. The world moves it.
 */
export function createSailboat(color: ColorLike = '#e63946'): THREE.Object3D {
  const b = new Parts();
  const sh = hullShape(2.5, 8.4, 0.8, 2.2);
  hull(b, sh, 0.75, 1.35, color);
  hull(b, sh, 0.55, 0.16, '#ffffff', 1.02);
  b.extrude(sh, 0.06, '#d9b98a', { rx: Math.PI / 2, y: 0.81, sx: 0.88, sy: 0.9 });
  b.box(1.4, 0.7, 2.2, '#f7f7f2', { y: 1.15, z: -1.0 });
  b.box(1.42, 0.25, 1.6, '#1d3557', { y: 1.25, z: -0.9 });
  b.cyl(0.08, 0.11, 10, '#e9ecef', { y: 5.8, z: 0.6 });
  b.rod({ x: 0, y: 1.9, z: 0.6 }, { x: 0, y: 1.9, z: -3.4 }, 0.07, '#e9ecef');
  b.rod({ x: 0, y: 10.6, z: 0.6 }, { x: 0, y: 0.9, z: 4.1 }, 0.02, '#888');
  const main = new THREE.Shape([new THREE.Vector2(0.45, 2.05), new THREE.Vector2(-3.3, 2.05), new THREE.Vector2(0.45, 10.4)]);
  b.extrude(main, 0.06, '#fbfbf5', { ry: -Math.PI / 2, x: 0.03 });
  const jib = new THREE.Shape([new THREE.Vector2(0.75, 9.8), new THREE.Vector2(3.9, 1.2), new THREE.Vector2(0.8, 1.3)]);
  b.extrude(jib, 0.05, '#ffe9a8', { ry: -Math.PI / 2, x: 0.03 });
  b.box(0.04, 0.4, 0.7, color, { y: 10.6, z: 0.25 });
  tinyPerson(b, 0.0, 0.85, -2.6, '#ffb703', 0.9, Math.PI);
  const root = new THREE.Group();
  const inner = b.build();
  root.add(inner);
  bob(inner, 1.3);
  return tag(root, 'Segelboot', 'sailboat', 'Wasserfahrzeug', 'createSailboat');
}

/**
 * Ausflugsdampfer/Fähre, 22 m long, 6 m wide (bow +Z), ≈10 m high. Origin = water level.
 * Windows glow at night. Self-animating bobbing; the world moves it.
 */
export function createFerry(): THREE.Object3D {
  const b = new Parts();
  const sh = hullShape(6, 22, 5);
  hull(b, sh, 1.6, 2.6, '#1d3557');
  hull(b, sh, -0.35, 0.45, '#c1121f', 1.01);
  hull(b, sh, 1.75, 0.3, '#ffffff', 1.01);
  b.extrude(sh, 0.1, '#c49a6c', { rx: Math.PI / 2, y: 1.8, sx: 0.96, sy: 0.97 });
  b.box(5.0, 2.4, 13, '#f7f7f2', { y: 3.0, z: -2 });
  b.box(4.2, 2.0, 7.5, '#f7f7f2', { y: 5.2, z: -1.2 });
  b.box(4.6, 1.4, 2.6, '#f7f7f2', { y: 6.9, z: 1.9 });
  b.box(4.62, 0.6, 0.1, '#3a6ea5', { y: 7.0, z: 3.21, mat: 'glass' });
  for (let z = -7.8; z <= 3.8; z += 1.45) {
    for (const sx of [-1, 1]) b.box(0.06, 0.75, 0.85, '#ffe6a0', { x: sx * 2.52, y: 3.1, z, mat: 'lamp' });
  }
  for (let z = -4.4; z <= 2.0; z += 1.3) {
    for (const sx of [-1, 1]) b.box(0.06, 0.65, 0.8, '#ffe6a0', { x: sx * 2.12, y: 5.3, z, mat: 'lamp' });
  }
  b.cyl(0.95, 1.15, 3.2, '#e63946', { y: 7.8, z: -3.6, seg: 12 });
  b.cyl(0.97, 0.97, 0.7, '#1b1b1f', { y: 9.2, z: -3.6, seg: 12 });
  for (const sx of [-1, 1]) {
    b.box(0.08, 0.5, 18, '#ffffff', { x: sx * 2.8, y: 2.1, z: -0.6 });
    for (const z of [-6, -1.5]) b.cyl(0.45, 0.45, 2.6, '#ff8a1c', { x: sx * 2.7, y: 4.6, z, rx: Math.PI / 2, seg: 8 });
  }
  b.rod({ x: 0, y: 7.6, z: 2.6 }, { x: 0, y: 10.4, z: 2.6 }, 0.07, '#e9ecef');
  b.sphere(0.2, '#fff6c8', { y: 10.5, z: 2.6, mat: 'lamp' });
  b.rod({ x: 0, y: 4.2, z: -8.5 }, { x: 0, y: 6.8, z: -10.6 }, 0.05, '#e9ecef');
  b.box(0.05, 0.8, 1.3, '#ffd23f', { y: 6.5, z: -11.0 });
  b.box(0.06, 0.4, 1.32, '#1d3557', { y: 6.7, z: -11.0 });
  // passengers on the upper deck
  tinyPerson(b, 1.4, 6.2, -4.6, '#ff6b9a', 0.9, Math.PI / 2);
  tinyPerson(b, -1.3, 6.2, -3.2, '#3fa7ff', 0.9, -Math.PI / 2);
  tinyPerson(b, 0.4, 6.2, -5.4, '#ffb703', 0.8);
  const root = new THREE.Group();
  const inner = b.build();
  root.add(inner);
  bob(inner, 0.5);
  return tag(root, 'Ausflugsdampfer', 'ferry', 'Wasserfahrzeug', 'createFerry');
}

/**
 * Piratenschiff, ≈23 m incl. bowsprit (hull 18 m, bow +Z), masts up to 17 m. Origin = water level.
 * Skull flag waves, lanterns glow at night. Self-animating rocking; the world moves it.
 */
export function createPirateShip(): THREE.Object3D {
  const b = new Parts();
  const WOOD = '#6b3e1f', DARK = '#3d2312', GOLD = '#d4a017', SAIL = '#f1e2bd';
  const sh = new THREE.Shape();
  sh.moveTo(-2.4, -9); sh.lineTo(2.4, -9); sh.lineTo(2.8, 2);
  sh.quadraticCurveTo(2.6, 7.5, 0, 9.5); sh.quadraticCurveTo(-2.6, 7.5, -2.8, 2); sh.closePath();
  hull(b, sh, 2.2, 3.0, WOOD);
  hull(b, sh, 2.3, 0.2, GOLD, 1.02);
  hull(b, sh, 1.2, 0.5, DARK, 1.015);
  b.extrude(sh, 0.1, '#b08a5a', { rx: Math.PI / 2, y: 2.35, sx: 0.94, sy: 0.95 });
  // castles
  b.box(5.0, 2.0, 4.0, WOOD, { y: 3.3, z: -7 });
  b.box(5.1, 0.18, 4.1, GOLD, { y: 4.35, z: -7 });
  for (const x of [-1.6, 0, 1.6]) b.box(0.8, 0.9, 0.08, '#ffcf6a', { x, y: 3.3, z: -9.05, mat: 'lamp' });
  b.box(4.2, 1.0, 3.0, WOOD, { y: 2.8, z: 6 });
  b.box(4.3, 0.15, 3.1, GOLD, { y: 3.35, z: 6 });
  // cannons
  for (const sx of [-1, 1]) for (const z of [-3, 0, 3]) {
    b.cyl(0.18, 0.24, 1.3, '#1b1b1f', { x: sx * 2.95, y: 1.2, z, rz: Math.PI / 2, mat: 'metal' });
    b.box(0.1, 0.6, 0.7, '#1b1b1f', { x: sx * 2.78, y: 1.2, z });
  }
  // masts, yards, sails
  const masts: [number, number][] = [[4, 12], [-0.5, 15], [-4.6, 11]];
  for (const [z, h] of masts) {
    b.cyl(0.16, 0.22, h, DARK, { y: 2.3 + h / 2, z });
    for (const [y, w, sh2] of [[0.42, 5.2, 0.32], [0.75, 4.0, 0.22]] as [number, number, number][]) {
      const yy = 2.3 + h * y;
      b.rod({ x: -w / 2 - 0.3, y: yy + h * sh2 * 0.5 + 0.2, z }, { x: w / 2 + 0.3, y: yy + h * sh2 * 0.5 + 0.2, z }, 0.09, DARK);
      b.box(w, h * sh2, 0.18, SAIL, { y: yy, z: z + 0.25, rx: -0.08 });
    }
  }
  b.cyl(0.7, 0.55, 0.6, DARK, { y: 2.3 + 15 * 0.9, z: -0.5, seg: 8 });
  b.rod({ x: 0, y: 2.6, z: 9.2 }, { x: 0, y: 4.6, z: 13.5 }, 0.12, DARK);
  b.extrude(new THREE.Shape([new THREE.Vector2(0, 0), new THREE.Vector2(4.2, 0.2), new THREE.Vector2(0.2, 5.5)]), 0.05, SAIL, { ry: -Math.PI / 2, y: 4.0, z: 8.6 });
  b.sphere(0.25, '#ffcf6a', { y: 5.2, z: -8.8, mat: 'lamp' });
  b.box(0.5, 0.5, 0.5, GOLD, { y: 3.0, z: 9.6 });
  tinyPerson(b, 0.8, 4.45, -6.5, '#c1121f', 0.95, Math.PI);
  tinyPerson(b, -1.0, 2.4, 1.5, '#f1e2bd', 0.9, 0.6);
  const ship = b.build();

  // skull flag on the main mast
  const f = new Parts();
  f.box(0.05, 1.5, 2.3, '#111114', { z: -1.15 });
  for (const sx of [-1, 1]) {
    f.sphere(0.32, '#f5f5f5', { x: sx * 0.04, y: 0.15, z: -1.15, sx: 0.3 });
    f.box(0.05, 0.12, 1.1, '#f5f5f5', { x: sx * 0.04, y: -0.3, z: -1.15, rx: 0.6 });
    f.box(0.05, 0.12, 1.1, '#f5f5f5', { x: sx * 0.04, y: -0.3, z: -1.15, rx: -0.6 });
    f.box(0.06, 0.08, 0.08, '#111114', { x: sx * 0.05, y: 0.2, z: -1.03 });
    f.box(0.06, 0.08, 0.08, '#111114', { x: sx * 0.05, y: 0.2, z: -1.27 });
  }
  const flag = f.build({ castShadow: false });
  flag.position.set(0, 2.3 + 15 + 0.4, -0.5);
  const inner = new THREE.Group();
  inner.add(ship, flag);
  const root = new THREE.Group();
  root.add(inner);
  bob(inner, 1.6);
  onTick((_dt, t) => {
    flag.rotation.y = Math.sin(t * 2.2) * 0.25;
  });
  return tag(root, 'Piratenschiff', 'pirate_ship', 'Wasserfahrzeug', 'createPirateShip');
}

// ─────────────────────────────────────────────────────── Sea serpent ──

/**
 * Seeschlange "Nessie": head at +Z (z≈2.5, ≈6 m above water), 3 humps + tail trailing to z≈-15.
 * Origin = water level. Self-animating undulation; the world moves it slowly along +Z.
 */
export function createSeaSerpent(): THREE.Object3D {
  const BODY = '#2ec4b6', BELLY = '#fff1c1', FIN = '#ff9f1c', SPOT = '#7b2cbf';
  const root = new THREE.Group();
  const humps: THREE.Group[] = [];
  const humpZ = [-3.6, -7.4, -11.0];
  humpZ.forEach((z, i) => {
    const s = 1 - i * 0.15;
    const h = new Parts();
    h.torus(1.6, 0.75, BODY, { arc: Math.PI, ry: Math.PI / 2, rs: 8, ts: 12 });
    for (let k = 0; k < 3; k++) {
      const a = Math.PI * (0.25 + k * 0.25);
      h.cone(0.3, 0.9, FIN, { y: Math.sin(a) * 2.3, z: Math.cos(a) * 2.3, rx: -(Math.PI / 2 - a) * 0.9 + 0.0, seg: 4 });
    }
    h.sphere(0.3, SPOT, { x: 0.6, y: 1.9, z: 0.4, sx: 0.4 });
    h.sphere(0.25, SPOT, { x: -0.62, y: 1.7, z: -0.6, sx: 0.4 });
    const g = h.build();
    g.scale.setScalar(s);
    g.position.z = z;
    root.add(g);
    humps.push(g);
  });
  const tail = new Parts();
  tail.cone(0.5, 2.6, BODY, { rx: -2.2, seg: 8 });
  tail.cone(0.9, 1.3, FIN, { rx: -2.2, y: -0.6, z: 1.2, sx: 1.4, sz: 0.25, seg: 3 });
  const tailG = tail.build();
  tailG.position.set(0, 0.6, -13.6);
  root.add(tailG);

  const head = new THREE.Group();
  const n = new Parts();
  n.rod({ x: 0, y: -0.8, z: 0 }, { x: 0, y: 2.4, z: 0.6 }, 0.8, BODY, undefined, 10);
  n.rod({ x: 0, y: 2.4, z: 0.6 }, { x: 0, y: 4.4, z: 1.7 }, 0.7, BODY, undefined, 10);
  n.sphere(0.7, BODY, { y: 2.4, z: 0.6 });
  n.rod({ x: 0, y: -0.6, z: 0.45 }, { x: 0, y: 4.3, z: 2.2 }, 0.45, BELLY, undefined, 8);
  n.sphere(1.15, BODY, { y: 5.1, z: 2.3, sz: 1.3, sy: 0.95 });
  n.sphere(0.85, BODY, { y: 4.85, z: 3.4, sx: 1.05, sy: 0.8 });
  n.sphere(0.12, '#0b3d38', { x: 0.3, y: 5.15, z: 4.15 });
  n.sphere(0.12, '#0b3d38', { x: -0.3, y: 5.15, z: 4.15 });
  for (const sx of [-1, 1]) {
    n.sphere(0.42, '#ffffff', { x: sx * 0.62, y: 5.75, z: 2.9 });
    n.sphere(0.2, '#111', { x: sx * 0.68, y: 5.8, z: 3.28 });
    n.sphere(0.07, '#ffffff', { x: sx * 0.62, y: 5.9, z: 3.45 });
    n.sphere(0.3, '#ff8fa3', { x: sx * 0.95, y: 4.75, z: 3.0, sx: 0.4 });
    n.cone(0.2, 0.7, FIN, { x: sx * 0.5, y: 6.2, z: 1.7, rx: -0.5, rz: -sx * 0.3, seg: 5 });
  }
  n.torus(0.45, 0.06, '#0b3d38', { y: 4.62, z: 3.95, arc: Math.PI, rz: Math.PI, rx: 0.5, ts: 10 });
  for (let k = 0; k < 4; k++) n.cone(0.25, 0.8, FIN, { y: 1.0 + k * 1.2, z: -0.65 + k * 0.33, rx: -0.6, seg: 4 });
  head.add(n.build());
  root.add(head);

  // ripples at the waterline
  const rp = new Parts();
  for (const z of [0, ...humpZ.flatMap((z) => [z - 1.6, z + 1.6])]) rp.torus(1.1, 0.12, '#e9fbff', { rx: Math.PI / 2, z, y: 0.05, ts: 14, rs: 3 });
  const ripples = ghost(rp.build({ castShadow: false }));
  root.add(ripples);

  onTick((_dt, t) => {
    humps.forEach((g, i) => {
      g.position.y = -0.55 + Math.sin(t * 2 - i * 1.1) * 0.45;
    });
    tailG.rotation.y = Math.sin(t * 2.4) * 0.4;
    head.position.y = Math.sin(t * 2 + 0.8) * 0.25;
    head.rotation.y = Math.sin(t * 0.45) * 0.45;
    head.rotation.x = Math.sin(t * 0.7) * 0.06;
    const s = 1 + Math.sin(t * 2) * 0.12;
    ripples.scale.set(s, 1, 1);
  });
  return tag(root, 'Seeschlange', 'sea_serpent', 'Kurioses', 'createSeaSerpent', 'Nessie');
}

// ──────────────────────────────────────────────────────────── Whale ──

/**
 * Wal, ≈13.5 m long. Origin = water level at the CENTER of its swimming circle (R=22 m).
 * Fully self-animating: it moves the object itself around its home position (captured on
 * the first frame; set userData.home to relocate), spouts and breaches every ~24 s.
 * Following it with the camera works because the root moves.
 */
export function createWhale(): THREE.Object3D {
  const TOP = '#3b5b85', BELLY = '#e8eef5';
  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);
  const b = new Parts();
  const prof: [number, number][] = [[0, -6.4], [0.7, -5.6], [1.3, -4.0], [1.85, -2], [2.15, 0], [2.25, 2], [2.05, 4], [1.55, 5.4], [0.7, 6.15], [0, 6.3]];
  b.lathe(prof, TOP, { rx: Math.PI / 2, seg: 14 });
  b.lathe(prof, BELLY, { rx: Math.PI / 2, seg: 14, s: 0.97, y: -0.42 });
  for (let i = 0; i < 7; i++) b.box(0.08, 0.06, 4.2, '#c9d4e0', { x: (i - 3) * 0.35, y: -2.15 + Math.abs(i - 3) * 0.08, z: 2.6 });
  for (const sx of [-1, 1]) {
    b.sphere(0.2, '#111', { x: sx * 1.85, y: 0.15, z: 3.7 });
    b.box(0.06, 0.07, 3.4, '#22344d', { x: sx * 1.98, y: -0.45, z: 4.0, ry: sx * 0.12 });
    b.box(3.2, 0.2, 1.3, TOP, { x: sx * 2.8, y: -0.9, z: 2.2, rz: sx * -0.45, ry: sx * 0.3 });
    b.box(2.6, 0.22, 1.5, TOP, { x: sx * 1.25, y: 0.0, z: -7.4, ry: sx * 0.42 });
  }
  b.cone(0.55, 1.4, TOP, { y: 1.95, z: -2.2, rx: -0.6, sx: 0.4, seg: 5 });
  b.cone(0.6, 1.8, TOP, { z: -6.6, rx: -Math.PI / 2, seg: 8 });
  body.add(b.build());

  // water spout (child of body, near the blowhole)
  const sp = new Parts();
  sp.cyl(0.25, 0.12, 4, '#ffffff', { y: 2, mat: 'cloud' });
  sp.ico(0.9, '#ffffff', { y: 4.2, x: 0.4, mat: 'cloud', detail: 1 });
  sp.ico(0.8, '#eef6ff', { y: 4.3, x: -0.5, z: 0.3, mat: 'cloud', detail: 1 });
  sp.ico(0.7, '#ffffff', { y: 4.8, z: -0.3, mat: 'cloud', detail: 1 });
  const spout = ghost(sp.build({ castShadow: false }));
  spout.position.set(0, 2.0, 2.6);
  spout.scale.setScalar(0.001);
  body.add(spout);

  // splash (child of root, compensated to stay where it happened)
  const spl = new Parts();
  spl.torus(2.4, 0.35, '#ffffff', { rx: Math.PI / 2, ts: 18, rs: 4, mat: 'cloud' });
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * TAU;
    spl.cone(0.4, 2.5 + (i % 3), '#f2f8ff', { x: Math.cos(a) * 1.8, y: 1.0, z: Math.sin(a) * 1.8, rz: -Math.cos(a) * 0.4, rx: Math.sin(a) * 0.4, mat: 'cloud', seg: 5 });
  }
  const splash = ghost(spl.build({ castShadow: false }));
  splash.visible = false;
  root.add(splash);
  const splashWorld = new THREE.Vector3();
  let splashT = -10;

  const R = 22, C = 24, W = 0.06;
  const BREACH_ADV = 15 / R;
  const ph = Math.random() * C;
  let lastQ = 0;
  onTick((_dt, t) => {
    const home = homeOf(root);
    const tt = t + ph;
    const cycles = Math.floor(tt / C);
    const p = (tt % C) / C;
    let y = -2.6 + 0.3 * Math.sin(t * 0.9), pitch = 0, roll = 0, adv = 0;
    let spoutK = 0;
    if (p >= 0.35 && p < 0.5) {
      const q = (p - 0.35) / 0.15;
      y = -2.6 + Math.sin(q * Math.PI) * 1.25;
      if (q > 0.35 && q < 0.95) spoutK = Math.sin(((q - 0.35) / 0.6) * Math.PI);
    } else if (p >= 0.5 && p < 0.6) {
      const q = (p - 0.5) / 0.1;
      y = -2.6 - q * 2.4;
      pitch = q * 0.25;
    } else if (p >= 0.6 && p < 0.78) {
      const q = (p - 0.6) / 0.18;
      y = -5 + 4 * 13 * q * (1 - q);
      adv = BREACH_ADV * q;
      const dur = C * 0.18;
      pitch = -Math.atan2((4 * 13 * (1 - 2 * q)) / dur, 15 / dur);
      roll = q * Math.PI * 0.9;
      for (const edge of [0.12, 0.9]) {
        if (lastQ < edge && q >= edge) {
          splashT = t;
          body.getWorldPosition(splashWorld);
        }
      }
      lastQ = q;
    } else if (p >= 0.78) {
      const q = (p - 0.78) / 0.22;
      y = -5 + q * 2.4;
      adv = BREACH_ADV;
      pitch = -0.2 * (1 - q);
      roll = Math.PI * 0.9 * (1 - q) + 0;
      lastQ = 0;
    }
    if (p < 0.6) lastQ = 0;
    const th = tt * W + cycles * BREACH_ADV + adv;
    root.position.set(home.x + Math.cos(th) * R, home.y, home.z + Math.sin(th) * R);
    root.rotation.y = Math.atan2(-Math.sin(th), Math.cos(th));
    body.position.y = y;
    body.rotation.set(pitch, 0, roll);
    spout.scale.setScalar(Math.max(0.001, spoutK));
    const age = t - splashT;
    splash.visible = age < 1.6;
    if (splash.visible) {
      const k = age / 1.6;
      splash.scale.set(0.6 + k * 1.6, Math.sin(k * Math.PI) * 1.4 + 0.01, 0.6 + k * 1.6);
      root.updateMatrixWorld();
      splash.position.copy(root.worldToLocal(splashWorld.clone().setY(home.y)));
    }
  });
  return tag(root, 'Wal', 'whale', 'Lebewesen', 'createWhale');
}

// ──────────────────────────────────────────────────────── Buoy, pier ──

/** Boje, ≈3.4 m tall, Ø 2.2 m. Origin = water level. Bobs, light blinks. */
export function createBuoy(): THREE.Object3D {
  const b = new Parts();
  b.cyl(1.0, 1.15, 1.3, '#e63946', { y: 0.15, seg: 12 });
  b.cyl(1.01, 1.01, 0.35, '#f5f5f5', { y: 0.45, seg: 12 });
  b.sphere(1.1, '#e63946', { y: -0.5, sy: 0.6, w: 12 });
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * TAU + 0.4;
    b.rod({ x: Math.cos(a) * 0.8, y: 0.8, z: Math.sin(a) * 0.8 }, { x: Math.cos(a) * 0.25, y: 2.7, z: Math.sin(a) * 0.25 }, 0.06, '#e63946');
  }
  b.cyl(0.4, 0.4, 0.15, '#2b3240', { y: 2.75 });
  b.cone(0.35, 0.6, '#e63946', { y: 3.45 });
  const inner = new THREE.Group();
  inner.add(b.build());
  const light = new Parts().sphere(0.25, '#ffef5a', { mat: 'neon' }).build({ castShadow: false });
  light.position.y = 3.0;
  inner.add(light);
  const root = new THREE.Group();
  root.add(inner);
  const ph = Math.random() * 10;
  onTick((_dt, t) => {
    inner.position.y = Math.sin(t * 1.3 + ph) * 0.2;
    inner.rotation.z = Math.sin(t * 0.9 + ph) * 0.12;
    inner.rotation.x = Math.sin(t * 1.1 + ph * 2) * 0.1;
    light.visible = (t + ph) % 2.5 < 0.5;
  });
  return tag(root, 'Boje', 'buoy', 'Wasserfahrzeug', 'createBuoy');
}

/**
 * Holzsteg, 4 m wide, running from z=0 to z=length (+Z). Deck at y≈1.25 above the water
 * (origin = water level at the land end). Lanterns glow at night. Static.
 */
export function createPier(length = 40): THREE.Object3D {
  const b = new Parts();
  const L = length;
  for (let z = 0, i = 0; z < L; z += 1, i++) b.box(4, 0.25, 0.92, i % 2 ? '#a8743f' : '#9a6a38', { y: 1.15, z: z + 0.5 });
  b.box(0.3, 0.4, L, '#6d4c2c', { x: 1.6, y: 0.85, z: L / 2 });
  b.box(0.3, 0.4, L, '#6d4c2c', { x: -1.6, y: 0.85, z: L / 2 });
  for (let z = 1; z <= L; z += 4) {
    for (const sx of [-1, 1]) b.cyl(0.25, 0.25, 4.6, '#4f3520', { x: sx * 1.85, y: -1.0, z, seg: 7 });
  }
  for (let z = 0.2; z <= L; z += 2) {
    for (const sx of [-1, 1]) b.box(0.12, 1.0, 0.12, '#6d4c2c', { x: sx * 1.95, y: 1.75, z });
  }
  for (const sx of [-1, 1]) b.box(0.14, 0.12, L, '#8b5a2b', { x: sx * 1.95, y: 2.25, z: L / 2 });
  for (let z = 6, k = 0; z < L; z += 12, k++) {
    const sx = k % 2 ? 1 : -1;
    b.cyl(0.07, 0.09, 2.6, '#2b3240', { x: sx * 1.95, y: 2.55, z });
    b.box(0.4, 0.5, 0.4, '#ffe6a0', { x: sx * 1.95, y: 4.05, z, mat: 'lamp' });
    b.cone(0.35, 0.3, '#2b3240', { x: sx * 1.95, y: 4.45, z, seg: 4 });
  }
  b.torus(0.4, 0.1, '#ff6b35', { x: 2.05, y: 1.8, z: L - 2, ry: Math.PI / 2, ts: 12 });
  b.box(1.6, 0.12, 0.5, '#8b5a2b', { x: -1.2, y: 1.75, z: L - 1.5 });
  tinyPerson(b, 1.2, 1.28, L - 0.8, '#3fa7ff', 0.9);
  b.rod({ x: 1.4, y: 2.3, z: L - 0.6 }, { x: 1.9, y: 4.2, z: L + 2.2 }, 0.03, '#5a4630');
  return tag(b.build(), 'Steg', 'pier', 'Gebäude', 'createPier', `${length} m`);
}
