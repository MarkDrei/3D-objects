import * as THREE from 'three';
import { Parts, rng } from '../core/parts';
import { onTick, env } from '../core/anim';
import { MATERIALS } from '../core/materials';
import { tag, canvasTexture, ghost, glowMat, tinyPerson, cowParts } from './sky-util';

const TAU = Math.PI * 2;

// ─────────────────────────────────────────────────────────────── UFO ──

/**
 * Fliegende Untertasse. Origin = GROUND point below it; the saucer hovers at y≈16,
 * the tractor beam reaches down to the ground. Ø ≈ 12.4 m.
 * userData.extras: [abducted cow] – add to the scene at the same transform.
 * Fully self-animating (hover, spinning lights, pulsing beam, tumbling cow).
 */
export function createUfo(): THREE.Object3D {
  const H = 16;
  const root = new THREE.Group();
  const hover = new THREE.Group();
  hover.position.y = H;
  root.add(hover);

  const b = new Parts();
  b.lathe([[0, -1.1], [2.2, -1.0], [4.6, -0.55], [6.2, 0], [4.8, 0.55], [2.6, 0.95], [0, 1.0]], '#c9d2de', { seg: 24 });
  b.cyl(6.28, 6.28, 0.22, '#5b6475', { seg: 24 });
  b.cyl(1.7, 2.1, 0.5, '#7a8494', { y: -1.25, seg: 16 });
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * TAU;
    b.cyl(0.12, 0.08, 1.0, '#8a93a3', { x: Math.cos(a) * 3.3, y: -1.25, z: Math.sin(a) * 3.3 });
    b.cyl(0.35, 0.35, 0.08, '#8a93a3', { x: Math.cos(a) * 3.3, y: -1.75, z: Math.sin(a) * 3.3 });
  }
  // dome + alien pilot
  b.sphere(2.5, '#a8ecff', { y: 0.7, sy: 0.9, w: 18, hseg: 10, mat: 'glass' });
  b.cyl(0.45, 0.65, 1.0, '#59c93a', { y: 1.4 });
  b.sphere(0.8, '#7cf05a', { y: 2.35, sy: 1.15 });
  b.sphere(0.27, '#101418', { x: 0.32, y: 2.45, z: 0.62, sy: 1.5, rz: -0.4 });
  b.sphere(0.27, '#101418', { x: -0.32, y: 2.45, z: 0.62, sy: 1.5, rz: 0.4 });
  b.rod({ x: 0.2, y: 3.1, z: 0 }, { x: 0.45, y: 3.7, z: 0 }, 0.04, '#59c93a');
  b.rod({ x: -0.2, y: 3.1, z: 0 }, { x: -0.45, y: 3.7, z: 0 }, 0.04, '#59c93a');
  b.sphere(0.13, '#ff4fd8', { x: 0.45, y: 3.75, mat: 'neon' });
  b.sphere(0.13, '#ff4fd8', { x: -0.45, y: 3.75, mat: 'neon' });
  b.torus(2.3, 0.22, '#5dfff0', { rx: Math.PI / 2, y: -1.1, ts: 28, mat: 'neon' });
  hover.add(b.build());

  const ring = new Parts();
  const RC = ['#ff3fd2', '#ffe14d', '#3fffd2'];
  for (let i = 0; i < 15; i++) {
    const a = (i / 15) * TAU;
    ring.sphere(0.32, RC[i % 3], { x: Math.cos(a) * 5.75, y: 0.22, z: Math.sin(a) * 5.75, w: 8, hseg: 6, mat: 'neon' });
  }
  const ringG = ring.build({ castShadow: false });
  hover.add(ringG);

  // tractor beam (does not block picking so the cow inside stays clickable)
  const beamMat = glowMat('#8cffb0', 0.2);
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(1.9, 6.8, H - 1.3, 28, 1, true), beamMat);
  beam.position.y = (H - 1.3) / 2;
  root.add(ghost(beam));
  const ringMat = glowMat('#c8ffd8', 0.5);
  const rings: THREE.Mesh[] = [];
  for (let i = 0; i < 3; i++) {
    const m = new THREE.Mesh(new THREE.TorusGeometry(1, 0.06, 4, 32), ringMat);
    m.rotation.x = Math.PI / 2;
    root.add(ghost(m));
    rings.push(m);
  }
  const spot = new THREE.Mesh(new THREE.CircleGeometry(7, 32), glowMat('#8cffb0', 0.35));
  spot.rotation.x = -Math.PI / 2;
  spot.position.y = 0.08;
  root.add(ghost(spot));

  // the abducted cow: its own selectable object
  const cow = new THREE.Group();
  const cowFloat = new THREE.Group();
  const cb = new Parts();
  cowParts(cb);
  const cowMesh = cb.build();
  cowMesh.position.y = -1.3; // rotate around the cow's belly
  cowFloat.add(cowMesh);
  cow.add(cowFloat);
  tag(cow, 'Kuh', 'cow', 'Lebewesen', 'createUfo', 'entführt');
  root.userData.extras = [cow];

  onTick((dt, t) => {
    ringG.rotation.y += dt * 1.8;
    hover.position.y = H + Math.sin(t * 1.2) * 0.4;
    hover.rotation.y += dt * 0.25;
    hover.rotation.z = Math.sin(t * 0.7) * 0.035;
    hover.rotation.x = Math.cos(t * 0.6) * 0.03;
    beamMat.opacity = 0.13 + 0.06 * Math.sin(t * 3) + 0.09 * env.night;
    for (let i = 0; i < 3; i++) {
      const k = ((t * 0.35 + i / 3) % 1);
      const y = (H - 1.3) * (1 - k);
      const r = 6.8 - (6.8 - 1.9) * (y / (H - 1.3));
      rings[i].position.y = y;
      rings[i].scale.setScalar(r);
    }
    ringMat.opacity = 0.35 + 0.3 * env.night;
    cowFloat.position.y = 7 + Math.sin(t * 0.7) * 3;
    cowFloat.rotation.y += dt * 0.5;
    cowFloat.rotation.z = Math.sin(t * 0.9) * 0.5;
    cowFloat.rotation.x = Math.sin(t * 0.63) * 0.3;
  });
  return tag(root, 'UFO', 'ufo', 'Kurioses', 'createUfo');
}

