import * as THREE from 'three';
import { model, fitModel } from '../core/assets';
import { selectable, type Category } from '../core/registry';
import { gallery } from '../objects/gallery';
import { withWindows } from '../core/windows';

/** Wrapper factories for the Kenney GLTF models (CC0). */

interface GltfDef { file: string; type: string; key: string; category: Category; variant?: string; size?: number; height?: number; scale?: number }

export function gltfObject(def: GltfDef): THREE.Object3D {
  const g = fitModel(model(def.file), { size: def.size, height: def.height, scale: def.scale });
  return selectable(g, { type: def.type, key: def.key, category: def.category, source: 'gltf', model: def.file, variant: def.variant });
}

// --- downtown / commercial ---------------------------------------------------
export const SKYSCRAPERS = ['a', 'b', 'c', 'd', 'e'].map((l) => `city/building-skyscraper-${l}.glb`);
export const COMMERCIAL = 'abcdefghijklmn'.split('').map((l) => `city/building-${l}.glb`);
export const HOUSES = 'abcdefghijklmnopqrstu'.split('').map((l) => `suburb/building-type-${l}.glb`);

export function skyscraper(i: number, size = 16) {
  return gltfObject({ file: SKYSCRAPERS[i % SKYSCRAPERS.length], type: 'Wolkenkratzer', key: 'skyscraper', category: 'Gebäude', variant: `Typ ${'ABCDE'[i % 5]}`, scale: size / 1.35 });
}
export function commercial(i: number, size = 13) {
  return gltfObject({ file: COMMERCIAL[i % COMMERCIAL.length], type: 'Geschäftshaus', key: 'commercial_building', category: 'Gebäude', variant: `Typ ${COMMERCIAL[i % COMMERCIAL.length].slice(-5, -4).toUpperCase()}`, scale: size / 0.95 });
}
/** Roof color variants: rotate the hue of the (green) roof pixels in the shader. */
const ROOFS = [
  { name: 'grünes Dach', hue: 0, sat: 1 },
  { name: 'rotes Dach', hue: -2.0, sat: 1.1 },
  { name: 'blaues Dach', hue: 1.2, sat: 0.9 },
  { name: 'braunes Dach', hue: -2.4, sat: 0.55 },
  { name: 'violettes Dach', hue: 2.0, sat: 0.8 },
];
const roofCache = new Map<string, THREE.Material>();
function roofMaterial(src: THREE.Material, v: number): THREE.Material {
  const k = `${src.uuid}:${v}`;
  let m = roofCache.get(k);
  if (m) return m;
  m = src.clone();
  const { hue, sat } = ROOFS[v];
  withWindows(m, (sh) => {
    sh.uniforms.uHue = { value: hue };
    sh.uniforms.uSat = { value: sat };
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', `#include <common>
uniform float uHue; uniform float uSat;
vec3 hueRot(vec3 c, float a){ const vec3 k = vec3(0.57735); float ca = cos(a); return c*ca + cross(k,c)*sin(a) + k*dot(k,c)*(1.0-ca); }`)
      .replace('#include <map_fragment>', `#include <map_fragment>
{ vec3 c = diffuseColor.rgb; float mx = max(c.r, max(c.g, c.b)); float mn = min(c.r, min(c.g, c.b));
  if (c.g >= mx - 0.001 && (mx - mn) > 0.12) { vec3 r = hueRot(c, uHue); float l = dot(r, vec3(0.333)); diffuseColor.rgb = max(mix(vec3(l), r, uSat), 0.0); } }`);
  }, `roof${v}`);
  roofCache.set(k, m);
  return m;
}

export function house(i: number, scale = 10, roof = 0) {
  const f = HOUSES[i % HOUSES.length];
  const v = roof % ROOFS.length;
  const o = gltfObject({ file: f, type: 'Wohnhaus', key: 'house', category: 'Gebäude', variant: `Typ ${f.slice(-5, -4).toUpperCase()}, ${ROOFS[v].name}`, scale });
  if (v) o.traverse((m) => { if ((m as THREE.Mesh).isMesh) (m as THREE.Mesh).material = roofMaterial((m as THREE.Mesh).material as THREE.Material, v); });
  return o;
}
export function suburbFence(len: 2 | 3 | 4) {
  return gltfObject({ file: `suburb/fence-1x${len}.glb`, type: 'Gartenzaun', key: 'garden_fence', category: 'Stadtmobiliar', scale: 10 });
}

// --- nature ------------------------------------------------------------------
const TREES: Record<string, string> = {
  tree_oak: 'Eiche', tree_oak_dark: 'Eiche (dunkel)', tree_default: 'Laubbaum', tree_default_fall: 'Herbstbaum', tree_detailed: 'Laubbaum (detailliert)',
  tree_fat: 'Kugelbaum', tree_pineTallA: 'Tanne', tree_pineTallB: 'Tanne', tree_pineRoundA: 'Kiefer', tree_pineRoundC: 'Kiefer', tree_cone: 'Kegelbaum',
  tree_palmTall: 'Palme', tree_palmBend: 'Palme (gebogen)', tree_blocks: 'Würfelbaum', tree_plateau: 'Schirmbaum',
};
export const TREE_NAMES = Object.keys(TREES);
export function tree(name: string, height = 9) {
  return gltfObject({ file: `nature/${name}.glb`, type: 'Baum', key: 'tree', category: 'Natur', variant: TREES[name], height });
}
export function suburbTree(large: boolean) {
  return gltfObject({ file: `suburb/tree-${large ? 'large' : 'small'}.glb`, type: 'Baum', key: 'tree', category: 'Natur', variant: large ? 'Straßenbaum groß' : 'Straßenbaum klein', scale: 10 });
}

const NATURE: Record<string, { type: string; key: string; category: Category; variant?: string; scale: number }> = {
  rock_largeA: { type: 'Felsen', key: 'rock', category: 'Natur', scale: 9 },
  rock_largeC: { type: 'Felsen', key: 'rock', category: 'Natur', scale: 9 },
  rock_tallA: { type: 'Felsen', key: 'rock', category: 'Natur', variant: 'hoch', scale: 8 },
  rock_smallA: { type: 'Stein', key: 'stone', category: 'Natur', scale: 6 },
  flower_redA: { type: 'Blume', key: 'flower', category: 'Natur', variant: 'rot', scale: 4 },
  flower_yellowA: { type: 'Blume', key: 'flower', category: 'Natur', variant: 'gelb', scale: 4 },
  flower_purpleA: { type: 'Blume', key: 'flower', category: 'Natur', variant: 'lila', scale: 4 },
  plant_bush: { type: 'Busch', key: 'bush', category: 'Natur', scale: 6 },
  plant_bushLarge: { type: 'Busch', key: 'bush', category: 'Natur', variant: 'groß', scale: 6 },
  plant_bushDetailed: { type: 'Busch', key: 'bush', category: 'Natur', variant: 'detailliert', scale: 6 },
  mushroom_redGroup: { type: 'Pilze', key: 'mushroom', category: 'Natur', scale: 5 },
  mushroom_redTall: { type: 'Pilz', key: 'mushroom', category: 'Natur', variant: 'Fliegenpilz', scale: 5 },
  tent_detailedOpen: { type: 'Zelt', key: 'tent', category: 'Stadtmobiliar', variant: 'offen', scale: 6 },
  tent_smallClosed: { type: 'Zelt', key: 'tent', category: 'Stadtmobiliar', variant: 'klein', scale: 6 },
  campfire_logs: { type: 'Lagerfeuer', key: 'campfire', category: 'Stadtmobiliar', scale: 6 },
  canoe: { type: 'Kanu', key: 'canoe', category: 'Wasserfahrzeug', scale: 5 },
  log_stack: { type: 'Holzstapel', key: 'log_stack', category: 'Natur', scale: 6 },
  stump_round: { type: 'Baumstumpf', key: 'stump', category: 'Natur', scale: 6 },
  crop_pumpkin: { type: 'Kürbis', key: 'pumpkin', category: 'Natur', scale: 5 },
  crop_melon: { type: 'Melone', key: 'melon', category: 'Natur', scale: 5 },
  crops_cornStageD: { type: 'Mais', key: 'corn', category: 'Natur', scale: 6 },
  crops_wheatStageB: { type: 'Weizen', key: 'wheat', category: 'Natur', scale: 6 },
  fence_simple: { type: 'Weidezaun', key: 'pasture_fence', category: 'Stadtmobiliar', scale: 6 },
  statue_obelisk: { type: 'Obelisk', key: 'obelisk', category: 'Kurioses', scale: 8 },
  statue_head: { type: 'Steinkopf', key: 'stone_head', category: 'Kurioses', scale: 8 },
  lily_large: { type: 'Seerose', key: 'lily', category: 'Natur', scale: 5 },
  sign: { type: 'Wegweiser', key: 'signpost', category: 'Stadtmobiliar', scale: 5 },
  pot_large: { type: 'Blumentopf', key: 'flower_pot', category: 'Stadtmobiliar', scale: 5 },
};
export function nature(name: keyof typeof NATURE | string, scaleMul = 1) {
  const d = NATURE[name];
  return gltfObject({ file: `nature/${name}.glb`, ...d, scale: d.scale * scaleMul });
}

export const GLTF_FILES = [
  ...SKYSCRAPERS, ...COMMERCIAL, ...HOUSES,
  'suburb/fence-1x2.glb', 'suburb/fence-1x3.glb', 'suburb/fence-1x4.glb', 'suburb/tree-large.glb', 'suburb/tree-small.glb',
  'suburb/planter.glb', 'suburb/driveway-long.glb', 'suburb/path-stones-long.glb',
  ...TREE_NAMES.map((n) => `nature/${n}.glb`),
  ...Object.keys(NATURE).map((n) => `nature/${n}.glb`),
];

gallery({
  ...Object.fromEntries(SKYSCRAPERS.map((_, i) => [`skyscraper${i}`, () => skyscraper(i)])),
  ...Object.fromEntries(COMMERCIAL.map((_, i) => [`commercial${i}`, () => commercial(i)])),
  ...Object.fromEntries(HOUSES.map((_, i) => [`house${i}`, () => house(i, 10, i)])),
  ...Object.fromEntries(TREE_NAMES.map((n) => [n, () => tree(n)])),
  ...Object.fromEntries(Object.keys(NATURE).map((n) => [n, () => nature(n)])),
});
