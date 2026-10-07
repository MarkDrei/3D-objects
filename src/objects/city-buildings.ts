import * as THREE from 'three';
import { Parts } from '../core/parts';
import { selectable } from '../core/registry';
import { onTick } from '../core/anim';
import { textPlane, pivot, windows, awning, seeded, TAU } from './city-util';

const B = (type: string, key: string, model: string, variant?: string) =>
  ({ type, key, category: 'Gebäude' as const, source: 'prozedural' as const, model, variant });

/** Shop front helper: door + display windows on the +Z face at z. */
function shopFront(b: Parts, w: number, z: number, frame: string) {
  b.box(1.6, 2.6, 0.1, '#6b4a2b', { y: 1.3, z: z + 0.02 });
  b.box(1.2, 2.2, 0.12, '#bfe6ff', { y: 1.25, z: z + 0.04, mat: 'glass' });
  b.sphere(0.07, '#e6b422', { x: 0.45, y: 1.2, z: z + 0.12 });
  const ww = (w - 3) / 2 - 0.6;
  for (const s of [-1, 1]) {
    const x = s * (0.8 + 0.3 + ww / 2);
    b.box(ww + 0.3, 2.3, 0.12, frame, { x, y: 1.55, z: z + 0.01 });
    b.box(ww, 2.0, 0.14, '#ffe7b0', { x, y: 1.55, z: z + 0.03, mat: 'lamp' });
  }
}

/** Donut shop 12 x 10 m (+ giant vertical donut on the roof, slowly spinning). Height ~15 m. 5 meshes. */
export function createDonutShop(): THREE.Object3D {
  const b = new Parts();
  const W = 12, D = 10, H = 5;
  b.box(W, H, D, '#9fe3d0', { y: H / 2 });
  b.box(W + 0.4, 0.5, D + 0.4, '#ff8fc4', { y: H + 0.25 });
  b.box(W + 0.2, 0.4, D + 0.2, '#6fcdb5', { y: 0.2 });
  shopFront(b, W, D / 2, '#ff8fc4');
  awning(b, W - 0.6, 3.25, D / 2, 1.6, '#ff8fc4', '#ffffff', 10);
  // roof mount
  b.box(1.0, 2.0, 1.0, '#888', { y: H + 1.5 });
  b.box(4, 0.3, 1.6, '#777', { y: H + 0.65 });
  const g = b.build();
  // side windows
  const sb = new Parts();
  for (const s of [-1, 1]) {
    for (let i = 0; i < 3; i++) {
      const z = -3 + i * 3;
      sb.box(0.1, 1.6, 1.6, '#ffffff', { x: s * (W / 2 + 0.02), y: 2.6, z });
      sb.box(0.12, 1.3, 1.3, '#ffe7b0', { x: s * (W / 2 + 0.03), y: 2.6, z, mat: 'lamp' });
    }
  }
  g.add(sb.build());
  const sign = textPlane('POLYDONUTS', 8, 1.1, { bg: '#ff5fa2', fg: '#fff7fb', border: '#fff', px: 96 });
  sign.position.set(0, 4.35, D / 2 + 0.06);
  g.add(sign);

  // giant donut (vertical, faces +Z), spins around Y
  const d = new Parts();
  const R = 2.6, T = 1.25;
  d.torus(R, T, '#e0a256', { rs: 10, ts: 24 });
  for (const s of [-1, 1]) d.torus(R, T * 0.98, '#ff7ac0', { z: s * 0.32, sz: 0.78, rs: 10, ts: 24 });
  const r = seeded(7);
  const cols = ['#ffffff', '#4ab8ff', '#ffe14d', '#6bff8c', '#b06bff'];
  for (let i = 0; i < 70; i++) {
    const a = r() * TAU, dr = (r() - 0.5) * 1.6;
    const s = i % 2 ? 1 : -1;
    const zz = s * (0.32 + Math.sqrt(Math.max(0, T * T - dr * dr)) * 0.78 + 0.02);
    d.box(0.32, 0.09, 0.09, cols[i % cols.length], { x: Math.cos(a) * (R + dr), y: Math.sin(a) * (R + dr), z: zz, rz: r() * 3 });
  }
  const donut = pivot(d, 0, H + 2.5 + R + T, 0);
  g.add(donut);
  onTick((dt) => (donut.rotation.y += dt * 0.6));
  return selectable(g, B('Donut-Laden', 'donut_shop', 'createDonutShop'));
}

