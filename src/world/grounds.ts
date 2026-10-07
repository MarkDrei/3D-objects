import * as THREE from 'three';
import { Parts } from '../core/parts';
import { selectable } from '../core/registry';
import { HALF, PARK_HALF, SEA_Z, SIDEWALK } from './layout';

const PATH = '#e2d3ad';
const PATH_EDGE = '#c9b78d';

/**
 * Park lawn + gravel paths. Layout (park spans ±46 inside the sidewalk):
 *  - a ring path (r = 13) around the central fountain
 *  - four straight paths from the ring to the middle of each park side
 *  - an outer loop path (rounded square at ±33) used by joggers
 */
export const PARK = {
  inner: PARK_HALF - SIDEWALK, // 46
  ring: 13,
  loop: 33,
};

export function buildParkGrounds(scene: THREE.Object3D) {
  const lawn = new Parts().box(PARK.inner * 2, 0.16, PARK.inner * 2, '#74b84e', { y: 0.08 }).build({ castShadow: false });
  scene.add(selectable(lawn, { type: 'Parkwiese', key: 'park_lawn', category: 'Gelände', source: 'prozedural', model: 'buildParkGrounds' }));

  const b = new Parts();
  const y = 0.18;
  // ring around fountain
  b.add(new THREE.RingGeometry(PARK.ring - 2, PARK.ring + 2, 40), PATH, { rx: -Math.PI / 2, y });
  b.add(new THREE.RingGeometry(PARK.ring + 2, PARK.ring + 2.4, 40), PATH_EDGE, { rx: -Math.PI / 2, y: y - 0.005 });
  // straight paths to the 4 sides
  const len = PARK.inner - PARK.ring - 1;
  const mid = PARK.ring + 1 + len / 2;
  for (const [x, z, rot] of [[0, mid, 0], [0, -mid, 0], [mid, 0, Math.PI / 2], [-mid, 0, Math.PI / 2]] as const) {
    b.box(4, 0.02, len + 2, PATH, { x, y, z, ry: rot });
  }
  // outer jogging loop
  const L = PARK.loop;
  for (const s of [-1, 1]) {
    b.box(L * 2 + 3, 0.02, 3, PATH, { z: s * L, y });
    b.box(3, 0.02, L * 2 - 3, PATH, { x: s * L, y });
  }
  const paths = b.build({ castShadow: false });
  scene.add(selectable(paths, { type: 'Parkweg', key: 'park_path', category: 'Gelände', source: 'prozedural', model: 'buildParkGrounds' }));
}

/** Seaside promenade between the southern road and the beach. */
export function buildPromenade(scene: THREE.Object3D) {
  const z0 = HALF + SIDEWALK + 1; // 117
  const z1 = SEA_Z - 6; // 141
  const b = new Parts();
  b.box(HALF * 2 + 120, 0.3, z1 - z0, '#d8cdb8', { y: 0.15, z: (z0 + z1) / 2 });
  // tile pattern stripes
  for (let x = -HALF - 56; x < HALF + 60; x += 8) b.box(0.25, 0.02, z1 - z0, '#c4b8a0', { x, y: 0.31, z: (z0 + z1) / 2 });
  // quay wall / railing towards the beach
  b.box(HALF * 2 + 120, 0.9, 0.5, '#9aa3ad', { y: 0.45, z: z1 });
  for (let x = -HALF - 56; x < HALF + 60; x += 4) b.box(0.15, 1.1, 0.15, '#5b6570', { x, y: 0.85, z: z1 });
  b.box(HALF * 2 + 120, 0.12, 0.12, '#5b6570', { y: 1.4, z: z1 });
  const g = b.build({ castShadow: false });
  scene.add(selectable(g, { type: 'Promenade', key: 'promenade', category: 'Gelände', source: 'prozedural', model: 'buildPromenade' }));
  return { z0, z1 };
}

/** Small rocky island with a mole for the lighthouse. */
export function buildIsland(scene: THREE.Object3D, x: number, z: number) {
  const b = new Parts();
  b.cyl(14, 18, 4, '#8d8577', { y: -1.5, seg: 9 });
  b.cyl(11, 14, 1.2, '#a59c8c', { y: 1, seg: 9 });
  b.ico(4, '#7d756a', { x: 9, y: 0.5, z: 5, sy: 0.6 });
  b.ico(3, '#968d7f', { x: -10, y: 0.2, z: -4, sy: 0.6 });
  b.ico(2.5, '#7d756a', { x: -6, y: 0.4, z: 10, sy: 0.6 });
  const g = b.build();
  g.position.set(x, 0, z);
  scene.add(selectable(g, { type: 'Felseninsel', key: 'island', category: 'Gelände', source: 'prozedural', model: 'buildIsland' }));
  return g;
}
