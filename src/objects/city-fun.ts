import * as THREE from 'three';
import { Parts } from '../core/parts';
import { selectable } from '../core/registry';
import { onTick, env } from '../core/anim';
import { textPlane, pivot, seeded, TAU } from './city-util';
import { buildPerson, createPerson } from './city-life';

/** Giant retro robot statue ~21 m on a 9 x 9 m plaza pedestal. Head turns, eyes glow, right arm waves every ~14 s. ~9 meshes. */
export function createGiantRobot(): THREE.Object3D {
  const b = new Parts();
  const BLUE = '#2f6fd6', RED = '#e8403a', SIL = '#c9d3dc', DARK = '#3a4450';
  // pedestal
  b.box(9, 1.6, 9, '#b9b4aa', { y: 0.8 });
  b.box(9.6, 0.3, 9.6, '#9f9a90', { y: 0.15 });
  b.box(7.5, 0.4, 7.5, '#cfcac0', { y: 1.8 });
  // feet + legs
  for (const s of [-1, 1]) {
    const x = s * 1.5;
    b.box(2.0, 1.0, 3.0, RED, { x, y: 2.5, z: 0.3 });
    b.box(1.4, 3.6, 1.4, SIL, { x, y: 4.8, mat: 'metal' });
    for (let k = 0; k < 3; k++) b.box(1.5, 0.15, 1.5, DARK, { x, y: 3.8 + k * 0.9 });
    b.sphere(0.9, RED, { x, y: 6.8 });
    b.box(1.6, 3.2, 1.6, BLUE, { x, y: 8.6 });
  }
  b.box(4.6, 1.5, 2.4, DARK, { y: 10.6 });
  // torso
  b.box(5.6, 5, 3.2, BLUE, { y: 13.6 });
  b.box(4.4, 2.4, 0.2, SIL, { y: 14.2, z: 1.65, mat: 'metal' });
  b.cyl(0.9, 0.9, 0.3, '#5ff8ff', { y: 14.2, z: 1.75, rx: Math.PI / 2, seg: 14, mat: 'neon' });
  for (let i = 0; i < 4; i++) b.box(0.4, 0.4, 0.15, ['#ffe14d', '#5dff8a', '#ff5fa2', '#5ff8ff'][i], { x: -1.5 + i * 1.0, y: 12.4, z: 1.7, mat: 'neon' });
  b.box(5.8, 0.5, 3.4, RED, { y: 11.3 });
  // left arm (static, hanging, holding a tiny car)
  b.sphere(1.0, RED, { x: -3.6, y: 15.4 });
  b.box(1.1, 3.0, 1.1, SIL, { x: -3.9, y: 13.4, mat: 'metal' });
  b.box(1.3, 2.6, 1.3, BLUE, { x: -3.9, y: 10.8, z: 0.5, rx: -0.5 });
  b.box(1.4, 0.8, 1.4, DARK, { x: -3.9, y: 9.6, z: 1.4 });
  b.box(1.2, 0.7, 2.0, '#ffd23f', { x: -3.9, y: 10.3, z: 1.9 }); // toy car in hand
  b.cyl(0.25, 0.25, 1.4, '#222', { x: -3.9, y: 9.95, z: 1.3, rz: Math.PI / 2, seg: 8 });
  b.cyl(0.25, 0.25, 1.4, '#222', { x: -3.9, y: 9.95, z: 2.5, rz: Math.PI / 2, seg: 8 });
  b.box(0.8, 0.3, 0.8, DARK, { y: 16.3 });
  const g = b.build();
  const plaque = textPlane('ROBO-1 · Hüter von Polyhafen', 6, 0.7, { bg: '#c9a54a', fg: '#3a2a10', px: 64 });
  plaque.position.set(0, 0.85, 4.52);
  g.add(plaque);

  // head
  const h = new Parts();
  h.box(3.0, 2.4, 2.6, SIL, { y: 1.2, mat: 'metal' });
  h.box(2.5, 0.6, 0.2, '#5ff8ff', { y: 1.4, z: 1.32, mat: 'neon' });
  h.box(1.6, 0.25, 0.1, DARK, { y: 0.55, z: 1.32 });
  for (let i = 0; i < 4; i++) h.box(0.12, 0.25, 0.12, '#ffffff', { x: -0.6 + i * 0.4, y: 0.55, z: 1.36 });
  for (const s of [-1, 1]) h.cyl(0.5, 0.5, 0.4, RED, { x: s * 1.6, y: 1.2, rz: Math.PI / 2, seg: 10 });
  h.cyl(0.07, 0.07, 1.4, DARK, { y: 3.0, seg: 5 });
  const head = pivot(h, 0, 16.4, 0);
  const ant = new Parts().sphere(0.3, '#ff3b3b', { mat: 'neon' }).build({ castShadow: false });
  ant.position.y = 3.8;
  head.add(ant);
  g.add(head);

  // right arm (waves)
  const a = new Parts();
  a.sphere(1.0, RED);
  a.box(1.1, 3.0, 1.1, SIL, { y: -2.0, mat: 'metal' });
  a.box(1.3, 2.6, 1.3, BLUE, { y: -4.6 });
  a.box(1.5, 1.0, 0.6, DARK, { y: -6.3 });
  for (let i = 0; i < 3; i++) a.box(0.3, 0.7, 0.3, DARK, { x: -0.5 + i * 0.5, y: -7.0 });
  const arm = pivot(a, 3.6, 15.4, 0);
  g.add(arm);

  onTick((dt, t) => {
    head.rotation.y = Math.sin(t * 0.35) * 0.7;
    ant.visible = Math.floor(t * 2) % 2 === 0;
    const k = t % 14;
    let lift = 0;
    if (k < 1) lift = k; else if (k < 5) lift = 1; else if (k < 6) lift = 6 - k;
    const e = lift * lift * (3 - 2 * lift);
    arm.rotation.z = e * 2.6 + (lift >= 1 ? Math.sin(t * 6) * 0.25 : 0);
  });
  return selectable(g, { type: 'Riesenroboter', key: 'giant_robot', category: 'Kurioses', source: 'prozedural', model: 'createGiantRobot' });
}

