import * as THREE from 'three';
import { Parts, rng } from '../core/parts';
import { onTick } from '../core/anim';
import { R, sel, group, stripedCone, textPlane, figure } from './park-util';

const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

/** Hot-Dog-Wagen mit Riesenwurst und Dampf. Footprint 2.6 x 1.6 m, height ≈ 3.6 m. Serving side faces +Z. */
export function createHotDogCart(): THREE.Object3D {
  const b = new Parts();
  b.box(2.0, 0.9, 1.0, '#e8414f', { y: 0.95 });
  b.box(2.04, 0.18, 1.04, '#ffffff', { y: 0.62 });
  b.box(2.1, 0.08, 1.1, '#c9ced6', { y: 1.44 });
  for (const s of [-1, 1]) {
    b.cyl(0.42, 0.42, 0.1, '#2b2b2b', { x: 0.45, y: 0.42, z: s * 0.58, rx: Math.PI / 2, seg: 10 });
    b.cyl(0.14, 0.14, 0.12, '#ffd23f', { x: 0.45, y: 0.42, z: s * 0.6, rx: Math.PI / 2, seg: 8 });
  }
  b.box(0.08, 0.5, 0.08, '#2b2b2b', { x: -0.85, y: 0.25 });
  b.rod(V(1.0, 1.1, -0.35), V(1.5, 1.2, -0.35), 0.04, '#9aa0a8');
  b.rod(V(1.0, 1.1, 0.35), V(1.5, 1.2, 0.35), 0.04, '#9aa0a8');
  b.rod(V(1.5, 1.2, -0.38), V(1.5, 1.2, 0.38), 0.05, '#2b2b2b');
  // condiments
  b.cyl(0.07, 0.07, 0.3, '#ffd21f', { x: -0.6, y: 1.63, z: 0.3, seg: 6 });
  b.cyl(0.07, 0.07, 0.3, '#e8112d', { x: -0.4, y: 1.63, z: 0.3, seg: 6 });
  // umbrella
  b.cyl(0.04, 0.04, 2.0, '#ffffff', { x: 0.2, y: 2.4, seg: 6 });
  stripedCone(b, 1.5, 0.6, 10, ['#ffd23f', '#e8414f'], { x: 0.2, y: 3.4 });
  // giant hot dog on the front
  b.add(new THREE.CapsuleGeometry(0.22, 1.5, 4, 8), '#e2b06a', { x: -0.2, y: 1.72, z: -0.12, rz: Math.PI / 2 });
  b.add(new THREE.CapsuleGeometry(0.22, 1.5, 4, 8), '#e2b06a', { x: -0.2, y: 1.72, z: 0.12, rz: Math.PI / 2 });
  b.add(new THREE.CapsuleGeometry(0.17, 1.9, 4, 8), '#b8432b', { x: -0.2, y: 1.85, rz: Math.PI / 2 });
  for (let k = 0; k < 8; k++) b.box(0.2, 0.05, 0.08, '#ffd21f', { x: -1.0 + k * 0.23, y: 2.03, z: k % 2 ? 0.05 : -0.05, ry: k % 2 ? 0.7 : -0.7 });
  // vendor
  figure(b, { x: 0, y: 0, z: -0.95, ry: 0, s: 1.75, shirt: '#ffffff', pants: '#2b2f44', hair: '#2b1a10' });
  b.cyl(0.2, 0.2, 0.25, '#ffffff', { x: 0, y: 1.98, z: -0.98, seg: 8 });
  const root = group(b.build());
  const sign = textPlane('HOT DOGS', 1.8, 0.5, '#ffd23f', '#c8283c');
  sign.position.set(0, 0.98, 0.512);
  root.add(sign);
  const steam = [0, 1, 2].map(() => {
    const s = new Parts().ico(0.18, '#ffffff', { detail: 1, mat: 'cloud' }).build({ castShadow: false });
    root.add(s);
    return s;
  });
  onTick((_dt, t) => {
    steam.forEach((s, k) => {
      const u = (t * 0.45 + k / 3) % 1;
      s.position.set(0.55 + Math.sin(t * 2 + k) * 0.1, 1.55 + u * 1.4, 0.15);
      s.scale.setScalar(0.5 + u * 1.5);
      s.visible = u < 0.92;
    });
  });
  return sel(root, 'Hot-Dog-Wagen', 'hotdog_cart', 'Stadtmobiliar', 'createHotDogCart');
}