/** Pizzeria 12 x 10 m with giant tilted pizza slice on the roof and a chimney. Height ~11 m. 5 meshes. */
export function createPizzeria(): THREE.Object3D {
  const b = new Parts();
  const W = 12, D = 10, H = 6.6;
  b.box(W, H, D, '#f3e2c4', { y: H / 2 });
  b.box(W + 0.3, 0.35, D + 0.3, '#b5532f', { y: H + 0.18 });
  // brick base band
  b.box(W + 0.1, 0.9, D + 0.1, '#b5532f', { y: 0.45 });
  shopFront(b, W, D / 2, '#2e8b4a');
  awning(b, W - 0.6, 3.3, D / 2, 1.5, '#2e8b4a', '#ffffff', 6);
  b.box((W - 0.6) / 3, 0.13, 1.5, '#d8342f', { x: (W - 0.6) / 3, y: 3.3, z: D / 2 + 0.65, rx: 0.32 });
  // upper windows with shutters
  for (const x of [-3.5, 0, 3.5]) {
    b.box(1.2, 1.3, 0.1, '#ffe7b0', { x, y: 5.5, z: D / 2 + 0.02, mat: 'lamp', sy: 0.7 });
    b.box(0.5, 1.0, 0.1, '#2e8b4a', { x: x - 0.9, y: 5.5, z: D / 2 + 0.03 });
    b.box(0.5, 1.0, 0.1, '#2e8b4a', { x: x + 0.9, y: 5.5, z: D / 2 + 0.03 });
  }
  // wood-fired oven chimney
  b.box(1.2, 3.2, 1.2, '#a2482a', { x: -4, y: H + 1.6, z: -2.5 });
  b.box(1.5, 0.3, 1.5, '#7d3520', { x: -4, y: H + 3.3, z: -2.5 });
  const g = b.build();
  const sign = textPlane('PIZZA MAMMA POLY', 8.5, 0.95, { bg: '#ffffff', fg: '#d8342f', border: '#2e8b4a', px: 96 });
  sign.position.set(0, 4.25, D / 2 + 0.06);
  g.add(sign);

  // giant slice
  const p = new Parts();
  const sh = new THREE.Shape();
  sh.moveTo(0, -3.2); sh.lineTo(-2.6, 2.6); sh.quadraticCurveTo(0, 3.4, 2.6, 2.6); sh.lineTo(0, -3.2);
  p.extrude(sh, 0.35, '#ffc94a', { z: -0.17 });
  p.add(new THREE.TorusGeometry(2.75, 0.32, 6, 12, 1.1), '#d98a3a', { y: -0.2, rz: Math.PI / 2 - 0.55 });
  const r = seeded(3);
  for (let i = 0; i < 9; i++) {
    const yy = -2 + r() * 4.3, half = ((yy + 3.2) / 5.8) * 2.4;
    p.cyl(0.42, 0.42, 0.1, '#c8322b', { x: (r() - 0.5) * half * 1.4, y: yy, z: 0.22, rx: Math.PI / 2, seg: 10 });
  }
  for (let i = 0; i < 8; i++) p.box(0.35, 0.12, 0.08, '#3f8f3a', { x: (r() - 0.5) * 2.2, y: -0.5 + r() * 2.8, z: 0.24, rz: r() * 3 });
  // cheese drip
  p.box(0.3, 0.9, 0.1, '#ffd760', { x: 0.6, y: -1.6, z: 0.1 });
  p.cyl(0.08, 0.08, 4.5, '#555', { y: -4.6, z: -0.3, seg: 6 });
  const slice = pivot(p, 2.2, H + 4.8, 1.8);
  slice.rotation.z = 0.25;
  g.add(slice);
  onTick((dt, t) => (slice.rotation.y = Math.sin(t * 0.8) * 0.35));

  // smoke puffs from the chimney
  const smoke = new Parts();
  for (let i = 0; i < 4; i++) smoke.ico(0.5 + i * 0.15, '#eeeeee', { y: i * 1.2, x: i * 0.25, mat: 'cloud' });
  const sm = pivot(smoke, -4, H + 4, -2.5, false);
  g.add(sm);
  onTick((dt, t) => {
    const k = (t * 0.4) % 1;
    sm.position.y = H + 3.6 + k * 2;
    sm.scale.setScalar(0.6 + k * 0.6);
    sm.visible = true;
  });
  return selectable(g, B('Pizzeria', 'pizzeria', 'createPizzeria'));
}