/** Basketball court 18 x 10 m (long axis X) with two hoops, fence posts and a dribbling ball. 3 meshes. */
export function createBasketballCourt(): THREE.Object3D {
  const b = new Parts();
  const L = '#ffffff';
  b.box(19, 0.1, 11, '#2f6fd6', { y: 0.05 });
  b.box(16, 0.02, 8.6, '#e88a3a', { y: 0.11 });
  for (const s of [-1, 1]) {
    b.box(4.2, 0.022, 3.4, '#2f6fd6', { x: s * 5.9, y: 0.115 });
    b.torus(4.4, 0.06, L, { x: s * 8, y: 0.12, rx: Math.PI / 2, rz: s > 0 ? Math.PI / 2 : -Math.PI / 2, arc: Math.PI, rs: 2, ts: 18, sz: 0.3 });
  }
  b.torus(1.5, 0.06, L, { y: 0.12, rx: Math.PI / 2, rs: 2, ts: 18, sz: 0.3 });
  b.box(0.1, 0.02, 8.6, L, { y: 0.125 });
  b.box(16, 0.02, 0.1, L, { y: 0.125, z: 4.3 });
  b.box(16, 0.02, 0.1, L, { y: 0.125, z: -4.3 });
  b.box(0.1, 0.02, 8.6, L, { y: 0.125, x: 8 });
  b.box(0.1, 0.02, 8.6, L, { y: 0.125, x: -8 });
  for (const s of [-1, 1]) {
    const x = s * 8.9;
    b.box(0.25, 3.6, 0.25, '#555', { x, y: 1.8 });
    b.box(0.25, 0.25, 1.0, '#555', { x: x - s * 0.5, y: 3.5, rx: 0, ry: Math.PI / 2 });
    b.box(0.1, 1.2, 1.8, L, { x: x - s * 0.9, y: 3.6 });
    b.box(0.11, 0.5, 0.7, '#e8403a', { x: x - s * 0.9, y: 3.35 });
    b.torus(0.28, 0.035, '#ff6a1a', { x: x - s * 1.3, y: 3.05, rx: Math.PI / 2, rs: 4, ts: 12 });
    b.cyl(0.28, 0.18, 0.45, '#f4f4f4', { x: x - s * 1.3, y: 2.8, open: true, seg: 8, mat: 'glass' });
  }
  for (let i = 0; i <= 10; i++) for (const z of [-5.4, 5.4]) b.box(0.08, 2.4, 0.08, '#7a858d', { x: -9.4 + i * 1.88, y: 1.2, z });
  b.box(18.8, 0.06, 0.06, '#7a858d', { y: 2.4, z: -5.4 });
  b.box(1.8, 0.4, 0.4, '#c98a4b', { x: -3, y: 0.3, z: -4.9 });
  const g = b.build();
  const ball = new Parts().sphere(0.13, '#ff6a1a', { w: 10, hseg: 7 }).build();
  g.add(ball);
  onTick((dt, t) => {
    const x = Math.sin(t * 0.5) * 6;
    ball.position.set(x, 0.25 + Math.abs(Math.sin(t * 5)) * 0.9, Math.sin(t * 0.8) * 2);
  });
  return selectable(g, { type: 'Basketballplatz', key: 'basketball_court', category: 'Attraktion', source: 'prozedural', model: 'createBasketballCourt' });
}

