import * as THREE from 'three';
import { Parts } from '../core/parts';
import { selectable } from '../core/registry';
import { onTick, env } from '../core/anim';
import { textPlane, TAU } from './city-util';

const POLE = '#3c4a52';

/** Street lamp ~5.2 m, arm reaching toward +Z. Footprint 0.5 x 1.6. 2 meshes. */
export function createStreetLamp(): THREE.Object3D {
  const b = new Parts();
  b.cyl(0.22, 0.28, 0.5, POLE, { y: 0.25, seg: 8 });
  b.cyl(0.08, 0.11, 5, POLE, { y: 2.6, seg: 8 });
  b.torus(0.12, 0.04, POLE, { y: 1.0, rx: Math.PI / 2, rs: 4, ts: 8 });
  // curved arm
  b.beam({ x: 0, y: 5.0, z: 0 }, { x: 0, y: 5.35, z: 0.55 }, 0.1, POLE);
  b.beam({ x: 0, y: 5.35, z: 0.55 }, { x: 0, y: 5.3, z: 1.15 }, 0.1, POLE);
  b.cyl(0.08, 0.38, 0.32, '#2d3940', { y: 5.12, z: 1.2, seg: 8 });
  b.cyl(0.3, 0.26, 0.14, '#fff4d0', { y: 4.92, z: 1.2, seg: 8, mat: 'lamp' });
  b.sphere(0.06, '#e6b422', { y: 5.32, z: 1.2 });
  const g = b.build();
  return selectable(g, { type: 'Straßenlaterne', key: 'street_lamp', category: 'Stadtmobiliar', source: 'prozedural', model: 'createStreetLamp' });
}

const BULB_GEO = new THREE.CylinderGeometry(0.16, 0.16, 0.06, 12).rotateX(Math.PI / 2);
const LIT: Record<string, THREE.Material> = {
  red: new THREE.MeshBasicMaterial({ color: '#ff2a2a', toneMapped: false }),
  yellow: new THREE.MeshBasicMaterial({ color: '#ffc21a', toneMapped: false }),
  green: new THREE.MeshBasicMaterial({ color: '#2aff6a', toneMapped: false }),
};

/**
 * Traffic light (Ampel) ~4.6 m, lights face +Z. userData.setState('red'|'yellow'|'green').
 * 1 static mesh (incl. dark bulbs) + 3 lit-bulb meshes of which only one is visible.
 */
export function createTrafficLight(): THREE.Object3D {
  const b = new Parts();
  b.cyl(0.2, 0.24, 0.3, '#2b2f33', { y: 0.15, seg: 8 });
  b.cyl(0.07, 0.07, 4.1, '#59636b', { y: 2.2, seg: 8 });
  // stripes on pole
  b.cyl(0.075, 0.075, 0.3, '#f0f0f0', { y: 1.2, seg: 8 });
  b.cyl(0.075, 0.075, 0.3, '#e63a2e', { y: 1.5, seg: 8 });
  // housing
  b.box(0.55, 1.5, 0.35, '#22262b', { y: 3.85, z: 0.12 });
  b.box(0.75, 1.75, 0.05, '#ffd21f', { y: 3.85, z: -0.07 }); // yellow back plate (German style)
  const ys = [4.35, 3.85, 3.35];
  for (const y of ys) {
    b.cyl(0.17, 0.17, 0.05, '#2c3036', { y, z: 0.3, rx: Math.PI / 2, seg: 12 });
    b.box(0.42, 0.06, 0.22, '#15181b', { y: y + 0.2, z: 0.4, rx: -0.25 }); // visor
  }
  // pedestrian push button
  b.box(0.18, 0.28, 0.12, '#ffd21f', { y: 1.05, z: 0.1 });
  b.box(0.1, 0.06, 0.03, '#222', { y: 1.08, z: 0.17 });
  const g = b.build();
  const bulbs: Record<string, THREE.Mesh> = {};
  (['red', 'yellow', 'green'] as const).forEach((c, i) => {
    const m = new THREE.Mesh(BULB_GEO, LIT[c]);
    m.position.set(0, ys[i], 0.33);
    m.visible = false;
    g.add(m);
    bulbs[c] = m;
  });
  let cur = '';
  g.userData.setState = (s: 'red' | 'yellow' | 'green') => {
    if (s === cur) return;
    cur = s;
    for (const k in bulbs) bulbs[k].visible = k === s;
  };
  g.userData.setState('red');
  return selectable(g, { type: 'Ampel', key: 'traffic_light', category: 'Verkehr', source: 'prozedural', model: 'createTrafficLight' });
}

