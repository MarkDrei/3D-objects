import * as THREE from 'three';
import { Parts } from '../core/parts';
import { onTick, env } from '../core/anim';
import { selectable } from '../core/registry';
import { homeOf } from './sky-util';

const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

/** Launch cycle in seconds: idle → venting → lift-off → gone → propulsive landing. */
const CYCLE = 90;
const T_VENT = 38, T_LIFT = 46, T_GONE = 62, T_LAND = 72, T_DOWN = 86;
const PAD_TOP = 2.2;

function phase(t: number) {
  return t % CYCLE;
}
/** Rocket height above the pad at cycle time p. */
function rocketY(p: number) {
  if (p >= T_LIFT && p < T_GONE) {
    const s = p - T_LIFT;
    return 0.5 * 3.2 * s * s;
  }
  if (p >= T_GONE && p < T_LAND) return 9999;
  if (p >= T_LAND && p < T_DOWN) {
    const s = (p - T_LAND) / (T_DOWN - T_LAND);
    return 320 * (1 - s) * (1 - s);
  }
  return 0;
}

/**
 * Raketenstartplatz. Launch pad 22 x 22 m with flame trench, lattice service tower (≈36 m) whose
 * access arm swings away before launch, and smoke puffs. The rocket (≈31 m, separately selectable)
 * is in userData.extras – add it to the scene at the pad's transform (placement helper does that).
 * Fully self-animating: every 90 s the rocket vents, launches, disappears and lands again.
 */
