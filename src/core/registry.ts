import * as THREE from 'three';

export type Category =
  | 'Fahrzeug'
  | 'Luftfahrt'
  | 'Wasserfahrzeug'
  | 'Gebäude'
  | 'Attraktion'
  | 'Stadtmobiliar'
  | 'Verkehr'
  | 'Natur'
  | 'Lebewesen'
  | 'Gelände'
  | 'Kurioses';

export interface ObjectMeta {
  /** German display name of the object type, e.g. "Auto" */
  type: string;
  /** Stable machine key of the type, used for IDs, e.g. "car" → car_007 */
  key: string;
  category: Category;
  /** Where the geometry comes from */
  source: 'prozedural' | 'gltf';
  /** For GLTF: model file; for procedural: factory function name */
  model?: string;
  /** Optional variant info, e.g. "Taxi" */
  variant?: string;
}

export interface ObjectInfo extends ObjectMeta {
  id: string;
}

const counters = new Map<string, number>();
export const registry: THREE.Object3D[] = [];

/** Mark a complete 3D object as one selectable unit and give it a unique ID. */
export function selectable<T extends THREE.Object3D>(obj: T, meta: ObjectMeta): T {
  const n = (counters.get(meta.key) ?? 0) + 1;
  counters.set(meta.key, n);
  const info: ObjectInfo = { ...meta, id: `${meta.key}_${String(n).padStart(3, '0')}` };
  obj.userData.info = info;
  obj.name = info.id;
  registry.push(obj);
  return obj;
}

export function infoOf(obj: THREE.Object3D): ObjectInfo | undefined {
  return obj.userData.info as ObjectInfo | undefined;
}

/** Walk up from a hit mesh to the outermost selectable object. */
export function findSelectable(o: THREE.Object3D | null): THREE.Object3D | null {
  let found: THREE.Object3D | null = null;
  while (o) {
    if (o.userData.info) found = o;
    if (o.userData.selectBoundary) break;
    o = o.parent;
  }
  return found;
}

/** Find the innermost selectable object (used when an object explicitly nests sub-objects). */
export function findInnerSelectable(o: THREE.Object3D | null): THREE.Object3D | null {
  while (o) {
    if (o.userData.info) return o;
    o = o.parent;
  }
  return null;
}
