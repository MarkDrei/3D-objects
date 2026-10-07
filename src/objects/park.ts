import * as THREE from 'three';
import { Parts } from '../core/parts';
import { onTick, env } from '../core/anim';
import { gallery } from './gallery';
import { R, sel, group, stripedCone, stripedBand, textPlane, figure, PASTELS } from './park-util';
import { EXTRA_GALLERY } from './park-extras';

export { createHotDogCart, createFlamingoFloat, createHedgeMaze, createMushroomHouse, createBubbleMachine } from './park-extras';

const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

// ───────────────────────────────────────────── Riesenrad ─────────────────────────────────────────────

/**
 * Riesenrad. Base footprint 14 x 8 m (wheel Ø 20 m overhangs in X, in the air), height ≈ 23.5 m.
 * Wheel plane is XY (faces ±Z). Rotates slowly, gondolas stay upright, rim bulbs chase at night.
 */
export function createFerrisWheel(): THREE.Object3D {
  const RAD = 10, AXLE = 13;
  const base = new Parts();
  base.box(14, 0.4, 8, '#cfc8bb', { y: 0.2 });
  base.box(6, 0.2, 1.4, '#b8b0a2', { y: 0.1, z: 4.5 });
  // ticket booth
  base.box(1.8, 2.2, 1.6, '#ff6fa5', { x: 5.4, y: 1.5, z: 2.6 });
  base.box(2.2, 0.25, 2.0, '#ffffff', { x: 5.4, y: 2.72, z: 2.6 });
  base.box(1.2, 0.7, 0.05, '#2b2f44', { x: 5.4, y: 1.9, z: 3.42 });
  // boarding platform + stairs
  base.box(3.4, 0.8, 2.6, '#e4ddd0', { y: 0.8, z: 0 });
  for (let s = 0; s < 3; s++) base.box(2.2, 0.27, 0.5, '#d6cfc2', { y: 0.27 * (s + 0.5), z: 1.55 + (2 - s) * 0.5 });
  // A-frame legs on both sides
  for (const zs of [-1, 1]) {
    const zTop = zs * 1.7, zBot = zs * 3.4;
    base.beam(V(-5.5, 0.4, zBot), V(0, AXLE, zTop), 0.45, '#f4f4f4');
    base.beam(V(5.5, 0.4, zBot), V(0, AXLE, zTop), 0.45, '#f4f4f4');
    base.beam(V(-3.4, 5.6, zs * 2.74), V(3.4, 5.6, zs * 2.74), 0.3, '#e94f6a');
    base.beam(V(-1.9, 9.4, zs * 2.2), V(1.9, 9.4, zs * 2.2), 0.25, '#e94f6a');
    base.cyl(0.5, 0.6, 0.6, '#9aa0a8', { x: -5.5, y: 0.6, z: zBot });
    base.cyl(0.5, 0.6, 0.6, '#9aa0a8', { x: 5.5, y: 0.6, z: zBot });
  }
  base.cyl(0.45, 0.45, 4, '#9aa0a8', { y: AXLE, rx: Math.PI / 2, seg: 10 });
  const root = group(base.build());

  const wheel = new THREE.Group();
  wheel.position.y = AXLE;
  root.add(wheel);
  const wb = new Parts();
  const zr = 1.05;
  for (const z of [-zr, zr]) {
    wb.torus(RAD, 0.2, '#ffffff', { z, rs: 5, ts: 40 });
    wb.torus(RAD * 0.42, 0.12, '#ffd23f', { z, rs: 4, ts: 24 });
    for (let k = 0; k < 16; k++) {
      const a = (k / 16) * Math.PI * 2;
      wb.beam(V(0, 0, z), V(Math.cos(a) * RAD, Math.sin(a) * RAD, z), 0.12, '#e94f6a', 'lamp');
    }
    // zig-zag truss between rims
    for (let k = 0; k < 24; k++) {
      const a1 = (k / 24) * Math.PI * 2, a2 = ((k + 1) / 24) * Math.PI * 2;
      wb.beam(V(Math.cos(a1) * RAD * 0.42, Math.sin(a1) * RAD * 0.42, z), V(Math.cos(a2) * RAD, Math.sin(a2) * RAD, z), 0.08, '#ffffff');
    }
  }
  for (let k = 0; k < 12; k++) {
    const a = (k / 12) * Math.PI * 2;
    wb.rod(V(Math.cos(a) * RAD, Math.sin(a) * RAD, -zr - 0.1), V(Math.cos(a) * RAD, Math.sin(a) * RAD, zr + 0.1), 0.09, '#c9ced6');
  }
  wb.cyl(0.9, 0.9, 2.8, '#e94f6a', { rx: Math.PI / 2, seg: 12 });
  // hub star (neon)
  const star = new Parts();
  for (const z of [-1.45, 1.45]) {
    for (let k = 0; k < 8; k++) {
      const a = (k / 8) * Math.PI * 2;
      star.box(0.18, 2.2, 0.08, k % 2 ? '#ffd23f' : '#ff4fa8', { z, rz: a, x: Math.cos(a + Math.PI / 2) * 1.1, y: Math.sin(a + Math.PI / 2) * 1.1, mat: 'neon' });
    }
  }
  wheel.add(wb.build(), star.build({ castShadow: false }));
  // chasing bulbs: two alternating sets
  const bulbs = [new Parts(), new Parts()];
  const BN = 64;
  for (const z of [-zr - 0.15, zr + 0.15]) {
    for (let k = 0; k < BN; k++) {
      const a = (k / BN) * Math.PI * 2;
      bulbs[k % 2].sphere(0.21, k % 4 < 2 ? '#fff2a8' : '#ff8ad8', { x: Math.cos(a) * RAD, y: Math.sin(a) * RAD, z, w: 4, hseg: 3, mat: 'neon' });
    }
  }
  const bulbA = bulbs[0].build({ castShadow: false }), bulbB = bulbs[1].build({ castShadow: false });
  wheel.add(bulbA, bulbB);

  const gondolas: THREE.Object3D[] = [];
  for (let k = 0; k < 12; k++) {
    const a = (k / 12) * Math.PI * 2;
    const c = PASTELS[k % PASTELS.length];
    const g = new Parts();
    g.rod(V(0, 0, 0), V(0, -0.9, 0), 0.06, '#9aa0a8');
    g.box(1.7, 0.12, 1.5, '#5b6170', { y: -2.55 });
    g.box(1.7, 0.85, 1.5, c, { y: -2.1 });
    g.box(1.74, 0.12, 1.54, '#ffffff', { y: -1.66 });
    for (const [px, pz] of [[-0.78, -0.68], [0.78, -0.68], [-0.78, 0.68], [0.78, 0.68]]) g.box(0.07, 0.75, 0.07, '#ffffff', { x: px, y: -1.25, z: pz });
    g.add(new THREE.ConeGeometry(1.25, 0.55, 4, 1), c, { y: -0.68, ry: Math.PI / 4 });
    g.sphere(0.12, '#ffd23f', { y: -0.35, w: 6, hseg: 4 });
    // two passengers peeking out
    if (k % 3 !== 1) {
      g.sphere(0.2, '#f1c27d', { x: -0.35, y: -1.35, z: 0.2, w: 6, hseg: 5 });
      g.sphere(0.2, k % 2 ? '#8d5524' : '#f1c27d', { x: 0.35, y: -1.35, z: -0.1, w: 6, hseg: 5 });
    }
    const gp = g.build();
    gp.position.set(Math.cos(a) * RAD, Math.sin(a) * RAD, 0);
    wheel.add(gp);
    gondolas.push(gp);
  }
  onTick((dt, t) => {
    wheel.rotation.z += dt * 0.07;
    for (const g of gondolas) g.rotation.z = -wheel.rotation.z + Math.sin(t * 1.3 + g.position.x) * 0.04;
    const on = Math.floor(t * 3) % 2 === 0;
    bulbA.visible = on || env.night < 0.2;
    bulbB.visible = !on || env.night < 0.2;
  });
  return sel(root, 'Riesenrad', 'ferris_wheel', 'Attraktion', 'createFerrisWheel');
}

// ───────────────────────────────────────────── Karussell ─────────────────────────────────────────────

function horse(b: Parts, x: number, y: number, z: number, ry: number, coat: string, saddle: string, mane: string) {
  const cos = Math.cos(ry), sin = Math.sin(ry);
  const P = (lx: number, ly: number, lz: number) => ({ x: x + lx * cos + lz * sin, y: y + ly, z: z - lx * sin + lz * cos });
  b.box(0.42, 0.42, 1.15, coat, { ...P(0, 0, 0), ry });
  b.box(0.3, 0.6, 0.32, coat, { ...P(0, 0.38, 0.55), ry, rx: -0.5 });
  b.box(0.26, 0.26, 0.55, coat, { ...P(0, 0.72, 0.78), ry, rx: 0.35 });
  b.box(0.08, 0.6, 0.3, mane, { ...P(0, 0.48, 0.42), ry, rx: -0.5 });
  b.box(0.05, 0.14, 0.05, coat, { ...P(0.08, 0.92, 0.62), ry });
  b.box(0.05, 0.14, 0.05, coat, { ...P(-0.08, 0.92, 0.62), ry });
  b.box(0.44, 0.1, 0.42, saddle, { ...P(0, 0.24, -0.05), ry });
  b.box(0.46, 0.16, 0.08, '#ffd23f', { ...P(0, 0.12, 0.3), ry });
  // galloping legs: front raised forward, back stretched
  b.box(0.1, 0.55, 0.1, coat, { ...P(0.13, -0.3, 0.55), ry, rx: -1.0 });
  b.box(0.1, 0.55, 0.1, coat, { ...P(-0.13, -0.3, 0.5), ry, rx: -0.7 });
  b.box(0.1, 0.55, 0.1, coat, { ...P(0.13, -0.38, -0.5), ry, rx: 0.6 });
  b.box(0.1, 0.55, 0.1, coat, { ...P(-0.13, -0.38, -0.45), ry, rx: 0.4 });
  b.box(0.08, 0.5, 0.1, mane, { ...P(0, -0.05, -0.68), ry, rx: 0.5 });
}