/** Aufblasbarer Riesen-Flamingo (Schwimmtier). ≈ 4 x 5 m, 5 m tall. Origin = waterline; bobs and spins. */
export function createFlamingoFloat(): THREE.Object3D {
  const P1 = '#ff7eb6', P2 = '#ff5fa2';
  const b = new Parts();
  b.torus(1.5, 0.75, P1, { y: 0.4, rx: Math.PI / 2, sx: 1, sy: 1.25, rs: 10, ts: 20 });
  b.sphere(1.1, P2, { y: 1.2, z: -0.9, sx: 1.2, sy: 0.9, sz: 1.4, w: 10, hseg: 8 });
  b.cone(0.7, 1.4, P1, { y: 1.5, z: -2.3, rx: -1.0, seg: 8 });
  // neck: arc of spheres
  for (let k = 0; k <= 9; k++) {
    const a = (k / 9) * Math.PI * 0.95;
    b.sphere(0.36 - k * 0.008, P1, { x: 0, y: 1.0 + Math.sin(a) * 3.0, z: 1.3 + Math.cos(a) * 0.9 - k * 0.1, w: 8, hseg: 6 });
  }
  b.sphere(0.5, P1, { y: 4.05, z: 0.15, w: 10, hseg: 8 });
  b.cone(0.18, 0.75, '#ffffff', { y: 3.8, z: 0.75, rx: 2.0, seg: 8 });
  b.cone(0.15, 0.3, '#1b1b25', { y: 3.48, z: 1.05, rx: 2.0, seg: 8 });
  for (const s of [-1, 1]) {
    b.sphere(0.15, '#ffffff', { x: s * 0.36, y: 4.2, z: 0.35, w: 6, hseg: 4 });
    b.sphere(0.08, '#1b1b25', { x: s * 0.44, y: 4.22, z: 0.42, w: 4, hseg: 3 });
  }
  // valve + sunglasses-shaped highlight
  b.cyl(0.08, 0.08, 0.15, '#ffffff', { x: 1.9, y: 0.6, rz: Math.PI / 2 });
  const inner = b.build();
  const spin = group(inner);
  const root = group(spin);
  const ph = R() * 10;
  onTick((dt, t) => {
    inner.position.y = Math.sin(t * 1.1 + ph) * 0.12 - 0.25;
    inner.rotation.x = Math.sin(t * 0.8 + ph) * 0.05;
    inner.rotation.z = Math.sin(t * 0.9 + ph) * 0.05;
    spin.rotation.y += dt * 0.08;
  });
  return sel(root, 'Aufblas-Flamingo', 'flamingo_float', 'Kurioses', 'createFlamingoFloat');
}