/** Fire hydrant ~0.9 m. 1 mesh. */
export function createHydrant(): THREE.Object3D {
  const b = new Parts();
  b.cyl(0.24, 0.26, 0.12, '#b8241c', { y: 0.06, seg: 8 });
  b.cyl(0.17, 0.19, 0.62, '#e2352a', { y: 0.42, seg: 8 });
  b.cyl(0.2, 0.2, 0.08, '#b8241c', { y: 0.74, seg: 8 });
  b.sphere(0.16, '#e2352a', { y: 0.78, hseg: 5, w: 8, sy: 0.8 });
  b.cyl(0.05, 0.05, 0.08, '#d7d7d7', { y: 0.95, seg: 6 });
  b.cyl(0.07, 0.07, 0.2, '#d7d7d7', { x: 0.2, y: 0.5, rz: Math.PI / 2, seg: 6 });
  b.cyl(0.07, 0.07, 0.2, '#d7d7d7', { x: -0.2, y: 0.5, rz: Math.PI / 2, seg: 6 });
  b.cyl(0.09, 0.09, 0.14, '#d7d7d7', { z: 0.2, y: 0.5, rx: Math.PI / 2, seg: 6 });
  return selectable(b.build(), { type: 'Hydrant', key: 'hydrant', category: 'Stadtmobiliar', source: 'prozedural', model: 'createHydrant' });
}

/** German yellow mailbox on a post ~1.5 m, slot facing +Z. 1 mesh. */
export function createMailbox(): THREE.Object3D {
  const b = new Parts();
  b.cyl(0.05, 0.05, 1.0, '#555c62', { y: 0.5, seg: 6 });
  b.box(0.55, 0.62, 0.36, '#ffcc00', { y: 1.2 });
  b.cyl(0.18, 0.18, 0.55, '#ffcc00', { y: 1.51, rz: Math.PI / 2, seg: 10, sy: 1 });
  b.box(0.36, 0.04, 0.03, '#222', { y: 1.38, z: 0.19 });
  // post horn
  b.torus(0.08, 0.022, '#111', { y: 1.15, z: 0.185, rs: 4, ts: 10 });
  b.box(0.12, 0.03, 0.02, '#111', { x: 0.1, y: 1.15, z: 0.19 });
  b.box(0.2, 0.08, 0.02, '#e9e9e9', { y: 0.98, z: 0.185 });
  return selectable(b.build(), { type: 'Briefkasten', key: 'mailbox', category: 'Stadtmobiliar', source: 'prozedural', model: 'createMailbox' });
}

/** Orange city trash can on a post ~1.2 m. 1 mesh. */
export function createTrashCan(): THREE.Object3D {
  const b = new Parts();
  b.cyl(0.05, 0.05, 0.7, '#4a5359', { y: 0.35, seg: 6 });
  b.cyl(0.3, 0.26, 0.7, '#ff7a1a', { y: 0.85, seg: 10 });
  b.cyl(0.31, 0.31, 0.06, '#d75e0b', { y: 1.21, seg: 10 });
  b.cyl(0.18, 0.18, 0.04, '#2a2a2a', { y: 1.24, seg: 10 });
  b.box(0.3, 0.12, 0.02, '#ffffff', { y: 0.95, z: 0.29 });
  return selectable(b.build(), { type: 'Mülleimer', key: 'trash_can', category: 'Stadtmobiliar', source: 'prozedural', model: 'createTrashCan' });
}