/** Karussell. Ø ≈ 11 m, height ≈ 7.5 m. Platform + canopy rotate, horses bob. */
export function createCarousel(): THREE.Object3D {
  const base = new Parts();
  base.cyl(5.6, 5.8, 0.3, '#c9b28a', { y: 0.15, seg: 16 });
  base.cyl(5.15, 5.2, 0.35, '#7c4a2a', { y: 0.45, seg: 16 });
  const root = group(base.build());
  const rotor = new THREE.Group();
  root.add(rotor);
  const r = new Parts();
  r.cyl(5.0, 5.0, 0.18, '#a8742f', { y: 0.7, seg: 16 });
  r.cyl(4.6, 4.6, 0.02, '#d9b26b', { y: 0.8, seg: 16 });
  r.cyl(1.1, 1.1, 3.9, '#ffffff', { y: 2.75, seg: 8 });
  r.cyl(1.16, 1.16, 0.3, '#ffd23f', { y: 1.0, seg: 8 });
  r.cyl(1.16, 1.16, 0.3, '#ffd23f', { y: 4.5, seg: 8 });
  for (let k = 0; k < 8; k++) {
    const a = (k / 8) * Math.PI * 2 + Math.PI / 8;
    r.box(0.7, 2.6, 0.04, k % 2 ? '#7fd3ff' : '#ff9ad5', { x: Math.sin(a) * 1.14, y: 2.75, z: Math.cos(a) * 1.14, ry: a });
  }
  stripedCone(r, 5.8, 2.6, 16, ['#ff4f6d', '#fff6e6'], { y: 6.1 });
  stripedBand(r, 5.8, 0.6, 16, ['#ffd23f', '#4ab8ff'], { y: 4.55 });
  r.cyl(5.85, 5.85, 0.12, '#ffd23f', { y: 4.85, seg: 16 });
  r.sphere(0.35, '#ffd23f', { y: 7.55, w: 8, hseg: 6 });
  r.rod(V(0, 7.6, 0), V(0, 8.6, 0), 0.05, '#ffffff');
  r.box(0.7, 0.4, 0.03, '#ff4fa8', { x: 0.36, y: 8.35 });
  const poles: [number, number][] = [];
  for (let k = 0; k < 8; k++) {
    const a = (k / 8) * Math.PI * 2;
    poles.push([Math.sin(a) * 3.6, Math.cos(a) * 3.6]);
    r.rod(V(Math.sin(a) * 3.6, 0.8, Math.cos(a) * 3.6), V(Math.sin(a) * 3.6, 4.4, Math.cos(a) * 3.6), 0.06, '#ffd23f');
  }
  // two carriages on the inner ring
  for (const a of [Math.PI / 8, Math.PI + Math.PI / 8]) {
    const cx = Math.sin(a) * 2.3, cz = Math.cos(a) * 2.3, ry = Math.atan2(Math.cos(a), -Math.sin(a));
    r.box(1.0, 0.6, 1.5, '#ff6fa5', { x: cx, y: 1.15, z: cz, ry });
    r.box(1.04, 0.7, 0.2, '#ffd23f', { x: cx - Math.cos(ry) * 0 - Math.sin(ry) * 0.7, y: 1.5, z: cz - Math.cos(ry) * 0.7, ry });
    r.add(new THREE.TorusGeometry(0.5, 0.08, 5, 10, Math.PI), '#ffd23f', { x: cx + Math.sin(ry) * 0.7, y: 1.4, z: cz + Math.cos(ry) * 0.7, ry: ry + Math.PI / 2, rx: Math.PI / 2 });
  }
  rotor.add(r.build());
  // canopy bulbs
  const lights = new Parts();
  for (let k = 0; k < 32; k++) {
    const a = (k / 32) * Math.PI * 2;
    lights.sphere(0.12, k % 2 ? '#fff2a8' : '#ff8ad8', { x: Math.sin(a) * 5.9, y: 4.3, z: Math.cos(a) * 5.9, w: 4, hseg: 3, mat: 'neon' });
  }
  rotor.add(lights.build({ castShadow: false }));
  const coats = ['#ffffff', '#3b2a20', '#c47a3a', '#9aa0aa', '#ffffff', '#f2e6d0', '#2b2b2b', '#d8a46a'];
  const hg = [new Parts(), new Parts()];
  for (let k = 0; k < 8; k++) {
    const [x, z] = poles[k];
    const a = (k / 8) * Math.PI * 2;
    horse(hg[k % 2], x, 2.0, z, Math.atan2(Math.cos(a), -Math.sin(a)), coats[k], PASTELS[k], k % 3 ? '#ffd23f' : '#2b2b2b');
  }
  const hA = hg[0].build(), hB = hg[1].build();
  rotor.add(hA, hB);
  onTick((dt, t) => {
    rotor.rotation.y += dt * 0.45;
    hA.position.y = Math.sin(t * 2.4) * 0.35;
    hB.position.y = -Math.sin(t * 2.4) * 0.35;
  });
  return sel(root, 'Karussell', 'carousel', 'Attraktion', 'createCarousel');
}

let dropTex: THREE.Texture | null = null;
function dropTexture() {
  if (dropTex) return dropTex;
  const c = document.createElement('canvas');
  c.width = c.height = 32;
  const g = c.getContext('2d')!;
  const grd = g.createRadialGradient(16, 16, 0, 16, 16, 16);
  grd.addColorStop(0, 'rgba(255,255,255,1)');
  grd.addColorStop(0.5, 'rgba(220,245,255,0.9)');
  grd.addColorStop(1, 'rgba(200,235,255,0)');
  g.fillStyle = grd;
  g.fillRect(0, 0, 32, 32);
  dropTex = new THREE.CanvasTexture(c);
  return dropTex;
}

// ───────────────────────────────────────────── Springbrunnen ─────────────────────────────────────────────

/** Springbrunnen. Ø ≈ 9.2 m, height ≈ 4.5 m (+ water jets up to ≈ 6.5 m). Animated water particles. */
export function createFountain(): THREE.Object3D {
  const b = new Parts();
  b.lathe([[4.1, 0], [4.6, 0], [4.65, 0.7], [4.5, 0.78], [4.1, 0.78], [4.05, 0.05]], '#d8d2c4', { seg: 16 });
  b.cyl(4.1, 4.1, 0.1, '#5a8fb0', { y: 0.05, seg: 16 });
  b.cyl(0.8, 0.95, 1.6, '#e2dccf', { y: 0.8, seg: 8 });
  b.lathe([[0, 1.55], [0.8, 1.6], [2.3, 1.95], [2.35, 2.15], [2.15, 2.15], [0.6, 1.85], [0, 1.85]], '#e8e2d6', { seg: 14 });
  b.cyl(0.35, 0.45, 1.2, '#e2dccf', { y: 2.6, seg: 8 });
  b.lathe([[0, 3.15], [0.5, 3.2], [1.25, 3.45], [1.3, 3.6], [1.12, 3.6], [0.4, 3.4], [0, 3.4]], '#e8e2d6', { seg: 12 });
  // golden fish on top, spitting water
  b.sphere(0.45, '#ffc93c', { y: 4.0, sx: 0.8, sz: 1.3, w: 8, hseg: 6 });
  b.cone(0.35, 0.5, '#ffb000', { y: 4.25, z: -0.55, rx: 0.9, seg: 4 });
  b.sphere(0.2, '#ffb000', { y: 3.75, z: 0.2, w: 6, hseg: 4 });
  b.sphere(0.08, '#1b1b1b', { x: 0.2, y: 4.12, z: 0.35, w: 4, hseg: 3 });
  b.sphere(0.08, '#1b1b1b', { x: -0.2, y: 4.12, z: 0.35, w: 4, hseg: 3 });
  // 8 small frog spouts on the rim
  for (let k = 0; k < 8; k++) {
    const a = (k / 8) * Math.PI * 2;
    const x = Math.sin(a) * 4.35, z = Math.cos(a) * 4.35;
    b.sphere(0.32, '#5fbf4a', { x, y: 0.95, z, sy: 0.75, w: 6, hseg: 5 });
    b.sphere(0.1, '#ffffff', { x: x - Math.sin(a) * 0.2 + Math.cos(a) * 0.12, y: 1.17, z: z - Math.cos(a) * 0.2 - Math.sin(a) * 0.12, w: 4, hseg: 3 });
    b.sphere(0.1, '#ffffff', { x: x - Math.sin(a) * 0.2 - Math.cos(a) * 0.12, y: 1.17, z: z - Math.cos(a) * 0.2 + Math.sin(a) * 0.12, w: 4, hseg: 3 });
  }
  // water surfaces
  b.cyl(4.08, 4.08, 0.05, '#4fb3e8', { y: 0.6, seg: 16, mat: 'water' });
  b.cyl(2.15, 2.15, 0.05, '#6cc6f0', { y: 2.05, seg: 14, mat: 'water' });
  b.cyl(1.12, 1.12, 0.05, '#6cc6f0', { y: 3.52, seg: 12, mat: 'water' });
  b.cyl(2.3, 2.5, 1.45, '#9ad8f5', { y: 1.35, seg: 14, open: true, mat: 'water' });
  b.cyl(1.28, 1.4, 1.45, '#9ad8f5', { y: 2.85, seg: 12, open: true, mat: 'water' });
  // underwater lights (glow at night)
  for (let k = 0; k < 6; k++) {
    const a = (k / 6) * Math.PI * 2 + 0.3;
    b.cyl(0.18, 0.2, 0.08, '#9fe8ff', { x: Math.sin(a) * 3.2, y: 0.14, z: Math.cos(a) * 3.2, mat: 'lamp' });
  }
  const root = group(b.build());

  // particle jets
  const G = -6;
  type Jet = { o: THREE.Vector3; v: THREE.Vector3; T: number; n: number };
  const jets: Jet[] = [];
  const addJet = (o: THREE.Vector3, v: THREE.Vector3, floorY: number, n: number) => {
    // time until y reaches floorY: o.y + v.y T + 0.5 G T² = floorY
    const a = 0.5 * G, bq = v.y, c = o.y - floorY;
    const T = (-bq - Math.sqrt(bq * bq - 4 * a * c)) / (2 * a);
    jets.push({ o, v, T, n });
  };
  addJet(V(0, 4.1, 0.6), V(0, 5.2, 0.9), 3.55, 70);
  for (let k = 0; k < 8; k++) {
    const a = (k / 8) * Math.PI * 2;
    addJet(V(Math.sin(a) * 4.05, 1.0, Math.cos(a) * 4.05), V(-Math.sin(a) * 2.1, 4.4, -Math.cos(a) * 2.1), 0.62, 28);
  }
  const total = jets.reduce((s, j) => s + j.n, 0);
  const pos = new Float32Array(total * 3);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.boundingSphere = new THREE.Sphere(V(0, 3, 0), 7);
  const pts = new THREE.Points(geo, new THREE.PointsMaterial({ color: '#e4f7ff', size: 0.34, map: dropTexture(), transparent: true, opacity: 0.95, depthWrite: false, alphaTest: 0.05 }));
  pts.userData.noHighlight = true;
  root.add(pts);
  const phases = Float32Array.from({ length: total }, () => R());
  onTick((_dt, t) => {
    let i = 0;
    for (const j of jets) {
      for (let k = 0; k < j.n; k++, i++) {
        const tau = ((t / j.T + phases[i]) % 1) * j.T;
        const sp = 1 + (phases[i] - 0.5) * 0.08;
        pos[i * 3] = j.o.x + j.v.x * tau * sp;
        pos[i * 3 + 1] = j.o.y + j.v.y * tau + 0.5 * G * tau * tau;
        pos[i * 3 + 2] = j.o.z + j.v.z * tau * sp;
      }
    }
    geo.attributes.position.needsUpdate = true;
  });
  return sel(root, 'Springbrunnen', 'fountain', 'Stadtmobiliar', 'createFountain');
}

// ───────────────────────────────────────────── Quietscheente ─────────────────────────────────────────────

/**
 * Riesen-Quietscheente, ≈ 7 m tall, 6.5 x 8 m. Origin = waterline (part of the body is below y=0):
 * place it at the water surface height. Bobs and turns slowly by itself.
 */
