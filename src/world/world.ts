import * as THREE from 'three';
import { buildRoads } from './roads';
import { buildTerrain } from './terrain';
import { Traffic, CAR_MODELS } from './traffic';

export const MODEL_FILES: string[] = [...CAR_MODELS.map((c) => c.file)];

/** Build the whole city. Returns the type keys of objects that move (for "follow"). */
export function buildWorld(scene: THREE.Scene): Set<string> {
  buildTerrain(scene);
  buildRoads(scene);
  const traffic = new Traffic(scene);
  traffic.spawn(26);
  return traffic.movingKeys;
}
