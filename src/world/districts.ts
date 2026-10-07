import * as THREE from 'three';
import { Parts, rng, pick } from '../core/parts';
import { selectable } from '../core/registry';
import { BLOCK, SIDEWALK, blockPos, HALF, SEA_Z } from './layout';
import { mergeInstances } from '../core/assets';
import { skyscraper, commercial, house, tree, nature, suburbTree, suburbFence, TREE_NAMES } from './gltf';

export type Side = 'n' | 's' | 'e' | 'w';
/** rotation.y so that an object's front (+Z) faces the given side */
export const FACE: Record<Side, number> = { s: 0, n: Math.PI, e: Math.PI / 2, w: -Math.PI / 2 };

export function place<T extends THREE.Object3D>(scene: THREE.Object3D, o: T, x: number, z: number, rotY = 0, y = 0): T {
  o.position.set(x, y, z);
  o.rotation.y = rotY;
  scene.add(o);
  const extras = o.userData.extras as THREE.Object3D[] | undefined;
  if (extras) for (const e of extras) {
    // extras are defined relative to their parent object
    e.applyMatrix4(new THREE.Matrix4().compose(o.position, o.quaternion, o.scale));
    scene.add(e);
  }
  return o;
}

/** Inner usable half size of a block (inside the sidewalk). */
export const INNER = BLOCK / 2 - SIDEWALK; // 19

/** Point on a block side: `along` in [-1, 1] along the side, `inset` = distance from the sidewalk inwards. */
export function sidePoint(cx: number, cz: number, side: Side, along: number, inset: number): [number, number] {
  const a = along * INNER;
  switch (side) {
    case 's': return [cx + a, cz + INNER - inset];
    case 'n': return [cx - a, cz - INNER + inset];
    case 'e': return [cx + INNER - inset, cz - a];
    case 'w': return [cx - INNER + inset, cz + a];
  }
}

/** Plaza / lawn ground tile inside a block. */
export function blockGround(scene: THREE.Object3D, cx: number, cz: number, color: string, type: string, key: string, size = INNER * 2) {
  const g = new Parts().box(size, 0.2, size, color, { y: 0.1 }).build({ castShadow: false });
  g.position.set(cx, 0, cz);
  scene.add(selectable(g, { type, key, category: 'Gelände', source: 'prozedural', model: 'blockGround' }));
  return g;
}

// ---------------------------------------------------------------------------
// Downtown (north row)
export function downtownTowers(scene: THREE.Object3D, bx: number, bz: number, variants: number[], plaza = '#cfc8bb') {
  const cx = blockPos(bx), cz = blockPos(bz);
  blockGround(scene, cx, cz, plaza, 'Platz', 'plaza');
  const slots: [number, number, Side][] = [[-9.5, -9.5, 'n'], [9.5, -9.5, 'n'], [-9.5, 9.5, 's'], [9.5, 9.5, 's']];
  const out: THREE.Object3D[] = [];
  variants.forEach((v, k) => {
    if (v < 0) return;
    const [dx, dz, side] = slots[k];
    out.push(place(scene, skyscraper(v, 17), cx + dx, cz + dz, FACE[side]));
  });
  return out;
}

/** A row of shops/offices along given sides of a block. */
export function shopRow(scene: THREE.Object3D, bx: number, bz: number, sides: Side[], seed: number, count = 3) {
  const r = rng(seed);
  const cx = blockPos(bx), cz = blockPos(bz);
  for (const side of sides) {
    for (let k = 0; k < count; k++) {
      const along = count === 1 ? 0 : -0.66 + (k * 1.32) / (count - 1);
      const [x, z] = sidePoint(cx, cz, side, along, 6.5);
      place(scene, commercial(Math.floor(r() * 14), 12), x, z, FACE[side]);
    }
  }
}

