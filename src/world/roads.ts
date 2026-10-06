import * as THREE from 'three';
import { Parts } from '../core/parts';
import { selectable } from '../core/registry';
import { BLOCK, HALF, N, P, ROAD, SIDEWALK, edgeExists, nodeExists, roadPos, blockPos, PARK_HALF } from './layout';

const ASPHALT = '#3b3f4a';
const ASPHALT_X = '#41454f';
const LINE = '#f2f2e6';
const YELLOW = '#ffc93c';
const CURB = '#c9c6bd';
const WALK = '#b9b4aa';

/** Roads, intersections, sidewalks. Every segment is its own selectable object. */
export function buildRoads(scene: THREE.Scene) {
  // straight segments
  for (let i = 0; i <= N; i++) {
    for (let j = 0; j <= N; j++) {
      if (edgeExists(i, j, i + 1, j)) scene.add(segment(i, j, 'x'));
      if (edgeExists(i, j, i, j + 1)) scene.add(segment(i, j, 'z'));
    }
  }
  // intersections
  for (let i = 0; i <= N; i++) {
    for (let j = 0; j <= N; j++) {
      if (!nodeExists(i, j)) continue;
      const deg = [[1, 0], [-1, 0], [0, 1], [0, -1]].filter(([di, dj]) => edgeExists(i, j, i + di, j + dj)).length;
      const b = new Parts();
      b.box(ROAD, 0.12, ROAD, ASPHALT_X, { y: 0.06 });
      if (deg === 4) {
        // a little yellow box junction
        b.box(ROAD * 0.5, 0.01, 0.25, YELLOW, { y: 0.125 });
        b.box(0.25, 0.01, ROAD * 0.5, YELLOW, { y: 0.125 });
      }
      const g = b.build({ castShadow: false, receiveShadow: true });
      g.position.set(roadPos(i), 0, roadPos(j));
      selectable(g, { type: 'Kreuzung', key: 'crossing', category: 'Verkehr', source: 'prozedural', model: 'buildRoads', variant: deg === 4 ? 'Vierwege' : deg === 3 ? 'T-Kreuzung' : 'Kurve' });
      scene.add(g);
    }
  }
  // sidewalk slabs for every block (the park gets one big one)
  for (let bx = 0; bx < N; bx++) {
    for (let bz = 0; bz < N; bz++) {
      if (bx >= 1 && bx <= 2 && bz >= 1 && bz <= 2) continue;
      scene.add(sidewalk(blockPos(bx), blockPos(bz), BLOCK, BLOCK));
    }
  }
  scene.add(sidewalk(0, 0, PARK_HALF * 2, PARK_HALF * 2, true));
  // outer ring sidewalk (outside the outermost roads)
  const outer = new Parts();
  const w = SIDEWALK + 1;
  const L = HALF * 2 + w * 2;
  outer.box(L, 0.25, w, WALK, { y: 0.125, z: -HALF - w / 2 });
  outer.box(L, 0.25, w, WALK, { y: 0.125, z: HALF + w / 2 });
  outer.box(w, 0.25, L - 2 * w, WALK, { y: 0.125, x: -HALF - w / 2 });
  outer.box(w, 0.25, L - 2 * w, WALK, { y: 0.125, x: HALF + w / 2 });
  const og = outer.build({ castShadow: false });
  selectable(og, { type: 'Gehweg', key: 'sidewalk', category: 'Verkehr', source: 'prozedural', model: 'buildRoads', variant: 'Außenring' });
  scene.add(og);
}

function segment(i: number, j: number, axis: 'x' | 'z') {
  const len = P - ROAD;
  const b = new Parts();
  b.box(len, 0.12, ROAD, ASPHALT, { y: 0.06 });
  // dashed center line
  const dashes = 7;
  for (let k = 0; k < dashes; k++) {
    const x = -len / 2 + (k + 0.5) * (len / dashes);
    b.box(2.4, 0.01, 0.22, LINE, { x, y: 0.125 });
  }
  // edge lines
  b.box(len, 0.01, 0.15, LINE, { y: 0.125, z: ROAD / 2 - 0.4 });
  b.box(len, 0.01, 0.15, LINE, { y: 0.125, z: -ROAD / 2 + 0.4 });
  // zebra crossings on both ends
  for (const end of [-1, 1]) {
    for (let s = 0; s < 6; s++) {
      const z = -ROAD / 2 + 0.9 + s * ((ROAD - 1.8) / 5);
      b.box(2.2, 0.012, 0.75, LINE, { x: end * (len / 2 - 1.6), y: 0.126, z });
    }
    // stop line
    b.box(0.35, 0.012, ROAD / 2 - 0.6, LINE, { x: end * (len / 2 - 3.2), y: 0.126, z: end * (ROAD / 4 - 0.1) });
  }
  const g = b.build({ castShadow: false });
  if (axis === 'x') g.position.set(roadPos(i) + P / 2, 0, roadPos(j));
  else {
    g.position.set(roadPos(i), 0, roadPos(j) + P / 2);
    g.rotation.y = Math.PI / 2;
  }
  return selectable(g, { type: 'Straße', key: 'road', category: 'Verkehr', source: 'prozedural', model: 'buildRoads', variant: axis === 'x' ? 'Ost-West' : 'Nord-Süd' });
}

/** Raised sidewalk ring with curb, interior left open for the district content. */
function sidewalk(cx: number, cz: number, w: number, d: number, park = false) {
  const b = new Parts();
  const h = 0.25;
  const s = SIDEWALK;
  b.box(w, h, s, WALK, { y: h / 2, z: -d / 2 + s / 2 });
  b.box(w, h, s, WALK, { y: h / 2, z: d / 2 - s / 2 });
  b.box(s, h, d - 2 * s, WALK, { y: h / 2, x: -w / 2 + s / 2 });
  b.box(s, h, d - 2 * s, WALK, { y: h / 2, x: w / 2 - s / 2 });
  // curb stones
  b.box(w, h + 0.04, 0.3, CURB, { y: (h + 0.04) / 2, z: -d / 2 + 0.15 });
  b.box(w, h + 0.04, 0.3, CURB, { y: (h + 0.04) / 2, z: d / 2 - 0.15 });
  b.box(0.3, h + 0.04, d, CURB, { y: (h + 0.04) / 2, x: -w / 2 + 0.15 });
  b.box(0.3, h + 0.04, d, CURB, { y: (h + 0.04) / 2, x: w / 2 - 0.15 });
  const g = b.build({ castShadow: false });
  g.position.set(cx, 0, cz);
  return selectable(g, { type: 'Gehweg', key: 'sidewalk', category: 'Verkehr', source: 'prozedural', model: 'buildRoads', variant: park ? 'Park' : undefined });
}
