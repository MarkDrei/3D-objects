import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { OutlinePass } from 'three/examples/jsm/postprocessing/OutlinePass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { Highlighter } from './highlight';
import { Environment } from './environment';
import { env, runTickers } from './anim';
import { findSelectable, visibleBox } from './registry';

export interface StageOptions {
  bounds: number;
  home: { pos: THREE.Vector3; target: THREE.Vector3 };
  maxDistance?: number;
}

/** Renderer, camera, controls, post-processing, picking and the main loop. */
export class Stage {
  readonly renderer: THREE.WebGLRenderer;
  readonly scene = new THREE.Scene();
  readonly camera: THREE.PerspectiveCamera;
  readonly controls: OrbitControls;
  readonly env: Environment;
  readonly highlighter = new Highlighter();
  onSelect: (obj: THREE.Object3D | null) => void = () => {};
  /** Called every frame after the scene was updated (UI overlays). */
  onFrame: () => void = () => {};
  following: THREE.Object3D | null = null;

  private composer: EffectComposer;
  private outline: OutlinePass;
  private bloom: UnrealBloomPass;
  private timer = new THREE.Timer();
  private raycaster = new THREE.Raycaster();
  private fly: { fromPos: THREE.Vector3; toPos: THREE.Vector3; fromT: THREE.Vector3; toT: THREE.Vector3; t: number; dur: number } | null = null;
  private lastFollowPos = new THREE.Vector3();
  private pixelRatio: number;
  private frameTimes: number[] = [];
  elapsed = 0;
  private frameNo = 0;

  constructor(container: HTMLElement, private opts: StageOptions) {
    this.renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance' });
    this.pixelRatio = Math.min(window.devicePixelRatio, 2);
    this.renderer.setPixelRatio(this.pixelRatio);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.renderer.shadowMap.autoUpdate = false;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    container.appendChild(this.renderer.domElement);

    this.camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.5, 2000);
    this.camera.position.copy(opts.home.pos);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.target.copy(opts.home.target);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.screenSpacePanning = false;
    this.controls.maxPolarAngle = Math.PI * 0.47;
    this.controls.minDistance = 6;
    this.controls.maxDistance = opts.maxDistance ?? 420;
    this.controls.touches = { ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_PAN };
    this.controls.zoomToCursor = true;
    this.controls.addEventListener('start', () => {
      this.fly = null;
    });

    this.env = new Environment(this.scene);

    const size = this.renderer.getDrawingBufferSize(new THREE.Vector2());
    const rt = new THREE.WebGLRenderTarget(size.x, size.y, { type: THREE.HalfFloatType, samples: 4 });
    this.composer = new EffectComposer(this.renderer, rt);
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    this.bloom = new UnrealBloomPass(new THREE.Vector2(size.x / 2, size.y / 2), 0.6, 0.4, 0.9);
    this.bloom.enabled = false;
    this.composer.addPass(this.bloom);
    this.outline = new OutlinePass(new THREE.Vector2(size.x, size.y), this.scene, this.camera);
    this.outline.visibleEdgeColor.set('#fff04d');
    this.outline.hiddenEdgeColor.set('#ff3fd2');
    this.outline.edgeStrength = 5;
    this.outline.edgeThickness = 1.5;
    this.outline.edgeGlow = 0.4;
    this.outline.pulsePeriod = 0;
    this.outline.enabled = false;
    this.composer.addPass(this.outline);
    this.composer.addPass(new OutputPass());