export function createRubberDuck(): THREE.Object3D {
  const Y = '#ffd21f';
  const b = new Parts();
  b.sphere(1, Y, { y: 1.1, sx: 3.1, sy: 2.2, sz: 3.7, w: 16, hseg: 12 });
  b.sphere(1.95, Y, { y: 4.6, z: 1.6, w: 14, hseg: 10 });
  b.cone(1.0, 2.0, Y, { y: 2.9, z: -3.4, rx: -1.05, seg: 8 });
  b.sphere(1, '#ffc400', { x: 2.75, y: 1.7, z: -0.4, sx: 0.45, sy: 1.0, sz: 1.7, w: 10, hseg: 8, rx: 0.15 });
  b.sphere(1, '#ffc400', { x: -2.75, y: 1.7, z: -0.4, sx: 0.45, sy: 1.0, sz: 1.7, w: 10, hseg: 8, rx: 0.15 });
  b.sphere(1, '#ff8a1c', { y: 4.15, z: 3.45, sx: 1.05, sy: 0.38, sz: 1.05, w: 12, hseg: 6 });
  b.sphere(1, '#ff7a10', { y: 3.85, z: 3.3, sx: 0.85, sy: 0.25, sz: 0.85, w: 12, hseg: 6 });
  for (const s of [-1, 1]) {
    b.sphere(0.48, '#ffffff', { x: s * 0.82, y: 5.15, z: 3.05, w: 10, hseg: 8 });
    b.sphere(0.27, '#1b1b25', { x: s * 0.9, y: 5.2, z: 3.42, w: 8, hseg: 6 });
    b.sphere(0.08, '#ffffff', { x: s * 0.86, y: 5.32, z: 3.66, w: 4, hseg: 3 });
    b.sphere(0.32, '#ff9aa8', { x: s * 1.45, y: 4.3, z: 2.75, sz: 0.4, w: 8, hseg: 6, ry: s * 0.6 });
  }
  // a little sailor hat
  b.cyl(1.0, 1.1, 0.5, '#ffffff', { y: 6.55, z: 1.4, rx: -0.15, seg: 12 });
  b.cyl(1.12, 1.12, 0.14, '#2f6bff', { y: 6.45, z: 1.42, rx: -0.15, seg: 12 });
  b.sphere(0.2, '#ff4f6d', { y: 6.85, z: 1.3, w: 6, hseg: 4 });
  const inner = b.build();
  const turn = new THREE.Group();
  turn.add(inner);
  const root = group(turn);
  const ph = R() * 10;
  onTick((dt, t) => {
    inner.position.y = Math.sin(t * 0.9 + ph) * 0.2 - 0.1;
    inner.rotation.z = Math.sin(t * 0.7 + ph) * 0.04;
    inner.rotation.x = Math.sin(t * 0.55 + ph) * 0.035;
    turn.rotation.y += dt * 0.06;
  });
  return sel(root, 'Riesen-Quietscheente', 'rubber_duck', 'Kurioses', 'createRubberDuck');
}

// ───────────────────────────────────────────── Ente ─────────────────────────────────────────────

/** Ente (Stockente), ≈ 0.6 m long. Origin = waterline. Bobs; userData.waddle (0..1) adds walking wiggle on land. */
export function createDuck(): THREE.Object3D {
  const b = new Parts();
  const female = R() < 0.4;
  b.sphere(0.2, female ? '#9b7653' : '#d9d3c7', { y: 0.08, sx: 1, sy: 0.72, sz: 1.45, w: 8, hseg: 6 });
  b.sphere(0.12, female ? '#8a6544' : '#7b5638', { y: 0.12, z: 0.18, w: 8, hseg: 6 });
  b.sphere(0.12, female ? '#9b7653' : '#1f7a3a', { y: 0.33, z: 0.24, w: 8, hseg: 6 });
  if (!female) b.cyl(0.085, 0.09, 0.04, '#ffffff', { y: 0.22, z: 0.22, seg: 8 });
  b.box(0.08, 0.04, 0.14, '#ffb21f', { y: 0.31, z: 0.38 });
  b.sphere(0.025, '#111111', { x: 0.08, y: 0.37, z: 0.3, w: 4, hseg: 3 });
  b.sphere(0.025, '#111111', { x: -0.08, y: 0.37, z: 0.3, w: 4, hseg: 3 });
  b.cone(0.07, 0.16, female ? '#7a5a3d' : '#2b2b2b', { y: 0.16, z: -0.3, rx: -1.1, seg: 4 });
  b.box(0.04, 0.05, 0.16, '#3f63c8', { x: 0.19, y: 0.12, z: -0.04 });
  b.box(0.04, 0.05, 0.16, '#3f63c8', { x: -0.19, y: 0.12, z: -0.04 });
  const inner = b.build();
  const root = group(inner);
  root.userData.waddle = 0;
  const ph = R() * 10;
  onTick((_dt, t) => {
    const w = root.userData.waddle as number;
    inner.position.y = Math.sin(t * 2.1 + ph) * 0.025 + Math.abs(Math.sin(t * 9)) * 0.04 * w;
    inner.rotation.z = Math.sin(t * 9 + ph) * 0.15 * w + Math.sin(t * 1.3 + ph) * 0.05;
    inner.rotation.y = Math.sin(t * 0.8 + ph) * 0.15;
  });
  return sel(root, 'Ente', 'duck', 'Lebewesen', 'createDuck', female ? 'Weibchen' : 'Erpel');
}

// ───────────────────────────────────────────── Schwanen-Tretboot ─────────────────────────────────────────────

/** Tretboot in Schwanform, ≈ 1.8 x 3.2 m, 2.4 m tall. Origin = waterline. Paddle wheel turns. */
export function createSwanBoat(): THREE.Object3D {
  const W = '#fbfbf6';
  const b = new Parts();
  b.sphere(1, W, { y: 0.35, sx: 0.95, sy: 0.55, sz: 1.6, w: 12, hseg: 8 });
  b.box(1.5, 0.2, 2.2, '#3a7bd5', { y: 0.72, z: -0.1 });
  b.box(1.2, 0.3, 0.5, '#2b5da8', { y: 0.95, z: -0.55 });
  b.box(1.2, 0.6, 0.15, '#2b5da8', { y: 1.2, z: -0.85, rx: -0.2 });
  // wings
  b.sphere(1, W, { x: 0.82, y: 0.95, z: -0.4, sx: 0.22, sy: 0.55, sz: 1.2, rx: -0.35, w: 8, hseg: 6 });
  b.sphere(1, W, { x: -0.82, y: 0.95, z: -0.4, sx: 0.22, sy: 0.55, sz: 1.2, rx: -0.35, w: 8, hseg: 6 });
  b.cone(0.45, 0.9, W, { y: 1.05, z: -1.55, rx: -1.0, seg: 6 });
  // S-shaped neck
  const neck = [V(0, 0.7, 1.15), V(0, 1.15, 1.42), V(0, 1.6, 1.38), V(0, 2.0, 1.2), V(0, 2.3, 1.25)];
  neck.forEach((p, i) => b.sphere(0.27 - i * 0.025, W, { x: p.x, y: p.y, z: p.z, w: 8, hseg: 6 }));
  b.sphere(0.28, W, { y: 2.42, z: 1.4, sz: 1.3, w: 8, hseg: 6 });
  b.cone(0.12, 0.4, '#ff8a1c', { y: 2.36, z: 1.85, rx: Math.PI / 2, seg: 6 });
  b.box(0.3, 0.12, 0.12, '#1b1b25', { y: 2.4, z: 1.6 });
  b.sphere(0.05, '#1b1b25', { x: 0.21, y: 2.5, z: 1.5, w: 4, hseg: 3 });
  b.sphere(0.05, '#1b1b25', { x: -0.21, y: 2.5, z: 1.5, w: 4, hseg: 3 });
  const root = group(b.build());
  const wheel = new Parts();
  for (let k = 0; k < 6; k++) wheel.box(0.5, 0.06, 0.7, '#ff4f6d', { rx: (k / 6) * Math.PI, z: 0 });
  wheel.cyl(0.12, 0.12, 0.6, '#ffd23f', { rz: Math.PI / 2 });
  const wg = wheel.build();
  wg.position.set(0, 0.25, -1.7);
  wg.rotation.y = Math.PI / 2;
  root.add(wg);
  const ph = R() * 10;
  onTick((dt, t) => {
    wg.rotation.x += dt * 2.2;
    root.children[0].position.y = Math.sin(t * 1.4 + ph) * 0.05;
    root.children[0].rotation.z = Math.sin(t * 1.1 + ph) * 0.03;
  });
  return sel(root, 'Schwanen-Tretboot', 'swan_boat', 'Wasserfahrzeug', 'createSwanBoat');
}

// ───────────────────────────────────────────── T-Rex ─────────────────────────────────────────────