/** Red phone booth ~2.7 m, door +Z. 3 meshes (std, glass, lamp). */
export function createPhoneBooth(): THREE.Object3D {
  const b = new Parts();
  const R = '#d2232a';
  b.box(1.1, 0.15, 1.1, '#9a1a1f', { y: 0.075 });
  for (const [x, z] of [[-0.5, -0.5], [0.5, -0.5], [-0.5, 0.5], [0.5, 0.5]]) b.box(0.12, 2.3, 0.12, R, { x, y: 1.3, z });
  b.box(1.08, 2.0, 0.06, R, { y: 1.2, z: -0.5 });
  b.box(1.16, 0.2, 1.16, R, { y: 2.5 });
  b.box(0.9, 0.18, 1.0, R, { y: 2.68, sx: 1, rz: 0 });
  b.sphere(0.12, '#ffcc00', { y: 2.84 });
  // window glazing bars
  for (const side of [-1, 1]) {
    for (let k = 0; k < 3; k++) b.box(0.9, 0.04, 0.05, R, { y: 0.9 + k * 0.5, x: 0, z: side * 0.52 });
    b.box(0.04, 1.6, 0.05, R, { y: 1.5, z: side * 0.52 });
  }
  for (let k = 0; k < 3; k++) b.box(0.05, 0.04, 0.9, R, { y: 0.9 + k * 0.5, x: 0.52 });
  for (let k = 0; k < 3; k++) b.box(0.05, 0.04, 0.9, R, { y: 0.9 + k * 0.5, x: -0.52 });
  b.box(0.9, 1.55, 0.03, '#bfe6ff', { y: 1.55, z: 0.5, mat: 'glass' });
  b.box(0.03, 1.55, 0.9, '#bfe6ff', { y: 1.55, x: 0.5, mat: 'glass' });
  b.box(0.03, 1.55, 0.9, '#bfe6ff', { y: 1.55, x: -0.5, mat: 'glass' });
  // TELEFON crown plates
  b.box(0.8, 0.16, 0.04, '#fffbe0', { y: 2.45, z: 0.59, mat: 'lamp' });
  b.box(0.04, 0.16, 0.8, '#fffbe0', { y: 2.45, x: 0.59, mat: 'lamp' });
  b.box(0.04, 0.16, 0.8, '#fffbe0', { y: 2.45, x: -0.59, mat: 'lamp' });
  // phone inside
  b.box(0.3, 0.4, 0.15, '#222', { y: 1.5, z: -0.4 });
  const g = b.build();
  const sign = textPlane('TELEFON', 0.75, 0.13, { bg: '#fffbe0', fg: '#111', px: 64 });
  sign.position.set(0, 2.45, 0.625);
  g.add(sign);
  return selectable(g, { type: 'Telefonzelle', key: 'phone_booth', category: 'Stadtmobiliar', source: 'prozedural', model: 'createPhoneBooth' });
}