// ─────────────────────────────────────────────────── Hot air balloon ──

const ENVELOPE: [number, number][] = [
  [0.9, 5.0], [1.7, 5.6], [2.9, 6.6], [3.95, 8.0], [4.6, 9.6], [4.8, 11.0], [4.5, 12.4], [3.7, 13.5], [2.3, 14.3], [0.001, 14.6],
];
const BALLOON_NAMES = ['Streifen', 'Ringe', 'Regenbogen', 'Erdbeere', 'Smiley'];

function envRadiusAt(y: number) {
  for (let i = 0; i < ENVELOPE.length - 1; i++) {
    const [r0, y0] = ENVELOPE[i], [r1, y1] = ENVELOPE[i + 1];
    if (y >= y0 && y <= y1) return r0 + ((y - y0) / (y1 - y0)) * (r1 - r0);
  }
  return 0;
}

/**
 * Heißluftballon, ≈14.6 m tall, Ø 9.6 m. Origin = bottom of the basket.
 * Variants 0..4: Streifen, Ringe, Regenbogen, Erdbeere, Smiley.
 * Self-animating: flame flicker only. The world moves it.
 */
export function createHotAirBalloon(variant = 0): THREE.Object3D {
  const v = ((variant % 5) + 5) % 5;
  const pts = ENVELOPE.map(([r, y]) => new THREE.Vector2(r, y));
  const b = new Parts();
  const gores = (colors: string[], n: number) => {
    for (let i = 0; i < n; i++) {
      b.add(new THREE.LatheGeometry(pts, 2, (i / n) * TAU, TAU / n), colors[i % colors.length]);
    }
  };
  if (v === 0) gores(['#ff4d4d', '#ffd23f'], 14);
  else if (v === 1) {
    const C = ['#2ec4b6', '#ffffff', '#1d3557', '#ffffff'];
    for (let k = 0; k < pts.length - 1; k++) b.add(new THREE.LatheGeometry([pts[k], pts[k + 1]], 20), C[k % C.length]);
  } else if (v === 2) gores(['#ff3b3b', '#ff9f1c', '#ffe14d', '#3ddc84', '#3fa7ff', '#8e5cff'], 18);
  else if (v === 3) {
    b.add(new THREE.LatheGeometry(pts, 20), '#e8283c');
    const r = rng(11);
    for (let i = 0; i < 70; i++) {
      const y = 6.5 + r() * 6.5, a = r() * TAU;
      const rad = envRadiusAt(y) + 0.02;
      b.sphere(0.13, '#ffe066', { x: Math.cos(a) * rad, y, z: Math.sin(a) * rad, sy: 1.6, w: 5, hseg: 4 });
    }
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * TAU;
      b.cone(1.1, 3.4, '#3aa84a', { x: Math.cos(a) * 1.5, y: 14.3, z: Math.sin(a) * 1.5, sz: 0.35, rx: Math.sin(a) * 1.2, rz: -Math.cos(a) * 1.2, ry: 0, seg: 4 });
    }
    b.cyl(0.25, 0.35, 1.6, '#2f8a3c', { y: 15.2, rz: 0.3 });
  } else {
    b.add(new THREE.LatheGeometry(pts, 20), '#ffd23f');
    for (const sx of [-1, 1]) {
      b.sphere(0.55, '#111', { x: sx * 1.5, y: 11.2, z: envRadiusAt(11.2) - 0.25, sy: 1.6 });
      b.sphere(0.17, '#ffffff', { x: sx * 1.38, y: 11.6, z: envRadiusAt(11.6) + 0.05 });
      b.sphere(0.6, '#ff8fa3', { x: sx * 2.9, y: 9.6, z: envRadiusAt(9.6) - 1.0, sz: 0.4, ry: sx * 0.6 });
    }
    b.torus(1.9, 0.18, '#111', { y: 9.9, z: envRadiusAt(9.9) - 0.35, arc: Math.PI, rz: Math.PI, rx: 0.25, ts: 14 });
  }
  // ropes, basket, passengers
  for (const [x, z] of [[0.7, 0.7], [-0.7, 0.7], [0.7, -0.7], [-0.7, -0.7]]) {
    b.rod({ x, y: 1.15, z }, { x: x * 1.25, y: 5.05, z: z * 1.25 }, 0.03, '#5a4630');
  }
  b.box(1.6, 1.1, 1.6, '#a8743f', { y: 0.55 });
  b.box(1.72, 0.14, 1.72, '#6d4c2c', { y: 1.12 });
  b.box(1.72, 0.1, 1.72, '#6d4c2c', { y: 0.05 });
  b.cyl(0.5, 0.42, 0.5, '#555d6b', { y: 3.1, mat: 'metal' });
  b.cyl(0.95, 0.95, 0.08, '#777f8b', { y: 2.85, mat: 'metal' });
  tinyPerson(b, 0.35, 0.15, 0.2, '#3fa7ff', 0.9, 0.4);
  tinyPerson(b, -0.4, 0.15, -0.15, '#ff6b9a', 0.85, -0.5);
  for (const [x, z] of [[0.86, 0.3], [-0.86, -0.3], [0.3, -0.86]]) b.sphere(0.18, '#c9a46a', { x, y: 0.55, z, sy: 1.3 });

  const root = new THREE.Group();
  root.add(b.build());
  const flame = new Parts();
  flame.cone(0.42, 1.6, '#ff8a1c', { y: 0.8, mat: 'neon' });
  flame.cone(0.22, 1.1, '#fff3a0', { y: 0.55, mat: 'neon' });
  const flameG = flame.build({ castShadow: false });
  flameG.position.y = 3.35;
  root.add(flameG);

  const seed = Math.random() * 10;
  onTick((_dt, t) => {
    const burst = Math.sin(t * 0.5 + seed) > 0.6 ? 1.6 : 0.6;
    flameG.scale.set(1, burst * (0.85 + Math.random() * 0.3), 1);
  });
  return tag(root, 'Heißluftballon', 'hot_air_balloon', 'Luftfahrt', 'createHotAirBalloon', BALLOON_NAMES[v]);
}