/** T-Rex-Statue auf Sockel. Footprint ≈ 9 x 8 m, height ≈ 10 m. Head turns, jaw roars. Eyes glow at night. */
export function createTRex(): THREE.Object3D {
  const G = '#4f9a3b', D = '#3c7d2c', BELLY = '#c9d98a', SP = '#ff9f1c';
  const b = new Parts();
  // pedestal
  b.box(9, 1.2, 8, '#a9a49a', { y: 0.6 });
  b.box(9.4, 0.25, 8.4, '#c2bdb2', { y: 1.25 });
  b.box(3.2, 0.7, 0.08, '#c08a2b', { y: 0.65, z: 4.02 });
  const Y0 = 1.35;
  // legs
  for (const s of [-1, 1]) {
    b.sphere(1, G, { x: s * 1.05, y: Y0 + 3.5, z: -0.6, sx: 0.85, sy: 1.5, sz: 1.25, w: 10, hseg: 8 });
    b.beam(V(s * 1.15, Y0 + 2.6, -0.7), V(s * 1.15, Y0 + 0.6, -1.3), 0.65, D);
    b.box(0.85, 0.45, 1.7, D, { x: s * 1.15, y: Y0 + 0.25, z: -0.75 });
    for (const cx of [-0.28, 0, 0.28]) b.cone(0.1, 0.35, '#f4efe0', { x: s * 1.15 + cx, y: Y0 + 0.15, z: 0.2, rx: Math.PI / 2, seg: 4 });
  }
  // torso + chest
  b.sphere(1, G, { y: Y0 + 4.6, z: 0.1, sx: 1.45, sy: 1.6, sz: 2.6, rx: -0.3, w: 12, hseg: 10 });
  b.sphere(1, BELLY, { y: Y0 + 4.5, z: 1.05, sx: 1.05, sy: 1.25, sz: 1.75, rx: -0.4, w: 10, hseg: 8 });
  b.sphere(1, G, { y: Y0 + 5.8, z: 2.0, sx: 1.05, sy: 1.35, sz: 1.2, rx: -0.5, w: 10, hseg: 8 });
  // tiny arms
  for (const s of [-1, 1]) {
    b.beam(V(s * 0.85, Y0 + 5.0, 2.4), V(s * 0.95, Y0 + 4.5, 3.0), 0.22, G);
    b.beam(V(s * 0.95, Y0 + 4.5, 3.0), V(s * 0.9, Y0 + 4.6, 3.45), 0.17, G);
    b.cone(0.06, 0.2, '#f4efe0', { x: s * 0.9, y: Y0 + 4.62, z: 3.6, rx: Math.PI / 2, seg: 4 });
  }
  // tail curving to the side
  const tailCurve = new THREE.CatmullRomCurve3([V(0, Y0 + 4.9, -1.4), V(0.3, Y0 + 4.7, -3.2), V(1.0, Y0 + 4.4, -4.8), V(2.2, Y0 + 4.0, -6.0), V(3.6, Y0 + 3.7, -6.6)]);
  for (let i = 0; i <= 16; i++) {
    const p = tailCurve.getPointAt(i / 16);
    b.sphere(1.15 - i * 0.062, G, { x: p.x, y: p.y, z: p.z, sy: 0.85, w: 10, hseg: 7 });
  }
  // back spikes
  const spikes = [V(0, Y0 + 6.3, 1.6), V(0, Y0 + 6.2, 0.6), V(0, Y0 + 5.9, -0.5), V(0, Y0 + 5.6, -1.6), V(0.3, Y0 + 5.55, -3.2), V(1.0, Y0 + 5.05, -4.8), V(2.2, Y0 + 4.5, -6.0)];
  spikes.forEach((p, i) => b.cone(0.32 - i * 0.025, 0.7 - i * 0.04, SP, { x: p.x, y: p.y, z: p.z, seg: 4 }));
  const root = group(b.build());

  // head pivot
  const head = new THREE.Group();
  head.position.set(0, Y0 + 6.6, 2.6);
  root.add(head);
  const h = new Parts();
  h.box(1.35, 1.1, 1.6, G, { y: 0.35, z: 0.5 });
  h.box(1.15, 0.75, 1.5, G, { y: 0.2, z: 1.8 });
  h.box(1.4, 0.25, 0.7, D, { y: 0.95, z: 0.6 });
  h.box(1.0, 0.2, 0.4, '#3a2a20', { y: 0.45, z: 2.5 });
  for (let k = 0; k < 6; k++) {
    h.cone(0.07, 0.28, '#ffffff', { x: 0.48, y: -0.25, z: 1.0 + k * 0.32, rx: Math.PI, seg: 4 });
    h.cone(0.07, 0.28, '#ffffff', { x: -0.48, y: -0.25, z: 1.0 + k * 0.32, rx: Math.PI, seg: 4 });
  }
  for (const s of [-1, 1]) {
    h.box(0.08, 0.32, 0.4, '#ffe14d', { x: s * 0.66, y: 0.62, z: 0.9, mat: 'lamp' });
    h.box(0.09, 0.2, 0.12, '#111111', { x: s * 0.67, y: 0.62, z: 0.98 });
  }
  head.add(h.build());
  const jaw = new THREE.Group();
  jaw.position.set(0, -0.25, 0.3);
  head.add(jaw);
  const j = new Parts();
  j.box(1.05, 0.35, 2.2, D, { y: -0.15, z: 1.1 });
  j.box(0.85, 0.08, 1.9, '#d65a6a', { y: 0.05, z: 1.1 });
  for (let k = 0; k < 5; k++) {
    j.cone(0.06, 0.22, '#ffffff', { x: 0.42, y: 0.12, z: 0.8 + k * 0.32, seg: 4 });
    j.cone(0.06, 0.22, '#ffffff', { x: -0.42, y: 0.12, z: 0.8 + k * 0.32, seg: 4 });
  }
  jaw.add(j.build());
  onTick((_dt, t) => {
    head.rotation.y = Math.sin(t * 0.35) * 0.35;
    const roar = Math.max(0, Math.sin(t * 0.5)) ** 6;
    head.rotation.x = -roar * 0.25 + Math.sin(t * 0.8) * 0.04;
    jaw.rotation.x = 0.08 + roar * 0.55;
  });
  return sel(root, 'T-Rex-Statue', 'trex_statue', 'Kurioses', 'createTRex');
}

// ───────────────────────────────────────────── Spielplatz ─────────────────────────────────────────────

/** Schaukel mit zwei Sitzen (eins besetzt). Footprint 5.4 x 2.6 m, height 2.8 m. */
export function createSwingSet(): THREE.Object3D {
  const b = new Parts();
  for (const x of [-2.5, 2.5]) {
    b.beam(V(x, 0, -1.2), V(x, 2.75, 0), 0.14, '#e94f4f');
    b.beam(V(x, 0, 1.2), V(x, 2.75, 0), 0.14, '#e94f4f');
    b.beam(V(x, 1.0, -0.76), V(x, 1.0, 0.76), 0.08, '#e94f4f');
  }
  b.cyl(0.09, 0.09, 5.3, '#3a7bd5', { y: 2.78, rz: Math.PI / 2 });
  b.box(5.6, 0.06, 2.8, '#d9c79a', { y: 0.03 });
  const root = group(b.build());
  const swings: THREE.Group[] = [];
  [-1.2, 1.2].forEach((x, i) => {
    const s = new Parts();
    s.rod(V(-0.3, 0, 0), V(-0.3, -2.1, 0), 0.025, '#9aa0a8');
    s.rod(V(0.3, 0, 0), V(0.3, -2.1, 0), 0.025, '#9aa0a8');
    s.box(0.72, 0.07, 0.32, i ? '#ffd23f' : '#4ab8ff', { y: -2.12 });
    if (i === 0) figure(s, { x: 0, y: -2.08, z: -0.1, s: 1.0, shirt: '#ff6fa5', pants: '#3a4a8a', sitting: true, hair: '#f2c94c' });
    const g = s.build();
    const pivot = new THREE.Group();
    pivot.position.set(x, 2.75, 0);
    pivot.add(g);
    root.add(pivot);
    swings.push(pivot);
  });
  onTick((_dt, t) => {
    swings[0].rotation.x = Math.sin(t * 2.1) * 0.65;
    swings[1].rotation.x = Math.sin(t * 2.1 + 2) * 0.12;
  });
  return sel(root, 'Schaukel', 'swing_set', 'Attraktion', 'createSwingSet');
}

/** Rutsche mit Kletterturm. Footprint 2 x 5.6 m, height 3.8 m. Slide runs towards +Z. */
export function createSlide(): THREE.Object3D {
  const b = new Parts();
  const top = 2.2;
  for (const [x, z] of [[-0.6, -1.6], [0.6, -1.6], [-0.6, -0.4], [0.6, -0.4]]) b.box(0.14, 3.4, 0.14, '#3a7bd5', { x, y: 1.7, z });
  b.box(1.35, 0.14, 1.35, '#c99a5b', { y: top, z: -1.0 });
  b.add(new THREE.ConeGeometry(1.05, 0.8, 4), '#e94f4f', { y: 3.75, z: -1.0, ry: Math.PI / 4 });
  // railings
  b.box(1.3, 0.08, 0.06, '#ffd23f', { y: top + 0.7, z: -1.62 });
  b.box(0.06, 0.08, 1.3, '#ffd23f', { x: -0.62, y: top + 0.7, z: -1.0 });
  b.box(0.06, 0.08, 1.3, '#ffd23f', { x: 0.62, y: top + 0.7, z: -1.0 });
  // ladder at the back
  b.beam(V(-0.4, 0, -2.6), V(-0.4, top, -1.65), 0.08, '#ffd23f');
  b.beam(V(0.4, 0, -2.6), V(0.4, top, -1.65), 0.08, '#ffd23f');
  for (let k = 1; k < 6; k++) {
    const f = k / 6;
    b.box(0.8, 0.05, 0.06, '#ffd23f', { y: top * f, z: -2.6 + 0.95 * f });
  }
  // chute
  const a = V(0, top + 0.05, -0.35), e = V(0, 0.35, 2.7);
  const len = a.distanceTo(e);
  const ang = Math.atan2(a.y - e.y, e.z - a.z);
  const mid = a.clone().add(e).multiplyScalar(0.5);
  b.box(0.9, 0.08, len, '#ffd23f', { x: 0, y: mid.y, z: mid.z, rx: ang });
  b.box(0.08, 0.3, len, '#ff9f1c', { x: 0.45, y: mid.y + 0.12, z: mid.z, rx: ang });
  b.box(0.08, 0.3, len, '#ff9f1c', { x: -0.45, y: mid.y + 0.12, z: mid.z, rx: ang });
  b.box(0.9, 0.08, 0.6, '#ffd23f', { y: 0.32, z: 3.0 });
  b.box(2.2, 0.05, 6.0, '#d9c79a', { y: 0.025, z: 0.2 });
  return sel(group(b.build()), 'Rutsche', 'slide', 'Attraktion', 'createSlide');
}

/** Wippe. Footprint 4.4 x 0.8 m, animated. */
export function createSeesaw(): THREE.Object3D {
  const b = new Parts();
  b.add(new THREE.CylinderGeometry(0.25, 0.25, 0.7, 3), '#e94f4f', { y: 0.3, rz: Math.PI / 2, ry: Math.PI / 2, sx: 1.4 });
  b.box(4.6, 0.04, 1.2, '#d9c79a', { y: 0.02 });
  const root = group(b.build());
  const p = new Parts();
  p.box(4.2, 0.1, 0.35, '#3a7bd5');
  for (const s of [-1, 1]) {
    p.box(0.5, 0.1, 0.45, '#ffd23f', { x: s * 1.8, y: 0.08 });
    p.rod(V(s * 1.45, 0.05, -0.15), V(s * 1.45, 0.5, -0.15), 0.03, '#9aa0a8');
    p.rod(V(s * 1.45, 0.05, 0.15), V(s * 1.45, 0.5, 0.15), 0.03, '#9aa0a8');
    p.rod(V(s * 1.45, 0.5, -0.2), V(s * 1.45, 0.5, 0.2), 0.03, '#9aa0a8');
  }
  figure(p, { x: 1.8, y: 0.13, z: 0, ry: -Math.PI / 2, s: 0.95, shirt: '#6ee7a8', pants: '#2b2f44', sitting: true, hair: '#2b1a10' });
  figure(p, { x: -1.8, y: 0.13, z: 0, ry: Math.PI / 2, s: 0.9, shirt: '#ff9f43', pants: '#5b3a8a', sitting: true, hair: '#c0582b' });
  const plank = p.build();
  plank.position.y = 0.6;
  root.add(plank);
  onTick((_dt, t) => (plank.rotation.z = Math.sin(t * 1.7) * 0.24));
  return sel(root, 'Wippe', 'seesaw', 'Attraktion', 'createSeesaw');
}

// ───────────────────────────────────────────── Riesenschach ─────────────────────────────────────────────

export const CHESS_SQUARE = 1.2;
export type ChessKind = 'king' | 'queen' | 'rook' | 'bishop' | 'knight' | 'pawn';
const CHESS_DE: Record<ChessKind, string> = { king: 'König', queen: 'Dame', rook: 'Turm', bishop: 'Läufer', knight: 'Springer', pawn: 'Bauer' };

/** Riesenschach-Brett, 10.4 x 10.4 m, 0.25 m high. File a..h along +X, rank 1 at +Z (white side). */
export function createChessBoard(): THREE.Object3D {
  const b = new Parts();
  b.box(10.4, 0.2, 10.4, '#6b4a2f', { y: 0.1 });
  for (let f = 0; f < 8; f++) {
    for (let r = 0; r < 8; r++) {
      const dark = (f + r) % 2 === 0;
      b.box(CHESS_SQUARE, 0.05, CHESS_SQUARE, dark ? '#7a8c5a' : '#f1ead8', { x: (f - 3.5) * CHESS_SQUARE, y: 0.225, z: (3.5 - r) * CHESS_SQUARE });
    }
  }
  return sel(group(b.build({ castShadow: false })), 'Riesenschach-Brett', 'chess_board', 'Attraktion', 'createChessBoard');
}

