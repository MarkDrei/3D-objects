import './style.css';
import * as THREE from 'three';
import { Stage } from './core/stage';
import { UI } from './core/ui';
import { preloadModels } from './core/assets';
import { env } from './core/anim';
import { registry, infoOf } from './core/registry';
import { setupDistanceCulling } from './core/culling';
import { MODEL_FILES, buildWorld } from './world/world';
import { GALLERY } from './objects/gallery';
import './objects';

const params = new URLSearchParams(location.search);
const view = params.get('view');

async function boot() {
  const bar = document.getElementById('loader-bar')!;
  const stage = new Stage(document.getElementById('app')!, {
    bounds: 300,
    home: { pos: new THREE.Vector3(150, 140, 210), target: new THREE.Vector3(0, 0, 20) },
  });
  await preloadModels(MODEL_FILES, (d, t) => (bar.style.width = `${(d / t) * 100}%`));

  let moving = new Set<string>();
  if (view) moving = buildGallery(stage, view);
  else {
    moving = buildWorld(stage.scene);
    setupDistanceCulling(stage.camera);
  }

  new UI(stage, moving);

  // URL helpers for screenshots / debugging
  if (params.get('night')) { stage.env.target = 1; env.night = 1; }
  const cam = params.get('cam');
  if (cam) {
    const [x, y, z, tx, ty, tz] = cam.split(',').map(Number);
    stage.camera.position.set(x, y, z);
    stage.controls.target.set(tx, ty, tz);
  }
  const sel = params.get('select');
  if (sel) {
    const o = registry.find((r) => infoOf(r)!.id === sel || infoOf(r)!.key === sel);
    if (o) { stage.select(o); if (!cam) stage.focus(o); }
  }
  // intro: swoop in from high above
  if (!view && !cam && !sel && !params.get('nointro')) {
    const home = stage.camera.position.clone();
    stage.camera.position.set(-260, 330, 380);
    stage.flyTo(home, stage.controls.target.clone(), 3.2);
  }
  (window as any).__stage = stage;
  (window as any).__count = registry.length;
  stage.start();
  document.getElementById('loader')!.classList.add('done');
  (window as any).__ready = true;
}

/** ?view=all → grid of all factories; ?view=name → one object. */
function buildGallery(stage: Stage, view: string) {
  const names = view === 'all' ? Object.keys(GALLERY) : view.split(',');
  const cols = Math.ceil(Math.sqrt(names.length));
  const spacing = Number(params.get('spacing') ?? 30);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(2000, 2000), new THREE.MeshStandardMaterial({ color: '#8fbf6a' }));
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  ground.raycast = () => {};
  stage.scene.add(ground);
  const moving = new Set<string>();
  names.forEach((n, k) => {
    const f = GALLERY[n];
    if (!f) { console.warn('unknown factory', n); return; }
    const o = f();
    o.position.x += (k % cols - (cols - 1) / 2) * spacing;
    o.position.z += (Math.floor(k / cols) - (cols - 1) / 2) * spacing;
    stage.scene.add(o);
    o.updateMatrixWorld(true);
  });
  const box = new THREE.Box3();
  for (const c of stage.scene.children) if (infoOf(c)) box.expandByObject(c);
  const sphere = box.getBoundingSphere(new THREE.Sphere());
  const r = Math.max(sphere.radius, 4);
  if (!params.get('cam')) {
    stage.camera.position.copy(sphere.center).add(new THREE.Vector3(0.8, 0.75, 1.2).normalize().multiplyScalar(r * 2.3));
    stage.controls.target.copy(sphere.center);
  }
  return moving;
}

boot().catch((e) => {
  console.error(e);
  document.querySelector('#loader .sub')!.textContent = 'Fehler beim Laden: ' + e.message;
});