// ──────────────────────────────────────────────────────────── Blimp ──

/**
 * Zeppelin, 30 m long (z -15..15, nose at +Z), envelope Ø 9 m. Origin = envelope
 * center (it is always airborne; gondola bottom at y≈-5.8).
 * Self-animating: props + scrolling neon marquee. The world moves it.
 */
export function createBlimp(): THREE.Object3D {
  const b = new Parts();
  const prof: [number, number][] = [[0, -15], [1.8, -14], [3.2, -12], [4.2, -9], [4.5, -6], [4.5, 6], [4.25, 9], [3.6, 11.5]];
  b.lathe(prof, '#e3e7ee', { rx: Math.PI / 2, seg: 18 });
  b.lathe([[3.6, 11.5], [2.6, 13.4], [1.4, 14.5], [0, 15]], '#e63946', { rx: Math.PI / 2, seg: 18 });
  b.torus(4.52, 0.12, '#e63946', { z: -6.5, ts: 24 });
  b.torus(4.52, 0.12, '#e63946', { z: 6.5, ts: 24 });
  // fins
  b.box(0.3, 3.4, 4.6, '#e63946', { y: 4.6, z: -11.6 });
  b.box(0.3, 3.4, 4.6, '#e63946', { y: -4.6, z: -11.6 });
  b.box(3.4, 0.3, 4.6, '#e63946', { x: 4.6, z: -11.6 });
  b.box(3.4, 0.3, 4.6, '#e63946', { x: -4.6, z: -11.6 });
  // gondola
  b.box(2.4, 1.6, 6.5, '#1d3557', { y: -5.0, z: 1 });
  b.sphere(1.2, '#1d3557', { y: -5.0, z: 4.2, sx: 1, sy: 0.67, sz: 0.8 });
  for (let z = -1.5; z <= 3.5; z += 1.2) {
    b.box(0.06, 0.55, 0.75, '#ffe6a0', { x: 1.22, y: -4.85, z, mat: 'lamp' });
    b.box(0.06, 0.55, 0.75, '#ffe6a0', { x: -1.22, y: -4.85, z, mat: 'lamp' });
  }
  b.box(2.2, 0.6, 0.06, '#9fdcff', { y: -4.7, z: 4.85, mat: 'glass' });
  // engine pods
  for (const sx of [-1, 1]) {
    b.cyl(0.55, 0.45, 2.2, '#8a919c', { x: sx * 3.4, y: -4.0, z: -3, rx: Math.PI / 2, mat: 'metal' });
    b.beam({ x: sx * 1.1, y: -4.4, z: -3 }, { x: sx * 3.0, y: -4.0, z: -3 }, 0.18, '#59606e', 'metal');
  }
  // navigation lights
  b.sphere(0.25, '#ff2a2a', { x: -4.3, z: 8.6, mat: 'neon' });
  b.sphere(0.25, '#2aff6a', { x: 4.3, z: 8.6, mat: 'neon' });
  const root = new THREE.Group();
  root.add(b.build());

  const props: THREE.Group[] = [];
  for (const sx of [-1, 1]) {
    const p = new Parts();
    p.box(0.28, 2.8, 0.1, '#2b3240');
    p.box(2.8, 0.28, 0.1, '#2b3240');
    p.sphere(0.25, '#e63946');
    const g = p.build({ castShadow: false });
    g.position.set(sx * 3.4, -4.0, -4.2);
    root.add(g);
    props.push(g);
  }

  // scrolling marquee on both flanks
  const tex = canvasTexture(2048, 256, (c, w, h) => {
    c.fillStyle = '#0b0f24';
    c.fillRect(0, 0, w, h);
    c.textBaseline = 'middle';
    c.textAlign = 'center';
    const msg = '★ POLYHAFEN';
    c.font = 'bold 170px sans-serif';
    const fs = Math.min(170, (170 * (w / 2 - 80)) / c.measureText(msg).width);
    c.font = `bold ${fs}px sans-serif`;
    for (let k = 0; k < 2; k++) {
      const grad = c.createLinearGradient(k * w / 2, 0, (k + 1) * w / 2, 0);
      grad.addColorStop(0, '#ff4fd8'); grad.addColorStop(0.5, '#ffe14d'); grad.addColorStop(1, '#3fffd2');
      c.fillStyle = grad;
      c.shadowColor = '#ff4fd8';
      c.shadowBlur = 24;
      c.fillText(msg, k * w / 2 + w / 4, h / 2 + 8);
    }
    c.shadowBlur = 0;
    c.fillStyle = '#ffe14d';
    for (let x = 0; x < w; x += 32) { c.fillRect(x, 6, 14, 10); c.fillRect(x + 16, h - 16, 14, 10); }
  });
  tex.wrapS = THREE.RepeatWrapping;
  tex.repeat.x = 0.5;
  const panelMat = new THREE.MeshBasicMaterial({ map: tex, toneMapped: false });
  for (const sx of [-1, 1]) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(13, 2.4), panelMat);
    m.position.set(sx * 4.56, 0.4, 0);
    m.rotation.y = sx * Math.PI / 2;
    root.add(m);
  }
  onTick((dt) => {
    for (const p of props) p.rotation.z += dt * 14;
    tex.offset.x = (tex.offset.x + dt * 0.05) % 1;
  });
  return tag(root, 'Zeppelin', 'blimp', 'Luftfahrt', 'createBlimp');
}

