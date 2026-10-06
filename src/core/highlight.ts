import * as THREE from 'three';

/**
 * Tints every mesh of the selected object (emissive pulse). The outline itself is
 * done by the OutlinePass in the stage. Tinted material clones are cached per
 * original material, so repeated selections do not leak.
 */
const TINT = new THREE.Color('#ffb300');

export class Highlighter {
  selected: THREE.Object3D | null = null;
  private saved = new Map<THREE.Mesh, THREE.Material | THREE.Material[]>();
  private tintCache = new WeakMap<THREE.Material, THREE.Material>();
  private active = new Set<THREE.Material>();

  select(obj: THREE.Object3D | null) {
    this.clear();
    this.selected = obj;
    if (!obj) return;
    obj.traverse((o) => {
      const m = o as THREE.Mesh;
      if (!m.isMesh || m.userData.noHighlight) return;
      this.saved.set(m, m.material);
      m.material = Array.isArray(m.material) ? m.material.map((x) => this.tint(x)) : this.tint(m.material);
    });
  }

  clear() {
    for (const [mesh, mat] of this.saved) mesh.material = mat;
    this.saved.clear();
    this.active.clear();
    this.selected = null;
  }

  /** Re-apply when an object swapped its own materials (rare). */
  update(t: number) {
    const k = 0.35 + 0.25 * Math.sin(t * 5);
    for (const m of this.active) {
      const sm = m as THREE.MeshStandardMaterial;
      if (sm.emissive) sm.emissiveIntensity = k;
    }
  }

  private tint(mat: THREE.Material): THREE.Material {
    let c = this.tintCache.get(mat);
    if (!c) {
      c = mat.clone();
      const sm = c as THREE.MeshStandardMaterial;
      if (sm.emissive) {
        sm.emissive = TINT.clone();
        sm.emissiveMap = null;
      } else if ((c as THREE.MeshBasicMaterial).color) {
        (c as THREE.MeshBasicMaterial).color.lerp(TINT, 0.5);
      }
      this.tintCache.set(mat, c);
    }
    this.active.add(c);
    return c;
  }
}