/** Skate park 16 x 12 m: halfpipe (along X, back) + funbox & rail (front). A skater (separately selectable Person) rides the halfpipe. ~8 meshes. */
export function createSkatePark(): THREE.Object3D {
  const b = new Parts();
  const C = '#c4c8cc', CD = '#a9aeb3';
  b.box(16, 0.15, 12, CD, { y: 0.075 });
  const R = 3.5, F = 2.5;
  const sh = new THREE.Shape();
  sh.moveTo(-F - R - 0.6, 0); sh.lineTo(-F - R - 0.6, R + 0.1); sh.lineTo(-F - R, R + 0.1);
  for (let i = 0; i <= 10; i++) { const a = Math.PI + (i / 10) * (Math.PI / 2); sh.lineTo(-F + R * Math.cos(a), R + R * Math.sin(a)); }
  sh.lineTo(F, 0);
  for (let i = 0; i <= 10; i++) { const a = 1.5 * Math.PI + (i / 10) * (Math.PI / 2); sh.lineTo(F + R * Math.cos(a), R + R * Math.sin(a)); }
  sh.lineTo(F + R + 0.6, R + 0.1); sh.lineTo(F + R + 0.6, 0); sh.lineTo(-F - R - 0.6, 0);
  b.extrude(sh, 6, C, { z: -5.5, y: 0.15 });
  for (const s of [-1, 1]) {
    b.cyl(0.08, 0.08, 6, '#7a858d', { x: s * (F + R), y: R + 0.2, z: -2.5, rx: Math.PI / 2, seg: 6 });
    // graffiti stripes on the sides
    b.box(3, 0.6, 0.05, s < 0 ? '#ff4fa8' : '#5dff8a', { x: s * 4.5, y: 1.4, z: 0.53, rz: s * 0.4 });
    b.box(2, 0.5, 0.05, '#4ab8ff', { x: s * 5, y: 2.3, z: 0.53, rz: -s * 0.2 });
    // deck railing
    b.box(0.06, 1, 6, '#ffd23f', { x: s * (F + R + 0.55), y: R + 0.7, z: -2.5 });
  }
  // funbox
  b.box(4, 0.8, 2.5, C, { y: 0.55, z: 3.5 });
  const w = new THREE.Shape();
  w.moveTo(0, 0); w.lineTo(2, 0); w.lineTo(2, 0.8); w.lineTo(0, 0);
  b.extrude(w, 2.5, CD, { x: 2, z: 2.25, y: 0.15 });
  b.extrude(w, 2.5, CD, { x: -2, z: 4.75, y: 0.15, ry: Math.PI });
  // rail
  b.box(5, 0.08, 0.08, '#ff6a1a', { x: 0, y: 0.9, z: 5.5 });
  for (const x of [-2.2, 2.2]) b.box(0.08, 0.75, 0.08, '#555', { x, y: 0.5, z: 5.5 });
  const g = b.build();
  const tag = textPlane('POLY SK8', 3.4, 0.9, { bg: '#1b1f3a', fg: '#ffe14d', px: 64 });
  tag.position.set(0, 0.55, 4.76);
  g.add(tag);

  // skater
  const skater = new THREE.Group();
  const board = new Parts();
  board.box(0.95, 0.05, 0.26, '#e8403a', { y: 0.12 });
  for (const x of [-0.32, 0.32]) for (const z of [-0.09, 0.09]) board.cyl(0.05, 0.05, 0.05, '#ffe14d', { x, y: 0.05, z, rx: Math.PI / 2, seg: 6 });
  skater.add(board.build());
  const person = createPerson(4242, { pose: 'still', variant: 'Skater', hat: 0 });
  person.userData.selectBoundary = true;
  person.position.y = 0.15;
  const limbs = person.userData.limbs as Record<string, THREE.Object3D>;
  limbs.aL.rotation.z = -1.1; limbs.aR.rotation.z = 1.1;
  limbs.lL.rotation.z = -0.2; limbs.lR.rotation.z = 0.2;
  skater.add(person);
  g.add(skater);
  const zc = -2.5;
  onTick((dt, t) => {
    const u = Math.sin(t * 1.5);
    const x = u * (F + R * 0.82);
    const ax = Math.abs(x);
    let y = 0.15, ang = 0;
    if (ax > F) {
      const dx = ax - F;
      y = 0.15 + R - Math.sqrt(Math.max(0, R * R - dx * dx));
      ang = Math.asin(Math.min(1, dx / R)) * Math.sign(x);
    }
    skater.position.set(x, y, zc);
    skater.rotation.z = ang;
    person.rotation.y = Math.sign(Math.cos(t * 1.5)) > 0 ? 0 : Math.PI;
  });
  return selectable(g, { type: 'Skatepark', key: 'skate_park', category: 'Attraktion', source: 'prozedural', model: 'createSkatePark' });
}