/** Heckenlabyrinth 15 x 15 m (7x7 cells), entrance at +Z, golden trophy in the middle. Hedges 1.8 m. */
export function createHedgeMaze(): THREE.Object3D {
  const N = 7, C = 2.1, H = 1.8, T = 0.45;
  const r = rng(77);
  // carve with DFS
  const vis = Array.from({ length: N * N }, () => false);
  const walls = { h: Array.from({ length: (N + 1) * N }, () => true), v: Array.from({ length: N * (N + 1) }, () => true) };
  // h[i][j]: wall above cell row j (between row j-1 and j) at column i; index j*N+i, j in 0..N
  // v[i][j]: wall left of cell column i at row j; index j*(N+1)+i, i in 0..N
  const stack: [number, number][] = [[3, 3]];
  vis[3 * N + 3] = true;
  while (stack.length) {
    const [x, y] = stack[stack.length - 1];
    const nb = ([[1, 0], [-1, 0], [0, 1], [0, -1]] as const).map(([dx, dy]) => [x + dx, y + dy, dx, dy] as const)
      .filter(([nx, ny]) => nx >= 0 && ny >= 0 && nx < N && ny < N && !vis[ny * N + nx]);
    if (!nb.length) { stack.pop(); continue; }
    const [nx, ny, dx, dy] = nb[Math.floor(r() * nb.length)];
    if (dx === 1) walls.v[y * (N + 1) + x + 1] = false;
    if (dx === -1) walls.v[y * (N + 1) + x] = false;
    if (dy === 1) walls.h[(y + 1) * N + x] = false;
    if (dy === -1) walls.h[y * N + x] = false;
    vis[ny * N + nx] = true;
    stack.push([nx, ny]);
  }
  walls.h[N * N + 3] = false; // entrance (front, +Z, row N edge)
  const b = new Parts();
  const off = (N * C) / 2;
  const col = () => (r() < 0.5 ? '#2f8a3a' : '#2a7d34');
  for (let j = 0; j <= N; j++) for (let i = 0; i < N; i++) {
    if (walls.h[j * N + i]) b.box(C + T, H, T, col(), { x: -off + (i + 0.5) * C, y: H / 2, z: -off + j * C });
  }
  for (let j = 0; j < N; j++) for (let i = 0; i <= N; i++) {
    if (walls.v[j * (N + 1) + i]) b.box(T, H, C + T, col(), { x: -off + i * C, y: H / 2, z: -off + (j + 0.5) * C });
  }
  b.box(N * C + 1, 0.04, N * C + 1, '#d9c79a', { y: 0.02 });
  // entrance arch
  b.box(0.4, 3.0, 0.5, '#2a7d34', { x: -1.25, y: 1.5, z: off });
  b.box(0.4, 3.0, 0.5, '#2a7d34', { x: 1.25, y: 1.5, z: off });
  b.box(2.9, 0.6, 0.5, '#2a7d34', { y: 3.1, z: off });
  // trophy pedestal in the center cell
  b.cyl(0.45, 0.55, 0.9, '#e8e2d6', { y: 0.45, seg: 8 });
  const root = group(b.build());
  const sign = textPlane('IRRGARTEN', 2.4, 0.42, '#5a3f2a', '#ffe9a8');
  sign.position.set(0, 3.1, off + 0.26);
  root.add(sign);
  const tr = new Parts();
  tr.cyl(0.25, 0.32, 0.12, '#ffc93c', { y: 0.06 });
  tr.cyl(0.06, 0.1, 0.4, '#ffc93c', { y: 0.32 });
  tr.lathe([[0.05, 0], [0.35, 0.15], [0.42, 0.6], [0.0, 0.6]], '#ffc93c', { y: 0.5, seg: 12 });
  tr.torus(0.18, 0.04, '#ffc93c', { x: 0.45, y: 0.85, rs: 4, ts: 10 });
  tr.torus(0.18, 0.04, '#ffc93c', { x: -0.45, y: 0.85, rs: 4, ts: 10 });
  tr.add(new THREE.OctahedronGeometry(0.16), '#fff6c8', { y: 1.4, mat: 'neon' });
  const trophy = tr.build();
  trophy.position.y = 0.9;
  root.add(trophy);
  onTick((dt, t) => {
    trophy.rotation.y += dt * 0.8;
    trophy.position.y = 0.9 + Math.sin(t * 2) * 0.05;
  });
  return sel(root, 'Heckenlabyrinth', 'hedge_maze', 'Attraktion', 'createHedgeMaze');
}