/** Café 10 x 7 m building + terrace with 3 parasol tables in front (to z ≈ +7.5). Giant coffee cup on roof. 4 meshes. */
export function createCafe(): THREE.Object3D {
  const b = new Parts();
  const W = 10, D = 7, H = 4.5;
  b.box(W, H, D, '#f6d7b0', { y: H / 2, z: -0.5 });
  b.box(W + 0.4, 0.4, D + 0.4, '#7a4b2a', { y: H + 0.2, z: -0.5 });
  shopFront(b, W, D / 2 - 0.5, '#7a4b2a');
  awning(b, W - 0.4, 3.2, D / 2 - 0.5, 1.6, '#7a4b2a', '#f6efe2', 8);
  // terrace
  b.box(W, 0.1, 4, '#c9b49a', { y: 0.05, z: D / 2 + 2 });
  const pc = ['#ff6b6b', '#4ab8ff', '#ffd23f'];
  for (let i = 0; i < 3; i++) {
    const x = -3.4 + i * 3.4, z = D / 2 + 2.3;
    b.cyl(0.5, 0.5, 0.06, '#ffffff', { x, y: 0.78, z, seg: 10 });
    b.cyl(0.04, 0.04, 0.78, '#555', { x, y: 0.39, z, seg: 5 });
    b.cyl(0.04, 0.04, 2.5, '#eee', { x, y: 1.25, z, seg: 5 });
    b.cone(1.5, 0.6, pc[i], { x, y: 2.5, z, seg: 8 });
    for (const s of [-1, 1]) {
      b.box(0.45, 0.06, 0.45, '#7a4b2a', { x: x + s * 0.85, y: 0.48, z });
      b.box(0.45, 0.55, 0.06, '#7a4b2a', { x: x + s * 0.85 + s * 0.2, y: 0.75, z, ry: Math.PI / 2 });
      b.box(0.05, 0.48, 0.05, '#555', { x: x + s * 0.85, y: 0.24, z });
    }
    b.cyl(0.08, 0.06, 0.12, '#ffffff', { x: x + 0.15, y: 0.87, z: z + 0.1, seg: 6 });
  }
  // giant coffee cup on roof
  b.cyl(1.6, 1.2, 2.6, '#ffffff', { x: 2, y: H + 1.7, z: -1, seg: 14 });
  b.cyl(1.45, 1.45, 0.1, '#4a2a17', { x: 2, y: H + 2.95, z: -1, seg: 14 });
  b.torus(0.7, 0.2, '#ffffff', { x: 3.6, y: H + 1.8, z: -1, rs: 6, ts: 10 });
  b.cyl(2.2, 2.2, 0.15, '#ffffff', { x: 2, y: H + 0.45, z: -1, seg: 16 });
  b.cyl(1.3, 1.3, 0.3, '#d8342f', { x: 2, y: H + 1.7, z: -1, seg: 14, sx: 1.02, sz: 1.02 });
  const g = b.build();
  const sign = textPlane('CAFÉ KOFFEIN', 6, 0.8, { bg: '#4a2a17', fg: '#ffe7b0', px: 96 });
  sign.position.set(0, 4.0, D / 2 - 0.44);
  g.add(sign);
  // steam
  const s = new Parts();
  for (let i = 0; i < 3; i++) s.ico(0.35 + i * 0.1, '#ffffff', { y: i * 0.7, x: Math.sin(i * 2) * 0.3, mat: 'cloud' });
  const st = pivot(s, 2, H + 3.3, -1, false);
  g.add(st);
  onTick((dt, t) => {
    const k = (t * 0.5) % 1;
    st.position.y = H + 3.2 + k * 1.2;
    st.scale.setScalar(0.7 + k * 0.5);
  });
  return selectable(g, B('Café', 'cafe', 'createCafe'));
}