export function createRocketLaunchSite(): THREE.Object3D {
  const pad = new Parts();
  pad.box(22, 1.6, 22, '#b9b6ae', { y: 0.8 });
  pad.box(16, 0.6, 16, '#d4d0c6', { y: 1.9 });
  pad.box(5, 0.7, 22.2, '#4a4a4f', { y: 1.95 }); // flame trench
  for (const s of [-1, 1]) {
    pad.box(1.2, 0.15, 22.2, '#ffcf3a', { x: s * 3.2, y: 2.25 });
    // hold-down clamps
    pad.box(1, 1.6, 1, '#7a7f87', { x: s * 2.2, y: 2.8, z: 2.2 });
    pad.box(1, 1.6, 1, '#7a7f87', { x: s * 2.2, y: 2.8, z: -2.2 });
  }
  // lightning masts in the corners
  for (const [x, z] of [[-10, -10], [10, -10], [-10, 10], [10, 10]]) {
    pad.cyl(0.25, 0.4, 24, '#d9dde2', { x, y: 13.6, z, seg: 6 });
    pad.sphere(0.35, '#ff3b3b', { x, y: 25.8, z, mat: 'neon' });
  }
  // service tower (lattice) at -X
  const tx = -8, H = 36;
  for (const [dx, dz] of [[-1.6, -1.6], [1.6, -1.6], [-1.6, 1.6], [1.6, 1.6]]) {
    pad.box(0.4, H, 0.4, '#e04b3a', { x: tx + dx, y: PAD_TOP + H / 2, z: dz });
  }
  for (let y = 2; y < H; y += 3) {
    const yy = PAD_TOP + y;
    pad.beam(V(tx - 1.6, yy, -1.6), V(tx + 1.6, yy + 3, -1.6), 0.18, '#f2f2f2');
    pad.beam(V(tx - 1.6, yy, 1.6), V(tx + 1.6, yy + 3, 1.6), 0.18, '#f2f2f2');
    pad.beam(V(tx - 1.6, yy + 3, -1.6), V(tx - 1.6, yy, 1.6), 0.18, '#f2f2f2');
    pad.beam(V(tx + 1.6, yy + 3, -1.6), V(tx + 1.6, yy, 1.6), 0.18, '#f2f2f2');
    pad.box(3.6, 0.2, 3.6, '#c63b2d', { x: tx, y: yy, z: 0 });
  }
  pad.box(4.2, 2.4, 4.2, '#eeeeee', { x: tx, y: PAD_TOP + H + 1.2 });
  pad.cyl(0.12, 0.12, 6, '#cccccc', { x: tx, y: PAD_TOP + H + 5.4 });
  pad.sphere(0.4, '#ff3b3b', { x: tx, y: PAD_TOP + H + 8.5, mat: 'neon' });
  // control bunker + sign
  pad.box(6, 3, 4, '#9aa0a8', { x: 6, y: 1.5 + 1.6, z: 8.5 });
  pad.box(3.4, 0.8, 0.1, '#1c2440', { x: 6, y: 3.6, z: 10.55 });
  pad.box(3.0, 0.5, 0.05, '#7dffb2', { x: 6, y: 3.6, z: 10.62, mat: 'neon' });
  const root = pad.build();

  // swinging access arm
  const armPivot = new THREE.Group();
  armPivot.position.set(tx + 1.6, PAD_TOP + 27, 0);
  const ab = new Parts();
  ab.box(5.2, 1.4, 1.6, '#f2f2f2', { x: 2.6 });
  ab.box(5.2, 0.15, 1.8, '#c63b2d', { x: 2.6, y: 0.75 });
  ab.box(0.6, 1.2, 1.4, '#3a3f4a', { x: 5.2 });
  armPivot.add(ab.build());
  root.add(armPivot);

  // smoke puffs (reused, grow + fade by scale)
  const smokeMat = new THREE.MeshStandardMaterial({ color: '#f1f1f1', roughness: 1, flatShading: true, transparent: true, opacity: 0.88 });
  const puffGeo = new THREE.IcosahedronGeometry(1, 0);
  const puffs: { m: THREE.Mesh; born: number; dir: THREE.Vector3 }[] = [];
  for (let i = 0; i < 16; i++) {
    const m = new THREE.Mesh(puffGeo, smokeMat);
    m.visible = false;
    m.userData.noHighlight = true;
    root.add(m);
    const a = (i / 16) * Math.PI * 2;
    // smoke exits mostly along the flame trench (±Z)
    puffs.push({ m, born: -99, dir: V(Math.cos(a) * 0.35, 0.25, Math.sin(a) > 0 ? 1 : -1) });
  }

  selectable(root, { type: 'Startrampe', key: 'launch_pad', category: 'Gebäude', source: 'prozedural', model: 'createRocketLaunchSite' });

  const rocket = createRocket();
  rocket.position.y = PAD_TOP;
  root.userData.extras = [rocket];

  let nextPuff = 0;
  onTick((dt, t) => {
    const p = phase(t);
    // access arm: retracts 8 s before lift-off, comes back after landing
    const armOpen = p > T_VENT - 4 && p < T_DOWN + 2 ? 1 : 0;
    armPivot.rotation.y = THREE.MathUtils.lerp(armPivot.rotation.y, armOpen * -1.4, dt * 0.8);

    const venting = p > T_VENT && p < T_LIFT + 6;
    const landing = p > T_DOWN - 4 && p < T_DOWN + 2;
    const rate = venting ? (p > T_LIFT ? 0.06 : 0.35) : landing ? 0.12 : p < T_VENT ? 2.5 : 99;
    if (t > nextPuff) {
      nextPuff = t + rate;
      const pf = puffs.reduce((a, b) => (a.born < b.born ? a : b));
      pf.born = t;
      pf.m.visible = true;
      pf.m.position.set((Math.random() - 0.5) * 2, PAD_TOP + 0.5, (Math.random() - 0.5) * 2);
    }
    for (const pf of puffs) {
      const age = t - pf.born;
      if (!pf.m.visible) continue;
      const life = venting && p > T_LIFT ? 5 : 3.5;
      if (age > life) { pf.m.visible = false; continue; }
      const k = age / life;
      const strong = venting && p > T_LIFT ? 1 : 0.35;
      pf.m.position.addScaledVector(pf.dir, dt * (6 * strong + 1) * (1 - k));
      pf.m.scale.setScalar((1 + k * 8) * (0.45 + strong) * Math.sin(Math.min(k * 3, 1) * Math.PI / 2) * (1 - k * k * 0.5));
    }
    smokeMat.color.setScalar(1 - env.night * 0.55);
  });
  return root;
}

