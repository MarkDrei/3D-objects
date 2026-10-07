import * as THREE from 'three';
import { gallery } from './gallery';
import { withExtras } from './sky-util';
import {
  createUfo, createHotAirBalloon, createBlimp, createHelicopter, createBannerPlane, createCloud, createBirdFlock,
  createWindTurbine, createRadioTelescope, createDragonKite,
} from './sky-air';

import {
  createLighthouse, createSailboat, createFerry, createPirateShip, createSeaSerpent, createWhale, createBuoy, createPier,
} from './sky-sea';

export * from './sky-air';
export * from './sky-sea';
export * from './sky-rocket';
import { createRocketLaunchSite, createJellyfish } from './sky-rocket';

function lift(o: THREE.Object3D, y: number) {
  const g = new THREE.Group();
  o.position.y = y;
  g.add(o);
  return g;
}

gallery({
  ufo: () => withExtras(createUfo()),
  hotAirBalloon: () => createHotAirBalloon(0),
  hotAirBalloon1: () => createHotAirBalloon(1),
  hotAirBalloon2: () => createHotAirBalloon(2),
  hotAirBalloon3: () => createHotAirBalloon(3),
  hotAirBalloon4: () => createHotAirBalloon(4),
  blimp: () => lift(createBlimp(), 7),
  helicopter: () => createHelicopter(),
  bannerPlane: () => createBannerPlane(),
  cloud: () => createCloud(1),
  birdFlock: () => createBirdFlock(14),
  windTurbine: () => createWindTurbine(),
  radioTelescope: () => createRadioTelescope(),
  dragonKite: () => createDragonKite(),
  lighthouse: () => createLighthouse(),
  sailboat: () => lift(createSailboat('#e63946'), 1.4),
  ferry: () => lift(createFerry(), 1.4),
  pirateShip: () => lift(createPirateShip(), 1.4),
  seaSerpent: () => lift(createSeaSerpent(), 1.2),
  whale: () => createWhale(),
  buoy: () => lift(createBuoy(), 1.2),
  pier: () => lift(createPier(40), 2),
  rocketLaunchSite: () => withExtras(createRocketLaunchSite()),
  jellyfish: () => lift(createJellyfish(), 1),
});