/** Backyard pool: deck 10 x 7 m, water 8 x 5 m, diving board, ladder, lounger + floating flamingo. 5 meshes. */
export function createSwimmingPool(): THREE.Object3D {
  const b = new Parts();
  const T = '#f2efe8';
  b.box(10, 0.4, 1, T, { y: 0.2, z: -3 });
  b.box(10, 0.4, 1, T, { y: 0.2, z: 3 });
  b.box(1, 0.4, 5, T, { y: 0.2, x: -4.5 });
  b.box(1, 0.4, 5, T, { y: 0.2, x: 4.5 });
  b.box(8, 0.05, 5, '#7fe6ff', { y: 0.03, mat: 'lamp' });
  b.box(8, 0.3, 5, '#38c6f0', { y: 0.2, mat: 'water' });
  // lane tiles
  for (let i = 0; i < 4; i++) b.box(7, 0.06, 0.12, '#2a7fd6', { y: 0.07, z: -1.8 + i * 1.2 });
  // ladder
  for (const z of [-0.3, 0.3]) {
    b.beam({ x: 3.6, y: 0.0, z }, { x: 3.75, y: 0.9, z }, 0.05, '#cfd8e0', 'metal');
    b.beam({ x: 3.75, y: 0.9, z }, { x: 4.3, y: 0.9, z }, 0.05, '#cfd8e0', 'metal');
  }
  // diving board
  b.box(0.8, 0.5, 0.8, '#5b6770', { x: -4.5, y: 0.65 });
  b.box(3, 0.1, 0.6, '#4ab8ff', { x: -3.3, y: 0.95 });
  // lounger + parasol
  b.box(0.8, 0.12, 2, '#ffffff', { x: 3, y: 0.55, z: 3.3, ry: Math.PI / 2 });
  b.box(0.8, 0.12, 0.9, '#ffffff', { x: 4.0, y: 0.8, z: 3.3, ry: Math.PI / 2, rx: 0.6 });
  b.cyl(0.04, 0.04, 2.4, '#eee', { x: 1.3, y: 1.5, z: 3.2, seg: 5 });
  b.cone(1.3, 0.5, '#ff5fa2', { x: 1.3, y: 2.7, z: 3.2, seg: 8 });
  const g = b.build();
  const f = new Parts();
  f.torus(0.6, 0.25, '#ff7ab8', { rx: Math.PI / 2, rs: 6, ts: 12 });
  f.beam({ x: 0.5, y: 0.1, z: 0 }, { x: 0.65, y: 0.9, z: 0 }, 0.16, '#ff7ab8');
  f.beam({ x: 0.65, y: 0.9, z: 0 }, { x: 0.45, y: 1.3, z: 0 }, 0.16, '#ff7ab8');
  f.sphere(0.18, '#ff7ab8', { x: 0.42, y: 1.38 });
  f.cone(0.08, 0.28, '#222', { x: 0.25, y: 1.3, rz: 2.2, seg: 5 });
  f.box(0.04, 0.04, 0.04, '#111', { x: 0.45, y: 1.45, z: 0.15 });
  const fl = pivot(f, 0, 0.45, 0);
  g.add(fl);
  onTick((dt, t) => {
    fl.position.set(Math.sin(t * 0.13) * 2.4, 0.42 + Math.sin(t * 1.6) * 0.04, Math.sin(t * 0.21) * 1.2);
    fl.rotation.y = t * 0.15;
    fl.rotation.z = Math.sin(t * 1.3) * 0.05;
  });
  return selectable(g, { type: 'Swimmingpool', key: 'swimming_pool', category: 'Attraktion', source: 'prozedural', model: 'createSwimmingPool' });
}

/** Trampoline Ø3.6 m with safety net and a bouncing kid (separately selectable Person, variant "Kind"). 4 meshes. */
export function createTrampoline(): THREE.Object3D {
  const b = new Parts();
  const R = 1.8;
  b.torus(R, 0.07, '#9aa4ab', { y: 0.8, rx: Math.PI / 2, rs: 4, ts: 20, mat: 'metal' });
  b.cyl(R - 0.1, R - 0.1, 0.04, '#1d1d1d', { y: 0.78, seg: 20 });
  b.torus(R, 0.18, '#2c8ef8', { y: 0.85, rx: Math.PI / 2, rs: 4, ts: 20, sz: 0.4 });
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * TAU;
    b.beam({ x: Math.cos(a) * R, y: 0, z: Math.sin(a) * R }, { x: Math.cos(a) * R, y: 0.8, z: Math.sin(a) * R }, 0.07, '#9aa4ab');
    b.beam({ x: Math.cos(a) * R, y: 0.8, z: Math.sin(a) * R }, { x: Math.cos(a) * R, y: 2.6, z: Math.sin(a) * R }, 0.05, '#2c8ef8');
  }
  b.torus(R, 0.04, '#2c8ef8', { y: 2.6, rx: Math.PI / 2, rs: 3, ts: 20 });
  for (let i = 0; i < 24; i++) { const a = (i / 24) * TAU; b.box(0.02, 1.8, 0.02, '#e8f2ff', { x: Math.cos(a) * R, y: 1.7, z: Math.sin(a) * R }); }
  b.torus(R, 0.02, '#e8f2ff', { y: 1.7, rx: Math.PI / 2, rs: 3, ts: 24 });
  const g = b.build();
  const kid = createPerson(77, { pose: 'still', variant: 'Kind' });
  kid.userData.selectBoundary = true;
  kid.scale.setScalar(0.62);
  const limbs = kid.userData.limbs as Record<string, THREE.Object3D>;
  g.add(kid);
  onTick((dt, t) => {
    const p = (t * 1.3) % 1;
    const h = 4 * p * (1 - p);
    kid.position.y = 0.8 + h * 1.4;
    limbs.aL.rotation.z = -0.4 - h * 2.2;
    limbs.aR.rotation.z = 0.4 + h * 2.2;
    limbs.lL.rotation.x = limbs.lR.rotation.x = h < 0.3 ? -0.5 : 0;
    kid.rotation.y = t * 0.6;
  });
  return selectable(g, { type: 'Trampolin', key: 'trampoline', category: 'Attraktion', source: 'prozedural', model: 'createTrampoline' });
}