// ---------------------------------------------------------------------------
// Suburb: houses with gardens, fences and trees
export function suburb(scene: THREE.Object3D, bx: number, bz: number, seed: number, sides: Side[] = ['n', 's']) {
  const r = rng(seed);
  const cx = blockPos(bx), cz = blockPos(bz);
  blockGround(scene, cx, cz, '#7cbd55', 'Garten', 'garden');
  const houses: THREE.Object3D[] = [];
  for (const side of sides) {
    for (const along of [-0.5, 0.5]) {
      const [x, z] = sidePoint(cx, cz, side, along, 6.8);
      const h = place(scene, house(Math.floor(r() * 21), 9, Math.floor(r() * 5)), x, z, FACE[side]);
      houses.push(h);
      // front garden: fence segments left and right of the garden path + a tree
      for (const off of [-0.29, 0.29]) {
        const [fx, fz] = sidePoint(cx, cz, side, along + off, 0.7);
        place(scene, suburbFence(3), fx, fz, FACE[side]);
      }
      if (r() < 0.85) {
        const [tx, tz] = sidePoint(cx, cz, side, along + (r() < 0.5 ? -0.4 : 0.4), 2.6);
        place(scene, r() < 0.4 ? suburbTree(true) : tree(pick(r, ['tree_oak', 'tree_default', 'tree_fat', 'tree_detailed']), 5.5 + r() * 2), tx, tz, r() * 6);
      }
    }
  }
  // hedges along the two remaining sides
  for (const side of (['n', 's', 'e', 'w'] as Side[]).filter((s) => !sides.includes(s))) {
    const hb = new Parts();
    hb.box(INNER * 2 - 4, 1.6, 1.4, '#3f8f3a', { y: 0.8 });
    hb.box(INNER * 2 - 3.6, 0.4, 1.6, '#4fa646', { y: 1.65 });
    const hg = hb.build();
    const [x, z] = sidePoint(cx, cz, side, 0, 1.2);
    place(scene, selectable(hg, { type: 'Hecke', key: 'hedge', category: 'Natur', source: 'prozedural', model: 'suburb' }), x, z, FACE[side]);
  }
  return { houses, backyard: { x: cx, z: cz } };
}

// ---------------------------------------------------------------------------
// Nature helpers
export function scatterTrees(scene: THREE.Object3D, seed: number, n: number, area: { x0: number; x1: number; z0: number; z1: number }, names: string[], hMin: number, hMax: number, avoid: (x: number, z: number) => boolean = () => false) {
  const r = rng(seed);
  let placed = 0, tries = 0;
  const pts: [number, number][] = [];
  while (placed < n && tries++ < n * 30) {
    const x = area.x0 + r() * (area.x1 - area.x0), z = area.z0 + r() * (area.z1 - area.z0);
    if (avoid(x, z)) continue;
    if (pts.some(([px, pz]) => (px - x) ** 2 + (pz - z) ** 2 < 30)) continue;
    pts.push([x, z]);
    place(scene, tree(pick(r, names), hMin + r() * (hMax - hMin)), x, z, r() * Math.PI * 2);
    placed++;
  }
  return pts;
}

export function forest(scene: THREE.Object3D) {
  const x0 = HALF + 14, x1 = HALF + 190;
  const camp = { x: HALF + 70, z: 10, r: 20 };
  const lake = { x: HALF + 110, z: -60, r: 22 };
  scatterTrees(scene, 11, 150, { x0, x1, z0: -150, z1: SEA_Z - 14 }, ['tree_pineTallA', 'tree_pineTallB', 'tree_pineRoundA', 'tree_pineRoundC', 'tree_cone', 'tree_oak_dark', 'tree_default', 'tree_detailed'], 8, 15,
    (x, z) => Math.hypot(x - camp.x, z - camp.z) < camp.r || Math.hypot(x - lake.x, z - lake.z) < lake.r + 4);
  // camping
  place(scene, nature('tent_detailedOpen', 1.2), camp.x - 7, camp.z - 4, 0.6);
  place(scene, nature('tent_smallClosed', 1.3), camp.x + 6, camp.z - 6, -0.5);
  place(scene, nature('tent_detailedOpen', 1.1), camp.x + 1, camp.z + 8, Math.PI + 0.3);
  place(scene, nature('campfire_logs', 1.3), camp.x, camp.z, 0);
  place(scene, nature('log_stack'), camp.x - 10, camp.z + 6, 1.2);
  place(scene, nature('stump_round'), camp.x + 3, camp.z + 2.5, 0);
  place(scene, nature('stump_round'), camp.x - 3, camp.z - 2, 0);
  const r = rng(3);
  for (let k = 0; k < 18; k++) {
    const a = r() * Math.PI * 2, d = 26 + r() * 60;
    const x = camp.x + Math.cos(a) * d, z = camp.z + Math.sin(a) * d;
    if (Math.hypot(x - lake.x, z - lake.z) < lake.r + 3) continue;
    place(scene, nature(pick(r, ['mushroom_redGroup', 'mushroom_redTall', 'rock_largeA', 'rock_largeC', 'plant_bushLarge', 'plant_bushDetailed', 'stump_round', 'rock_tallA'])), x, z, r() * 6);
  }
  // forest lake
  const lb = new Parts();
  lb.add(new THREE.CircleGeometry(lake.r, 14), '#3c9ad8', { rx: -Math.PI / 2, y: 0.06, mat: 'water', sz: 0.8 });
  lb.add(new THREE.RingGeometry(lake.r - 0.2, lake.r + 1.6, 14), '#9a8f7a', { rx: -Math.PI / 2, y: 0.05, sz: 0.8 });
  const lg = lb.build({ castShadow: false });
  lg.position.set(lake.x, 0, lake.z);
  lg.scale.z = 1;
  scene.add(selectable(lg, { type: 'Waldsee', key: 'lake', category: 'Gelände', source: 'prozedural', model: 'forest' }));
  place(scene, nature('canoe', 1.4), lake.x + 4, lake.z + 3, 0.8, 0.1);
  place(scene, nature('lily_large'), lake.x - 6, lake.z - 4, 0, 0.08);
  place(scene, nature('lily_large'), lake.x - 3, lake.z + 6, 1, 0.08);
  return { camp, lake };
}