/** Bus stop with shelter, bench, glowing ad panel and H sign. Footprint 4 x 1.6, ~3 m. Open side +Z. */
export function createBusStop(): THREE.Object3D {
  const b = new Parts();
  const F = '#5b6770';
  b.box(4, 0.08, 1.7, '#9aa1a6', { y: 0.04 });
  for (const x of [-1.85, 1.85]) {
    b.box(0.1, 2.5, 0.1, F, { x, y: 1.25, z: -0.65 });
    b.box(0.1, 2.5, 0.1, F, { x, y: 1.25, z: 0.55 });
  }
  b.box(4.2, 0.12, 1.8, '#3e4a52', { y: 2.55, rx: -0.06 });
  b.box(3.6, 2.1, 0.04, '#cfe9ff', { y: 1.3, z: -0.66, mat: 'glass' });
  b.box(0.04, 2.1, 1.1, '#cfe9ff', { x: -1.85, y: 1.3, z: -0.05, mat: 'glass' });
  // ad panel (right side), glowing
  b.box(0.12, 2.0, 1.15, F, { x: 1.88, y: 1.3, z: -0.05 });
  b.box(0.04, 1.8, 1.0, '#ff5fa2', { x: 1.95, y: 1.3, z: -0.05, mat: 'lamp' });
  b.box(0.04, 0.6, 0.7, '#ffe14d', { x: 1.98, y: 1.5, z: -0.05, mat: 'lamp' });
  // bench
  b.box(2.6, 0.08, 0.45, '#c98a4b', { y: 0.5, z: -0.35 });
  b.box(0.08, 0.5, 0.4, F, { x: -1.1, y: 0.25, z: -0.35 });
  b.box(0.08, 0.5, 0.4, F, { x: 1.1, y: 0.25, z: -0.35 });
  // H sign
  b.cyl(0.05, 0.05, 3.0, F, { x: -2.3, y: 1.5, z: 0.6, seg: 6 });
  b.cyl(0.32, 0.32, 0.06, '#ffcc00', { x: -2.3, y: 2.85, z: 0.6, rx: Math.PI / 2, seg: 14 });
  b.cyl(0.26, 0.26, 0.07, '#1f9d55', { x: -2.3, y: 2.85, z: 0.6, rx: Math.PI / 2, seg: 14 });
  b.box(0.06, 0.28, 0.08, '#ffcc00', { x: -2.38, y: 2.85, z: 0.6 });
  b.box(0.06, 0.28, 0.08, '#ffcc00', { x: -2.22, y: 2.85, z: 0.6 });
  b.box(0.16, 0.05, 0.08, '#ffcc00', { x: -2.3, y: 2.85, z: 0.6 });
  b.box(0.5, 0.35, 0.04, '#ffffff', { x: -2.3, y: 2.3, z: 0.6 });
  return selectable(b.build(), { type: 'Bushaltestelle', key: 'bus_stop', category: 'Stadtmobiliar', source: 'prozedural', model: 'createBusStop' });
}

function bike(b: Parts, x: number, z: number, color: string) {
  const R = 0.33;
  b.torus(R, 0.04, '#222', { x, y: R, z: z - 0.5, ry: Math.PI / 2, rs: 4, ts: 12 });
  b.torus(R, 0.04, '#222', { x, y: R, z: z + 0.5, ry: Math.PI / 2, rs: 4, ts: 12 });
  b.beam({ x, y: R, z: z - 0.5 }, { x, y: 0.75, z: z - 0.1 }, 0.05, color);
  b.beam({ x, y: 0.75, z: z - 0.1 }, { x, y: 0.78, z: z + 0.4 }, 0.05, color);
  b.beam({ x, y: R, z: z - 0.5 }, { x, y: R + 0.02, z: z + 0.05 }, 0.05, color);
  b.beam({ x, y: R + 0.02, z: z + 0.05 }, { x, y: 0.78, z: z + 0.4 }, 0.05, color);
  b.beam({ x, y: R + 0.02, z: z + 0.05 }, { x, y: 0.75, z: z - 0.1 }, 0.05, color);
  b.beam({ x, y: 0.78, z: z + 0.4 }, { x, y: R, z: z + 0.5 }, 0.05, color);
  b.box(0.12, 0.05, 0.25, '#222', { x, y: 0.82, z: z - 0.12 });
  b.box(0.5, 0.04, 0.04, '#222', { x, y: 0.95, z: z + 0.42 });
  b.beam({ x, y: 0.78, z: z + 0.4 }, { x, y: 0.95, z: z + 0.42 }, 0.04, '#222');
}