/** Schachfigur, 0.95–1.75 m tall, base Ø ≈ 0.85 m. Knight faces +Z. */
export function createChessPiece(kind: ChessKind, white: boolean): THREE.Object3D {
  const c = white ? '#f4eee0' : '#2b2b36';
  const acc = white ? '#e0b84a' : '#c23b4f';
  const b = new Parts();
  const base: [number, number][] = [[0, 0], [0.42, 0], [0.42, 0.1], [0.34, 0.16], [0.36, 0.22], [0.24, 0.3]];
  switch (kind) {
    case 'pawn':
      b.lathe([...base, [0.16, 0.55], [0.26, 0.6], [0.14, 0.65], [0.0, 0.65]], c, { seg: 12 });
      b.sphere(0.24, c, { y: 0.82, w: 10, hseg: 8 });
      break;
    case 'rook':
      b.lathe([...base, [0.24, 0.85], [0.33, 0.9], [0.33, 1.05], [0, 1.05]], c, { seg: 12 });
      for (let k = 0; k < 6; k++) {
        const a = (k / 6) * Math.PI * 2;
        b.box(0.14, 0.18, 0.12, c, { x: Math.sin(a) * 0.27, y: 1.13, z: Math.cos(a) * 0.27, ry: a });
      }
      b.cyl(0.25, 0.25, 0.04, acc, { y: 0.88 });
      break;
    case 'bishop':
      b.lathe([...base, [0.15, 0.75], [0.27, 0.8], [0.15, 0.86], [0, 0.86]], c, { seg: 12 });
      b.sphere(0.24, c, { y: 1.1, sy: 1.45, w: 10, hseg: 8 });
      b.box(0.04, 0.22, 0.3, acc, { y: 1.18, z: 0.1, rx: 0.5 });
      b.sphere(0.08, acc, { y: 1.48, w: 6, hseg: 4 });
      break;
    case 'queen':
      b.lathe([...base, [0.16, 0.95], [0.3, 1.0], [0.18, 1.06], [0.3, 1.3], [0, 1.25]], c, { seg: 14 });
      for (let k = 0; k < 8; k++) {
        const a = (k / 8) * Math.PI * 2;
        b.sphere(0.06, acc, { x: Math.sin(a) * 0.29, y: 1.33, z: Math.cos(a) * 0.29, w: 5, hseg: 4 });
      }
      b.sphere(0.12, acc, { y: 1.42, w: 8, hseg: 6 });
      break;
    case 'king':
      b.lathe([...base, [0.17, 1.05], [0.32, 1.1], [0.2, 1.16], [0.3, 1.38], [0, 1.4]], c, { seg: 14 });
      b.box(0.1, 0.4, 0.1, acc, { y: 1.6 });
      b.box(0.3, 0.1, 0.1, acc, { y: 1.64 });
      break;
    case 'knight': {
      b.lathe([...base, [0.26, 0.4], [0, 0.4]], c, { seg: 12 });
      b.box(0.36, 0.7, 0.45, c, { y: 0.7, z: -0.05, rx: -0.25 });
      b.box(0.34, 0.32, 0.65, c, { y: 1.02, z: 0.18, rx: 0.35 });
      b.box(0.08, 0.55, 0.22, acc, { y: 0.85, z: -0.28, rx: -0.3 });
      b.cone(0.07, 0.18, c, { x: 0.1, y: 1.28, z: -0.02, seg: 4 });
      b.cone(0.07, 0.18, c, { x: -0.1, y: 1.28, z: -0.02, seg: 4 });
      b.sphere(0.04, white ? '#111' : '#ff4f6d', { x: 0.17, y: 1.1, z: 0.22, w: 4, hseg: 3 });
      b.sphere(0.04, white ? '#111' : '#ff4f6d', { x: -0.17, y: 1.1, z: 0.22, w: 4, hseg: 3 });
      break;
    }
  }
  return sel(group(b.build()), 'Schachfigur', 'chess_piece', 'Attraktion', 'createChessPiece', `${white ? 'Weißer' : 'Schwarzer'} ${CHESS_DE[kind]}`.replace('Weißer Dame', 'Weiße Dame').replace('Schwarzer Dame', 'Schwarze Dame'));
}

/**
 * Mid-game position (Italian opening, both castled) + two captured pieces beside the board.
 * Call AFTER the board has its final world position/rotation and is in the scene graph
 * (or at least has updated matrices); returns pieces in world coordinates — add them to the scene.
 */
export function placeChessGame(board: THREE.Object3D): THREE.Object3D[] {
  board.updateWorldMatrix(true, false);
  const q = board.getWorldQuaternion(new THREE.Quaternion());
  const flip = new THREE.Quaternion().setFromAxisAngle(V(0, 1, 0), Math.PI);
  const pieces: THREE.Object3D[] = [];
  const put = (kind: ChessKind, white: boolean, sq: string) => {
    const f = sq.charCodeAt(0) - 97, r = Number(sq[1]) - 1;
    const p = createChessPiece(kind, white);
    p.position.copy(board.localToWorld(V((f - 3.5) * CHESS_SQUARE, 0.25, (3.5 - r) * CHESS_SQUARE)));
    p.quaternion.copy(q);
    if (white) p.quaternion.multiply(flip);
    pieces.push(p);
  };
  const W: [ChessKind, string][] = [['king', 'g1'], ['queen', 'e2'], ['rook', 'f1'], ['rook', 'a1'], ['bishop', 'c4'], ['bishop', 'g5'], ['knight', 'f3'], ['knight', 'c3'],
    ['pawn', 'a2'], ['pawn', 'b2'], ['pawn', 'c2'], ['pawn', 'd3'], ['pawn', 'e4'], ['pawn', 'f2'], ['pawn', 'g2'], ['pawn', 'h3']];
  const B: [ChessKind, string][] = [['king', 'g8'], ['queen', 'e7'], ['rook', 'f8'], ['rook', 'a8'], ['bishop', 'c5'], ['bishop', 'e6'], ['knight', 'f6'], ['knight', 'c6'],
    ['pawn', 'a6'], ['pawn', 'b7'], ['pawn', 'c7'], ['pawn', 'd6'], ['pawn', 'e5'], ['pawn', 'f7'], ['pawn', 'g7'], ['pawn', 'h6']];
  W.forEach(([k, s]) => put(k, true, s));
  B.forEach(([k, s]) => put(k, false, s));
  // captured pieces beside the board: a toppled white pawn and a standing black pawn
  const top = createChessPiece('pawn', true);
  top.position.copy(board.localToWorld(V(6.0, 0.42, 2.2)));
  top.quaternion.copy(q).multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0.6, Math.PI / 2)));
  pieces.push(top);
  const blk = createChessPiece('pawn', false);
  blk.position.copy(board.localToWorld(V(-6.0, 0, -2.0)));
  blk.quaternion.copy(q);
  pieces.push(blk);
  return pieces;
}

// ───────────────────────────────────────────── Eisdiele ─────────────────────────────────────────────

/** Eisdiele mit Riesen-Eistüte auf dem Dach. Footprint 4 x 4.4 m (incl. awning), height ≈ 8 m. Counter faces +Z. */
export function createIceCreamKiosk(): THREE.Object3D {
  const b = new Parts();
  b.box(3.6, 2.4, 3.2, '#9be3c9', { y: 1.2 });
  b.box(3.7, 0.5, 3.3, '#ff8fb8', { y: 0.25 });
  b.box(2.5, 1.05, 0.06, '#2b3550', { y: 1.72, z: 1.6 });
  b.box(2.9, 0.1, 0.55, '#ffffff', { y: 1.17, z: 1.82 });
  for (let k = 0; k < 6; k++) b.box(0.52, 0.06, 0.9, k % 2 ? '#ffffff' : '#ff6fa5', { x: -1.3 + k * 0.52, y: 2.42, z: 1.95, rx: 0.42 });
  b.box(4.0, 0.25, 3.6, '#ff6fa5', { y: 2.53 });
  // ice cream tubs inside the window
  ['#ffe0ea', '#7a4a2a', '#b9f0c8', '#fff3b0'].forEach((c, k) => b.cyl(0.18, 0.18, 0.12, c, { x: -0.75 + k * 0.5, y: 1.28, z: 1.85, seg: 8 }));
  // little stools + menu board
  for (const x of [-1.3, 1.3]) {
    b.cyl(0.25, 0.25, 0.08, '#ff6fa5', { x, y: 0.7, z: 2.55, seg: 8 });
    b.cyl(0.05, 0.05, 0.7, '#9aa0a8', { x, y: 0.35, z: 2.55, seg: 5 });
  }
  b.box(0.06, 1.0, 0.7, '#2b3550', { x: 1.86, y: 1.6, z: 0.3 });
  const root = group(b.build());
  const sign = textPlane('GELATO', 2.8, 0.55, '#ffffff', '#ff4f8b', { border: '#9be3c9' });
  sign.position.set(0, 3.0, 1.81);
  root.add(sign);
  // rotating giant cone
  const c = new Parts();
  c.cone(0.95, 2.4, '#d9a35b', { y: 1.2, rx: Math.PI, seg: 12 });
  for (let k = 0; k < 4; k++) c.torus(0.25 + k * 0.17, 0.03, '#b07a3a', { y: 0.45 + k * 0.48, rx: Math.PI / 2, rs: 3, ts: 12 });
  c.sphere(0.95, '#ff9ec1', { y: 2.75, w: 12, hseg: 9 });
  c.sphere(0.82, '#fff3d6', { y: 3.75, w: 12, hseg: 9 });
  c.sphere(0.65, '#7a4a2a', { y: 4.6, w: 12, hseg: 9 });
  for (let k = 0; k < 7; k++) {
    const a = (k / 7) * Math.PI * 2;
    c.sphere(0.16, '#ff9ec1', { x: Math.sin(a) * 0.86, y: 2.35 - (k % 3) * 0.12, z: Math.cos(a) * 0.86, sy: 1.5, w: 6, hseg: 4 });
  }
  c.sphere(0.22, '#e8112d', { y: 5.35, w: 8, hseg: 6 });
  c.rod(V(0, 5.5, 0), V(0.15, 5.85, -0.05), 0.025, '#3c7d2c');
  const sprinkleC = ['#ff4f6d', '#4ab8ff', '#ffd23f', '#6ee7a8', '#b48cff', '#ffffff'];
  const sprinkle = (cy: number, r: number, n: number) => {
    for (let k = 0; k < n; k++) {
      const th = R() * Math.PI * 2, ph = R() * 1.2;
      c.box(0.05, 0.05, 0.2, sprinkleC[k % sprinkleC.length], {
        x: Math.sin(ph) * Math.cos(th) * r, y: cy + Math.cos(ph) * r, z: Math.sin(ph) * Math.sin(th) * r, rx: R() * 3, ry: R() * 3,
      });
    }
  };
  sprinkle(3.75, 0.8, 18);
  sprinkle(4.6, 0.64, 14);
  const cone = c.build();
  cone.position.y = 2.65;
  root.add(cone);
  onTick((dt) => (cone.rotation.y += dt * 0.5));
  return sel(root, 'Eisdiele', 'ice_cream_kiosk', 'Gebäude', 'createIceCreamKiosk');
}

// ───────────────────────────────────────────── Bank / Picknick ─────────────────────────────────────────────

