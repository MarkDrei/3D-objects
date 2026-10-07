import * as THREE from 'three';
import { rng, pick } from '../core/parts';
import { onTick } from '../core/anim';
import { model } from '../core/assets';
import { selectable } from '../core/registry';
import {
  createUfo, createHotAirBalloon, createBlimp, createHelicopter, createBannerPlane, createCloud, createBirdFlock,
  createWindTurbine, createRadioTelescope, createDragonKite, createLighthouse, createSailboat, createFerry,
  createPirateShip, createSeaSerpent, createWhale, createBuoy, createPier, createRocketLaunchSite, createJellyfish,
} from '../objects/sky';
import { createBarn, createWindmill, createScarecrow, createHayBale, createCow, createPig, createChicken, createSheep, createPerson } from '../objects/city';
import { createHedgeMaze } from '../objects/park';
import { place, FACE } from './districts';
import { nature } from './gltf';
import { followCurve, loop, circle, roundedRect, drift } from './movers';
import { HALF, SEA_Z } from './layout';

/** Water surface height of the sea (mean). */
export const SEA_Y = -0.6;

export const OUTSKIRT_MODELS = ['cars/tractor.glb'];

export function buildOutskirts(scene: THREE.Scene, helipadTop: THREE.Vector3 | null) {
  const moving = new Set<string>();
  farm(scene, moving);
  north(scene);
  sea(scene, moving);
  sky(scene, moving, helipadTop);
  return moving;
}

// ── farm (west) ───────────────────────────────────────────────────────────
function farm(scene: THREE.Scene, moving: Set<string>) {
  const r = rng(404);
  place(scene, createBarn(), -205, 12, FACE.e);
  place(scene, createWindmill(), -150, 28, FACE.e + 0.4);
  for (const [x, z, ry] of [[-188, 26, 0.3], [-190, 30, 1.2], [-186, 31, 2], [-222, -6, 0.5], [-226, -3, 1.4]]) place(scene, createHayBale(), x, z, ry);
  place(scene, createScarecrow(), -165, -75, FACE.e);
  place(scene, createScarecrow(), -230, -72, FACE.e + 0.5);
  place(scene, createHedgeMaze(), -150, -140, FACE.s);

  // pasture with fence, cows and sheep
  const px = -232, pz = 75, pw = 46, pd = 34;
  for (let x = px - pw / 2; x < px + pw / 2 - 1; x += 4.6) {
    place(scene, nature('fence_simple', 1.15), x + 2.3, pz - pd / 2, 0);
    place(scene, nature('fence_simple', 1.15), x + 2.3, pz + pd / 2, 0);
  }
  for (let z = pz - pd / 2; z < pz + pd / 2 - 1; z += 4.6) {
    place(scene, nature('fence_simple', 1.15), px - pw / 2, z + 2.3, Math.PI / 2);
    place(scene, nature('fence_simple', 1.15), px + pw / 2, z + 2.3, Math.PI / 2);
  }
  for (let k = 0; k < 5; k++) place(scene, createCow(k + 1), px - 15 + r() * 30, pz - 10 + r() * 20, r() * 6);
  for (let k = 0; k < 5; k++) place(scene, createSheep(), px - 18 + r() * 36, pz - 12 + r() * 24, r() * 6);
  // pigs + chickens near the barn
  for (let k = 0; k < 3; k++) place(scene, createPig(), -188 + r() * 6, 0 + r() * 8, r() * 6);
  for (let k = 0; k < 6; k++) {
    const c = createChicken();
    scene.add(c);
    followCurve(c, circle(-190 + r() * 4, -10 + r() * 4, 1.5 + r() * 2.5, 0, 10), 0.5 + r() * 0.3, { offset: r(), reverse: r() < 0.5 });
  }
  // the farmer walks around the barn
  const farmer = createPerson(77, { variant: 'Bäuerin' });
  farmer.userData.walkSpeed = 0.8;
  scene.add(farmer);
  followCurve(farmer, roundedRect(-205, 12, 14, 12, 3, 0), 1.0);
  // UFO over the meadow, abducting a cow
  place(scene, createUfo(), -262, 10, 0);

  // tractor ploughing around the wheat field
  const tr = model('cars/tractor.glb');
  tr.scale.setScalar(1.6);
  tr.position.y = 0.3 * 1.6;
  const tractor = new THREE.Group();
  tractor.add(tr);
  const wheels: THREE.Object3D[] = [];
  tr.traverse((o) => o.name.startsWith('wheel') && wheels.push(o));
  scene.add(selectable(tractor, { type: 'Traktor', key: 'tractor', category: 'Fahrzeug', source: 'gltf', model: 'cars/tractor.glb' }));
  followCurve(tractor, roundedRect(-230, -75, 29, 24, 5, 0), 3);
  onTick((dt) => wheels.forEach((w) => (w.rotation.x += dt * 6)));
  moving.add('tractor');
}