/** Gas station ~24 x 18 m: canopy over two pump islands (front), shop at the back, tall neon price pylon. 5 meshes. */
export function createGasStation(): THREE.Object3D {
  const b = new Parts();
  b.box(24, 0.12, 18, '#8d949b', { y: 0.06 });
  // shop at back
  b.box(12, 4, 6, '#f2f2f2', { y: 2, z: -5.5 });
  b.box(12.4, 0.6, 6.4, '#1d6fe0', { y: 4.2, z: -5.5 });
  b.box(9, 2.4, 0.1, '#ffe7b0', { x: 0.8, y: 1.6, z: -2.45, mat: 'lamp' });
  b.box(1.4, 2.6, 0.12, '#bfe6ff', { x: -4.6, y: 1.3, z: -2.44, mat: 'glass' });
  // canopy
  for (const [x, z] of [[-5, 1], [5, 1], [-5, 6], [5, 6]]) b.box(0.5, 5.2, 0.5, '#e8e8e8', { x, y: 2.6, z });
  b.box(14, 0.9, 8, '#ffffff', { y: 5.6, z: 3.5 });
  b.box(14.2, 0.5, 8.2, '#1d6fe0', { y: 5.4, z: 3.5 });
  b.box(14.25, 0.15, 8.25, '#ffd21f', { y: 5.85, z: 3.5 });
  for (const x of [-4, 0, 4]) for (const z of [1.5, 5.5]) b.box(1.6, 0.06, 0.4, '#ffffff', { x, y: 5.12, z, mat: 'lamp' });
  // pump islands
  for (const x of [-2.5, 2.5]) {
    b.box(1.2, 0.25, 5, '#d0d0d0', { x, y: 0.12, z: 3.5 });
    for (const z of [2.3, 4.7]) {
      b.box(0.8, 1.7, 0.6, '#1d6fe0', { x, y: 1.1, z });
      b.box(0.82, 0.4, 0.62, '#ffffff', { x, y: 1.8, z });
      b.box(0.5, 0.3, 0.05, '#9cff9c', { x, y: 1.45, z: z + 0.31, mat: 'neon' });
      b.box(0.1, 0.5, 0.1, '#222', { x: x + 0.45, y: 1.1, z });
    }
    b.cyl(0.25, 0.25, 0.9, '#ffd21f', { x, y: 0.7, z: 3.5, seg: 8 }); // bollard
  }
  // EV charger
  b.box(0.6, 1.8, 0.4, '#2fbf71', { x: 9, y: 0.9, z: 4 });
  b.box(0.4, 0.4, 0.05, '#a8ffcf', { x: 9, y: 1.3, z: 4.21, mat: 'neon' });
  // price pylon
  b.box(0.5, 9, 0.5, '#9aa1a6', { x: 10.5, y: 4.5, z: 7.5 });
  b.box(2.8, 5, 0.6, '#1d6fe0', { x: 10.5, y: 8, z: 7.5 });
  const g = b.build();
  const top = textPlane('POLYTANK', 2.6, 0.9, { bg: '#ffd21f', fg: '#1d6fe0', px: 96 });
  top.position.set(10.5, 9.8, 7.81);
  const prices = new THREE.Group();
  ['SUPER 1,79', 'DIESEL 1,69', 'PLASMA 0,42'].forEach((s, i) => {
    const m = textPlane(s, 2.4, 0.7, { bg: '#0b0f1d', fg: i === 2 ? '#ff5fe0' : '#5dff8a', glow: true, px: 64 });
    m.position.set(10.5, 8.6 - i * 0.95, 7.81);
    prices.add(m);
  });
  g.add(top, prices);
  const canopy = textPlane('POLYTANK', 6, 0.75, { bg: '#1d6fe0', fg: '#ffffff', px: 96 });
  canopy.position.set(0, 5.6, 7.56);
  g.add(canopy);
  return selectable(g, B('Tankstelle', 'gas_station', 'createGasStation'));
}