// ─────────────────────────────────────────────────────── Helicopter ──

/**
 * Hubschrauber, ≈8.6 m long (z -6.3..2.3), rotor Ø 9 m. Origin = bottom of skids.
 * userData.rotorSpeed (0..1, default 1) – set by the world (e.g. 0 when parked).
 */
export function createHelicopter(): THREE.Object3D {
  const b = new Parts();
  const RED = '#e63946', WHITE = '#f5f5f5';
  b.sphere(1.4, RED, { y: 1.65, z: 0.4, sz: 1.55, sy: 1.0, w: 14, hseg: 10 });
  b.sphere(1.15, '#9fdcff', { y: 1.9, z: 1.35, sz: 0.95, sy: 0.85, mat: 'glass' });
  b.box(2.85, 0.35, 2.4, WHITE, { y: 1.3, z: 0.1 });
  b.cyl(0.45, 0.22, 5.2, RED, { y: 1.95, z: -3.4, rx: Math.PI / 2 });
  b.box(0.15, 1.5, 0.95, RED, { y: 2.55, z: -5.85, rx: -0.25 });
  b.box(1.8, 0.1, 0.55, WHITE, { y: 1.95, z: -5.2 });
  b.box(1.2, 0.65, 2.0, '#d6d9de', { y: 2.75, z: -0.1, mat: 'metal' });
  b.cyl(0.18, 0.22, 0.6, '#59606e', { y: 3.3, mat: 'metal' });
  for (const sx of [-1, 1]) {
    b.rod({ x: sx * 0.95, y: 0.12, z: -1.3 }, { x: sx * 0.95, y: 0.12, z: 1.9 }, 0.08, '#3a3f4a');
    b.rod({ x: sx * 0.95, y: 0.12, z: 1.9 }, { x: sx * 0.95, y: 0.35, z: 2.25 }, 0.08, '#3a3f4a');
    b.rod({ x: sx * 0.95, y: 0.12, z: -0.6 }, { x: sx * 0.6, y: 1.0, z: -0.6 }, 0.06, '#3a3f4a');
    b.rod({ x: sx * 0.95, y: 0.12, z: 1.2 }, { x: sx * 0.6, y: 1.0, z: 1.2 }, 0.06, '#3a3f4a');
  }
  b.sphere(0.12, '#ff2a2a', { y: 3.0, z: -5.9, mat: 'neon' });
  b.sphere(0.12, '#ffffff', { y: 0.8, z: 2.3, mat: 'lamp' });
  const root = new THREE.Group();
  root.add(b.build());

  const mr = new Parts();
  for (let i = 0; i < 4; i++) mr.box(0.35, 0.06, 4.4, '#2b3240', { ry: (i * Math.PI) / 2, x: Math.sin((i * Math.PI) / 2) * 2.3, z: Math.cos((i * Math.PI) / 2) * 2.3 });
  mr.cyl(0.32, 0.32, 0.25, '#59606e', { mat: 'metal' });
  const main = mr.build({ castShadow: true });
  main.position.y = 3.65;
  root.add(main);
  const tr = new Parts();
  tr.box(0.06, 1.5, 0.18, '#2b3240');
  tr.box(0.06, 0.18, 1.5, '#2b3240');
  const tail = tr.build({ castShadow: false });
  tail.position.set(0.18, 2.55, -5.95);
  root.add(tail);

  root.userData.rotorSpeed = 1;
  let spin = 1;
  onTick((dt) => {
    spin += ((root.userData.rotorSpeed as number) - spin) * Math.min(1, dt * 0.8);
    main.rotation.y += dt * 26 * spin;
    tail.rotation.x += dt * 40 * spin;
  });
  return tag(root, 'Hubschrauber', 'helicopter', 'Luftfahrt', 'createHelicopter');
}