/** Pilzhaus (Fliegenpilz-Häuschen) mit leuchtenden Fenstern und rauchendem Schornstein. Ø ≈ 7 m, height ≈ 7 m. Door faces +Z. */
export function createMushroomHouse(): THREE.Object3D {
  const b = new Parts();
  b.lathe([[0, 0], [2.0, 0], [1.75, 1.2], [1.6, 2.6], [1.7, 3.4], [0, 3.4]], '#f4ead2', { seg: 14 });
  // door
  b.box(0.95, 1.4, 0.2, '#8a5a32', { y: 0.7, z: 1.88, rx: -0.08 });
  b.cyl(0.475, 0.475, 0.2, '#8a5a32', { y: 1.4, z: 1.86, rx: Math.PI / 2, seg: 10 });
  b.sphere(0.07, '#ffd23f', { x: 0.3, y: 0.75, z: 2.0, w: 4, hseg: 3 });
  // round windows (glow at night)
  for (const [a, y] of [[0.9, 2.2], [-0.9, 2.2], [2.6, 1.6], [-2.4, 2.6]]) {
    const r = 1.68;
    b.cyl(0.33, 0.33, 0.12, '#ffe7a0', { x: Math.sin(a) * r, y, z: Math.cos(a) * r, rx: Math.PI / 2, ry: a, seg: 10, mat: 'lamp' });
    b.torus(0.34, 0.06, '#8a5a32', { x: Math.sin(a) * (r + 0.05), y, z: Math.cos(a) * (r + 0.05), ry: a, rs: 4, ts: 10 });
  }
  // cap
  b.sphere(3.4, '#e8312f', { y: 3.2, sy: 0.62, w: 18, hseg: 10, ...{} });
  b.cyl(3.35, 3.0, 0.3, '#f4ead2', { y: 3.15, seg: 18 });
  for (let k = 0; k < 16; k++) {
    const th = R() * Math.PI * 2, ph = 0.25 + R() * 1.1;
    const x = Math.sin(ph) * Math.cos(th) * 3.4, y = 3.2 + Math.cos(ph) * 3.4 * 0.62, z = Math.sin(ph) * Math.sin(th) * 3.4;
    b.sphere(0.25 + R() * 0.25, '#ffffff', { x, y, z, sy: 0.45, w: 8, hseg: 4 });
  }
  // chimney
  b.cyl(0.25, 0.3, 1.4, '#9a8b7a', { x: 1.2, y: 5.4, z: -0.8, seg: 7 });
  // path stones + little mushrooms
  for (let k = 0; k < 5; k++) b.cyl(0.35, 0.38, 0.08, '#c9c1b2', { x: Math.sin(k) * 0.3, y: 0.04, z: 2.5 + k * 0.8, seg: 7 });
  for (const [x, z, s] of [[-2.4, 1.6, 1], [2.5, 1.2, 0.8], [-1.6, 2.6, 0.6], [2.0, -2.2, 1.1]]) {
    b.cyl(0.08 * s, 0.1 * s, 0.4 * s, '#f4ead2', { x, y: 0.2 * s, z, seg: 6 });
    b.sphere(0.28 * s, '#e8312f', { x, y: 0.4 * s, z, sy: 0.55, w: 8, hseg: 4 });
  }
  // lantern
  b.box(0.06, 1.6, 0.06, '#2b2b2b', { x: -1.2, y: 0.8, z: 2.6 });
  b.box(0.25, 0.3, 0.25, '#ffe7a0', { x: -1.2, y: 1.7, z: 2.6, mat: 'lamp' });
  const root = group(b.build());
  const smoke = [0, 1, 2, 3].map(() => {
    const s = new Parts().ico(0.3, '#e8e8e8', { detail: 1, mat: 'cloud' }).build({ castShadow: false });
    root.add(s);
    return s;
  });
  onTick((_dt, t) => {
    smoke.forEach((s, k) => {
      const u = (t * 0.25 + k / 4) % 1;
      s.position.set(1.2 + u * 0.8 + Math.sin(t + k) * 0.15, 6.2 + u * 2.6, -0.8 - u * 0.4);
      s.scale.setScalar(0.6 + u * 1.6);
      s.visible = u < 0.95;
    });
  });
  return sel(root, 'Pilzhaus', 'mushroom_house', 'Gebäude', 'createMushroomHouse');
}

