import * as THREE from 'three';
import { buildRoads } from './roads';
import { buildTerrain } from './terrain';
import { Traffic, CAR_MODELS } from './traffic';
import { GLTF_FILES } from './gltf';
import { buildPark } from './park';
import { buildCity } from './city';
import { buildParkGrounds, buildPromenade, buildIsland } from './grounds';
import { forest, farmFields, cityTrees } from './districts';

export const MODEL_FILES: string[] = [...CAR_MODELS.map((c) => c.file), ...GLTF_FILES];

/** Build the whole city. Returns the type keys of objects that move (for "follow"). */
export function buildWorld(scene: THREE.Scene): Set<string> {
  buildTerrain(scene);
  buildRoads(scene);
  buildParkGrounds(scene);
  buildPromenade(scene);
  buildIsland(scene, 95, 215);
  buildPark(scene);
  const city = buildCity(scene);

  forest(scene);
  farmFields(scene);
  cityTrees(scene);

  const traffic = new Traffic(scene);
  traffic.spawn(26);
  return new Set([...traffic.movingKeys, ...city.movingKeys, 'monorail_train', 'swan_boat', 'duck']);
}