// ─────────────────────────────────────────────────────── Banner plane ──

/**
 * Propellerflugzeug mit Banner "Willkommen in Polyhafen!". Plane ≈6 m long (nose at +Z),
 * wingspan 9 m; banner 16 m trails behind (z -8..-24). Origin = bottom of the wheels.
 * Self-animating: propeller + waving banner. The world moves it.
 */
export function createBannerPlane(): THREE.Object3D {
  const b = new Parts();
  const Y = '#ffcc33', R = '#e63946';
  b.cyl(0.6, 0.35, 5.2, Y, { y: 1.3, z: 0.1, rx: Math.PI / 2, seg: 10 });
  b.cyl(0.45, 0.6, 0.6, R, { y: 1.3, z: 2.95, rx: Math.PI / 2, seg: 10 });
  b.box(9, 0.14, 1.4, Y, { y: 1.85, z: 0.9 });
  b.box(0.9, 0.16, 1.42, R, { x: 4.1, y: 1.85, z: 0.9 });
  b.box(0.9, 0.16, 1.42, R, { x: -4.1, y: 1.85, z: 0.9 });
  b.box(3.0, 0.1, 0.8, Y, { y: 1.45, z: -2.3 });
  b.box(0.1, 1.2, 0.9, R, { y: 1.95, z: -2.3 });
  b.box(0.9, 0.55, 1.2, '#9fdcff', { y: 1.75, z: 1.1, mat: 'glass' });
  for (const sx of [-1, 1]) {
    b.rod({ x: sx * 0.3, y: 1.0, z: 1.3 }, { x: sx * 0.75, y: 0.3, z: 1.3 }, 0.05, '#333');
    b.cyl(0.3, 0.3, 0.15, '#222', { x: sx * 0.8, y: 0.3, z: 1.3, rz: Math.PI / 2 });
  }
  // tow ropes + front pole of the banner
  b.rod({ x: 0, y: 1.2, z: -2.7 }, { x: 0, y: 2.4, z: -8 }, 0.03, '#444');
  b.rod({ x: 0, y: 1.2, z: -2.7 }, { x: 0, y: 0.0, z: -8 }, 0.03, '#444');
  b.rod({ x: 0, y: -0.05, z: -8 }, { x: 0, y: 2.45, z: -8 }, 0.07, '#5a4630');
  const root = new THREE.Group();
  root.add(b.build());

  const p = new Parts();
  p.box(0.15, 2.4, 0.08, '#333');
  p.sphere(0.18, R);
  const prop = p.build({ castShadow: false });
  prop.position.set(0, 1.3, 3.3);
  root.add(prop);

  // banner (shared waving geometry, two sides so the text reads from both)
  const tex = canvasTexture(2048, 300, (c, w, h) => {
    c.fillStyle = '#fffdf3';
    c.fillRect(0, 0, w, h);
    c.strokeStyle = '#e63946';
    c.lineWidth = 16;
    c.strokeRect(8, 8, w - 16, h - 16);
    const msg = 'Willkommen in Polyhafen!';
    c.font = 'bold 170px sans-serif';
    const fs = Math.min(170, (170 * (w - 120)) / c.measureText(msg).width);
    c.font = `bold ${fs}px sans-serif`;
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillStyle = '#1d3557';
    c.fillText(msg, w / 2, h / 2 + 8);
  });
  const texBack = tex.clone();
  texBack.wrapS = THREE.RepeatWrapping;
  texBack.repeat.x = -1;
  texBack.offset.x = 1;
  texBack.needsUpdate = true;
  const geo = new THREE.PlaneGeometry(16, 2.4, 32, 1);
  geo.rotateY(Math.PI / 2);
  geo.translate(0, 1.2, -16);
  const base = Float32Array.from(geo.attributes.position.array as Float32Array);
  const front = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: tex, side: THREE.FrontSide, roughness: 0.9 }));
  const back = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: texBack, side: THREE.BackSide, roughness: 0.9 }));
  root.add(front, back);
  onTick((dt, t) => {
    prop.rotation.z += dt * 40;
    const a = geo.attributes.position.array as Float32Array;
    for (let i = 0; i < a.length; i += 3) {
      const z = base[i + 2];
      const k = (-8 - z) / 16;
      a[i] = Math.sin(z * 0.55 + t * 9) * 0.55 * k;
      a[i + 1] = base[i + 1] - k * k * 0.8;
    }
    geo.attributes.position.needsUpdate = true;
    geo.computeVertexNormals();
  });
  return tag(root, 'Bannerflugzeug', 'banner_plane', 'Luftfahrt', 'createBannerPlane');
}

// ──────────────────────────────────────────────────────────── Cloud ──