/** Bike rack with 3 bikes. Footprint 3 x 1.3. 1 mesh. Bikes point along Z. */
export function createBikeRack(): THREE.Object3D {
  const b = new Parts();
  for (let i = 0; i < 4; i++) {
    const x = -1.2 + i * 0.8;
    b.torus(0.4, 0.04, '#9aa4ab', { x, y: 0, z: 0.2, ry: Math.PI / 2, arc: Math.PI, rs: 4, ts: 8 });
  }
  bike(b, -0.8, 0.1, '#e8403a');
  bike(b, 0.0, 0.25, '#2c8ef8');
  bike(b, 0.8, 0.05, '#2fbf71');
  return selectable(b.build(), { type: 'Fahrradständer', key: 'bike_rack', category: 'Stadtmobiliar', source: 'prozedural', model: 'createBikeRack' });
}

/** News kiosk ~3 x 2.4 x 3.2 m, counter at +Z. 3 meshes. */
export function createNewsKiosk(): THREE.Object3D {
  const b = new Parts();
  b.box(3, 2.4, 2.2, '#2e7d5b', { y: 1.2 });
  b.box(3.4, 0.2, 2.6, '#1f5a40', { y: 2.5 });
  b.cyl(0.0, 1.8, 0.6, '#1f5a40', { y: 2.9, seg: 4, ry: Math.PI / 4, sx: 1.2 });
  b.box(2.6, 1.0, 0.05, '#ffe9b0', { y: 1.65, z: 1.11, mat: 'lamp' });
  b.box(2.8, 0.1, 0.5, '#d9c3a0', { y: 1.1, z: 1.3 });
  // magazines on counter + side racks
  const mags = ['#ff5a5a', '#5ab0ff', '#ffd23f', '#b06bff', '#4fd18b', '#ff8fd0'];
  for (let i = 0; i < 9; i++) b.box(0.26, 0.04, 0.34, mags[i % mags.length], { x: -1.2 + i * 0.3, y: 1.18, z: 1.3, ry: (i % 3) * 0.1 });
  for (let r = 0; r < 3; r++) for (let i = 0; i < 4; i++) b.box(0.04, 0.38, 0.28, mags[(i + r) % mags.length], { x: 1.53, y: 0.5 + r * 0.5, z: -0.7 + i * 0.4, rz: 0.1 });
  for (let r = 0; r < 3; r++) for (let i = 0; i < 4; i++) b.box(0.04, 0.38, 0.28, mags[(i + r + 2) % mags.length], { x: -1.53, y: 0.5 + r * 0.5, z: -0.7 + i * 0.4, rz: -0.1 });
  const g = b.build();
  const sign = textPlane('KIOSK', 2.4, 0.42, { bg: '#ffd23f', fg: '#1f5a40', px: 96 });
  sign.position.set(0, 2.5, 1.31);
  g.add(sign);
  return selectable(g, { type: 'Zeitungskiosk', key: 'news_kiosk', category: 'Stadtmobiliar', source: 'prozedural', model: 'createNewsKiosk' });
}

const ADS: { bg: [string, string]; title: string; sub: string; fg: string; icon: 'donut' | 'rocket' | 'robot' | 'heart' }[] = [
  { bg: ['#ff5fa2', '#ffb36b'], title: 'POLYDONUTS', sub: 'Jetzt mit 3D-Glasur!', fg: '#fff', icon: 'donut' },
  { bg: ['#1b2a6b', '#5b2bbf'], title: 'MONDURLAUB', sub: 'Raketenstart täglich · Nord', fg: '#ffe14d', icon: 'rocket' },
  { bg: ['#13c2a3', '#1d7fd8'], title: 'ROBO-RAMA', sub: 'Der Riese winkt zurück', fg: '#fff', icon: 'robot' },
  { bg: ['#ff3b3b', '#ff9b1a'], title: 'I ♥ POLYHAFEN', sub: 'Die Stadt aus Dreiecken', fg: '#fff', icon: 'heart' },
];