// ── north: wind farm, rocket base, radio telescope ───────────────────────
function north(scene: THREE.Scene) {
  for (const [x, z] of [[-230, -230], [-150, -255], [-60, -235], [250, -235], [330, -205], [-320, -150]]) {
    place(scene, createWindTurbine(), x, z, FACE.s + 0.3);
  }
  place(scene, createRocketLaunchSite(), 120, -185, FACE.s);
  place(scene, createRadioTelescope(), -40, -175, 0.6);
  place(scene, createRadioTelescope(), -5, -200, -0.4);
  const r = rng(808);
  for (let k = 0; k < 14; k++) {
    const x = -300 + r() * 600, z = -140 - r() * 120;
    if (Math.abs(x - 120) < 30 && Math.abs(z + 185) < 30) continue;
    place(scene, nature(pick(r, ['rock_largeA', 'rock_largeC', 'rock_tallA', 'plant_bushLarge'])), x, z, r() * 6);
  }
}

// ── sea: lighthouse, pier, boats, monsters ───────────────────────────────
function sea(scene: THREE.Scene, moving: Set<string>) {
  place(scene, createLighthouse(), 95, 215, 0.4, 1.6);
  place(scene, createPier(52), -60, SEA_Z - 8, 0, SEA_Y);
  place(scene, createPier(34), 40, SEA_Z - 8, 0, SEA_Y);
  for (const [x, z] of [[-20, 188], [20, 192], [160, 200], [-110, 205]]) place(scene, createBuoy(), x, z, 0, SEA_Y);

  const boat = (o: THREE.Object3D, pts: [number, number][], speed: number, offset = 0) => {
    scene.add(o);
    followCurve(o, loop(pts, SEA_Y), speed, { offset });
    return o;
  };
  boat(createSailboat('#e63946'), [[-160, 200], [-60, 240], [40, 230], [0, 300], [-140, 290]], 4);
  boat(createSailboat('#2a9df4'), [[60, 260], [200, 240], [260, 300], [120, 330]], 3.5, 0.4);
  boat(createSailboat('#ffd23f'), [[-260, 230], [-180, 260], [-220, 330], [-300, 290]], 3.2, 0.7);
  boat(createFerry(), [[-58, 205], [-200, 380], [150, 420], [200, 260]], 5);
  boat(createPirateShip(), [[180, 300], [320, 260], [380, 360], [240, 400]], 3.2);
  const serpent = createSeaSerpent();
  boat(serpent, [[-40, 260], [60, 320], [-20, 380], [-120, 330]], 2.2);
  place(scene, createWhale(), -210, 330, 0, SEA_Y);
  for (const [x, z, hue] of [[30, 200, 0.85], [-90, 230, 0.55], [150, 245, 0.75]]) place(scene, createJellyfish(hue), x, z, 0, SEA_Y);
  // kite on the beach (flies out over the water)
  place(scene, createDragonKite(), 15, SEA_Z + 2, Math.PI, 0.05);
  // people on the promenade and the pier
  const r = rng(99);
  for (let k = 0; k < 7; k++) {
    const p = createPerson(300 + k);
    p.userData.walkSpeed = 1;
    scene.add(p);
    const z = HALF + 9 + (k % 3) * 4;
    followCurve(p, loop([[-140, z], [140, z + 1], [140, z + 2.5], [-140, z + 1.5]], 0.3, 0.05), 1.2 + r() * 0.3, { offset: r(), reverse: k % 2 === 0 });
  }
  moving.add('sailboat').add('ferry').add('pirate_ship').add('sea_serpent').add('whale').add('jellyfish');
}