/** Car wash tunnel 8 x 13 m (open along Z, entrance +Z), 3 colorful rotating brushes and foam bubbles. 6 meshes. */
export function createCarWash(): THREE.Object3D {
  const b = new Parts();
  const W = 8, D = 13, H = 5;
  b.box(W + 4, 0.12, D + 2, '#8d949b', { y: 0.06 });
  b.box(0.6, H, D, '#f4f4f4', { x: -W / 2, y: H / 2 });
  b.box(0.6, H, D, '#f4f4f4', { x: W / 2, y: H / 2 });
  b.box(W + 1, 0.8, D + 0.4, '#20b7e8', { y: H + 0.4 });
  // window strips
  for (const s of [-1, 1]) for (let i = 0; i < 4; i++) b.box(0.1, 1.2, 2, '#bfe6ff', { x: s * (W / 2 + 0.31), y: 3, z: -4.5 + i * 3, mat: 'glass' });
  // stripes
  b.box(W + 1.05, 0.25, D + 0.45, '#ffd21f', { y: H + 0.1 });
  // rails on floor
  b.box(0.2, 0.15, D, '#555', { x: -1.2, y: 0.15 });
  b.box(0.2, 0.15, D, '#555', { x: 1.2, y: 0.15 });
  // light-up arrow
  b.box(1.4, 0.3, 0.1, '#5dff8a', { y: H - 0.6, z: D / 2 + 0.02, mat: 'neon' });
  const g = b.build();
  const sign = textPlane('SCHAUMPARTY', 7.5, 0.7, { bg: '#20b7e8', fg: '#ffffff', px: 96 });
  sign.position.set(0, H + 0.4, D / 2 + 0.22);
  g.add(sign);

  const brushColors = ['#ff4fa8', '#4ab8ff', '#ffd23f', '#6bff8c'];
  const mkBrush = (len: number) => {
    const p = new Parts();
    p.cyl(0.12, 0.12, len, '#888', { seg: 6 });
    for (let k = 0; k < 10; k++) {
      const a = (k / 10) * TAU;
      p.box(0.22, len * 0.95, 0.75, brushColors[k % 4], { x: Math.cos(a) * 0.55, z: Math.sin(a) * 0.55, ry: -a });
    }
    return p;
  };
  const left = pivot(mkBrush(3.6), -2.6, 2.2, 1.5);
  const right = pivot(mkBrush(3.6), 2.6, 2.2, 1.5);
  const top = pivot(mkBrush(4.4), 0, 3.9, -2.5);
  top.rotation.z = Math.PI / 2;
  const topSpin = top.children[0];
  g.add(left, right, top);
  // foam bubbles at the exit
  const f = new Parts();
  const r = seeded(11);
  for (let i = 0; i < 14; i++) f.ico(0.3 + r() * 0.4, '#ffffff', { x: (r() - 0.5) * 6, y: r() * 2.5, z: (r() - 0.5) * 3, detail: 1 });
  const foam = pivot(f, 0, 0.4, -D / 2 + 1.5, false);
  g.add(foam);
  onTick((dt, t) => {
    left.rotation.y += dt * 4;
    right.rotation.y -= dt * 4;
    topSpin.rotation.y += dt * 3;
    foam.position.y = 0.4 + Math.sin(t * 2) * 0.2;
    foam.scale.setScalar(1 + Math.sin(t * 3) * 0.05);
  });
  return selectable(g, B('Waschstraße', 'car_wash', 'createCarWash'));
}

/** Fire station 20 x 14 m with 3 garage doors (front +Z), hose tower (~15 m), blinking blue light. 4 meshes. */
export function createFireStation(): THREE.Object3D {
  const b = new Parts();
  const W = 16, D = 14, H = 8;
  const RED = '#c83a2e', TRIM = '#f2e6d0';
  b.box(W, H, D, RED, { x: -2, y: H / 2 });
  b.box(W + 0.4, 0.5, D + 0.4, TRIM, { x: -2, y: H + 0.25 });
  b.box(W + 0.2, 0.4, D + 0.2, '#8f2a22', { x: -2, y: 0.2 });
  // doors
  for (let i = 0; i < 3; i++) {
    const x = -2 - 5 + i * 5;
    b.box(4.2, 4.6, 0.1, TRIM, { x, y: 2.3, z: D / 2 + 0.01 });
    b.box(3.8, 4.3, 0.12, '#e8e8e8', { x, y: 2.15, z: D / 2 + 0.02 });
    for (let k = 0; k < 5; k++) b.box(3.8, 0.05, 0.14, '#b9b9b9', { x, y: 0.6 + k * 0.8, z: D / 2 + 0.03 });
    b.box(3.4, 0.6, 0.14, '#bfe6ff', { x, y: 3.6, z: D / 2 + 0.04, mat: 'lamp' });
  }
  // upper windows
  windows(b, W - 2, D / 2 + 0.02, 6.0, 1, 6, { x0: -2, ww: 1.2, wh: 1.0 });
  // hose tower
  b.box(5, 15, 5, RED, { x: 8.5, y: 7.5, z: -3 });
  b.box(5.6, 0.5, 5.6, TRIM, { x: 8.5, y: 15.2, z: -3 });
  b.cone(4, 2.4, '#5b6770', { x: 8.5, y: 16.6, z: -3, seg: 4, ry: Math.PI / 4 });
  for (let k = 0; k < 4; k++) b.box(1.0, 1.4, 0.1, '#bfe6ff', { x: 8.5, y: 3 + k * 3, z: -0.48, mat: 'lamp' });
  // round clock
  b.cyl(0.9, 0.9, 0.12, '#ffffff', { x: 8.5, y: 13.2, z: -0.45, rx: Math.PI / 2, seg: 16 });
  b.box(0.08, 0.7, 0.05, '#111', { x: 8.5, y: 13.4, z: -0.37 });
  b.box(0.5, 0.08, 0.05, '#111', { x: 8.7, y: 13.2, z: -0.37 });
  // forecourt
  b.box(W, 0.06, 4, '#9aa1a6', { x: -2, y: 0.03, z: D / 2 + 2 });
  for (let i = 0; i < 3; i++) b.box(4, 0.02, 0.3, '#ffd21f', { x: -7 + i * 5, y: 0.07, z: D / 2 + 3.6 });
  const g = b.build();
  const sign = textPlane('FEUERWEHR', 9, 1.1, { bg: TRIM, fg: RED, px: 96 });
  sign.position.set(-2, H - 0.45, D / 2 + 0.06);
  g.add(sign);
  // blinking blue light on top
  const bl = new Parts().sphere(0.45, '#2f6bff', { mat: 'neon' }).build({ castShadow: false });
  bl.position.set(8.5, 18.1, -3);
  g.add(bl);
  onTick((dt, t) => (bl.visible = Math.floor(t * 3) % 2 === 0));
  return selectable(g, B('Feuerwache', 'fire_station', 'createFireStation'));
}

