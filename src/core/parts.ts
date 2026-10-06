import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { MATERIALS, type MatKey } from './materials';

export type ColorLike = THREE.ColorRepresentation;

export interface PartOpts {
  x?: number; y?: number; z?: number;
  rx?: number; ry?: number; rz?: number;
  /** uniform or per-axis scale */
  s?: number; sx?: number; sy?: number; sz?: number;
  mat?: MatKey;
}

const tmpColor = new THREE.Color();
const tmpMatrix = new THREE.Matrix4();
const tmpQuat = new THREE.Quaternion();
const tmpEuler = new THREE.Euler();
const tmpPos = new THREE.Vector3();
const tmpScale = new THREE.Vector3();

/**
 * Procedural model builder. Every primitive gets a vertex color and is baked into
 * one merged mesh per material on build(). Use separate builders for animated parts
 * (e.g. a rotor) and attach their result to a pivot group.
 *
 *   const b = new Parts();
 *   b.box(2, 1, 4, '#c33', { y: 0.5 });
 *   b.cyl(0.4, 0.4, 0.3, '#222', { x: 1, rz: Math.PI / 2 });
 *   const mesh = b.build();
 */
export class Parts {
  private geos = new Map<MatKey, THREE.BufferGeometry[]>();

  /** Add an arbitrary geometry (consumed – do not reuse). */
  add(geo: THREE.BufferGeometry, color: ColorLike, o: PartOpts = {}): this {
    let g = geo.index ? geo.toNonIndexed() : geo;
    if (g !== geo) geo.dispose();
    for (const name of Object.keys(g.attributes)) {
      if (name !== 'position' && name !== 'normal') g.deleteAttribute(name);
    }
    if (!g.attributes.normal) g.computeVertexNormals();
    tmpEuler.set(o.rx ?? 0, o.ry ?? 0, o.rz ?? 0);
    tmpQuat.setFromEuler(tmpEuler);
    tmpPos.set(o.x ?? 0, o.y ?? 0, o.z ?? 0);
    const s = o.s ?? 1;
    tmpScale.set((o.sx ?? 1) * s, (o.sy ?? 1) * s, (o.sz ?? 1) * s);
    tmpMatrix.compose(tmpPos, tmpQuat, tmpScale);
    g.applyMatrix4(tmpMatrix);
    const n = g.attributes.position.count;
    const colors = new Float32Array(n * 3);
    tmpColor.set(color);
    for (let i = 0; i < n; i++) {
      colors[i * 3] = tmpColor.r; colors[i * 3 + 1] = tmpColor.g; colors[i * 3 + 2] = tmpColor.b;
    }
    g.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    const key = o.mat ?? 'std';
    if (!this.geos.has(key)) this.geos.set(key, []);
    this.geos.get(key)!.push(g);
    return this;
  }

  box(w: number, h: number, d: number, color: ColorLike, o: PartOpts = {}) {
    return this.add(new THREE.BoxGeometry(w, h, d), color, o);
  }
  /** Cylinder, centered on its middle. */
  cyl(rTop: number, rBottom: number, h: number, color: ColorLike, o: PartOpts & { seg?: number; open?: boolean } = {}) {
    return this.add(new THREE.CylinderGeometry(rTop, rBottom, h, o.seg ?? 10, 1, o.open ?? false), color, o);
  }
  cone(r: number, h: number, color: ColorLike, o: PartOpts & { seg?: number } = {}) {
    return this.add(new THREE.ConeGeometry(r, h, o.seg ?? 10), color, o);
  }
  sphere(r: number, color: ColorLike, o: PartOpts & { w?: number; hseg?: number } = {}) {
    return this.add(new THREE.SphereGeometry(r, o.w ?? 10, o.hseg ?? 8), color, o);
  }
  ico(r: number, color: ColorLike, o: PartOpts & { detail?: number } = {}) {
    return this.add(new THREE.IcosahedronGeometry(r, o.detail ?? 0), color, o);
  }
  torus(r: number, tube: number, color: ColorLike, o: PartOpts & { rs?: number; ts?: number; arc?: number } = {}) {
    return this.add(new THREE.TorusGeometry(r, tube, o.rs ?? 8, o.ts ?? 16, o.arc ?? Math.PI * 2), color, o);
  }
  /** Extruded 2D shape (in XY plane, extruded along +Z by depth). */
  extrude(shape: THREE.Shape, depth: number, color: ColorLike, o: PartOpts & { bevel?: number } = {}) {
    const g = new THREE.ExtrudeGeometry(shape, {
      depth, bevelEnabled: (o.bevel ?? 0) > 0, bevelSize: o.bevel ?? 0, bevelThickness: o.bevel ?? 0, bevelSegments: 1,
    });
    return this.add(g, color, o);
  }
  /** Lathe around Y from a list of [radius, y] points. */
  lathe(points: [number, number][], color: ColorLike, o: PartOpts & { seg?: number } = {}) {
    const g = new THREE.LatheGeometry(points.map(([r, y]) => new THREE.Vector2(r, y)), o.seg ?? 12);
    return this.add(g, color, o);
  }
  /** A beam between two points (box with square cross section). */
  beam(a: THREE.Vector3Like, b: THREE.Vector3Like, thick: number, color: ColorLike, mat?: MatKey) {
    const va = new THREE.Vector3(a.x, a.y, a.z), vb = new THREE.Vector3(b.x, b.y, b.z);
    const len = va.distanceTo(vb);
    const g = new THREE.BoxGeometry(thick, len, thick);
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), vb.clone().sub(va).normalize());
    const m = new THREE.Matrix4().compose(va.clone().add(vb).multiplyScalar(0.5), q, new THREE.Vector3(1, 1, 1));
    g.applyMatrix4(m);
    return this.add(g, color, { mat });
  }
  /** Round tube between two points. */
  rod(a: THREE.Vector3Like, b: THREE.Vector3Like, r: number, color: ColorLike, mat?: MatKey, seg = 6) {
    const va = new THREE.Vector3(a.x, a.y, a.z), vb = new THREE.Vector3(b.x, b.y, b.z);
    const len = va.distanceTo(vb);
    const g = new THREE.CylinderGeometry(r, r, len, seg);
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), vb.clone().sub(va).normalize());
    g.applyMatrix4(new THREE.Matrix4().compose(va.clone().add(vb).multiplyScalar(0.5), q, new THREE.Vector3(1, 1, 1)));
    return this.add(g, color, { mat });
  }

  get empty() { return this.geos.size === 0; }

  /**
   * Bake into a Group containing one Mesh per material.
   * castShadow defaults to true.
   */
  build(opts: { castShadow?: boolean; receiveShadow?: boolean; name?: string } = {}): THREE.Group {
    const group = new THREE.Group();
    if (opts.name) group.name = opts.name;
    for (const [key, list] of this.geos) {
      const merged = list.length === 1 ? list[0] : mergeGeometries(list, false);
      if (!merged) continue;
      merged.computeBoundingSphere();
      const mesh = new THREE.Mesh(merged, MATERIALS[key]);
      mesh.castShadow = (opts.castShadow ?? true) && key !== 'glass' && key !== 'neon' && key !== 'water';
      mesh.receiveShadow = opts.receiveShadow ?? key === 'std';
      mesh.name = key;
      group.add(mesh);
    }
    this.geos.clear();
    return group;
  }
}

/** Small seeded PRNG so the world looks the same on every load. */
export function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function pick<T>(r: () => number, arr: readonly T[]): T {
  return arr[Math.floor(r() * arr.length)];
}
