import * as THREE from 'three';
import { Parts } from '../core/parts';
import { onTick, env } from '../core/anim';

/** Shared helpers for the city object factories. */

export const TAU = Math.PI * 2;

/** Canvas-texture text plane. `glow` = unlit (neon look), otherwise lit + slight night glow. */
export function textPlane(
  text: string,
  w: number,
  h: number,
  o: { bg?: string; fg?: string; font?: string; glow?: boolean; border?: string; px?: number } = {},
): THREE.Mesh {
  const px = o.px ?? 128;
  const cw = Math.round(px * (w / h)), ch = px;
  const c = document.createElement('canvas');
  c.width = Math.min(cw, 1024); c.height = ch;
  const g = c.getContext('2d')!;
  g.fillStyle = o.bg ?? '#1b1f3a';
  g.fillRect(0, 0, c.width, c.height);
  if (o.border) {
    g.strokeStyle = o.border; g.lineWidth = ch * 0.08;
    g.strokeRect(ch * 0.05, ch * 0.05, c.width - ch * 0.1, ch - ch * 0.1);
  }
  g.fillStyle = o.fg ?? '#fff';
  g.textAlign = 'center'; g.textBaseline = 'middle';
  let size = ch * 0.62;
  const fam = o.font ?? '900 {s}px "Arial Black", Impact, system-ui, sans-serif';
  g.font = fam.replace('{s}', String(size));
  while (g.measureText(text).width > c.width * 0.9 && size > 8) {
    size -= 2;
    g.font = fam.replace('{s}', String(size));
  }
  if (o.glow) { g.shadowColor = o.fg ?? '#fff'; g.shadowBlur = ch * 0.12; }
  g.fillText(text, c.width / 2, c.height / 2 + ch * 0.04);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  const mat = o.glow
    ? new THREE.MeshBasicMaterial({ map: tex, toneMapped: false })
    : new THREE.MeshStandardMaterial({ map: tex, roughness: 0.7, emissive: new THREE.Color('#ffffff'), emissiveMap: tex, emissiveIntensity: 0.15 });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
  if (!o.glow) {
    const sm = mat as THREE.MeshStandardMaterial;
    let last = -1;
    onTick(() => {
      if (env.night === last) return;
      last = env.night;
      sm.emissiveIntensity = 0.15 + env.night * 0.55;
    });
  }
  return m;
}

/** A pivot group positioned at (x,y,z) holding the built parts. */
export function pivot(b: Parts, x = 0, y = 0, z = 0, castShadow = true): THREE.Group {
  const p = new THREE.Group();
  p.position.set(x, y, z);
  if (!b.empty) p.add(b.build({ castShadow }));
  return p;
}

/** Deterministic tiny PRNG from a seed. */
export function seeded(seed: number) {
  let s = (seed * 2654435761) >>> 0 || 1;
  return () => {
    s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0;
    return s / 4294967296;
  };
}

/** Window grid on a facade (front = +Z face at z). */
export function windows(
  b: Parts, w: number, z: number, y0: number, rows: number, cols: number,
  o: { ww?: number; wh?: number; dy?: number; color?: string; frame?: string; x0?: number; mat?: 'lamp' | 'glass' | 'std' } = {},
) {
  const ww = o.ww ?? 1.1, wh = o.wh ?? 1.3, dy = o.dy ?? 3;
  const x0 = o.x0 ?? 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = x0 - w / 2 + (c + 0.5) * (w / cols);
      const y = y0 + r * dy;
      b.box(ww + 0.25, wh + 0.25, 0.08, o.frame ?? '#f4efe4', { x, y, z });
      b.box(ww, wh, 0.1, o.color ?? '#9fd3ff', { x, y, z: z + 0.03, mat: o.mat ?? 'lamp' });
    }
  }
}

/** Striped awning along X, sloping down toward +Z. */
export function awning(b: Parts, w: number, y: number, z: number, depth: number, c1: string, c2: string, stripes = 8) {
  const sw = w / stripes;
  for (let i = 0; i < stripes; i++) {
    b.box(sw, 0.12, depth, i % 2 ? c1 : c2, { x: -w / 2 + (i + 0.5) * sw, y, z: z + depth / 2 - 0.1, rx: 0.32 });
    // scalloped edge
    b.box(sw * 0.9, 0.45, 0.06, i % 2 ? c1 : c2, { x: -w / 2 + (i + 0.5) * sw, y: y - Math.sin(0.32) * depth / 2 - 0.25, z: z + depth * Math.cos(0.32) - 0.08 });
  }
}

export const lerp = THREE.MathUtils.lerp;