/** Wolke, ≈22–30 m wide, ≈8 m high. Origin = cloud bottom center. Static. */
export function createCloud(seed = 1): THREE.Object3D {
  const r = rng(seed * 977 + 13);
  const b = new Parts();
  const n = 6 + Math.floor(r() * 5);
  for (let i = 0; i < n; i++) {
    const rad = 3.5 + r() * 4.5 * (1 - Math.abs(i / n - 0.5));
    const x = (i / (n - 1) - 0.5) * 22 + (r() - 0.5) * 3;
    const z = (r() - 0.5) * 8;
    b.ico(rad, r() < 0.5 ? '#ffffff' : '#eef2fa', { x, y: rad * 0.55 + r() * 1.5, z, sy: 0.72, detail: 1, mat: 'cloud' });
  }
  b.ico(5, '#e3e9f4', { y: 1.4, sx: 2.6, sy: 0.35, sz: 1.2, detail: 1, mat: 'cloud' });
  return tag(b.build(), 'Wolke', 'cloud', 'Natur', 'createCloud');
}

// ─────────────────────────────────────────────────────── Bird flock ──

/**
 * Vogelschwarm (Möwen). Origin = center of the swirl; birds circle within ~20 m around it
 * (±4 m in height). Self-animating; 3 instanced draw calls for the whole flock.
 */
export function createBirdFlock(count = 14): THREE.Object3D {
  const S = 0.9;
  const body = new Parts();
  body.sphere(0.22, '#f7f7f7', { sz: 2.4, w: 8, hseg: 6 });
  body.sphere(0.16, '#f7f7f7', { y: 0.08, z: 0.5, w: 8, hseg: 6 });
  body.cone(0.06, 0.25, '#ffb703', { y: 0.06, z: 0.75, rx: Math.PI / 2, seg: 5 });
  body.box(0.3, 0.04, 0.28, '#cfd6de', { z: -0.55 });
  const wingR = new Parts();
  wingR.box(0.85, 0.05, 0.42, '#c9d1da', { x: 0.45 });
  wingR.box(0.3, 0.06, 0.36, '#2b2f36', { x: 1.0 });
  const wingL = new Parts();
  wingL.box(0.85, 0.05, 0.42, '#c9d1da', { x: -0.45 });
  wingL.box(0.3, 0.06, 0.36, '#2b2f36', { x: -1.0 });
  const geo = (p: Parts) => (p.build().children[0] as THREE.Mesh).geometry;
  const mk = (g: THREE.BufferGeometry) => {
    const m = new THREE.InstancedMesh(g, MATERIALS.std, count);
    m.castShadow = true;
    m.frustumCulled = false;
    return m;
  };
  const mb = mk(geo(body)), ml = mk(geo(wingL)), mr = mk(geo(wingR));
  const root = new THREE.Group();
  root.add(mb, ml, mr);

  const r = rng(count * 31 + 7);
  const birds = Array.from({ length: count }, () => ({ R: 8 + r() * 12, h: (r() - 0.5) * 6, w: 0.32 + r() * 0.12, ph: r() * TAU }));
  const M = new THREE.Matrix4(), W = new THREE.Matrix4(), F = new THREE.Matrix4();
  const q = new THREE.Quaternion(), e = new THREE.Euler(0, 0, 0, 'YXZ'), p = new THREE.Vector3(), sc = new THREE.Vector3(S, S, S);
  onTick((_dt, t) => {
    birds.forEach((bd, i) => {
      const th = t * bd.w + bd.ph;
      p.set(Math.cos(th) * bd.R, bd.h + Math.sin(t * 0.5 + bd.ph) * 1.5, Math.sin(th) * bd.R);
      e.set(Math.cos(t * 0.5 + bd.ph) * 0.1, Math.atan2(-Math.sin(th), Math.cos(th)), -0.35);
      q.setFromEuler(e);
      M.compose(p, q, sc);
      mb.setMatrixAt(i, M);
      const glide = Math.sin(t * 0.6 + bd.ph) < -0.3;
      const flap = glide ? 0.12 : Math.sin(t * 11 + bd.ph * 7) * 0.65;
      W.multiplyMatrices(M, F.makeRotationZ(flap));
      mr.setMatrixAt(i, W);
      W.multiplyMatrices(M, F.makeRotationZ(-flap));
      ml.setMatrixAt(i, W);
    });
    for (const m of [mb, ml, mr]) {
      m.instanceMatrix.needsUpdate = true;
      m.computeBoundingBox();
      m.computeBoundingSphere();
    }
  });
  return tag(root, 'Vogelschwarm', 'bird_flock', 'Lebewesen', 'createBirdFlock', `${count} Möwen`);
}

// ─────────────────────────────────────────────────────── Wind turbine ──

/**
 * Windrad, hub at 40 m, rotor Ø 34 m, tower footprint Ø 6 m. Faces +Z (rotor in front).
 * Self-animating rotor + red night beacon.
 */