/** Rakete ≈31 m, white with red stripes, 4 fins, flame + landing legs. Moves itself (see launch site). */
function createRocket(): THREE.Object3D {
  const b = new Parts();
  const R = 1.9;
  b.cyl(R, R, 22, '#f4f5f7', { y: 4 + 11, seg: 14 });
  b.cyl(R * 1.01, R * 1.01, 1.4, '#e63946', { y: 9, seg: 14 });
  b.cyl(R * 1.01, R * 1.01, 0.6, '#1d2340', { y: 20, seg: 14 });
  b.cyl(R * 1.01, R * 1.01, 1.4, '#e63946', { y: 24.5, seg: 14 });
  b.lathe([[0.0, 0], [R, 0], [R * 0.95, 1.8], [R * 0.7, 4], [R * 0.35, 5.6], [0.0, 6.6]], '#e63946', { y: 26, seg: 14 });
  // window + lettering band
  b.cyl(0.6, 0.6, 0.2, '#7fd4ff', { y: 23, z: R, rx: Math.PI / 2, mat: 'glass' });
  b.box(0.5, 6, 0.1, '#1d2340', { y: 15, z: R + 0.02 });
  // engine section
  b.cyl(R, R * 1.15, 4, '#3b3f4a', { y: 2, seg: 14 });
  for (let k = 0; k < 3; k++) {
    const a = (k / 3) * Math.PI * 2;
    b.cyl(0.45, 0.8, 1.4, '#22252c', { x: Math.cos(a) * 0.9, y: -0.7 + 0.7, z: Math.sin(a) * 0.9, seg: 8 });
  }
  // fins
  for (let k = 0; k < 4; k++) {
    const a = (k / 4) * Math.PI * 2 + Math.PI / 4;
    const shape = new THREE.Shape([new THREE.Vector2(0, 0), new THREE.Vector2(2.6, -0.6), new THREE.Vector2(2.6, 1.2), new THREE.Vector2(0, 6)]);
    const g = new THREE.ExtrudeGeometry(shape, { depth: 0.25, bevelEnabled: false });
    g.translate(R - 0.1, 0.8, -0.125);
    g.rotateY(-a);
    b.add(g, '#e63946');
  }
  const body = b.build();
  const root = new THREE.Group();
  root.add(body);

  // landing legs (fold out for landing)
  const legs: THREE.Group[] = [];
  for (let k = 0; k < 4; k++) {
    const pivot = new THREE.Group();
    const a = (k / 4) * Math.PI * 2;
    pivot.position.set(Math.cos(a) * R, 4.5, Math.sin(a) * R);
    pivot.rotation.y = -a;
    const lb = new Parts();
    lb.box(0.35, 5.2, 0.35, '#2b2f38', { y: -2.6 });
    lb.box(1.1, 0.25, 1.1, '#2b2f38', { y: -5.2 });
    const lg = lb.build();
    const tilt = new THREE.Group();
    tilt.add(lg);
    pivot.add(tilt);
    root.add(pivot);
    legs.push(tilt);
  }

  // flame
  const fb = new Parts();
  fb.cone(1.6, 9, '#ffb03b', { y: -4.5, rx: Math.PI, mat: 'neon', seg: 10 });
  fb.cone(0.9, 6, '#fff3c4', { y: -3.2, rx: Math.PI, mat: 'neon', seg: 8 });
  const flame = fb.build({ castShadow: false });
  flame.visible = false;
  flame.userData.noHighlight = true;
  root.add(flame);
  const glow = new THREE.PointLight('#ffae4a', 0, 120, 1.5);
  glow.position.y = -3;
  root.add(glow);

  selectable(root, { type: 'Rakete', key: 'rocket', category: 'Kurioses', source: 'prozedural', model: 'createRocketLaunchSite' });
  root.userData.noCull = true;

  onTick((_dt, t) => {
    const home = homeOf(root);
    const p = phase(t);
    const y = rocketY(p);
    const gone = y > 900;
    body.visible = !gone;
    legs.forEach((l) => (l.parent!.visible = !gone));
    root.position.set(home.x, home.y + (gone ? 0 : y), home.z);
    const burning = (p >= T_LIFT && p < T_GONE) || (p >= T_LAND && p < T_DOWN - 0.3) || (p > T_LIFT - 1.2 && p < T_LIFT);
    flame.visible = burning && !gone;
    if (flame.visible) {
      const f = 0.85 + Math.random() * 0.3;
      flame.scale.set(f, f * (p >= T_LAND ? 0.8 : 1.15), f);
    }
    glow.intensity = flame.visible ? 400 : 0;
    // slight wobble during ascent
    root.rotation.z = p >= T_LIFT && p < T_GONE ? Math.sin(t * 7) * 0.006 : 0;
    // legs: folded during flight, deployed on the pad and for the final landing
    const deployed = p < T_LIFT || p > T_DOWN - 6;
    for (const l of legs) l.rotation.z = THREE.MathUtils.lerp(l.rotation.z, deployed ? 0.55 : 0, 0.05);
  });
  return root;
}