/** Parked food truck ~6.5 x 2.6 m (long axis X, serving window on +Z side, cab at +X) with a giant taco or hot dog on the roof. ~6 meshes. */
export function createFoodTruck(kind: 'taco' | 'hotdog' = 'taco'): THREE.Object3D {
  const taco = kind === 'taco';
  const C1 = taco ? '#13b5a3' : '#e8403a', C2 = taco ? '#ff9b1a' : '#ffd23f';
  const b = new Parts();
  b.box(4.6, 2.5, 2.4, C1, { x: -0.6, y: 2.0 });
  b.box(4.62, 0.4, 2.42, C2, { x: -0.6, y: 1.0 });
  b.box(1.7, 1.9, 2.3, C1, { x: 2.5, y: 1.7 });
  b.box(0.1, 0.9, 2.0, '#bfe6ff', { x: 3.36, y: 2.1, mat: 'glass' });
  b.box(1.2, 0.8, 0.06, '#bfe6ff', { x: 2.5, y: 2.1, z: 1.16, mat: 'glass' });
  b.box(0.15, 0.3, 2.0, '#ccc', { x: 3.4, y: 1.0 });
  b.box(0.06, 0.2, 0.4, '#fff6d0', { x: 3.43, y: 1.35, z: 0.8, mat: 'lamp' });
  b.box(0.06, 0.2, 0.4, '#fff6d0', { x: 3.43, y: 1.35, z: -0.8, mat: 'lamp' });
  for (const x of [-2.1, 2.4]) for (const z of [-1.15, 1.15]) {
    b.cyl(0.45, 0.45, 0.3, '#222', { x, y: 0.45, z, rx: Math.PI / 2, seg: 10 });
    b.cyl(0.22, 0.22, 0.32, '#bbb', { x, y: 0.45, z, rx: Math.PI / 2, seg: 8 });
  }
  // serving window
  b.box(2.8, 1.1, 0.06, '#fff0c0', { x: -0.7, y: 2.3, z: 1.2, mat: 'lamp' });
  b.box(3.0, 0.08, 1.0, C2, { x: -0.7, y: 3.15, z: 1.65, rx: -0.5 });
  b.box(3.0, 0.1, 0.5, '#d9c3a0', { x: -0.7, y: 1.72, z: 1.42 });
  b.box(0.8, 0.9, 0.06, '#1b1f3a', { x: -2.4, y: 1.0, z: 1.6, rx: 0.2 }); // A-board menu
  b.box(0.6, 0.06, 0.03, '#ffffff', { x: -2.4, y: 1.2, z: 1.65, rx: 0.2 });
  b.box(0.5, 0.06, 0.03, '#ffffff', { x: -2.4, y: 1.0, z: 1.65, rx: 0.2 });
  // string lights
  for (let i = 0; i < 9; i++) b.sphere(0.07, ['#ff5fa2', '#ffe14d', '#5dff8a'][i % 3], { x: -2.6 + i * 0.5, y: 3.18 - Math.sin((i / 8) * Math.PI) * 0.15, z: 1.25, mat: 'neon', w: 5, hseg: 3 });
  // roof food
  if (taco) {
    for (const s of [-1, 1]) b.add(new THREE.CylinderGeometry(1.7, 1.7, 0.18, 16, 1, false, Math.PI / 2, Math.PI), '#f2c14e', { x: -0.6, y: 3.6, z: s * 0.35, rx: -Math.PI / 2 + s * 0.2 });
    const r = seeded(4);
    for (let i = 0; i < 16; i++) b.ico(0.25 + r() * 0.12, ['#4fbf3a', '#4fbf3a', '#e8322b', '#ffd23f', '#7a4a2a'][i % 5], { x: -2.0 + (i / 15) * 2.8, y: 4.7 + r() * 0.35 - Math.abs(i - 7.5) * 0.06, z: (r() - 0.5) * 0.4 });
  } else {
    for (const s of [-1, 1]) b.add(new THREE.CapsuleGeometry(0.5, 3.0, 4, 10), '#e0a050', { x: -0.6, y: 3.85, z: s * 0.42, rz: Math.PI / 2 });
    b.add(new THREE.CapsuleGeometry(0.38, 3.9, 4, 10), '#b8432f', { x: -0.6, y: 4.25, rz: Math.PI / 2 });
    for (let i = 0; i < 10; i++) b.box(0.45, 0.06, 0.1, '#ffd21f', { x: -2.4 + i * 0.4, y: 4.64, z: (i % 2 ? 0.08 : -0.08), ry: i % 2 ? 0.6 : -0.6 });
  }
  b.box(0.2, 0.6, 0.2, '#555', { x: -0.6, y: 3.4 });
  const g = b.build();
  const sign = textPlane(taco ? 'TACO LOCO' : 'HOT DOG HELGA', 3.0, 0.5, { bg: C2, fg: '#1b1f3a', px: 64 });
  sign.position.set(-0.7, 2.95, 1.215);
  g.add(sign);
  onTick((dt, t) => {
    // a gentle "breathing" bob of the roof food via sign glow
    (sign.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.15 + env.night * 0.7;
  });
  return selectable(g, { type: 'Imbisswagen', key: 'food_truck', category: 'Fahrzeug', source: 'prozedural', model: 'createFoodTruck', variant: taco ? 'Taco' : 'Hot Dog' });
}

/** Giant orange tabby cat ~7.5 m sitting (for a rooftop), faces +Z. Tail swishes, head tilts, eyes glow. Footprint ~5 x 7. 3 meshes. */
export function createGiantCat(): THREE.Object3D {
  const O = '#f29a3a', S = '#c8691e', W = '#fff3e0';
  const b = new Parts();
  b.sphere(2.4, O, { y: 2.6, sy: 1.15, sz: 1.1, w: 12, hseg: 9 });
  b.sphere(1.5, W, { y: 2.8, z: 1.4, sy: 1.2, sx: 1.1, w: 10, hseg: 7 });
  for (let i = 0; i < 4; i++) b.box(4.9, 0.35, 3.0, S, { y: 1.6 + i * 1.0, z: -0.8, sx: 1 - i * 0.12 });
  // haunches + paws
  for (const s of [-1, 1]) {
    b.sphere(1.3, O, { x: s * 1.7, y: 1.2, z: 0.3, sz: 1.4, w: 10, hseg: 7 });
    b.box(0.8, 0.6, 1.2, W, { x: s * 0.7, y: 0.3, z: 2.0 });
    b.box(0.9, 0.5, 1.3, W, { x: s * 1.9, y: 0.25, z: 1.7 });
  }
  const g = b.build();
  const h = new Parts();
  h.sphere(1.7, O, { sx: 1.15, sz: 0.95, w: 12, hseg: 9 });
  h.sphere(0.8, W, { y: -0.55, z: 1.15, sx: 1.2, sy: 0.75 });
  for (const s of [-1, 1]) {
    h.cone(0.7, 1.3, O, { x: s * 1.1, y: 1.5, rz: -s * 0.35, seg: 4 });
    h.cone(0.4, 0.8, '#ffb6c8', { x: s * 1.05, y: 1.45, z: 0.15, rz: -s * 0.35, seg: 4 });
    h.sphere(0.36, '#5dff8a', { x: s * 0.62, y: 0.25, z: 1.38, sy: 1.3, mat: 'neon' });
    h.box(0.1, 0.45, 0.05, '#111', { x: s * 0.62, y: 0.25, z: 1.72 });
    for (let k = 0; k < 3; k++) h.box(1.4, 0.04, 0.04, '#ffffff', { x: s * 1.2, y: -0.45 + k * 0.15, z: 1.5, rz: s * (k - 1) * 0.15 });
  }
  h.box(0.35, 0.22, 0.2, '#ff7a9a', { y: -0.25, z: 1.85 });
  for (let i = 0; i < 3; i++) h.box(0.18, 0.7, 0.05, S, { x: -0.35 + i * 0.35, y: 1.1, z: 1.4, rx: -0.4 });
  const head = pivot(h, 0, 6.0, 0.5);
  g.add(head);
  const t = new Parts();
  const segs = 7;
  let px = 0, py = 0;
  for (let i = 0; i < segs; i++) {
    const a = 0.2 + i * 0.28;
    const nx = px + Math.sin(a) * 0.75, ny = py + Math.cos(a) * 0.75 * (i < 3 ? -0.2 : 1);
    t.rod({ x: px, y: py, z: 0 }, { x: nx, y: ny, z: 0 }, 0.42 - i * 0.03, i === segs - 1 ? S : O, undefined, 7);
    t.sphere(0.42 - i * 0.03, i % 2 ? S : O, { x: nx, y: ny, w: 7, hseg: 5 });
    px = nx; py = ny;
  }
  const tail = pivot(t, 1.0, 0.6, -2.4);
  tail.rotation.y = -Math.PI / 2;
  g.add(tail);
  onTick((dt, tt) => {
    tail.rotation.x = Math.sin(tt * 1.4) * 0.35;
    head.rotation.z = Math.sin(tt * 0.4) * 0.18;
    head.rotation.y = Math.sin(tt * 0.23) * 0.3;
  });
  return selectable(g, { type: 'Riesenkatze', key: 'giant_cat', category: 'Kurioses', source: 'prozedural', model: 'createGiantCat' });
}

/** Neon sign "I ♥ POLYHAFEN" ~11 x 4.5 m on a scaffold (rooftop or plaza), faces +Z. Heart pulses. 4 meshes. */
export function createNeonSign(): THREE.Object3D {
  const b = new Parts();
  const S = '#4a5560';
  for (const x of [-4.5, 0, 4.5]) {
    b.box(0.25, 2.2, 0.25, S, { x, y: 1.1, z: -0.4 });
    b.beam({ x, y: 0, z: -1.6 }, { x, y: 2.2, z: -0.4 }, 0.15, S);
  }
  b.box(11, 0.2, 0.2, S, { y: 2.3, z: -0.4 });
  b.box(11, 2.4, 0.15, '#120a2a', { y: 3.6, z: -0.45 });
  b.box(0.35, 1.8, 0.2, '#5ff8ff', { x: -4.8, y: 3.6, z: -0.3, mat: 'neon' });
  const g = b.build();
  const txt = textPlane('POLYHAFEN', 7, 1.6, { bg: '#120a2a', fg: '#ff5fe0', glow: true, px: 128 });
  txt.position.set(1.3, 3.6, -0.36);
  g.add(txt);
  const sh = new THREE.Shape();
  sh.moveTo(0, -0.9);
  sh.bezierCurveTo(-1.4, 0, -1.0, 1.0, 0, 0.45);
  sh.bezierCurveTo(1.0, 1.0, 1.4, 0, 0, -0.9);
  const hp = new Parts().extrude(sh, 0.25, '#ff2a4a', { mat: 'neon' });
  const heart = pivot(hp, -3.4, 3.6, -0.35, false);
  g.add(heart);
  onTick((dt, t) => {
    const k = 1 + Math.max(0, Math.sin(t * 6)) * 0.15 * (Math.sin(t * 3) > 0 ? 1 : 0.3);
    heart.scale.setScalar(k);
  });
  return selectable(g, { type: 'Leuchtreklame', key: 'neon_sign', category: 'Stadtmobiliar', source: 'prozedural', model: 'createNeonSign', variant: 'I ♥ Polyhafen' });
}

/** Street musician with guitar, open case with coins and floating neon music notes. Footprint 2 x 2. ~8 meshes. */
export function createStreetMusician(): THREE.Object3D {
  const { root: person } = buildPerson(31, { pose: 'still', hat: 1, shirt: '#7a3a9a' });
  const limbs = person.userData.limbs as Record<string, THREE.Object3D>;
  const g = new THREE.Group();
  g.add(person);
  const gb = new Parts();
  gb.sphere(0.25, '#c8742e', { x: 0.05, y: -0.0, z: 0.0, sz: 0.35, w: 10, hseg: 6 });
  gb.sphere(0.2, '#c8742e', { x: -0.25, y: 0.07, z: 0.0, sz: 0.35, w: 10, hseg: 6 });
  gb.cyl(0.07, 0.07, 0.02, '#2a1b12', { x: -0.05, y: 0.03, z: 0.09, rx: Math.PI / 2, seg: 8 });
  gb.box(0.7, 0.06, 0.04, '#5a3a1e', { x: -0.62, y: 0.15, z: 0 , rz: 0.2 });
  gb.box(0.14, 0.1, 0.05, '#2a1b12', { x: -1.0, y: 0.23, rz: 0.2 });
  const guitar = pivot(gb, 0.05, 1.12, 0.22);
  guitar.rotation.z = 0.5;
  g.add(guitar);
  limbs.aL.rotation.x = -1.2; limbs.aL.rotation.z = 0.6;
  // case with coins
  const c = new Parts();
  c.box(1.1, 0.12, 0.45, '#1b1b1b', { x: 0.9, y: 0.06, z: 0.8 });
  c.box(1.0, 0.04, 0.38, '#b8322a', { x: 0.9, y: 0.12, z: 0.8 });
  for (let i = 0; i < 6; i++) c.cyl(0.04, 0.04, 0.01, '#ffd23f', { x: 0.6 + i * 0.1, y: 0.15, z: 0.75 + (i % 2) * 0.1, seg: 6 });
  c.box(0.6, 0.35, 0.03, '#f4efe4', { x: -0.7, y: 0.5, z: 0.6, rx: -0.3 });
  g.add(c.build());
  const sign = textPlane('SPENDEN ♪', 0.55, 0.3, { bg: '#f4efe4', fg: '#1b1b1b', px: 48 });
  sign.position.set(-0.7, 0.5, 0.63); sign.rotation.x = -0.3;
  g.add(sign);
  // notes
  const notes: THREE.Object3D[] = [];
  const cols = ['#ff5fe0', '#5ff8ff', '#ffe14d'];
  for (let i = 0; i < 3; i++) {
    const n = new Parts();
    n.sphere(0.09, cols[i], { sx: 1.3, mat: 'neon', w: 6, hseg: 4 });
    n.box(0.025, 0.32, 0.025, cols[i], { x: 0.1, y: 0.16, mat: 'neon' });
    n.box(0.12, 0.04, 0.025, cols[i], { x: 0.15, y: 0.3, rz: -0.4, mat: 'neon' });
    const m = n.build({ castShadow: false });
    g.add(m);
    notes.push(m);
  }
  onTick((dt, t) => {
    limbs.aR.rotation.x = -0.8 + Math.sin(t * 9) * 0.25;
    limbs.aR.rotation.z = -0.3;
    person.rotation.y = Math.sin(t * 1.5) * 0.12;
    notes.forEach((n, i) => {
      const k = (t * 0.45 + i / 3) % 1;
      n.position.set(0.3 + Math.sin(k * 6 + i) * 0.4, 1.6 + k * 2.2, 0.3);
      n.scale.setScalar(Math.sin(k * Math.PI) * 1.2 + 0.01);
    });
  });
  return selectable(g, { type: 'Straßenmusiker', key: 'street_musician', category: 'Lebewesen', source: 'prozedural', model: 'createStreetMusician' });
}

/** Fortune teller booth "MADAME POLY" 3.4 x 3 x 4 m, open front +Z, glowing crystal ball. ~6 meshes. */
export function createFortuneTeller(): THREE.Object3D {
  const b = new Parts();
  const P = '#5a2a8a', G = '#ffd23f';
  b.box(3.4, 0.2, 3, '#3a1a5a', { y: 0.1 });
  b.box(3.4, 3, 0.1, P, { y: 1.6, z: -1.45 });
  for (const s of [-1, 1]) {
    b.box(0.1, 3, 3, P, { x: s * 1.65, y: 1.6 });
    // drapes
    b.box(0.6, 2.8, 0.1, '#c8322b', { x: s * 1.3, y: 1.6, z: 1.45, rz: s * 0.05 });
  }
  b.cone(2.6, 1.6, P, { y: 3.9, seg: 6 });
  b.sphere(0.2, G, { y: 4.8 });
  b.box(3.6, 0.3, 3.2, G, { y: 3.15 });
  // stars
  const r = seeded(9);
  for (let i = 0; i < 10; i++) b.cone(0.12, 0.05, G, { x: -1.5 + r() * 3, y: 0.8 + r() * 2, z: -1.39, rx: Math.PI / 2, seg: 5, mat: 'neon' });
  for (const s of [-1, 1]) for (let i = 0; i < 4; i++) b.cone(0.12, 0.05, G, { x: s * 1.71, y: 0.8 + r() * 2, z: -1.2 + r() * 2.4, rz: s * Math.PI / 2, seg: 5, mat: 'neon' });
  // table + cloth
  b.cyl(0.7, 0.8, 0.9, '#2a8f7a', { y: 0.65, z: 0.3, seg: 10 });
  b.cyl(0.25, 0.3, 0.12, G, { y: 1.15, z: 0.3, seg: 8 });
  const g = b.build();
  const { root: teller } = buildPerson(808, { pose: 'still', hat: -1, shirt: '#2a8f7a' });
  teller.position.set(0, 0.2, -0.6);
  const limbs = teller.userData.limbs as Record<string, THREE.Object3D>;
  limbs.aL.rotation.x = limbs.aR.rotation.x = -1.1;
  limbs.aL.rotation.z = -0.25; limbs.aR.rotation.z = 0.25;
  const turban = new Parts().sphere(0.22, '#c8322b', { y: 1.92, sy: 0.9 }).sphere(0.06, '#5ff8ff', { y: 1.9, z: 0.2, mat: 'neon' }).build();
  teller.add(turban);
  g.add(teller);
  const ballMat = new THREE.MeshBasicMaterial({ color: '#c77dff', transparent: true, opacity: 0.85, toneMapped: false });
  const ball = new THREE.Mesh(new THREE.IcosahedronGeometry(0.3, 2), ballMat);
  ball.position.set(0, 1.5, 0.3);
  g.add(ball);
  const sign = textPlane('MADAME POLY', 3.2, 0.55, { bg: '#3a1a5a', fg: G, glow: true, px: 64 });
  sign.position.set(0, 3.15, 1.61);
  g.add(sign);
  onTick((dt, t) => {
    const k = 0.5 + 0.5 * Math.sin(t * 2.2);
    ballMat.color.setHSL(0.75 + 0.08 * Math.sin(t * 0.7), 0.9, 0.55 + k * 0.2);
    ball.scale.setScalar(1 + k * 0.06);
    limbs.aL.rotation.z = -0.25 + Math.sin(t * 2) * 0.08;
    limbs.aR.rotation.z = 0.25 - Math.sin(t * 2) * 0.08;
  });
  return selectable(g, { type: 'Wahrsagerin', key: 'fortune_teller', category: 'Kurioses', source: 'prozedural', model: 'createFortuneTeller' });
}

/** Giant gumball machine ~7.5 m. Every few seconds a gumball rolls down the chute. Footprint 4 x 4. 4 meshes. */
export function createGumballMachine(): THREE.Object3D {
  const b = new Parts();
  const RED = '#e8322b';
  b.cyl(1.9, 2.1, 0.5, '#b8b8b8', { y: 0.25, seg: 12, mat: 'metal' });
  b.cyl(1.2, 1.7, 2.8, RED, { y: 1.9, seg: 12 });
  b.cyl(1.7, 1.7, 0.3, RED, { y: 3.4, seg: 12 });
  b.cyl(0.55, 0.55, 0.3, '#cfd8e0', { y: 2.4, z: 1.45, rx: Math.PI / 2 - 0.25, seg: 12, mat: 'metal' });
  b.box(0.15, 0.6, 0.12, '#888', { y: 2.4, z: 1.6, rx: -0.25 });
  b.box(0.9, 0.5, 0.6, '#cfd8e0', { y: 1.05, z: 1.45, mat: 'metal' });
  b.box(0.7, 0.08, 0.6, '#555', { y: 0.82, z: 1.7 });
  const r = seeded(21);
  const cols = ['#ff4fa8', '#ffd23f', '#4ab8ff', '#5dff8a', '#ff7a1a', '#b06bff', '#ffffff', '#e8322b'];
  for (let i = 0; i < 55; i++) {
    const a = r() * TAU, rr = Math.sqrt(r()) * 1.7, y = r();
    const yy = 3.75 + y * 2.4;
    const lim = Math.sqrt(Math.max(0, 4.4 - (yy - 5.3) ** 2)) - 0.35;
    const rad = Math.min(rr, lim);
    b.sphere(0.32, cols[i % cols.length], { x: Math.cos(a) * rad, y: yy, z: Math.sin(a) * rad, w: 8, hseg: 6 });
  }
  b.cyl(0.8, 1.0, 0.45, RED, { y: 7.35, seg: 12 });
  b.sphere(0.35, RED, { y: 7.7 });
  const g = b.build();
  const globe = new Parts().sphere(2.1, '#dff4ff', { y: 5.3, w: 16, hseg: 12, mat: 'glass' }).build();
  g.add(globe);
  const sign = textPlane('1 ⭐ = 1 KUGEL', 2.0, 0.4, { bg: '#ffd23f', fg: RED, px: 48 });
  sign.position.set(0, 3.0, 1.62); sign.rotation.x = -0.15;
  g.add(sign);
  const gum = new Parts().sphere(0.3, '#ff4fa8', { w: 8, hseg: 6 }).build();
  g.add(gum);
  onTick((dt, t) => {
    const k = (t % 6) / 1.4;
    if (k > 1) { gum.visible = false; return; }
    gum.visible = true;
    gum.position.set(0, 1.25 - k * 0.15, 1.3 + k * 0.8);
    if (k > 0.6) gum.position.y = 1.1 - (k - 0.6) * 1.2;
    gum.rotation.x += dt * 8;
  });
  return selectable(g, { type: 'Riesen-Kaugummiautomat', key: 'gumball_machine', category: 'Kurioses', source: 'prozedural', model: 'createGumballMachine' });
}
