import type * as THREE from 'three';

/**
 * Registry of object factories for the single-object viewer (?view=<name> or ?view=all).
 * Every objects/*.ts file registers its factories here.
 */
export const GALLERY: Record<string, () => THREE.Object3D> = {};

export function gallery(entries: Record<string, () => THREE.Object3D>) {
  Object.assign(GALLERY, entries);
}