export function createWindTurbine(): THREE.Object3D {
  const b = new Parts();
  const W = '#f2f4f7';
  b.cyl(3, 3.2, 0.6, '#a5a9ad', { y: 0.3, seg: 12 });
  b.cyl(0.75, 1.5, 40, W, { y: 20.3, seg: 12 });
  b.box(1.4, 0.4, 0.06, '#2ec4b6', { y: 3, z: 1.43 });
  b.box(2.0, 2.0, 5.0, W, { y: 40.6, z: -0.6 });
  b.box(2.02, 0.3, 5.02, '#2ec4b6', { y: 40.0, z: -0.6 });
  const root = new THREE.Group();
  root.add(b.build());
  const beacon = new Parts().sphere(0.35, '#ff2020', { mat: 'neon' }).build({ castShadow: false });
  beacon.position.set(0, 41.8, -2.4);
  root.add(beacon);

  const rb = new Parts();
  rb.cone(0.95, 1.8, W, { rx: Math.PI / 2, z: 0.9, seg: 10 });
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * TAU;
    rb.box(1.0, 16.5, 0.22, W, { x: -Math.sin(a) * 8.9, y: Math.cos(a) * 8.9, rz: a, ry: 0.15 });
    rb.box(1.02, 1.6, 0.24, '#e63946', { x: -Math.sin(a) * 16.2, y: Math.cos(a) * 16.2, rz: a, ry: 0.15 });
  }
  const rotor = rb.build();
  rotor.position.set(0, 40.6, 2.1);
  root.add(rotor);
  const speed = 0.7 + Math.random() * 0.5;
  rotor.rotation.z = Math.random() * TAU;
  onTick((dt, t) => {
    rotor.rotation.z -= dt * speed;
    beacon.visible = Math.sin(t * 3) > 0.2 && env.night > 0.15;
  });
  return tag(root, 'Windrad', 'wind_turbine', 'Gebäude', 'createWindTurbine');
}

// ──────────────────────────────────────────────────── Radio telescope ──

/** Radioteleskop, dish Ø 16 m, ≈19 m tall, base Ø 11 m. Self-animating (slews + tilts). */
export function createRadioTelescope(): THREE.Object3D {
  const b = new Parts();
  b.cyl(5, 5.5, 1.2, '#a5a9ad', { y: 0.6, seg: 16 });
  b.torus(4.6, 0.15, '#59606e', { rx: Math.PI / 2, y: 1.25, ts: 24 });
  const root = new THREE.Group();
  root.add(b.build());

  const az = new THREE.Group();
  az.position.y = 1.2;
  const a = new Parts();
  a.box(9, 0.9, 4.2, '#e9ecef', { y: 0.45 });
  a.box(0.9, 9.2, 1.4, '#e9ecef', { x: 4.2, y: 5.0 });
  a.box(0.9, 9.2, 1.4, '#e9ecef', { x: -4.2, y: 5.0 });
  a.box(2.4, 2.0, 2.4, '#d8dde3', { x: 2.0, y: 1.9, z: 1.0 });
  a.box(1.6, 0.6, 0.06, '#ffe6a0', { x: 2.0, y: 2.1, z: 2.22, mat: 'lamp' });
  az.add(a.build());
  root.add(az);

  const el = new THREE.Group();
  el.position.y = 9.0;
  az.add(el);
  const d = new Parts();
  const f = 5.5;
  const outer: [number, number][] = [], inner: [number, number][] = [];
  for (let i = 0; i <= 8; i++) {
    const r = i;
    outer.push([r + 0.001, (r * r) / (4 * f) - 0.3]);
    inner.push([r + 0.001, (r * r) / (4 * f)]);
  }
  d.lathe([...outer, ...inner.reverse()], '#f7f8fa', { y: 0.6, seg: 24 });
  d.cyl(1.0, 1.4, 1.2, '#cfd4da', { y: 0.0 });
  d.box(7.6, 0.6, 0.6, '#cfd4da', { y: 0.2 });
  for (let i = 0; i < 4; i++) {
    const ang = (i / 4) * TAU + Math.PI / 4;
    d.rod({ x: Math.cos(ang) * 7.5, y: 0.6 + (7.5 * 7.5) / (4 * f), z: Math.sin(ang) * 7.5 }, { x: 0, y: 0.6 + f, z: 0 }, 0.09, '#9aa1ab', 'metal');
  }
  d.cyl(0.45, 0.65, 1.2, '#59606e', { y: 0.6 + f, mat: 'metal' });
  d.sphere(0.18, '#ff2a2a', { y: 0.6 + f + 0.7, mat: 'neon' });
  el.add(d.build());

  const ph = Math.random() * 10;
  onTick((_dt, t) => {
    az.rotation.y = Math.sin((t + ph) * 0.06) * 2.2;
    el.rotation.x = -0.45 + Math.sin((t + ph) * 0.11) * 0.35;
  });
  return tag(root, 'Radioteleskop', 'radio_telescope', 'Gebäude', 'createRadioTelescope');
}

// ──────────────────────────────────────────────────────── Dragon kite ──

/**
 * Drachen (Lenkdrachen in Drachenform!) on a long string. Origin = ground anchor where a
 * kid holds the string; the kite flies ≈26 m up and ≈16 m towards -Z, tail streams further -Z.
 * Fully self-animating.
 */