/** Water tower ~19 m on 4 braced legs, footprint 7 x 7. 2 meshes. */
export function createWaterTower(): THREE.Object3D {
  const b = new Parts();
  const L = '#7d8a93';
  const legs: [number, number][] = [[-2.6, -2.6], [2.6, -2.6], [-2.6, 2.6], [2.6, 2.6]];
  for (const [x, z] of legs) {
    b.beam({ x: x * 1.2, y: 0, z: z * 1.2 }, { x: x * 0.8, y: 11, z: z * 0.8 }, 0.35, L);
    b.box(1, 0.4, 1, '#aaa', { x: x * 1.2, y: 0.2, z: z * 1.2 });
  }
  for (const y of [3.5, 7.5]) {
    const k = 1.2 - (y / 11) * 0.4;
    for (let i = 0; i < 4; i++) {
      const [x1, z1] = legs[i], [x2, z2] = legs[(i + 1) % 4 === 2 ? 3 : (i + 1) % 4 === 3 ? 2 : (i + 1) % 4];
      b.beam({ x: x1 * k, y, z: z1 * k }, { x: x2 * k, y, z: z2 * k }, 0.18, L);
    }
  }
  // X bracing front
  b.beam({ x: -3.1, y: 0.5, z: 3.1 }, { x: 2.3, y: 10.5, z: 2.3 }, 0.12, L);
  b.beam({ x: 3.1, y: 0.5, z: 3.1 }, { x: -2.3, y: 10.5, z: 2.3 }, 0.12, L);
  b.cyl(0.4, 0.4, 11, '#5b6770', { y: 5.5, seg: 8 });
  // tank
  b.cyl(4, 4, 5.5, '#d9e3ea', { y: 13.8, seg: 16 });
  b.cyl(4.1, 4.1, 0.9, '#2f8fd6', { y: 14.5, seg: 16 });
  b.cone(4.4, 2.6, '#5b6770', { y: 17.85, seg: 16 });
  b.sphere(0.35, '#ffd21f', { y: 19.3 });
  b.cyl(4.6, 4.6, 0.2, '#5b6770', { y: 11.1, seg: 16 });
  // railing
  for (let i = 0; i < 20; i++) {
    const a = (i / 20) * TAU;
    b.box(0.06, 1, 0.06, '#5b6770', { x: Math.cos(a) * 4.5, y: 11.7, z: Math.sin(a) * 4.5 });
  }
  b.torus(4.5, 0.05, '#5b6770', { y: 12.2, rx: Math.PI / 2, rs: 3, ts: 24 });
  const g = b.build();
  const band = textPlane('POLYHAFEN', 5.5, 0.8, { bg: '#2f8fd6', fg: '#ffffff', px: 96 });
  band.position.set(0, 14.5, 4.12);
  g.add(band);
  return selectable(g, B('Wasserturm', 'water_tower', 'createWaterTower'));
}

