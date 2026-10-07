import * as THREE from 'three';
import { Parts, rng, type PartOpts } from '../core/parts';
import { selectable, type Category } from '../core/registry';

/** Shared seeded random for the park objects (deterministic look). */
export const R = rng(20261006);

/** Tag a park object as one selectable unit. */
export function sel<T extends THREE.Object3D>(obj: T, type: string, key: string, category: Category, model: string, variant?: string): T {
  return selectable(obj, { type, key, category, source: 'prozedural', model, variant });
}

/** Group several baked builders into one root. */
export function group(...children: THREE.Object3D[]): THREE.Group {
  const g = new THREE.Group();
  for (const c of children) g.add(c);
  return g;
}

/** Cone made of alternating colored wedges (circus / carousel roofs). */
export function stripedCone(b: Parts, r: number, h: number, stripes: number, colors: string[], o: PartOpts = {}) {
  const step = (Math.PI * 2) / stripes;
  for (let i = 0; i < stripes; i++) {
    b.add(new THREE.ConeGeometry(r, h, 2, 1, false, i * step, step), colors[i % colors.length], o);
  }
}

/** Striped open cylinder band (awning valance etc.). */
export function stripedBand(b: Parts, r: number, h: number, stripes: number, colors: string[], o: PartOpts = {}) {
  const step = (Math.PI * 2) / stripes;
  for (let i = 0; i < stripes; i++) {
    b.add(new THREE.CylinderGeometry(r, r, h, 2, 1, true, i * step, step), colors[i % colors.length], o);
  }
}

/** Canvas-texture sign (one mesh). Front faces +Z. */
export function textPlane(text: string, w: number, h: number, bg: string, fg: string, opts: { font?: string; border?: string } = {}): THREE.Mesh {
  const cw = 512, ch = Math.max(64, Math.round((512 * h) / w));
  const c = document.createElement('canvas');
  c.width = cw; c.height = ch;
  const g = c.getContext('2d')!;
  g.fillStyle = bg;
  g.fillRect(0, 0, cw, ch);
  if (opts.border) {
    g.strokeStyle = opts.border;
    g.lineWidth = ch * 0.08;
    g.strokeRect(ch * 0.06, ch * 0.06, cw - ch * 0.12, ch - ch * 0.12);
  }
  g.fillStyle = fg;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  let size = ch * 0.62;
  const family = opts.font ?? '800 SIZEpx "Trebuchet MS", system-ui, sans-serif';
  do {
    g.font = family.replace('SIZE', String(Math.round(size)));
    size *= 0.92;
  } while (g.measureText(text).width > cw * 0.86 && size > 8);
  g.fillText(text, cw / 2, ch / 2 + ch * 0.03);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex }));
  return m;
}

/** Tiny low-poly person (≈1.0 * scale m) added to a builder. Faces +Z. */
export function figure(
  b: Parts,
  o: { x: number; y: number; z: number; ry?: number; s?: number; shirt: string; pants: string; skin?: string; hair?: string; sitting?: boolean },
) {
  const s = o.s ?? 1;
  const ry = o.ry ?? 0;
  const cos = Math.cos(ry), sin = Math.sin(ry);
  const at = (lx: number, ly: number, lz: number) => ({ x: o.x + (lx * cos + lz * sin) * s, y: o.y + ly * s, z: o.z + (-lx * sin + lz * cos) * s });
  const skin = o.skin ?? '#f1c27d';
  if (o.sitting) {
    b.box(0.34 * s, 0.14 * s, 0.42 * s, o.pants, { ...at(0, 0.07, 0.12), ry });
    b.box(0.3 * s, 0.4 * s, 0.12 * s, o.pants, { ...at(0, -0.15, 0.36), ry });
  } else {
    b.box(0.14 * s, 0.5 * s, 0.16 * s, o.pants, { ...at(-0.09, 0.25, 0), ry });
    b.box(0.14 * s, 0.5 * s, 0.16 * s, o.pants, { ...at(0.09, 0.25, 0), ry });
  }
  const by = o.sitting ? 0 : 0.5;
  b.box(0.38 * s, 0.45 * s, 0.22 * s, o.shirt, { ...at(0, by + 0.23, 0), ry });
  b.box(0.1 * s, 0.4 * s, 0.12 * s, o.shirt, { ...at(-0.25, by + 0.22, 0.02), ry });
  b.box(0.1 * s, 0.4 * s, 0.12 * s, o.shirt, { ...at(0.25, by + 0.22, 0.02), ry });
  b.sphere(0.15 * s, skin, { ...at(0, by + 0.62, 0), w: 8, hseg: 6 });
  b.sphere(0.155 * s, o.hair ?? '#4a2c17', { ...at(0, by + 0.71, -0.035), w: 8, hseg: 6, sy: 0.55 });
  b.box(0.05 * s, 0.05 * s, 0.02 * s, '#1b1b25', { ...at(-0.06, by + 0.65, 0.145), ry });
  b.box(0.05 * s, 0.05 * s, 0.02 * s, '#1b1b25', { ...at(0.06, by + 0.65, 0.145), ry });
}

export const PASTELS = ['#ff6fa5', '#ffd23f', '#4ab8ff', '#6ee7a8', '#b48cff', '#ff9f43', '#ff4f6d', '#2fd3c7'];