/**
 * Leuchtqualle: a giant (≈7 m) jellyfish drifting in the bay, bell pulses, tentacles wave,
 * glows strongly at night. Origin = water level; the bell floats half above the water.
 * Self-animating (pulse + gentle drift around its placement position).
 */
export function createJellyfish(hue = 0.85): THREE.Object3D {
  const col = new THREE.Color().setHSL(hue, 0.85, 0.66);
  const root = new THREE.Group();
  const bellMat = new THREE.MeshStandardMaterial({ color: col, emissive: col, emissiveIntensity: 0.25, transparent: true, opacity: 0.72, roughness: 0.25, flatShading: true });
  const bell = new THREE.Mesh(new THREE.SphereGeometry(3.4, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), bellMat);
  bell.castShadow = true;
  root.add(bell);
  const ib = new Parts();
  ib.sphere(1.6, '#ffffff', { y: 0.8, sy: 0.6, mat: 'neon' });
  for (let k = 0; k < 4; k++) ib.torus(0.7, 0.12, col.clone().offsetHSL(0.08, 0, 0.1), { x: Math.cos(k * 1.57) * 1.2, y: 0.4, z: Math.sin(k * 1.57) * 1.2, rx: Math.PI / 2, mat: 'neon' });
  const inner = ib.build({ castShadow: false });
  root.add(inner);
  const tentacles: THREE.Mesh[] = [];
  const tMat = new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.6, toneMapped: false });
  for (let k = 0; k < 10; k++) {
    const a = (k / 10) * Math.PI * 2;
    const len = 5 + (k % 3) * 1.5;
    const g = new THREE.CylinderGeometry(0.12, 0.03, len, 4, 6);
    g.translate(0, -len / 2, 0);
    const m = new THREE.Mesh(g, tMat);
    m.position.set(Math.cos(a) * 2.6, 0.1, Math.sin(a) * 2.6);
    m.userData.base = Float32Array.from(g.attributes.position.array as Float32Array);
    root.add(m);
    tentacles.push(m);
  }
  selectable(root, { type: 'Leuchtqualle', key: 'jellyfish', category: 'Kurioses', source: 'prozedural', model: 'createJellyfish' });
  root.userData.noCull = true;
  const ph = Math.random() * 10;
  onTick((_dt, t) => {
    const home = homeOf(root);
    const pulse = Math.sin(t * 2.2 + ph);
    bell.scale.set(1 + pulse * 0.08, 1 - pulse * 0.12, 1 + pulse * 0.08);
    bellMat.emissiveIntensity = 0.2 + env.night * (1.2 + pulse * 0.4);
    root.position.set(home.x + Math.sin(t * 0.07 + ph) * 18, home.y - 0.6 + pulse * 0.25, home.z + Math.cos(t * 0.05 + ph) * 12);
    for (const m of tentacles) {
      const base = m.userData.base as Float32Array;
      const pos = m.geometry.attributes.position as THREE.BufferAttribute;
      const arr = pos.array as Float32Array;
      for (let i = 0; i < pos.count; i++) {
        const y = base[i * 3 + 1];
        arr[i * 3] = base[i * 3] + Math.sin(t * 2 + y * 0.8 + m.position.x) * y * -0.08;
        arr[i * 3 + 2] = base[i * 3 + 2] + Math.cos(t * 1.7 + y * 0.6 + m.position.z) * y * -0.06;
      }
      pos.needsUpdate = true;
    }
  });
  return root;
}