/** Cinema "POLYPLEX" 16 x 14 m, ~13 m high with vertical neon sign, marquee with chasing bulbs and giant popcorn bucket on the roof. 8 meshes. */
export function createCinema(): THREE.Object3D {
  const b = new Parts();
  const W = 16, D = 14, H = 10;
  b.box(W, H, D, '#4b3672', { y: H / 2 });
  b.box(W + 0.4, 0.6, D + 0.4, '#2a1d40', { y: H + 0.3 });
  b.box(W + 0.5, 0.2, D + 0.5, '#ffd23f', { y: H + 0.05 });
  // art deco pilasters
  for (let i = 0; i < 5; i++) b.box(0.6, H, 0.3, '#5a3f88', { x: -W / 2 + 0.5 + i * ((W - 1) / 4), y: H / 2, z: D / 2 + 0.1 });
  // entrance doors
  for (const x of [-2.4, 0, 2.4]) b.box(2, 2.8, 0.12, '#ffe7b0', { x, y: 1.4, z: D / 2 + 0.05, mat: 'lamp' });
  // marquee canopy
  b.box(13, 1.4, 3.2, '#c8322b', { y: 4.0, z: D / 2 + 1.6 });
  b.box(12.6, 0.15, 3.0, '#ffe7b0', { y: 3.25, z: D / 2 + 1.6, mat: 'lamp' });
  // poster frames
  for (const s of [-1, 1]) {
    b.box(2.2, 3.0, 0.15, '#ffd23f', { x: s * 6.2, y: 2.0, z: D / 2 + 0.1 });
    b.box(1.9, 2.7, 0.17, s < 0 ? '#ff5fa2' : '#4ab8ff', { x: s * 6.2, y: 2.0, z: D / 2 + 0.12, mat: 'lamp' });
  }
  // red carpet + stanchions
  b.box(3, 0.04, 4, '#c8322b', { y: 0.02, z: D / 2 + 2 });
  for (const s of [-1, 1]) for (let k = 0; k < 3; k++) {
    b.cyl(0.07, 0.07, 1, '#ffd23f', { x: s * 1.8, y: 0.5, z: D / 2 + 0.8 + k * 1.4, seg: 6 });
    b.sphere(0.1, '#ffd23f', { x: s * 1.8, y: 1.05, z: D / 2 + 0.8 + k * 1.4 });
  }
  // vertical sign blade
  b.box(1.8, 9, 0.6, '#ffd23f', { y: H + 2.5, z: D / 2 + 0.4 });
  // giant popcorn bucket on roof
  const PX = -4.5, PZ = -3;
  for (let k = 0; k < 12; k++) {
    const a = (k / 12) * TAU;
    b.box(0.95, 4, 0.2, k % 2 ? '#ffffff' : '#e8322b', { x: PX + Math.cos(a) * 1.7, y: H + 2.6, z: PZ + Math.sin(a) * 1.7, ry: -a + Math.PI / 2, rx: 0 , sx: 1 });
  }
  b.cyl(1.75, 1.35, 4, '#e8322b', { x: PX, y: H + 2.6, z: PZ, seg: 12, sx: 0.98, sz: 0.98 });
  const r = seeded(5);
  for (let i = 0; i < 24; i++) b.ico(0.45 + r() * 0.2, i % 5 ? '#fff6d5' : '#ffd760', { x: PX + (r() - 0.5) * 3, y: H + 4.8 + r() * 1.2, z: PZ + (r() - 0.5) * 3, detail: 0 });
  const g = b.build();
  const v = textPlane('POLYPLEX', 8.4, 1.4, { bg: '#ffd23f', fg: '#c8322b', px: 96 });
  v.rotation.z = Math.PI / 2;
  v.position.set(0, H + 2.5, D / 2 + 0.71);
  g.add(v);
  const now = textPlane('HEUTE: DIE RACHE DER DREIECKE', 12, 1.0, { bg: '#fff6d5', fg: '#1b1f3a', px: 64 });
  now.position.set(0, 4.0, D / 2 + 3.22);
  g.add(now);
  // chasing bulbs: two alternating meshes
  const mk = (odd: number) => {
    const p = new Parts();
    let k = 0;
    for (let i = 0; i <= 24; i++) {
      if (i % 2 !== odd) continue;
      p.sphere(0.12, '#fff3a0', { x: -6.3 + i * (12.6 / 24), y: 4.75, z: D / 2 + 3.2, w: 6, hseg: 4, mat: 'neon' });
      k++;
    }
    for (let i = 0; i <= 18; i++) {
      if (i % 2 !== odd) continue;
      p.sphere(0.13, '#fff3a0', { x: 0.95, y: H - 1.8 + i * 0.5, z: D / 2 + 0.75, w: 6, hseg: 4, mat: 'neon' });
      p.sphere(0.13, '#fff3a0', { x: -0.95, y: H - 1.8 + i * 0.5, z: D / 2 + 0.75, w: 6, hseg: 4, mat: 'neon' });
    }
    return p.build({ castShadow: false });
  };
  const ba = mk(0), bb = mk(1);
  g.add(ba, bb);
  onTick((dt, t) => {
    const on = Math.floor(t * 4) % 2 === 0;
    ba.visible = on; bb.visible = !on;
  });
  return selectable(g, B('Kino', 'cinema', 'createCinema'));
}

