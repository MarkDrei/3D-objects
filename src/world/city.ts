import * as THREE from 'three';
import { rng } from '../core/parts';
import { onTick } from '../core/anim';
import {
  createStreetLamp, createTrafficLight, createHydrant, createMailbox, createTrashCan, createPhoneBooth,
  createBusStop, createBikeRack, createNewsKiosk, createBillboard,
} from '../objects/city-furniture';
import {
  createDonutShop, createPizzeria, createCafe, createGasStation, createCarWash, createFireStation,
  createWaterTower, createCinema, createRadioTower, createHelipad,
} from '../objects/city-buildings';
import {
  createGiantRobot, createBasketballCourt, createSkatePark, createSwimmingPool, createTrampoline, createFoodTruck,
  createGiantCat, createNeonSign, createStreetMusician, createFortuneTeller, createGumballMachine,
} from '../objects/city-fun';
import { createPerson, createDog } from '../objects/city-life';
import { place, FACE, sidePoint, blockGround, shopRow, downtownTowers, suburb, type Side, INNER } from './districts';
import { commercial } from './gltf';
import { N, ROAD, blockPos, roadPos, PARK_HALF, SIDEWALK, hasLights } from './layout';
import { lightState } from './traffic';
import { followCurve, roundedRect } from './movers';
import { buildLightPools } from './lightpools';

const H = ROAD / 2;
const SIDES: Side[] = ['n', 's', 'e', 'w'];
const isPark = (bx: number, bz: number) => bx >= 1 && bx <= 2 && bz >= 1 && bz <= 2;


/** Top of a placed object (e.g. to put things on a roof). */
function topOf(o: THREE.Object3D) {
  o.updateMatrixWorld(true);
  return new THREE.Box3().setFromObject(o).max.y;
}