function drawIcon(g: CanvasRenderingContext2D, kind: string, x: number, y: number, s: number, t: number) {
  g.save();
  g.translate(x, y);
  g.rotate(Math.sin(t * 2) * 0.15);
  if (kind === 'donut') {
    g.fillStyle = '#e9a85a'; g.beginPath(); g.arc(0, 0, s, 0, TAU); g.fill();
    g.fillStyle = '#ff7ac0'; g.beginPath(); g.arc(0, -s * 0.05, s * 0.88, 0, TAU); g.fill();
    g.fillStyle = 'rgba(0,0,0,0)'; g.globalCompositeOperation = 'destination-out';
    g.beginPath(); g.arc(0, 0, s * 0.33, 0, TAU); g.fill(); g.globalCompositeOperation = 'source-over';
    const cs = ['#fff', '#5af', '#ff0', '#5f5'];
    for (let i = 0; i < 14; i++) { const a = i * 2.4, r = s * (0.5 + (i % 3) * 0.12); g.fillStyle = cs[i % 4]; g.fillRect(Math.cos(a) * r, Math.sin(a) * r, s * 0.14, s * 0.05); }
  } else if (kind === 'rocket') {
    g.translate(0, Math.sin(t * 6) * 4);
    g.fillStyle = '#ff9b1a'; g.beginPath(); g.moveTo(-s * 0.25, s * 0.7); g.lineTo(0, s * (1.1 + Math.random() * 0.3)); g.lineTo(s * 0.25, s * 0.7); g.fill();
    g.fillStyle = '#eee'; g.fillRect(-s * 0.3, -s * 0.5, s * 0.6, s * 1.2);
    g.fillStyle = '#ff3b3b'; g.beginPath(); g.moveTo(-s * 0.3, -s * 0.5); g.lineTo(0, -s * 1.1); g.lineTo(s * 0.3, -s * 0.5); g.fill();
    g.fillStyle = '#4ab8ff'; g.beginPath(); g.arc(0, -s * 0.1, s * 0.15, 0, TAU); g.fill();
  } else if (kind === 'robot') {
    g.fillStyle = '#cfd8e3'; g.fillRect(-s * 0.6, -s * 0.5, s * 1.2, s);
    g.fillStyle = '#ff3b3b'; const blink = Math.sin(t * 3) > 0.9 ? 0.05 : 0.2;
    g.fillRect(-s * 0.4, -s * 0.2, s * 0.25, s * blink); g.fillRect(s * 0.15, -s * 0.2, s * 0.25, s * blink);
    g.fillStyle = '#333'; g.fillRect(-s * 0.3, s * 0.2, s * 0.6, s * 0.1);
    g.fillStyle = '#ffe14d'; g.beginPath(); g.arc(0, -s * 0.8, s * 0.12, 0, TAU); g.fill();
    g.fillStyle = '#cfd8e3'; g.fillRect(-s * 0.03, -s * 0.75, s * 0.06, s * 0.25);
  } else {
    const k = s * (1 + Math.sin(t * 6) * 0.08);
    g.fillStyle = '#fff'; g.beginPath(); g.moveTo(0, k * 0.8);
    g.bezierCurveTo(-k * 1.3, -k * 0.1, -k * 0.6, -k * 1.0, 0, -k * 0.4);
    g.bezierCurveTo(k * 0.6, -k * 1.0, k * 1.3, -k * 0.1, 0, k * 0.8); g.fill();
  }
  g.restore();
}

/**
 * Big billboard ~12 x 6 m panel on two legs (total ~11.5 m high), screen faces +Z.
 * Animated canvas ad (≤ 10 fps), glows at night. 3 meshes.
 */
