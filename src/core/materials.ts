import * as THREE from 'three';
import { nightUniform } from './windows';

/**
 * Shared materials. Procedural objects use vertex colors so that a whole object
 * can be merged into one mesh per material (= very few draw calls on mobile).
 */
export type MatKey = 'std' | 'metal' | 'glass' | 'lamp' | 'neon' | 'water' | 'cloud';

const std = new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.85, metalness: 0.0 });
const metal = new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.35, metalness: 0.6 });
const glass = new THREE.MeshStandardMaterial({
  vertexColors: true, flatShading: true, roughness: 0.1, metalness: 0.2, transparent: true, opacity: 0.55,
});
/** Lamps: white-ish by day, glowing warm at night (emissiveIntensity driven by the day/night cycle). */
const lamp = new THREE.MeshStandardMaterial({
  vertexColors: true, flatShading: true, roughness: 0.4, emissive: new THREE.Color('#ffd27a'), emissiveIntensity: 0,
});
/** Neon: always unlit/bright, multiplied by vertex color. */
const neon = new THREE.MeshBasicMaterial({ vertexColors: true, toneMapped: false });
const water = new THREE.MeshStandardMaterial({
  vertexColors: true, flatShading: true, roughness: 0.15, metalness: 0.1, transparent: true, opacity: 0.85,
});
const cloud = new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 1, transparent: true, opacity: 0.92 });

export const MATERIALS: Record<MatKey, THREE.Material> = { std, metal, glass, lamp, neon, water, cloud };

/** Called by the environment when the day/night factor changes (0 = day, 1 = night). */
export function setNightFactor(n: number) {
  lamp.emissiveIntensity = n * 1.6;
  lamp.color.setScalar(1 - n * 0.3);
  nightUniform.value = n;
}