export function buildCity(scene: THREE.Scene) {
  const movingKeys = new Set<string>();
  const pools: THREE.Vector3[] = [];
  /** street lamp + remember where its light falls */
  const lamp = (x: number, z: number, rot: number) => {
    place(scene, createStreetLamp(), x, z, rot, 0.25);
    pools.push(new THREE.Vector3(x + Math.sin(rot) * 1.5, 0.3, z + Math.cos(rot) * 1.5));
  };

  // ── north row: downtown ─────────────────────────────────────────────────
  const nw = downtownTowers(scene, 0, 0, [2, 4, 0, 3]);
  // helipad on the lowest tower, radio mast on another
  const pad = createHelipad();
  place(scene, pad, nw[0].position.x, nw[0].position.z, 0, topOf(nw[0]) - 0.2);
  place(scene, createRadioTower(), nw[2].position.x, nw[2].position.z, 0, topOf(nw[2]) - 0.3);

  // robot plaza: 2 towers in the back, robot + fun stuff in the front
  const [cx1, cz1] = [blockPos(1), blockPos(0)];
  downtownTowers(scene, 1, 0, [1, 3, -1, -1]);
  place(scene, createGiantRobot(), cx1, cz1 + 8, 0);
  place(scene, createGumballMachine(), cx1 - 14, cz1 + 13, Math.PI / 6);
  place(scene, createStreetMusician(), cx1 + 13, cz1 + 14, -Math.PI / 5);

  // cinema block
  const [cx2, cz2] = [blockPos(2), blockPos(0)];
  blockGround(scene, cx2, cz2, '#cfc8bb', 'Platz', 'plaza');
  place(scene, createCinema(), cx2, cz2 + 11, FACE.s);
  shopRow(scene, 2, 0, ['n'], 5, 3);
  const shop = place(scene, commercial(6, 12), ...sidePoint(cx2, cz2, 'w', 0, 6.5), FACE.w);
  place(scene, createGiantCat(), shop.position.x, shop.position.z, FACE.s, topOf(shop) - 0.2);

  // NE: fire station + water tower
  const [cx3, cz3] = [blockPos(3), blockPos(0)];
  blockGround(scene, cx3, cz3, '#cfc8bb', 'Platz', 'plaza');
  place(scene, createFireStation(), cx3 - 4, cz3 + 10, FACE.s);
  place(scene, createWaterTower(), cx3 + 12, cz3 - 11, 0);
  place(scene, createBillboard('FEUERWEHR POLYHAFEN · 112'), cx3 - 7, cz3 - 9, FACE.n);

  // ── east column ────────────────────────────────────────────────────────
  const [ex, ez1] = [blockPos(3), blockPos(1)];
  blockGround(scene, ex, ez1, '#cfc8bb', 'Platz', 'plaza');
  place(scene, createDonutShop(), ...sidePoint(ex, ez1, 'w', 0.48, 6.5), FACE.w);
  place(scene, createPizzeria(), ...sidePoint(ex, ez1, 'w', -0.48, 6.5), FACE.w);
  place(scene, createCafe(), ...sidePoint(ex, ez1, 'e', 0.45, 9), FACE.e);
  place(scene, commercial(2, 12), ...sidePoint(ex, ez1, 'e', -0.5, 6.5), FACE.e);
  place(scene, createNeonSign(), ex + 2, ez1, FACE.w, 0.2);

  const ez2 = blockPos(2);
  blockGround(scene, ex, ez2, '#bdb7ab', 'Asphaltfläche', 'lot');
  place(scene, createGasStation(), ex - 5, ez2, FACE.w);
  place(scene, createCarWash(), ex + 13, ez2 + 4, FACE.s);
  place(scene, createFoodTruck('taco'), ex + 12, ez2 - 13, FACE.e);

  // SE: shops + skate park
  const ez3 = blockPos(3);
  blockGround(scene, ex, ez3, '#cfc8bb', 'Platz', 'plaza');
  shopRow(scene, 3, 3, ['e', 's'], 8, 2);
  place(scene, createSkatePark(), ex - 8, ez3 - 9, FACE.s);
  place(scene, createFortuneTeller(), ex - 13, ez3 + 4, FACE.w);

  // ── south row ──────────────────────────────────────────────────────────
  const sz = blockPos(3);
  blockGround(scene, blockPos(2), sz, '#cfc8bb', 'Platz', 'plaza');
  shopRow(scene, 2, 3, ['s'], 9, 3);
  place(scene, createBasketballCourt(), blockPos(2), sz - 9, 0);
  blockGround(scene, blockPos(1), sz, '#cfc8bb', 'Platz', 'plaza');
  shopRow(scene, 1, 3, ['s'], 10, 2);
  place(scene, createFoodTruck('hotdog'), blockPos(1) - 8, sz - 12, FACE.n);
  place(scene, createNewsKiosk(), blockPos(1) + 9, sz - 13, FACE.n);
  place(scene, createBillboard(), blockPos(1) + 4, sz + 1, FACE.n);

  // ── west column: suburbs ──────────────────────────────────────────────
  const s1 = suburb(scene, 0, 1, 31, ['e', 'w']);
  const s2 = suburb(scene, 0, 2, 32);
  const s3 = suburb(scene, 0, 3, 33);
  place(scene, createSwimmingPool(), s2.backyard.x, s2.backyard.z, 0, 0.2);
  place(scene, createTrampoline(), s3.backyard.x - 6, s3.backyard.z, 0, 0.2);
  place(scene, createSwimmingPool(), s1.backyard.x, s1.backyard.z, Math.PI / 2, 0.2);
  const dog = createDog(3);
  scene.add(dog);
  dog.userData.walkSpeed = 1;
  followCurve(dog, roundedRect(s3.backyard.x + 5, s3.backyard.z, 3, 3, 1.5, 0.2), 1.6);
  movingKeys.add('dog');

  // ── street furniture ──────────────────────────────────────────────────
  const r = rng(555);
  for (let bx = 0; bx < N; bx++) for (let bz = 0; bz < N; bz++) {
    if (isPark(bx, bz)) continue;
    const cx = blockPos(bx), cz = blockPos(bz);
    for (const side of SIDES) {
      for (const along of [-0.62, 0.62]) lamp(...sidePoint(cx, cz, side, along, -SIDEWALK + 0.6), FACE[side]);
      const extra = r();
      const [x, z] = sidePoint(cx, cz, side, (r() - 0.5) * 0.5, -SIDEWALK + 0.9);
      const f = extra < 0.25 ? createTrashCan() : extra < 0.45 ? createHydrant() : extra < 0.6 ? createMailbox() : extra < 0.7 ? createPhoneBooth() : extra < 0.82 ? createBikeRack() : null;
      if (f) place(scene, f, x, z, FACE[side], 0.25);
    }
  }
  // park perimeter lamps + bus stops facing the park
  const PI = PARK_HALF - 1.6;
  for (const side of SIDES) for (const a of [-0.75, -0.25, 0.25, 0.75]) {
    const t = a * (PARK_HALF - 4);
    const [x, z, rot] = side === 's' ? [t, PI, 0] : side === 'n' ? [t, -PI, Math.PI] : side === 'e' ? [PI, t, Math.PI / 2] : [-PI, t, -Math.PI / 2];
    lamp(x, z, rot);
  }
  place(scene, createBusStop(), 12, PARK_HALF - 1.5, 0, 0.25);
  place(scene, createBusStop(), -PARK_HALF + 1.5, -12, -Math.PI / 2, 0.25);
  place(scene, createBusStop(), blockPos(3) - 6, blockPos(1) - INNER - 1.6, Math.PI, 0.25);

  // ── traffic lights ────────────────────────────────────────────────────
  const lights: { o: THREE.Object3D; i: number; j: number; axis: 'x' | 'z' }[] = [];
  const DIRS: [number, number][] = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  for (let i = 0; i <= N; i++) for (let j = 0; j <= N; j++) {
    if (!hasLights(i, j)) continue;
    for (const d of DIRS) {
      // approach from the node behind (cars moving along d arrive at (i,j))
      const pi = i - d[0], pj = j - d[1];
      if (pi < 0 || pj < 0 || pi > N || pj > N || (pi === 2 && pj === 2)) continue;
      const rt: [number, number] = [-d[1], d[0]];
      const x = roadPos(i) - d[0] * (H + 1.4) + rt[0] * (H + 1.3);
      const z = roadPos(j) - d[1] * (H + 1.4) + rt[1] * (H + 1.3);
      const o = createTrafficLight();
      place(scene, o, x, z, Math.atan2(-d[0], -d[1]), 0.25);
      lights.push({ o, i, j, axis: d[0] !== 0 ? 'x' : 'z' });
    }
  }
  onTick((_dt, t) => {
    for (const l of lights) {
      const s = lightState(l.i, l.j, l.axis, t);
      if (l.o.userData._s !== s) {
        l.o.userData._s = s;
        (l.o.userData.setState as (s: string) => void)(s);
      }
    }
  });

  // ── pedestrians ───────────────────────────────────────────────────────
  let seed = 1;
  for (let bx = 0; bx < N; bx++) for (let bz = 0; bz < N; bz++) {
    if (isPark(bx, bz)) continue;
    const cx = blockPos(bx), cz = blockPos(bz);
    const path = roundedRect(cx, cz, INNER + 1.6, INNER + 1.6, 1.2, 0.25);
    for (let k = 0; k < 2; k++) {
      const p = createPerson(seed++);
      p.userData.walkSpeed = 1;
      scene.add(p);
      followCurve(p, path, 1.25 + r() * 0.3, { offset: r(), reverse: k === 1 });
    }
  }
  movingKeys.add('person');
  buildLightPools(scene, pools);
  const helipadTop = new THREE.Vector3(pad.position.x, topOf(pad), pad.position.z);
  return { movingKeys, helipadTop };
}