export function createDragonKite(): THREE.Object3D {
  const root = new THREE.Group();
  // kid holding the string
  const k = new Parts();
  k.box(0.16, 0.6, 0.18, '#3a4a7a', { x: -0.1, y: 0.3 });
  k.box(0.16, 0.6, 0.18, '#3a4a7a', { x: 0.1, y: 0.3 });
  k.box(0.42, 0.5, 0.25, '#ffb703', { y: 0.85 });
  k.sphere(0.2, '#f1c27d', { y: 1.3 });
  k.box(0.42, 0.1, 0.42, '#e63946', { y: 1.47, z: 0.05 });
  k.rod({ x: 0.2, y: 1.05, z: 0 }, { x: 0.25, y: 1.55, z: -0.3 }, 0.05, '#f1c27d');
  k.rod({ x: -0.2, y: 1.05, z: 0 }, { x: -0.25, y: 1.55, z: -0.3 }, 0.05, '#f1c27d');
  k.cyl(0.15, 0.15, 0.12, '#8b5a2b', { y: 1.6, z: -0.35, rz: Math.PI / 2 });
  root.add(k.build());

  const kite = new THREE.Group();
  root.add(kite);
  // head (faces +Z towards the kid)
  const h = new Parts();
  const RED = '#e8283c', GOLD = '#ffc93c';
  h.sphere(1.6, RED, { sz: 1.3, sy: 0.9, w: 12, hseg: 8 });
  h.box(2.0, 0.7, 1.6, RED, { y: -0.55, z: 1.6 });
  h.box(1.8, 0.35, 1.4, '#ffffff', { y: -0.95, z: 1.7 });
  for (const sx of [-1, 1]) {
    h.sphere(0.5, '#ffffff', { x: sx * 0.75, y: 0.75, z: 1.15 });
    h.sphere(0.24, '#111', { x: sx * 0.78, y: 0.8, z: 1.55 });
    h.cone(0.25, 1.8, GOLD, { x: sx * 0.75, y: 1.6, z: -0.6, rx: -0.9, rz: -sx * 0.35 });
    h.rod({ x: sx * 0.9, y: -0.4, z: 2.3 }, { x: sx * 3.2, y: -1.4, z: 2.0 }, 0.06, GOLD);
    h.sphere(0.35, '#ff8fa3', { x: sx * 1.2, y: -0.15, z: 1.2, sz: 0.4, ry: sx * 0.8 });
    h.cone(0.12, 0.3, '#ffffff', { x: sx * 0.6, y: -0.85, z: 2.35, rx: Math.PI });
  }
  h.box(3.4, 0.08, 0.08, '#5a4630', { y: -0.2, z: -0.5 });
  h.box(0.08, 2.8, 0.08, '#5a4630', { y: 0.2, z: -0.5 });
  kite.add(h.build());

  const t1 = new Parts();
  const N = 15;
  for (let i = 0; i < N; i++) {
    const z = -1.6 - i * 1.6;
    const r = 1.25 * (1 - i * 0.045);
    t1.cyl(r, r, 0.5, i % 2 ? GOLD : RED, { z, rx: Math.PI / 2, seg: 8 });
    t1.cone(0.35, 1.0, GOLD, { y: r + 0.3, z, sz: 0.6, seg: 4 });
    if (i % 3 === 1) {
      t1.box(3.6 * r, 0.06, 0.6, '#3ddc84', { z: z - 0.2, rz: 0.2 });
    }
  }
  const tz = -1.6 - N * 1.6;
  t1.cone(1.2, 3.2, '#3ddc84', { z: tz - 0.6, rx: -Math.PI / 2, sx: 1.4, sy: 1, sz: 0.2, seg: 4 });
  t1.cone(1.0, 2.6, '#3fa7ff', { z: tz - 0.4, rx: -Math.PI / 2, rz: 0.6, sx: 1.2, sz: 0.2, seg: 4 });
  const tail = t1.build({ castShadow: true });
  kite.add(tail);
  const tailGeo = (tail.children[0] as THREE.Mesh).geometry;
  const tailBase = Float32Array.from(tailGeo.attributes.position.array as Float32Array);

  // the string (sagging line)
  const SEG = 20;
  const lineGeo = new THREE.BufferGeometry();
  lineGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array((SEG + 1) * 3), 3));
  const line = new THREE.Line(lineGeo, new THREE.LineBasicMaterial({ color: '#f5f5f5' }));
  line.frustumCulled = false;
  root.add(ghost(line));

  const anchor = new THREE.Vector3(0, 1.6, -0.35);
  const end = new THREE.Vector3();
  onTick((_dt, t) => {
    kite.position.set(Math.sin(t * 0.37) * 5, 26 + Math.sin(t * 0.53) * 2.5, -16 + Math.sin(t * 0.3) * 2);
    kite.rotation.set(-0.35 + Math.sin(t * 0.8) * 0.08, Math.sin(t * 0.37) * 0.2, Math.sin(t * 0.9) * 0.18);
    const a = tailGeo.attributes.position.array as Float32Array;
    for (let i = 0; i < a.length; i += 3) {
      const z = tailBase[i + 2];
      const d = Math.max(0, -z - 1.2) / 24;
      a[i] = tailBase[i] + Math.sin(z * 0.35 + t * 3.2) * 2.4 * d;
      a[i + 1] = tailBase[i + 1] + Math.cos(z * 0.3 + t * 2.4) * 1.4 * d - d * d * 6;
    }
    tailGeo.attributes.position.needsUpdate = true;
    tailGeo.computeVertexNormals();
    kite.updateMatrix();
    end.set(0, -1.0, 0.8).applyMatrix4(kite.matrix);
    const la = lineGeo.attributes.position.array as Float32Array;
    for (let i = 0; i <= SEG; i++) {
      const s = i / SEG;
      la[i * 3] = anchor.x + (end.x - anchor.x) * s;
      la[i * 3 + 1] = anchor.y + (end.y - anchor.y) * s - Math.sin(s * Math.PI) * 2.2;
      la[i * 3 + 2] = anchor.z + (end.z - anchor.z) * s;
    }
    lineGeo.attributes.position.needsUpdate = true;
  });
  return tag(root, 'Drachen', 'dragon_kite', 'Kurioses', 'createDragonKite');
}
