import * as THREE from 'three';
import { Parts, rng } from '../core/parts';
import { selectable } from '../core/registry';
import { onTick } from '../core/anim';
import { MATERIALS } from '../core/materials';
import { HALF, SEA_Z } from './layout';

/** Ground, sea with waves, beach and the hills in the north. */
export function buildTerrain(scene: THREE.Scene) {
  // grass ground (everything north of the sea)
  const W = 1800;
  const groundDepth = SEA_Z + 900;
  const g = new Parts().box(W, 1, groundDepth, '#77b255', { y: -0.5, z: SEA_Z - groundDepth / 2 }).build({ castShadow: false, receiveShadow: true });
  scene.add(selectable(g, { type: 'Wiese', key: 'ground', category: 'Gelände', source: 'prozedural', model: 'buildTerrain' }));

  // city base: slightly different green inside the ring so the city reads as a unit
  const base = new Parts().box(HALF * 2 + 8, 0.04, HALF * 2 + 8, '#6aa74a', { y: 0.01 }).build({ castShadow: false, receiveShadow: true });
  base.userData.noHighlight = true;
  g.add(base);

  // beach between harbor promenade and sea
  const beach = new Parts();
  beach.box(W, 0.6, 22, '#ecd9a0', { y: -0.25, z: SEA_Z + 4 });
  beach.box(W, 0.4, 10, '#e2cc8c', { y: -0.55, z: SEA_Z + 18 });
  const bg = beach.build({ castShadow: false });
  scene.add(selectable(bg, { type: 'Strand', key: 'beach', category: 'Gelände', source: 'prozedural', model: 'buildTerrain' }));

  // sea: animated low-poly waves
  const seaGeo = new THREE.PlaneGeometry(W, 700, 90, 36);
  seaGeo.rotateX(-Math.PI / 2);
  const posAttr = seaGeo.attributes.position as THREE.BufferAttribute;
  const base0 = Float32Array.from(posAttr.array as Float32Array);
  const colors = new Float32Array(posAttr.count * 3);
  const c1 = new THREE.Color('#2a8fd6'), c2 = new THREE.Color('#1b5fa8');
  for (let i = 0; i < posAttr.count; i++) {
    const z = base0[i * 3 + 2];
    const c = c1.clone().lerp(c2, THREE.MathUtils.clamp((z + 350) / 700, 0, 1));
    colors.set([c.r, c.g, c.b], i * 3);
  }
  seaGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  const sea = new THREE.Mesh(seaGeo, MATERIALS.water);
  sea.position.set(0, -0.7, SEA_Z + 12 + 350);
  sea.receiveShadow = true;
  scene.add(selectable(sea, { type: 'Meer', key: 'sea', category: 'Gelände', source: 'prozedural', model: 'buildTerrain' }));
  let acc = 0;
  onTick((dt, t) => {
    acc += dt;
    if (acc < 1 / 30) return; // waves at 30 fps are plenty
    acc = 0;
    const a = posAttr.array as Float32Array;
    for (let i = 0; i < posAttr.count; i++) {
      const x = base0[i * 3], z = base0[i * 3 + 2];
      a[i * 3 + 1] = Math.sin(x * 0.05 + t * 1.3) * 0.35 + Math.cos(z * 0.07 + t * 0.9 + x * 0.02) * 0.35;
    }
    posAttr.needsUpdate = true;
    seaGeo.computeVertexNormals();
  });

  // northern hills
  const r = rng(7);
  const hills: [number, number, number, number][] = [
    [-260, -330, 120, 40], [-80, -380, 150, 55], [130, -360, 130, 46], [320, -300, 140, 50], [-420, -200, 120, 38],
    [450, -150, 110, 34], [-30, -560, 220, 90], [260, -560, 200, 80], [-330, -520, 200, 70],
  ];
  for (const [x, z, rad, h] of hills) {
    const b = new Parts();
    b.add(new THREE.SphereGeometry(rad, 12, 7, 0, Math.PI * 2, 0, Math.PI / 2), r() < 0.5 ? '#6ea84e' : '#5f9944', { sy: h / rad });
    const hg = b.build({ castShadow: false, receiveShadow: true });
    hg.position.set(x, -2, z);
    hg.rotation.y = r() * 6;
    scene.add(selectable(hg, { type: 'Hügel', key: 'hill', category: 'Gelände', source: 'prozedural', model: 'buildTerrain' }));
  }
  // far mountains (snowy peaks)
  for (let k = 0; k < 9; k++) {
    const b = new Parts();
    const h = 140 + r() * 120, rad = 120 + r() * 80;
    b.cone(rad, h, '#6d7c99', { y: h / 2, seg: 7 });
    b.cone(rad * 0.32, h * 0.32, '#f4f7ff', { y: h - h * 0.16 + 0.5, seg: 7 });
    const m = b.build({ castShadow: false });
    m.position.set(-700 + k * 175 + r() * 40, -5, -760 - r() * 60);
    scene.add(selectable(m, { type: 'Berg', key: 'mountain', category: 'Gelände', source: 'prozedural', model: 'buildTerrain' }));
  }
}