/** Fields of the farm, west of the city. */
export function farmFields(scene: THREE.Object3D) {
  const r = rng(21);
  const fields: { x: number; z: number; w: number; d: number; crop: string; color: string; step: number }[] = [
    { x: -165, z: -75, w: 50, d: 40, crop: 'crops_cornStageD', color: '#8a5a33', step: 3.2 },
    { x: -230, z: -75, w: 50, d: 40, crop: 'crops_wheatStageB', color: '#9a6a3a', step: 3.2 },
    { x: -165, z: 85, w: 44, d: 30, crop: 'crop_pumpkin', color: '#7a4f2d', step: 4.5 },
  ];
  for (const f of fields) {
    const b = new Parts();
    b.box(f.w, 0.3, f.d, f.color, { y: 0.05 });
    for (let zz = -f.d / 2 + 1.5; zz < f.d / 2; zz += f.step) b.box(f.w - 2, 0.25, 0.9, '#6b4426', { y: 0.25, z: zz });
    const g = b.build({ castShadow: false });
    g.position.set(f.x, 0, f.z);
    scene.add(selectable(g, { type: 'Acker', key: 'field', category: 'Gelände', source: 'prozedural', model: 'farmFields' }));
  }
  // crops: one merged, clickable row per furrow
  const NAMES: Record<string, string> = { crops_cornStageD: 'Maisreihe', crops_wheatStageB: 'Weizenreihe', crop_pumpkin: 'Kürbisreihe' };
  for (const f of fields) {
    const sc = f.crop === 'crop_pumpkin' ? 6.5 : 9;
    for (let zz = -f.d / 2 + 1.5; zz < f.d / 2; zz += f.step) {
      const mats: THREE.Matrix4[] = [];
      for (let xx = -f.w / 2 + 2.5; xx < f.w / 2 - 2; xx += f.crop === 'crop_pumpkin' ? 3.5 : 3) {
        if (r() < 0.1) continue;
        mats.push(new THREE.Matrix4().compose(new THREE.Vector3(xx + r() * 0.5, 0.35, zz), new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), r() * 6), new THREE.Vector3(sc, sc * (0.85 + r() * 0.3), sc)));
      }
      const row = mergeInstances(`nature/${f.crop}.glb`, mats);
      row.position.set(f.x, 0, f.z);
      scene.add(selectable(row, { type: NAMES[f.crop], key: f.crop === 'crop_pumpkin' ? 'pumpkin_row' : f.crop.includes('corn') ? 'corn_row' : 'wheat_row', category: 'Natur', source: 'gltf', model: `nature/${f.crop}.glb (${mats.length}× gemergt)` }));
    }
  }
  return fields;
}

export function cityTrees(scene: THREE.Object3D) {
  // a few street trees on the outer ring sidewalk
  const r = rng(99);
  for (let k = -3; k <= 3; k++) {
    if (k === 0) continue;
    place(scene, tree(pick(r, ['tree_palmTall', 'tree_palmBend']), 10 + r() * 3), k * 30 + 6, HALF + 12, r() * 6);
  }
  return TREE_NAMES;
}