/** Seifenblasen-Maschine: Zahnräder, Trichter und ein drehendes Blasrad – schillernde Blasen steigen auf. 2.4 x 2 m, ≈ 3.2 m (+ bubbles). */
export function createBubbleMachine(): THREE.Object3D {
  const b = new Parts();
  b.box(1.8, 1.2, 1.4, '#7a5cff', { y: 0.6 });
  b.box(1.9, 0.12, 1.5, '#ffd23f', { y: 1.26 });
  b.cyl(0.35, 0.6, 0.7, '#2fd3c7', { y: 1.65, seg: 10 });
  b.cyl(0.65, 0.65, 0.12, '#ff6fa5', { y: 2.02, seg: 10 });
  b.rod(V(0.6, 1.3, 0.4), V(0.9, 2.6, 0.6), 0.06, '#c9ced6');
  b.rod(V(-0.6, 1.3, -0.4), V(-0.75, 2.8, -0.5), 0.06, '#c9ced6');
  b.sphere(0.18, '#ff4f6d', { x: -0.75, y: 2.85, z: -0.5, w: 6, hseg: 4, mat: 'neon' });
  b.sphere(0.12, '#6ee7a8', { x: 0.9, y: 2.65, z: 0.6, w: 6, hseg: 4, mat: 'neon' });
  for (const [x, z] of [[-0.7, -0.55], [0.7, -0.55], [-0.7, 0.55], [0.7, 0.55]]) b.cyl(0.12, 0.15, 0.15, '#2b2b2b', { x, y: 0.07, z, seg: 6 });
  // dials
  for (let k = 0; k < 3; k++) b.cyl(0.12, 0.12, 0.04, '#ffffff', { x: -0.5 + k * 0.5, y: 0.85, z: 0.71, rx: Math.PI / 2, seg: 10 });
  const root = group(b.build());
  const gear = (r: number, col: string) => {
    const g = new Parts();
    g.cyl(r, r, 0.12, col, { rz: Math.PI / 2, seg: 12 });
    for (let k = 0; k < 10; k++) {
      const a = (k / 10) * Math.PI * 2;
      g.box(0.12, 0.18, 0.14, col, { y: Math.cos(a) * (r + 0.07), z: Math.sin(a) * (r + 0.07), rx: a });
    }
    return g.build();
  };
  const g1 = gear(0.42, '#ffc93c'), g2 = gear(0.28, '#c9ced6');
  g1.position.set(0.98, 0.7, -0.15);
  g2.position.set(0.98, 0.72, 0.5);
  root.add(g1, g2);
  // bubble wand wheel on top
  const wand = new Parts();
  for (let k = 0; k < 4; k++) {
    const a = (k / 4) * Math.PI * 2;
    wand.rod(V(0, 0, 0), V(0, Math.cos(a) * 0.7, Math.sin(a) * 0.7), 0.03, '#ff6fa5');
    wand.torus(0.18, 0.03, '#ffd23f', { y: Math.cos(a) * 0.85, z: Math.sin(a) * 0.85, ry: Math.PI / 2, rs: 4, ts: 10 });
  }
  const wg = wand.build();
  wg.position.set(0, 2.55, 0);
  root.add(wg);
  // bubbles
  const BUB = ['#ffd6f5', '#d6f0ff', '#e9ffd6', '#fff3c4', '#e6d6ff'];
  const proto = BUB.map((c) => new Parts().sphere(0.25, c, { w: 10, hseg: 8, mat: 'glass' }).build({ castShadow: false }).children[0] as THREE.Mesh);
  const bubbles = Array.from({ length: 14 }, (_, k) => {
    const m = proto[k % proto.length].clone();
    m.userData.noHighlight = true;
    root.add(m);
    return { m, ph: R(), dx: (R() - 0.5) * 2.5, dz: 0.6 + R() * 1.5, s: 0.6 + R() * 1.2 };
  });
  onTick((dt, t) => {
    g1.rotation.x += dt * 1.5;
    g2.rotation.x -= dt * 2.25;
    wg.rotation.x += dt * 1.2;
    for (const bb of bubbles) {
      const u = (t * 0.12 + bb.ph) % 1;
      bb.m.position.set(bb.dx * u + Math.sin(t * 1.5 + bb.ph * 9) * 0.3, 2.6 + u * 7, bb.dz * u * 2 + Math.cos(t + bb.ph * 7) * 0.3);
      const pop = u > 0.93 ? 0 : 1;
      bb.m.scale.setScalar(bb.s * Math.min(1, u * 8) * pop + 0.001);
    }
  });
  return sel(root, 'Seifenblasen-Maschine', 'bubble_machine', 'Kurioses', 'createBubbleMachine');
}

export const EXTRA_GALLERY: Record<string, () => THREE.Object3D> = {
  hotDogCart: () => createHotDogCart(),
  flamingoFloat: () => createFlamingoFloat(),
  hedgeMaze: () => createHedgeMaze(),
  mushroomHouse: () => createMushroomHouse(),
  bubbleMachine: () => createBubbleMachine(),
};