/** Parkbank, 2.0 x 0.7 m, 0.95 m tall. Sitting side faces +Z. */
export function createBench(): THREE.Object3D {
  const b = new Parts();
  for (let k = 0; k < 3; k++) b.box(1.9, 0.05, 0.13, '#b8743a', { y: 0.45, z: 0.15 - k * 0.15 });
  b.box(1.9, 0.12, 0.04, '#b8743a', { y: 0.68, z: -0.2, rx: -0.15 });
  b.box(1.9, 0.12, 0.04, '#b8743a', { y: 0.85, z: -0.23, rx: -0.15 });
  for (const x of [-0.82, 0.82]) {
    b.box(0.07, 0.45, 0.07, '#2d4a3a', { x, y: 0.22, z: 0.2 });
    b.box(0.07, 0.9, 0.07, '#2d4a3a', { x, y: 0.45, z: -0.2, rx: -0.12 });
    b.box(0.07, 0.06, 0.5, '#2d4a3a', { x, y: 0.42, z: 0 });
    b.box(0.07, 0.05, 0.45, '#2d4a3a', { x, y: 0.62, z: 0.02 });
  }
  return sel(group(b.build()), 'Parkbank', 'bench', 'Stadtmobiliar', 'createBench');
}

/** Picknickdecke mit Korb, Essen – und einer Ameisenstraße. 2.6 x 2.0 m. */
export function createPicnicBlanket(): THREE.Object3D {
  const b = new Parts();
  b.box(2.4, 0.02, 1.8, '#e8414f', { y: 0.01 });
  for (let i = 0; i < 8; i++) for (let j = 0; j < 6; j++) if ((i + j) % 2 === 0) b.box(0.3, 0.022, 0.3, '#ffffff', { x: -1.05 + i * 0.3, y: 0.012, z: -0.75 + j * 0.3 });
  // basket
  b.box(0.6, 0.35, 0.4, '#b9874a', { x: -0.7, y: 0.2, z: -0.45 });
  b.box(0.62, 0.05, 0.42, '#8f6430', { x: -0.7, y: 0.4, z: -0.45 });
  b.add(new THREE.TorusGeometry(0.25, 0.025, 4, 10, Math.PI), '#8f6430', { x: -0.7, y: 0.42, z: -0.45 });
  b.box(0.25, 0.08, 0.3, '#ffffff', { x: -0.55, y: 0.45, z: -0.4, rz: 0.3 });
  // plates with food
  for (const [x, z] of [[0.2, 0.35], [0.75, -0.2]]) {
    b.cyl(0.2, 0.18, 0.03, '#ffffff', { x, y: 0.04, z, seg: 10 });
    b.box(0.2, 0.04, 0.2, '#e8c37a', { x, y: 0.075, z });
    b.box(0.21, 0.025, 0.21, '#6ccf5a', { x, y: 0.105, z });
    b.box(0.2, 0.04, 0.2, '#e8c37a', { x, y: 0.135, z });
  }
  // watermelon slice
  b.add(new THREE.CylinderGeometry(0.3, 0.3, 0.06, 8, 1, false, 0, Math.PI * 0.4), '#3c9a3c', { x: 0.1, y: 0.05, z: -0.35, rx: Math.PI / 2 });
  b.add(new THREE.CylinderGeometry(0.27, 0.27, 0.065, 8, 1, false, 0, Math.PI * 0.4), '#ff4f5e', { x: 0.1, y: 0.05, z: -0.35, rx: Math.PI / 2 });
  // bottle, cups, apples
  b.cyl(0.07, 0.07, 0.3, '#2f8f5a', { x: 0.95, y: 0.16, z: 0.45, seg: 8, mat: 'glass' });
  b.cyl(0.03, 0.04, 0.12, '#2f8f5a', { x: 0.95, y: 0.37, z: 0.45, seg: 6, mat: 'glass' });
  b.cyl(0.05, 0.04, 0.1, '#4ab8ff', { x: 0.6, y: 0.06, z: 0.6, seg: 8 });
  b.cyl(0.05, 0.04, 0.1, '#ffd23f', { x: 0.45, y: 0.06, z: 0.68, seg: 8 });
  b.sphere(0.07, '#d81e2c', { x: -0.2, y: 0.07, z: 0.5, w: 6, hseg: 5 });
  b.sphere(0.07, '#8fd14f', { x: -0.05, y: 0.07, z: 0.62, w: 6, hseg: 5 });
  const root = group(b.build({ castShadow: false }));
  // ant trail marching towards the basket
  const ants = new Parts();
  const N = 12;
  for (let k = 0; k < N; k++) {
    ants.sphere(0.018, '#151515', { x: k * 0.11, y: 0.025, z: 0, sx: 2, w: 4, hseg: 3 });
    if (k % 3 === 0) ants.box(0.035, 0.012, 0.035, '#ffffff', { x: k * 0.11, y: 0.045, z: 0 });
  }
  const ag = ants.build({ castShadow: false });
  const antPath = new THREE.Group();
  antPath.position.set(-0.4, 0.02, -0.45);
  antPath.add(ag);
  root.add(antPath);
  onTick((_dt, t) => {
    ag.position.x = 1.3 - ((t * 0.12) % 1.4);
    ag.position.z = Math.sin(t * 3) * 0.01;
    antPath.rotation.y = 0.5;
  });
  return sel(root, 'Picknickdecke', 'picnic', 'Stadtmobiliar', 'createPicnicBlanket');
}

// ───────────────────────────────────────────── Musikpavillon ─────────────────────────────────────────────

/** Musikpavillon (achteckig) mit Blaskapelle und schwebenden Noten. Ø ≈ 9.2 m, height ≈ 8.5 m. Stairs face +Z. */
export function createBandstand(): THREE.Object3D {
  const b = new Parts();
  b.cyl(4.2, 4.4, 0.95, '#f4efe4', { y: 0.47, seg: 8, ry: Math.PI / 8 });
  b.cyl(4.25, 4.25, 0.12, '#3d8c5a', { y: 0.98, seg: 8, ry: Math.PI / 8 });
  for (let s = 0; s < 3; s++) b.box(2.4, 0.3, 0.45, '#e6dfd0', { y: 0.15 + s * 0.3, z: 4.9 - s * 0.45 });
  const posts: THREE.Vector3[] = [];
  for (let k = 0; k < 8; k++) {
    const a = (k / 8) * Math.PI * 2 + Math.PI / 8;
    posts.push(V(Math.sin(a) * 3.85, 0, Math.cos(a) * 3.85));
  }
  posts.forEach((p) => b.cyl(0.12, 0.14, 3.2, '#ffffff', { x: p.x, y: 2.6, z: p.z, seg: 6 }));
  posts.forEach((p, k) => {
    const q = posts[(k + 1) % 8];
    const mid = p.clone().add(q).multiplyScalar(0.5);
    if (mid.z > 3) return; // keep the front open
    b.beam(V(p.x, 2.0, p.z), V(q.x, 2.0, q.z), 0.08, '#ffffff');
    for (let f = 1; f < 6; f++) {
      const v = p.clone().lerp(q, f / 6);
      b.box(0.05, 0.9, 0.05, '#ffffff', { x: v.x, y: 1.5, z: v.z });
    }
  });
  posts.forEach((p, k) => {
    const q = posts[(k + 1) % 8];
    b.beam(V(p.x, 4.15, p.z), V(q.x, 4.15, q.z), 0.25, '#3d8c5a');
  });
  stripedCone(b, 4.9, 2.8, 8, ['#e94f4f', '#fff6e6'], { y: 5.6, ry: Math.PI / 8 });
  b.cyl(0.08, 0.08, 1.2, '#ffd23f', { y: 7.4, seg: 6 });
  b.sphere(0.25, '#ffd23f', { y: 8.0, w: 8, hseg: 6 });
  b.box(0.8, 0.45, 0.03, '#4ab8ff', { x: 0.42, y: 7.6 });
  // music stands
  for (const x of [-1.6, 0, 1.6]) {
    b.rod(V(x, 1.04, 0.4), V(x, 2.0, 0.4), 0.025, '#2b2b2b');
    b.box(0.5, 0.35, 0.03, '#2b2b2b', { x, y: 2.1, z: 0.45, rx: -0.4 });
  }
  const root = group(b.build());
  const bulbs = new Parts();
  for (let k = 0; k < 24; k++) {
    const a = (k / 24) * Math.PI * 2;
    bulbs.sphere(0.11, k % 2 ? '#fff2a8' : '#ff8ad8', { x: Math.sin(a) * 4.75, y: 4.1, z: Math.cos(a) * 4.75, w: 4, hseg: 3, mat: 'neon' });
  }
  root.add(bulbs.build({ castShadow: false }));
  // brass band
  const band = new Parts();
  const uni = '#c8283c';
  [-1.6, 0, 1.6].forEach((x, i) => {
    figure(band, { x, y: 1.04, z: -0.3, s: 1.7, shirt: uni, pants: '#1f2240', ry: 0, hair: '#2b1a10' });
    band.cyl(0.17, 0.17, 0.3, '#1b1b25', { x, y: 1.04 + 2.0, z: -0.33, seg: 8 });
    band.box(0.35, 0.05, 0.1, '#ffd23f', { x, y: 1.04 + 1.88, z: -0.12 });
    if (i === 0) {
      band.torus(0.32, 0.07, '#ffcc33', { x: x + 0.1, y: 1.04 + 1.15, z: 0.0, ry: Math.PI / 2, rs: 5, ts: 12 });
      band.cone(0.38, 0.5, '#ffcc33', { x: x + 0.1, y: 1.04 + 1.9, z: 0.05, seg: 10 });
    } else if (i === 1) {
      band.cyl(0.42, 0.42, 0.45, '#ffffff', { x, y: 1.04 + 0.85, z: 0.15, rx: Math.PI / 2, seg: 12 });
      band.cyl(0.43, 0.43, 0.1, '#c8283c', { x, y: 1.04 + 0.85, z: 0.15, rx: Math.PI / 2, seg: 12 });
    } else {
      band.cyl(0.03, 0.05, 0.55, '#ffcc33', { x, y: 1.04 + 1.35, z: 0.4, rx: Math.PI / 2, seg: 6 });
      band.cone(0.1, 0.18, '#ffcc33', { x, y: 1.04 + 1.35, z: 0.72, rx: -Math.PI / 2, seg: 8 });
    }
  });
  const bandG = band.build();
  root.add(bandG);
  // floating music notes
  const noteCols = ['#ff4fa8', '#4ab8ff', '#ffd23f', '#6ee7a8'];
  const notes = noteCols.map((col) => {
    const n = new Parts();
    n.sphere(0.13, col, { sx: 1.3, sz: 0.6, w: 6, hseg: 4, mat: 'neon' });
    n.box(0.04, 0.45, 0.04, col, { x: 0.14, y: 0.22, mat: 'neon' });
    n.box(0.18, 0.06, 0.04, col, { x: 0.22, y: 0.42, rz: -0.4, mat: 'neon' });
    const g = n.build({ castShadow: false });
    root.add(g);
    return g;
  });
  onTick((_dt, t) => {
    bandG.position.y = Math.abs(Math.sin(t * 4.2)) * 0.06;
    notes.forEach((g, k) => {
      const u = (t * 0.22 + k / notes.length) % 1;
      g.position.set(Math.sin(k * 2.1 + u * 4) * (1.0 + u), 3.1 + u * 4.5, 0.4 + Math.cos(k * 1.7 + u * 3) * (0.8 + u));
      g.scale.setScalar(Math.sin(u * Math.PI) * 1.2 + 0.01);
      g.rotation.z = Math.sin(t * 3 + k) * 0.3;
    });
  });
  return sel(root, 'Musikpavillon', 'bandstand', 'Gebäude', 'createBandstand');
}