/** Radio tower ~36 m lattice mast, red/white, blinking red top light. Footprint 4 x 4. 2 meshes. */
export function createRadioTower(): THREE.Object3D {
  const b = new Parts();
  const H = 34, seg = 8;
  const w = (y: number) => 2 - (y / H) * 1.5;
  for (let s = 0; s < seg; s++) {
    const y0 = (s / seg) * H, y1 = ((s + 1) / seg) * H;
    const c = s % 2 ? '#ffffff' : '#e3342f';
    const a = w(y0), bb = w(y1);
    const corners = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
    for (let i = 0; i < 4; i++) {
      const [x1, z1] = corners[i], [x2, z2] = corners[(i + 1) % 4];
      b.beam({ x: x1 * a, y: y0, z: z1 * a }, { x: x1 * bb, y: y1, z: z1 * bb }, 0.22, c);
      b.beam({ x: x1 * a, y: y0, z: z1 * a }, { x: x2 * bb, y: y1, z: z2 * bb }, 0.09, c);
      b.beam({ x: x1 * bb, y: y1, z: z1 * bb }, { x: x2 * bb, y: y1, z: z2 * bb }, 0.12, c);
    }
  }
  // dishes + antenna
  b.cyl(0.9, 0.2, 0.4, '#e6e6e6', { x: 0.9, y: 20, z: 0.6, rx: Math.PI / 2, seg: 10 });
  b.cyl(0.7, 0.15, 0.35, '#e6e6e6', { x: -0.7, y: 25, z: 0.5, rx: Math.PI / 2, rz: 0.6, seg: 10 });
  b.cyl(0.08, 0.08, 5, '#aaa', { y: H + 2.5, seg: 5 });
  b.box(2.2, 0.15, 2.2, '#888', { y: 0.08 });
  const g = b.build();
  const light = new Parts();
  light.sphere(0.35, '#ff2020', { y: H + 5.1, mat: 'neon' });
  light.sphere(0.25, '#ff2020', { y: H * 0.55, x: 1.3, mat: 'neon' });
  const lm = light.build({ castShadow: false });
  g.add(lm);
  onTick((dt, t) => (lm.visible = (t % 1.6) < 0.5));
  return selectable(g, B('Funkturm', 'radio_tower', 'createRadioTower'));
}

/** Rooftop helipad 12 x 12 x 0.5 m with H, yellow circle, edge lights and windsock. Category Verkehr. 3 meshes. */
export function createHelipad(): THREE.Object3D {
  const b = new Parts();
  b.box(12, 0.4, 12, '#3a3f47', { y: 0.2 });
  b.torus(4.6, 0.25, '#ffd21f', { y: 0.42, rx: Math.PI / 2, rs: 3, ts: 32, sz: 0.2 });
  b.box(0.7, 0.04, 4.2, '#ffffff', { x: -1.2, y: 0.42 });
  b.box(0.7, 0.04, 4.2, '#ffffff', { x: 1.2, y: 0.42 });
  b.box(1.8, 0.04, 0.7, '#ffffff', { y: 0.42 });
  for (let i = 0; i < 16; i++) {
    const side = Math.floor(i / 4), k = (i % 4) / 4 - 0.375;
    const x = side === 0 ? k * 12 : side === 1 ? 5.8 : side === 2 ? -k * 12 : -5.8;
    const z = side === 0 ? -5.8 : side === 1 ? k * 12 : side === 2 ? 5.8 : -k * 12;
    b.cyl(0.12, 0.12, 0.2, '#7dff9a', { x, y: 0.5, z, seg: 6, mat: 'neon' });
  }
  // windsock
  b.cyl(0.05, 0.05, 3, '#ccc', { x: 5.5, y: 1.9, z: -5.5, seg: 5 });
  const g = b.build({ castShadow: false });
  const s = new Parts();
  s.cyl(0.3, 0.15, 0.6, '#ff7a1a', { y: 0.3, seg: 8 });
  s.cyl(0.15, 0.1, 0.6, '#ffffff', { y: 0.9, seg: 8 });
  s.cyl(0.1, 0.06, 0.5, '#ff7a1a', { y: 1.45, seg: 8 });
  const sock = pivot(s, 5.5, 3.3, -5.5);
  sock.rotation.z = -1.3;
  g.add(sock);
  onTick((dt, t) => {
    sock.rotation.z = -1.3 + Math.sin(t * 3) * 0.1;
    sock.rotation.y = Math.sin(t * 0.5) * 0.4;
  });
  return selectable(g, { type: 'Hubschrauberlandeplatz', key: 'helipad', category: 'Verkehr', source: 'prozedural', model: 'createHelipad' });
}