export function createBillboard(text?: string): THREE.Object3D {
  const b = new Parts();
  const S = '#4a5560';
  for (const x of [-3.5, 3.5]) {
    b.box(0.5, 5.2, 0.5, S, { x, y: 2.6 });
    b.box(1.2, 0.3, 1.2, '#7b858d', { x, y: 0.15 });
  }
  b.box(12.6, 6.6, 0.4, '#2a3138', { y: 8.2, z: -0.2 });
  b.box(12.6, 0.15, 1.2, '#3a434b', { y: 4.95, z: 0.3 });
  // spotlights on top
  for (const x of [-4.5, 0, 4.5]) {
    b.beam({ x, y: 11.5, z: -0.2 }, { x, y: 11.8, z: 1.2 }, 0.1, S);
    b.cyl(0.25, 0.15, 0.4, '#fff4d0', { x, y: 11.75, z: 1.3, rx: 2.4, mat: 'lamp', seg: 8 });
  }
  // catwalk railing
  for (let i = 0; i <= 8; i++) b.box(0.05, 0.7, 0.05, S, { x: -6 + i * 1.5, y: 5.35, z: 0.85 });
  b.box(12.2, 0.05, 0.05, S, { y: 5.7, z: 0.85 });
  const g = b.build();

  const c = document.createElement('canvas');
  c.width = 512; c.height = 256;
  const ctx = c.getContext('2d')!;
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  const mat = new THREE.MeshStandardMaterial({ map: tex, emissive: new THREE.Color('#ffffff'), emissiveMap: tex, emissiveIntensity: 0.25, roughness: 0.6 });
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(12, 6), mat);
  screen.position.set(0, 8.2, 0.02);
  g.add(screen);

  const ads = text ? [{ ...ADS[3], title: text, sub: 'Polyhafen', icon: 'heart' as const }, ...ADS] : ADS;
  let acc = 1, idx = Math.floor(Math.random() * ads.length), adT = 0;
  const draw = (t: number) => {
    const ad = ads[idx];
    const gr = ctx.createLinearGradient(0, 0, 512, 256);
    gr.addColorStop(0, ad.bg[0]); gr.addColorStop(1, ad.bg[1]);
    ctx.fillStyle = gr; ctx.fillRect(0, 0, 512, 256);
    // rays
    ctx.save(); ctx.translate(120, 128); ctx.rotate(t * 0.3);
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    for (let i = 0; i < 10; i++) { ctx.rotate(TAU / 10); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(300, -30); ctx.lineTo(300, 30); ctx.fill(); }
    ctx.restore();
    drawIcon(ctx, ad.icon, 120, 128, 70, t);
    const slide = Math.max(0, 1 - adT * 2.5);
    ctx.fillStyle = ad.fg; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    let size = 58; ctx.font = `900 ${size}px "Arial Black", Impact, sans-serif`;
    while (ctx.measureText(ad.title).width > 300 && size > 20) { size -= 2; ctx.font = `900 ${size}px "Arial Black", Impact, sans-serif`; }
    ctx.fillText(ad.title, 205 + slide * 320, 110);
    ctx.font = '700 24px system-ui, sans-serif';
    ctx.fillText(ad.sub, 205 + slide * 500, 168);
    // blinking border bulbs
    for (let i = 0; i < 24; i++) {
      const on = (i + Math.floor(t * 6)) % 3 === 0;
      ctx.fillStyle = on ? '#fff7b0' : 'rgba(255,255,255,0.25)';
      const x = (i / 24) * 512 + 10;
      ctx.beginPath(); ctx.arc(x, 8, 5, 0, TAU); ctx.arc(x, 248, 5, 0, TAU); ctx.fill();
    }
    tex.needsUpdate = true;
  };
  onTick((dt, t) => {
    adT += dt;
    if (adT > 7) { adT = 0; idx = (idx + 1) % ads.length; }
    mat.emissiveIntensity = 0.25 + env.night * 0.8;
    acc += dt;
    if (acc < 0.1) return;
    acc = 0;
    draw(t);
  });
  draw(0);
  return selectable(g, { type: 'Werbetafel', key: 'billboard', category: 'Stadtmobiliar', source: 'prozedural', model: 'createBillboard' });
}