// ───────────────────────────────────────────── Heckenfiguren / Blumenbeet ─────────────────────────────────────────────

/** Heckenfigur (Elefant / Giraffe / Hase) auf Pflanzkasten. Footprint 3.4 x 2.4 m, height 3–5 m. Faces +Z. */
export function createTopiary(kind: 'elephant' | 'giraffe' | 'rabbit'): THREE.Object3D {
  const H1 = '#2f8a3a', H2 = '#3fa046', H3 = '#26732f';
  const b = new Parts();
  b.box(3.4, 0.6, 2.4, '#c9c1b2', { y: 0.3 });
  b.box(3.1, 0.06, 2.1, '#5a3f2a', { y: 0.62 });
  const leaf = (r: number, x: number, y: number, z: number, o: { sx?: number; sy?: number; sz?: number; c?: string } = {}) =>
    b.ico(r, o.c ?? (R() < 0.5 ? H1 : H2), { x, y, z, sx: o.sx, sy: o.sy, sz: o.sz, detail: 1 });
  const base = 0.62;
  if (kind === 'elephant') {
    leaf(1, 0, base + 1.75, -0.2, { sx: 1.1, sy: 0.9, sz: 1.35 });
    leaf(0.72, 0, base + 2.25, 1.2);
    leaf(0.55, 0.72, base + 2.3, 0.95, { sx: 0.3, sy: 1.1, sz: 0.9, c: H3 });
    leaf(0.55, -0.72, base + 2.3, 0.95, { sx: 0.3, sy: 1.1, sz: 0.9, c: H3 });
    [[0, 2.0, 1.75, 0.26], [0, 1.6, 2.0, 0.22], [0, 1.25, 2.25, 0.19], [0, 1.15, 2.55, 0.17], [0, 1.35, 2.8, 0.16]].forEach(([x, y, z, r]) => leaf(r, x, base + y, z, { c: H2 }));
    for (const [x, z] of [[-0.55, 0.55], [0.55, 0.55], [-0.55, -0.85], [0.55, -0.85]]) b.cyl(0.3, 0.33, 1.2, H1, { x, y: base + 0.6, z, seg: 7 });
    b.cone(0.12, 0.5, H3, { y: base + 1.5, z: -1.55, rx: -2.3, seg: 5 });
    b.sphere(0.07, '#111', { x: 0.42, y: base + 2.45, z: 1.65, w: 4, hseg: 3 });
    b.sphere(0.07, '#111', { x: -0.42, y: base + 2.45, z: 1.65, w: 4, hseg: 3 });
  } else if (kind === 'giraffe') {
    leaf(0.85, 0, base + 2.0, -0.25, { sx: 0.8, sy: 0.75, sz: 1.3 });
    for (const [x, z] of [[-0.35, 0.45], [0.35, 0.45], [-0.35, -0.85], [0.35, -0.85]]) b.cyl(0.16, 0.18, 1.6, H1, { x, y: base + 0.8, z, seg: 6 });
    for (let k = 0; k < 6; k++) leaf(0.36 - k * 0.015, 0, base + 2.4 + k * 0.42, 0.45 + k * 0.14, { c: k % 2 ? H1 : H2 });
    leaf(0.45, 0, base + 4.75, 1.35, { sz: 1.5, c: H2 });
    b.cyl(0.05, 0.06, 0.35, H3, { x: 0.15, y: base + 5.2, z: 1.1, seg: 5 });
    b.cyl(0.05, 0.06, 0.35, H3, { x: -0.15, y: base + 5.2, z: 1.1, seg: 5 });
    b.sphere(0.06, '#111', { x: 0.3, y: base + 4.9, z: 1.55, w: 4, hseg: 3 });
    b.sphere(0.06, '#111', { x: -0.3, y: base + 4.9, z: 1.55, w: 4, hseg: 3 });
  } else {
    leaf(0.95, 0, base + 1.0, -0.2, { sx: 1, sy: 1.05, sz: 1.2 });
    leaf(0.6, 0, base + 2.1, 0.45);
    leaf(0.25, 0.25, base + 3.0, 0.35, { sx: 0.7, sy: 2.6, sz: 0.5, c: H3 });
    leaf(0.25, -0.25, base + 3.0, 0.35, { sx: 0.7, sy: 2.6, sz: 0.5, c: H3 });
    b.ico(0.32, '#f4f4ee', { y: base + 0.8, z: -1.35, detail: 1 });
    leaf(0.35, 0.5, base + 0.35, 0.6, { sz: 1.3 });
    leaf(0.35, -0.5, base + 0.35, 0.6, { sz: 1.3 });
    b.sphere(0.06, '#111', { x: 0.28, y: base + 2.25, z: 0.95, w: 4, hseg: 3 });
    b.sphere(0.06, '#111', { x: -0.28, y: base + 2.25, z: 0.95, w: 4, hseg: 3 });
    b.sphere(0.08, '#ff8fb1', { y: base + 2.05, z: 1.03, w: 4, hseg: 3 });
  }
  const de = { elephant: 'Elefant', giraffe: 'Giraffe', rabbit: 'Hase' }[kind];
  return sel(group(b.build()), 'Heckenfigur', 'topiary', 'Natur', 'createTopiary', de);
}

/** Rundes Blumenbeet, Ø ≈ 4.2 m, with two buzzing bees. */
export function createFlowerBed(): THREE.Object3D {
  const b = new Parts();
  b.torus(1.95, 0.22, '#b9b2a4', { y: 0.18, rx: Math.PI / 2, rs: 4, ts: 14 });
  b.cyl(1.9, 1.95, 0.32, '#5a3f2a', { y: 0.16, seg: 14 });
  const ring = (r: number, n: number, colors: string[], h: number) => {
    for (let k = 0; k < n; k++) {
      const a = (k / n) * Math.PI * 2 + r;
      const x = Math.sin(a) * r, z = Math.cos(a) * r;
      const hh = h + R() * 0.15;
      b.box(0.04, hh, 0.04, '#3c8a3a', { x, y: 0.32 + hh / 2, z });
      b.box(0.22, 0.04, 0.1, '#4fa64a', { x, y: 0.4, z, ry: R() * 3 });
      const c = colors[k % colors.length];
      for (let p = 0; p < 5; p++) {
        const pa = (p / 5) * Math.PI * 2;
        b.sphere(0.07, c, { x: x + Math.cos(pa) * 0.08, y: 0.32 + hh, z: z + Math.sin(pa) * 0.08, sy: 0.5, w: 5, hseg: 3 });
      }
      b.sphere(0.05, '#ffd23f', { x, y: 0.35 + hh, z, w: 5, hseg: 3 });
    }
  };
  ring(1.6, 16, ['#ff4f6d', '#ff8fb1'], 0.3);
  ring(1.05, 11, ['#ffd23f', '#ff9f43'], 0.45);
  ring(0.5, 6, ['#b48cff', '#7a5cff'], 0.6);
  // sunflower in the middle
  b.box(0.07, 1.4, 0.07, '#3c8a3a', { y: 1.0 });
  b.cyl(0.32, 0.32, 0.06, '#ffc21f', { y: 1.75, z: 0.05, rx: Math.PI / 2 - 0.3, seg: 12 });
  b.cyl(0.16, 0.16, 0.08, '#6b3a1a', { y: 1.76, z: 0.1, rx: Math.PI / 2 - 0.3, seg: 10 });
  const root = group(b.build());
  const bees = new Parts();
  for (const k of [0, 1]) {
    const x = k * 0.0;
    bees.sphere(0.07, '#ffd23f', { x, sx: 1.4, w: 6, hseg: 4 });
    bees.box(0.04, 0.15, 0.15, '#1b1b1b', { x: x - 0.02 });
    bees.sphere(0.06, '#ffffff', { x, y: 0.08, z: 0.06, sy: 0.4, w: 4, hseg: 3, mat: 'glass' });
  }
  const bee1 = bees.build({ castShadow: false });
  const bee2 = bee1.clone();
  root.add(bee1, bee2);
  onTick((_dt, t) => {
    bee1.position.set(Math.sin(t * 1.3) * 1.2, 1.0 + Math.sin(t * 7) * 0.08, Math.cos(t * 1.3) * 1.2);
    bee1.rotation.y = t * 1.3 + Math.PI;
    bee2.position.set(Math.sin(-t * 0.9 + 2) * 0.7, 0.9 + Math.sin(t * 9) * 0.06, Math.cos(-t * 0.9 + 2) * 0.9);
    bee2.rotation.y = -t * 0.9;
  });
  return sel(root, 'Blumenbeet', 'flower_bed', 'Natur', 'createFlowerBed');
}

// ───────────────────────────────────────────── Teich ─────────────────────────────────────────────

/**
 * Teich, w x d m (organic outline inside that rectangle). Water surface at y = 0.12 (sits on top of the
 * ground; ground is at y≈0.03 inside the city). userData.waterY = 0.12, userData.randomPoint(rand) returns a
 * local point on the water (≥ 1.5 m from the shore), userData.contains(x, z) tests local coordinates.
 */
export const POND_WATER_Y = 0.12;
export function createPond(w: number, d: number): THREE.Object3D {
  const n = 28;
  const ph1 = R() * 6, ph2 = R() * 6;
  const radius = (a: number) => 1 - 0.07 * (1 + Math.sin(a * 3 + ph1)) - 0.05 * (1 + Math.sin(a * 5 + ph2));
  const pts: THREE.Vector2[] = [];
  for (let k = 0; k < n; k++) {
    const a = (k / n) * Math.PI * 2;
    const r = radius(a);
    pts.push(new THREE.Vector2(Math.cos(a) * r * (w / 2), Math.sin(a) * r * (d / 2)));
  }
  // mirror y so that after rotateX(-PI/2) the outline maps to +z = sin(a) and the faces point up
  const shape = (s: number) => new THREE.Shape(pts.map((p) => new THREE.Vector2(p.x * s, -p.y * s)));
  const b = new Parts();
  const mud = new THREE.ShapeGeometry(shape(1.04));
  mud.rotateX(-Math.PI / 2);
  b.add(mud, '#9c8a5c', { y: 0.06 });
  const deep = new THREE.ShapeGeometry(shape(0.6));
  deep.rotateX(-Math.PI / 2);
  b.add(deep, '#1e5e8a', { y: 0.065 });
  // rim stones
  for (let k = 0; k < n * 2; k++) {
    const a = (k / (n * 2)) * Math.PI * 2 + R() * 0.05;
    const r = radius(a) * 1.04;
    if (R() < 0.15) continue;
    const s = 0.3 + R() * 0.45;
    b.ico(s, R() < 0.5 ? '#a8a9a3' : '#8f918c', { x: Math.cos(a) * r * (w / 2), y: s * 0.35, z: Math.sin(a) * r * (d / 2), sy: 0.6, ry: R() * 3 });
  }
  // reeds
  for (let c = 0; c < 4; c++) {
    const a = c * 1.7 + 0.4;
    const cx = Math.cos(a) * radius(a) * (w / 2) * 0.9, cz = Math.sin(a) * radius(a) * (d / 2) * 0.9;
    for (let k = 0; k < 9; k++) {
      const x = cx + (R() - 0.5) * 1.2, z = cz + (R() - 0.5) * 1.2, h = 1 + R() * 0.8;
      b.box(0.05, h, 0.05, '#5b8f3a', { x, y: h / 2, z, rz: (R() - 0.5) * 0.2 });
      if (k % 2 === 0) b.cyl(0.06, 0.06, 0.28, '#6b4423', { x, y: h, z, seg: 5 });
    }
  }
  // lily pads with flowers
  const lily = Math.max(4, Math.round((w * d) / 25));
  for (let k = 0; k < lily; k++) {
    const a = R() * Math.PI * 2, rr = 0.55 + R() * 0.3;
    const x = Math.cos(a) * radius(a) * rr * (w / 2), z = Math.sin(a) * radius(a) * rr * (d / 2);
    const r = 0.35 + R() * 0.3;
    b.add(new THREE.CylinderGeometry(r, r, 0.03, 9, 1, false, 0, Math.PI * 1.75), '#3f9a3a', { x, y: POND_WATER_Y + 0.02, z, ry: R() * 6 });
    if (k % 2 === 0) {
      b.cone(0.13, 0.16, '#ff9ec1', { x, y: POND_WATER_Y + 0.11, z, seg: 6 });
      b.sphere(0.05, '#ffd23f', { x, y: POND_WATER_Y + 0.17, z, w: 4, hseg: 3 });
    }
  }
  const water = new THREE.ShapeGeometry(shape(1.0));
  water.rotateX(-Math.PI / 2);
  b.add(water, '#3a9bd8', { y: POND_WATER_Y, mat: 'water' });
  const root = group(b.build({ castShadow: false }));
  root.children[0].children.forEach((m) => {
    if (m.name === 'std') (m as THREE.Mesh).castShadow = true;
  });
  root.userData.waterY = POND_WATER_Y;
  root.userData.contains = (x: number, z: number) => {
    const a = Math.atan2(z / (d / 2), x / (w / 2));
    const r = Math.hypot(x / (w / 2), z / (d / 2));
    return r < radius(a);
  };
  root.userData.randomPoint = (rand: () => number = Math.random) => {
    const a = rand() * Math.PI * 2;
    const f = Math.sqrt(rand());
    const r = radius(a);
    const kx = Math.max(0, r * (w / 2) - 1.5) * f, kz = Math.max(0, r * (d / 2) - 1.5) * f;
    return V(Math.cos(a) * kx, POND_WATER_Y, Math.sin(a) * kz);
  };
  return sel(root, 'Teich', 'pond', 'Gelände', 'createPond');
}