    window.addEventListener('resize', () => this.resize());
    this.setupPicking();
  }

  private resize() {
    const w = window.innerWidth, h = window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.fov = w < h ? 62 : 50;
    this.camera.updateProjectionMatrix();
    this.renderer.setPixelRatio(this.pixelRatio);
    this.renderer.setSize(w, h);
    this.composer.setPixelRatio(this.pixelRatio);
    this.composer.setSize(w, h);
  }

  private setupPicking() {
    const el = this.renderer.domElement;
    let down: { x: number; y: number; t: number; id: number } | null = null;
    let multi = false;
    el.addEventListener('pointerdown', (e) => {
      if (down && down.id !== e.pointerId) multi = true;
      else { down = { x: e.clientX, y: e.clientY, t: performance.now(), id: e.pointerId }; multi = false; }
    });
    el.addEventListener('pointerup', (e) => {
      if (!down || down.id !== e.pointerId) return;
      const dx = e.clientX - down.x, dy = e.clientY - down.y;
      const quick = performance.now() - down.t < 450;
      const still = dx * dx + dy * dy < 100;
      down = null;
      if (quick && still && !multi) this.pick(e.clientX, e.clientY);
    });
    el.addEventListener('pointercancel', () => (down = null));
  }

  pick(x: number, y: number) {
    const ndc = new THREE.Vector2((x / window.innerWidth) * 2 - 1, -(y / window.innerHeight) * 2 + 1);
    this.raycaster.setFromCamera(ndc, this.camera);
    const hits = this.raycaster.intersectObjects(this.scene.children, true);
    for (const h of hits) {
      if (!isVisible(h.object)) continue;
      const sel = findSelectable(h.object);
      if (sel) {
        this.select(sel);
        return;
      }
    }
    this.select(null);
  }

  select(obj: THREE.Object3D | null) {
    if (obj === this.highlighter.selected) return;
    this.highlighter.select(obj);
    this.outline.selectedObjects = obj ? [obj] : [];
    this.outline.enabled = !!obj;
    if (this.following && this.following !== obj) this.following = null;
    this.onSelect(obj);
  }

  /** Smoothly fly the camera to frame an object. */
  focus(obj: THREE.Object3D) {
    const box = visibleBox(obj);
    const sphere = box.getBoundingSphere(new THREE.Sphere());
    const dir = this.camera.position.clone().sub(this.controls.target).normalize();
    if (dir.y < 0.25) { dir.y = 0.35; dir.normalize(); }
    const dist = THREE.MathUtils.clamp(sphere.radius * 2.8, 10, 300);
    this.flyTo(sphere.center.clone().add(dir.multiplyScalar(dist)), sphere.center);
  }

  flyTo(pos: THREE.Vector3, target: THREE.Vector3, dur = 1.1) {
    this.fly = { fromPos: this.camera.position.clone(), toPos: pos.clone(), fromT: this.controls.target.clone(), toT: target.clone(), t: 0, dur };
  }

  home() {
    this.following = null;
    this.flyTo(this.opts.home.pos, this.opts.home.target, 1.4);
  }

  follow(obj: THREE.Object3D | null) {
    this.following = obj;
    if (obj) {
      obj.getWorldPosition(this.lastFollowPos);
      this.focus(obj);
    }
  }

  start() {
    this.resize();
    this.renderer.setAnimationLoop(() => this.frame());
  }

  private frame() {
    this.timer.update();
    const dt = Math.min(this.timer.getDelta(), 0.05);
    this.elapsed += dt;
    const t = this.elapsed;
    runTickers(dt, t);
    this.env.update(dt);
    this.highlighter.update(t);

    // following: shift everything (camera, target and a running fly animation) by the object's motion
    if (this.following) {
      const p = this.following.getWorldPosition(new THREE.Vector3());
      const d = p.clone().sub(this.lastFollowPos);
      this.lastFollowPos.copy(p);
      if (this.fly) {
        this.fly.fromPos.add(d); this.fly.toPos.add(d);
        this.fly.fromT.add(d); this.fly.toT.add(d);
      } else {
        this.camera.position.add(d);
        this.controls.target.add(d);
      }
    }
    if (this.fly) {
      const f = this.fly;
      f.t += dt / f.dur;
      const k = easeInOut(Math.min(f.t, 1));
      this.camera.position.lerpVectors(f.fromPos, f.toPos, k);
      this.controls.target.lerpVectors(f.fromT, f.toT, k);
      if (f.t >= 1) this.fly = null;
    }
    // keep the camera inside the world
    const b = this.opts.bounds;
    const tg = this.controls.target;
    const cx = THREE.MathUtils.clamp(tg.x, -b, b), cz = THREE.MathUtils.clamp(tg.z, -b, b), cy = THREE.MathUtils.clamp(tg.y, 0, 120);
    if (cx !== tg.x || cz !== tg.z || cy !== tg.y) {
      const corr = new THREE.Vector3(cx - tg.x, cy - tg.y, cz - tg.z);
      tg.add(corr);
      this.camera.position.add(corr);
    }
    this.controls.update();
    if (this.camera.position.y < 1.5) this.camera.position.y = 1.5;

    this.bloom.enabled = env.night > 0.15;
    this.bloom.strength = 0.65 * env.night;
    // shadows only every 2nd frame: halves the shadow draw calls, moving shadows still look smooth
    if ((this.frameNo++ & 1) === 0) this.renderer.shadowMap.needsUpdate = true;
    this.composer.render(dt);
    this.onFrame();
    this.adaptQuality(dt);
  }

  /** Lower the pixel ratio on slow devices. */
  private adaptQuality(dt: number) {
    this.frameTimes.push(dt);
    if (this.frameTimes.length < 90) return;
    const avg = this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length;
    this.frameTimes = [];
    if (avg > 1 / 38 && this.pixelRatio > 1) {
      this.pixelRatio = Math.max(1, this.pixelRatio - 0.25);
      this.resize();
    }
  }
}

function isVisible(o: THREE.Object3D | null): boolean {
  while (o) {
    if (!o.visible) return false;
    o = o.parent;
  }
  return true;
}

function easeInOut(x: number) {
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}