// ── sky ──────────────────────────────────────────────────────────────────
function sky(scene: THREE.Scene, moving: Set<string>, helipad: THREE.Vector3 | null) {
  // blimp circling the city
  const blimp = createBlimp();
  scene.add(blimp);
  followCurve(blimp, circle(0, 0, 175, 88, 48), 8, { bank: 0.2 });
  // banner plane on a big loop
  const plane = createBannerPlane();
  scene.add(plane);
  followCurve(plane, loop([[-260, -120], [0, -260], [260, -120], [260, 160], [0, 260], [-260, 160]], 62), 22, { bank: 0.6 });
  // hot air balloons
  const centers: [number, number, number][] = [[-120, 70, -60], [60, 85, 60], [180, 60, -100], [-60, 95, 180], [-200, 75, 120]];
  centers.forEach(([x, y, z], k) => {
    const b = createHotAirBalloon(k);
    scene.add(b);
    drift(b, new THREE.Vector3(x, y, z), 30 + k * 6, 0.03 + k * 0.004, k * 1.7);
  });
  // clouds drifting east, wrapping around
  const r = rng(5);
  const clouds: THREE.Object3D[] = [];
  for (let k = 0; k < 12; k++) {
    const c = createCloud(k + 1);
    c.position.set(-500 + r() * 1000, 120 + r() * 40, -420 + r() * 840);
    c.scale.setScalar(1 + r() * 0.8);
    scene.add(c);
    clouds.push(c);
  }
  onTick((dt) => {
    for (const c of clouds) {
      c.position.x += dt * 3;
      if (c.position.x > 520) c.position.x = -520;
    }
  });
  // seagulls + birds
  place(scene, createBirdFlock(14), -30, 0, 200).position.y = 28;
  place(scene, createBirdFlock(10), 10, 0, -20).position.y = 45;
  place(scene, createBirdFlock(12), -200, 0, -40).position.y = 30;

  // helicopter: parks on the helipad, takes off, tours the city, lands again
  const heli = createHelicopter();
  scene.add(heli);
  const pad = helipad ?? new THREE.Vector3(-90, 40, -90);
  const tour = circle(0, 20, 120, pad.y + 25, 40);
  const tourLen = tour.getLength();
  const CYC = 80, PARK = 14, UP = 6, FLY = 52, DOWN = 8;
  const p = new THREE.Vector3(), tan = new THREE.Vector3();
  const start = tour.getPointAt(0);
  onTick((_dt, t) => {
    const c = t % CYC;
    if (c < PARK) {
      heli.position.copy(pad);
      heli.userData.rotorSpeed = c > PARK - 3 ? (c - (PARK - 3)) / 3 : Math.max(0, 1 - c / 3) * 0.5;
    } else if (c < PARK + UP) {
      const k = (c - PARK) / UP;
      const e = k * k * (3 - 2 * k);
      heli.position.lerpVectors(pad, start, e);
      heli.position.y = pad.y + (start.y - pad.y) * Math.min(1, k * 1.6);
      heli.userData.rotorSpeed = 1;
      heli.rotation.y = Math.atan2(start.x - pad.x, start.z - pad.z);
    } else if (c < PARK + UP + FLY) {
      const u = (((c - PARK - UP) / FLY) * tourLen * 0.999) / tourLen;
      tour.getPointAt(u, p);
      tour.getTangentAt(u, tan);
      heli.position.copy(p);
      heli.rotation.y = Math.atan2(tan.x, tan.z);
      heli.rotation.z = -0.12;
    } else {
      const k = Math.min(1, (c - PARK - UP - FLY) / DOWN);
      const e = k * k * (3 - 2 * k);
      heli.position.lerpVectors(start, pad, e);
      heli.position.y = start.y + (pad.y - start.y) * Math.max(0, (k - 0.35) / 0.65);
      heli.rotation.z = 0;
    }
  });
  moving.add('blimp').add('banner_plane').add('hot_air_balloon').add('helicopter').add('cloud').add('rocket');
}
