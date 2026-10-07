import * as THREE from 'three';
import { rng, pick } from '../core/parts';
import {
  createFerrisWheel, createCarousel, createFountain, createRubberDuck, createDuck, createSwanBoat, createTRex,
  createSwingSet, createSlide, createSeesaw, createChessBoard, placeChessGame, createIceCreamKiosk, createBench,
  createPicnicBlanket, createBandstand, createTopiary, createFlowerBed, createPond, createMonorail,
  createHotDogCart, createFlamingoFloat, createMushroomHouse, createBubbleMachine, POND_WATER_Y,
} from '../objects/park';
import { place, FACE } from './districts';
import { tree, nature } from './gltf';
import { followCurve, loop } from './movers';
import { PARK } from './grounds';

/** Lawn top inside the park. */
export const LAWN_Y = 0.16;

type Obstacle = { x: number; z: number; r: number };

/**
 * Central park: fountain in the middle, ferris wheel + bandstand (NE), carousel + chess (NW),
 * pond with the giant rubber duck (SW), T-Rex + playground (SE), monorail around everything.
 */
export function buildPark(scene: THREE.Scene) {
  const obstacles: Obstacle[] = [];
  const at = (o: THREE.Object3D, x: number, z: number, rot = 0, r = 3, y = LAWN_Y) => {
    obstacles.push({ x, z, r });
    return place(scene, o, x, z, rot, y);
  };

  // center
  at(createFountain(), 0, 0, 0, 6);

  // NE: ferris wheel + bandstand
  at(createFerrisWheel(), 19, -22, Math.PI / 4 - Math.PI / 2 + Math.PI, 11);
  at(createBandstand(), 24, -5.5, -Math.PI / 2, 5.5);
  at(createBubbleMachine(), 7.5, -24, Math.PI / 2, 2);

  // NW: carousel + giant chess + hot dogs
  at(createCarousel(), -21, -23, 0, 6.5);
  const board = at(createChessBoard(), -22, -8.5, 0, 7.5);
  board.updateMatrixWorld(true);
  for (const p of placeChessGame(board)) scene.add(p);
  at(createHotDogCart(), -6, -16, Math.PI / 2, 2);

  // SW: pond with rubber duck, swan boats, ducks, flamingo
  const pondX = -20, pondZ = 20, pondW = 28, pondD = 22;
  at(createPond(pondW, pondD), pondX, pondZ, 0, 13, 0.08);
  const waterY = 0.08 + POND_WATER_Y;
  place(scene, createRubberDuck(), pondX + 2, pondZ + 1, 0.6, waterY);
  place(scene, createFlamingoFloat(), pondX - 7, pondZ - 5, 1, waterY);
  const r = rng(77);
  const pondLoop = (rx: number, rz: number, n = 12) => {
    const pts: [number, number][] = [];
    for (let k = 0; k < n; k++) {
      const a = (k / n) * Math.PI * 2;
      pts.push([pondX + Math.cos(a) * rx * (0.9 + r() * 0.2), pondZ + Math.sin(a) * rz * (0.9 + r() * 0.2)]);
    }
    return loop(pts, waterY);
  };
  for (let k = 0; k < 3; k++) {
    const boat = createSwanBoat();
    scene.add(boat);
    followCurve(boat, pondLoop(9.5, 7), 0.9 + k * 0.15, { offset: k / 3, reverse: k === 1 });
  }
  for (let k = 0; k < 7; k++) {
    const d = createDuck();
    scene.add(d);
    followCurve(d, pondLoop(5 + r() * 5, 3.5 + r() * 4, 9), 0.35 + r() * 0.2, { offset: r(), reverse: r() < 0.5 });
  }

  // SE: T-Rex, playground, ice cream, mushroom house
  at(createTRex(), 23, 25, -Math.PI * 0.75, 6.5);
  at(createSwingSet(), 10, 10, -Math.PI / 4, 3);
  at(createSlide(), 21, 9, Math.PI, 3);
  at(createSeesaw(), 9, 19, Math.PI / 2, 2.5);
  at(createIceCreamKiosk(), 5.5, 27, -Math.PI / 2, 3);
  at(createMushroomHouse(), 29, 12, -Math.PI / 2, 4);

  // picnic + flower beds + benches + topiaries
  at(createPicnicBlanket(), 14, 31, 0.4, 2);
  at(createPicnicBlanket(), -9, -30, -0.6, 2);
  for (const [x, z] of [[-30, 2], [30, -14], [-12, 30], [16, -31]] as const) at(createFlowerBed(), x, z, 0, 2.5);
  const benches: [number, number, number][] = [
    [3.3, 20, FACE.w], [-3.3, 22, FACE.e], [3.3, -20, FACE.w], [-3.3, -22, FACE.e],
    [20, 3.3, FACE.n], [-21, 3.3, FACE.n], [22, -3.3, FACE.s], [-19, -3.3, FACE.s],
  ];
  for (const [x, z, rot] of benches) at(createBench(), x, z, rot, 1.3);
  at(createTopiary('elephant'), -36.8, 36.8, Math.PI * 0.75, 2.5);
  at(createTopiary('giraffe'), 36.8, -36.8, -Math.PI * 0.25, 2.5);
  at(createTopiary('rabbit'), -36.8, -36.8, Math.PI * 0.25, 2.5);

  // monorail around the park
  const M = 40.5, c = 9;
  const pts: [number, number][] = [];
  for (const [sx, sz] of [[1, 1], [-1, 1], [-1, -1], [1, -1]] as const) {
    const cx = sx * (M - c), cz = sz * (M - c);
    const a0 = Math.atan2(sz, sx) - Math.PI / 4;
    for (let k = 0; k <= 3; k++) {
      const a = a0 + (k / 3) * (Math.PI / 2);
      pts.push([cx + Math.cos(a) * c, cz + Math.sin(a) * c]);
    }
  }
  const curve = new THREE.CatmullRomCurve3(pts.map(([x, z]) => new THREE.Vector3(x, 0, z)), true, 'centripetal');
  const mono = createMonorail(curve, 8.5);
  scene.add(mono.track, mono.train);

  // trees: outer band (avoid the monorail line) + a few in the quadrants
  const avoid = (x: number, z: number, rad: number) => {
    const ax = Math.abs(x), az = Math.abs(z);
    if (ax > PARK.inner - 2 || az > PARK.inner - 2) return true;
    // monorail band
    const dEdge = Math.max(ax, az);
    if (dEdge > M - 2.5 && dEdge < M + 2.5) return true;
    // jogging loop + axis paths + ring
    if (Math.abs(dEdge - PARK.loop) < 2.5 && Math.min(ax, az) < PARK.loop + 2) return true;
    if (ax < 3.5 || az < 3.5) return true;
    if (Math.hypot(x, z) < PARK.ring + 3.5) return true;
    return obstacles.some((o) => Math.hypot(o.x - x, o.z - z) < o.r + rad);
  };
  const tr = rng(123);
  let n = 0;
  for (let tries = 0; tries < 900 && n < 46; tries++) {
    const x = (tr() * 2 - 1) * (PARK.inner - 2), z = (tr() * 2 - 1) * (PARK.inner - 2);
    if (avoid(x, z, 2.6)) continue;
    const outer = Math.max(Math.abs(x), Math.abs(z)) > PARK.loop;
    const name = outer ? pick(tr, ['tree_oak', 'tree_default', 'tree_detailed', 'tree_fat', 'tree_default_fall']) : pick(tr, ['tree_oak', 'tree_fat', 'tree_plateau', 'tree_default_fall']);
    // under the monorail (outside band) keep trees below the track
    const h = outer ? 6 + tr() * 1.5 : 6.5 + tr() * 3;
    at(tree(name, h), x, z, tr() * 6, 2.6);
    n++;
  }
  for (let k = 0; k < 16; k++) {
    const x = (tr() * 2 - 1) * (PARK.inner - 3), z = (tr() * 2 - 1) * (PARK.inner - 3);
    if (avoid(x, z, 1.2)) continue;
    at(nature(pick(tr, ['plant_bushLarge', 'plant_bushDetailed', 'flower_redA', 'flower_yellowA', 'flower_purpleA', 'mushroom_redGroup'])), x, z, tr() * 6, 1.2);
  }

  return { obstacles, monorail: mono };
}