// ───────────────────────────────────────────── Monorail ─────────────────────────────────────────────

/**
 * Elevated monorail. `curve` is a closed curve at y = 0 in the coordinate space of the parent the
 * returned objects are added to (normally world space). Track top is at `height`. The train drives by itself
 * (≈ 11 m/s). Both objects stay at the origin of that space; the train root follows its lead car.
 */
export function createMonorail(curve: THREE.CatmullRomCurve3, height: number): { track: THREE.Object3D; train: THREE.Object3D } {
  const L = curve.getLength();
  const tb = new Parts();
  const segN = Math.ceil(L / 1.6);
  const pts = curve.getSpacedPoints(segN);
  for (let k = 0; k < segN; k++) {
    const a = pts[k], e = pts[k + 1];
    const dx = e.x - a.x, dz = e.z - a.z;
    const len = Math.hypot(dx, dz) + 0.12;
    const ry = Math.atan2(dx, dz);
    const mx = (a.x + e.x) / 2, mz = (a.z + e.z) / 2;
    tb.box(0.8, 0.9, len, '#f2f2ee', { x: mx, y: height - 0.45, z: mz, ry });
    tb.box(0.84, 0.16, len, '#2fb5c9', { x: mx, y: height - 0.72, z: mz, ry });
  }
  const pillarN = Math.max(4, Math.round(L / 9));
  for (let k = 0; k < pillarN; k++) {
    const u = k / pillarN;
    const p = curve.getPointAt(u), tg = curve.getTangentAt(u);
    const ry = Math.atan2(tg.x, tg.z);
    tb.cyl(0.42, 0.5, height - 1.0, '#d8d4cc', { x: p.x, y: (height - 1.0) / 2, z: p.z, seg: 8 });
    tb.box(1.9, 0.45, 1.1, '#d8d4cc', { x: p.x, y: height - 1.1, z: p.z, ry });
    tb.cyl(0.8, 0.9, 0.3, '#b9b4aa', { x: p.x, y: 0.15, z: p.z, seg: 8 });
    tb.box(0.3, 0.3, 0.3, '#ff4f6d', { x: p.x, y: height - 1.45, z: p.z, ry, mat: 'lamp' });
  }
  const track = sel(group(tb.build()), 'Monorail-Strecke', 'monorail_track', 'Verkehr', 'createMonorail');

  const CAR_LEN = 6.2, GAP = 0.6;
  const mkCar = (kind: 'front' | 'mid' | 'rear') => {
    const c = new Parts();
    const body = '#fbfbfb', stripe = '#ff4f6d';
    c.box(2.3, 1.9, CAR_LEN - (kind === 'mid' ? 0 : 1.2), body, { y: 1.25, z: kind === 'front' ? -0.6 : kind === 'rear' ? 0.6 : 0 });
    c.box(1.9, 0.35, CAR_LEN - 0.4, '#e9edf2', { y: 2.3 });
    c.box(0.3, 1.1, CAR_LEN - 0.5, '#d4d9e0', { x: 0.62, y: -0.15 });
    c.box(0.3, 1.1, CAR_LEN - 0.5, '#d4d9e0', { x: -0.62, y: -0.15 });
    c.box(2.36, 0.22, CAR_LEN - 0.3, stripe, { y: 0.55 });
    c.box(2.34, 0.7, CAR_LEN - 1.6, '#bfe6ff', { y: 1.55, mat: 'lamp' });
    for (let k = 0; k < 5; k++) c.box(2.38, 0.72, 0.12, body, { y: 1.55, z: -CAR_LEN / 2 + 1.1 + k * ((CAR_LEN - 2.2) / 4) });
    // doors
    c.box(2.37, 1.3, 0.9, '#e9edf2', { y: 1.3, z: 0 });
    if (kind !== 'mid') {
      const s = kind === 'front' ? 1 : -1;
      c.sphere(1, body, { y: 1.25, z: s * (CAR_LEN / 2 - 1.2), sx: 1.15, sy: 0.95, sz: 1.9, w: 12, hseg: 8 });
      c.sphere(1, '#2b3550', { y: 1.55, z: s * (CAR_LEN / 2 - 0.85), sx: 1.0, sy: 0.55, sz: 1.35, w: 12, hseg: 6, mat: 'glass' });
      c.box(0.35, 0.12, 0.1, '#fff6d0', { x: 0.65, y: 0.85, z: s * (CAR_LEN / 2 + 0.55), mat: 'neon' });
      c.box(0.35, 0.12, 0.1, '#fff6d0', { x: -0.65, y: 0.85, z: s * (CAR_LEN / 2 + 0.55), mat: 'neon' });
      c.box(2.3, 0.18, 0.6, stripe, { y: 0.55, z: s * (CAR_LEN / 2 + 0.1) });
    }
    return c.build();
  };
  const cars = [mkCar('front'), mkCar('mid'), mkCar('rear')];
  const train = new THREE.Group();
  train.add(cars[0]);
  const followers = [new THREE.Group(), new THREE.Group()];
  followers[0].add(cars[1]);
  followers[1].add(cars[2]);
  train.add(followers[0], followers[1]);
  let s = 0;
  const p = new THREE.Vector3(), tg = new THREE.Vector3();
  const place = () => {
    const u0 = ((s % L) + L) % L / L;
    curve.getPointAt(u0, p);
    curve.getTangentAt(u0, tg);
    train.position.set(p.x, height, p.z);
    const yaw0 = Math.atan2(tg.x, tg.z);
    train.rotation.y = yaw0;
    followers.forEach((f, i) => {
      const si = s - (i + 1) * (CAR_LEN + GAP);
      const u = ((si % L) + L) % L / L;
      curve.getPointAt(u, p);
      curve.getTangentAt(u, tg);
      const dx = p.x - train.position.x, dz = p.z - train.position.z;
      const c = Math.cos(-yaw0), sn = Math.sin(-yaw0);
      f.position.set(dx * c + dz * sn, 0, -dx * sn + dz * c);
      f.rotation.y = Math.atan2(tg.x, tg.z) - yaw0;
    });
  };
  place();
  onTick((dt, t) => {
    s += dt * (10 + Math.sin(t * 0.2) * 2.5);
    place();
  });
  sel(train, 'Monorail-Zug', 'monorail_train', 'Fahrzeug', 'createMonorail');
  return { track, train };
}

// ───────────────────────────────────────────── Gallery ─────────────────────────────────────────────

function sampleLoop() {
  const pts = [V(-20, 0, -10), V(-15, 0, -15), V(15, 0, -15), V(20, 0, -10), V(20, 0, 10), V(15, 0, 15), V(-15, 0, 15), V(-20, 0, 10)];
  return new THREE.CatmullRomCurve3(pts, true, 'centripetal');
}

gallery({
  ferrisWheel: () => createFerrisWheel(),
  carousel: () => createCarousel(),
  fountain: () => createFountain(),
  rubberDuck: () => createRubberDuck(),
  duck: () => createDuck(),
  swanBoat: () => createSwanBoat(),
  tRex: () => createTRex(),
  swingSet: () => createSwingSet(),
  slide: () => createSlide(),
  seesaw: () => createSeesaw(),
  chessBoard: () => createChessBoard(),
  chessGame: () => {
    const g = new THREE.Group();
    const board = createChessBoard();
    g.add(board);
    for (const p of placeChessGame(board)) g.add(p);
    return g;
  },
  chessPieces: () => {
    const g = new THREE.Group();
    (['pawn', 'rook', 'knight', 'bishop', 'queen', 'king'] as ChessKind[]).forEach((k, i) => {
      const w = createChessPiece(k, true);
      w.position.set((i - 2.5) * 1.3, 0, 1);
      const bl = createChessPiece(k, false);
      bl.position.set((i - 2.5) * 1.3, 0, -1);
      g.add(w, bl);
    });
    return g;
  },
  iceCreamKiosk: () => createIceCreamKiosk(),
  bench: () => createBench(),
  picnicBlanket: () => createPicnicBlanket(),
  bandstand: () => createBandstand(),
  topiaryElephant: () => createTopiary('elephant'),
  topiaryGiraffe: () => createTopiary('giraffe'),
  topiaryRabbit: () => createTopiary('rabbit'),
  flowerBed: () => createFlowerBed(),
  pond: () => createPond(18, 12),
  pondScene: () => {
    const g = new THREE.Group();
    const pond = createPond(30, 20);
    g.add(pond);
    const duck = createRubberDuck();
    duck.position.set(3, POND_WATER_Y, 0);
    g.add(duck);
    const swan = createSwanBoat();
    swan.position.set(-7, POND_WATER_Y, 3);
    swan.rotation.y = 0.8;
    g.add(swan);
    for (let k = 0; k < 4; k++) {
      const d = createDuck();
      d.position.set(-4 + k * 1.1, POND_WATER_Y, -4 + (k % 2) * 0.8);
      d.rotation.y = 1.2;
      g.add(d);
    }
    return g;
  },
  monorail: () => {
    const g = new THREE.Group();
    const { track, train } = createMonorail(sampleLoop(), 7);
    g.add(track, train);
    return g;
  },
  ...EXTRA_GALLERY,
});
