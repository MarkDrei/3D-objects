import * as THREE from 'three';
import { model } from '../core/assets';
import { onTick, env } from '../core/anim';
import { Parts, rng } from '../core/parts';
import { selectable, type ObjectMeta } from '../core/registry';
import { LANE, N, P, ROAD, edgeExists, nodeExists, roadPos, hasLights } from './layout';

type Dir = [number, number];
const DIRS: Dir[] = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const H = ROAD / 2;
const SEG = P - ROAD;
const STOP_BACK = 3.4; // stop line distance before the junction

export const CAR_MODELS: { file: string; meta: Omit<ObjectMeta, 'source' | 'model' | 'category'>; siren?: string[]; len: number }[] = [
  { file: 'cars/sedan.glb', meta: { type: 'Auto', key: 'car', variant: 'Limousine' }, len: 2.6 },
  { file: 'cars/sedan-sports.glb', meta: { type: 'Auto', key: 'car', variant: 'Sportlimousine' }, len: 2.6 },
  { file: 'cars/hatchback-sports.glb', meta: { type: 'Auto', key: 'car', variant: 'Kompaktsportler' }, len: 2.5 },
  { file: 'cars/suv.glb', meta: { type: 'Auto', key: 'car', variant: 'SUV' }, len: 2.6 },
  { file: 'cars/suv-luxury.glb', meta: { type: 'Auto', key: 'car', variant: 'Luxus-SUV' }, len: 2.7 },
  { file: 'cars/taxi.glb', meta: { type: 'Taxi', key: 'taxi' }, len: 2.8 },
  { file: 'cars/police.glb', meta: { type: 'Polizeiauto', key: 'police_car' }, siren: ['#2f6bff', '#ff2f3f'], len: 3.0 },
  { file: 'cars/ambulance.glb', meta: { type: 'Krankenwagen', key: 'ambulance' }, siren: ['#2f6bff', '#2f6bff'], len: 3.3 },
  { file: 'cars/firetruck.glb', meta: { type: 'Feuerwehrauto', key: 'fire_truck' }, siren: ['#2f6bff', '#2f6bff'], len: 3.4 },
  { file: 'cars/van.glb', meta: { type: 'Transporter', key: 'van' }, len: 2.8 },
  { file: 'cars/delivery.glb', meta: { type: 'Lieferwagen', key: 'delivery_van' }, len: 3.3 },
  { file: 'cars/truck.glb', meta: { type: 'Pick-up', key: 'pickup' }, len: 3.0 },
  { file: 'cars/garbage-truck.glb', meta: { type: 'Müllwagen', key: 'garbage_truck' }, len: 3.5 },
  { file: 'cars/race.glb', meta: { type: 'Rennwagen', key: 'race_car' }, len: 2.6 },
  { file: 'cars/race-future.glb', meta: { type: 'Rennwagen', key: 'race_car', variant: 'Futuristisch' }, len: 2.7 },
];

export const CAR_SCALE = 1.35;

/** Build a vehicle from the Kenney car kit, with spinning wheels, lights and optional siren. */
export function createVehicle(def: (typeof CAR_MODELS)[number]) {
  const inner = model(def.file);
  inner.scale.setScalar(CAR_SCALE);
  inner.position.y = 0.3 * CAR_SCALE; // Kenney cars have their wheel bottoms at y=-0.3
  const root = new THREE.Group();
  root.add(inner);
  const wheels: THREE.Object3D[] = [];
  inner.traverse((o) => {
    if (o.name.startsWith('wheel')) wheels.push(o);
  });
  root.userData.wheels = wheels;

  // headlights + tail lights (visible at night)
  const lb = new Parts();
  const zf = (def.len / 2 + 0.02) * CAR_SCALE * 0.98;
  lb.box(0.28, 0.14, 0.05, '#fff6d0', { x: 0.42 * CAR_SCALE, y: 0.55 * CAR_SCALE, z: zf, mat: 'neon' });
  lb.box(0.28, 0.14, 0.05, '#fff6d0', { x: -0.42 * CAR_SCALE, y: 0.55 * CAR_SCALE, z: zf, mat: 'neon' });
  lb.box(0.26, 0.12, 0.05, '#ff2a2a', { x: 0.45 * CAR_SCALE, y: 0.6 * CAR_SCALE, z: -zf, mat: 'neon' });
  lb.box(0.26, 0.12, 0.05, '#ff2a2a', { x: -0.45 * CAR_SCALE, y: 0.6 * CAR_SCALE, z: -zf, mat: 'neon' });
  const lights = lb.build({ castShadow: false });
  lights.visible = false;
  root.add(lights);
  // light cone on the road
  const beam = new THREE.Mesh(
    new THREE.PlaneGeometry(3.2, 7),
    new THREE.MeshBasicMaterial({ color: '#fff3c0', transparent: true, opacity: 0.18, depthWrite: false, toneMapped: false }),
  );
  beam.rotation.x = -Math.PI / 2;
  beam.position.set(0, 0.15, zf + 3.6);
  beam.userData.noHighlight = true;
  lights.add(beam);
  root.userData.lights = lights;

  if (def.siren) {
    const top = new THREE.Box3().setFromObject(inner).max.y;
    const mk = (c: string, x: number) => {
      const s = new Parts().box(0.36, 0.2, 0.3, c, { mat: 'neon' }).build({ castShadow: false });
      s.position.set(x, top + 0.08, def.file.includes('police') ? -0.1 : 0.9);
      root.add(s);
      return s;
    };
    const a = mk(def.siren[0], 0.3), b = mk(def.siren[1], -0.3);
    root.userData.siren = [a, b];
  }
  return selectable(root, { ...def.meta, category: 'Fahrzeug', source: 'gltf', model: def.file });
}

interface Car {
  obj: THREE.Object3D;
  len: number;
  /** current node we're heading to */
  ti: number; tj: number;
  dir: Dir;
  mode: 'straight' | 'turn';
  curve: THREE.QuadraticBezierCurve3 | THREE.LineCurve3;
  clen: number;
  s: number;
  speed: number;
  max: number;
  next: Dir;
  wheelAngle: number;
  sirenOn: boolean;
}

const right = (d: Dir): Dir => [-d[1], d[0]];

/** Traffic lights cycle per junction (EW green → yellow → NS green → yellow). */
const CYCLE = 18;
export function lightState(i: number, j: number, axis: 'x' | 'z', t: number): 'green' | 'yellow' | 'red' {
  const ph = (t + (i * 3.7 + j * 5.3)) % CYCLE;
  if (axis === 'x') return ph < 7 ? 'green' : ph < 9 ? 'yellow' : 'red';
  return ph < 9 ? 'red' : ph < 16 ? 'green' : ph < 18 ? 'yellow' : 'red';
}

export function nodeDegree(i: number, j: number) {
  return DIRS.filter(([di, dj]) => edgeExists(i, j, i + di, j + dj)).length;
}

export class Traffic {
  cars: Car[] = [];
  private r = rng(42);
  /** objects that drive and can be followed */
  movingKeys = new Set<string>();

  constructor(private scene: THREE.Scene) {}

  spawn(count: number) {
    const r = this.r;
    const edges: [number, number, Dir][] = [];
    for (let i = 0; i <= N; i++) for (let j = 0; j <= N; j++) for (const d of DIRS) if (edgeExists(i, j, i + d[0], j + d[1])) edges.push([i, j, d]);
    // shuffle edges, put at most one car per edge initially
    for (let k = edges.length - 1; k > 0; k--) { const m = Math.floor(r() * (k + 1)); [edges[k], edges[m]] = [edges[m], edges[k]]; }
    for (let n = 0; n < count && n < edges.length; n++) {
      // make sure the special vehicles appear at least once
      const def = n < CAR_MODELS.length ? CAR_MODELS[n] : CAR_MODELS[Math.floor(r() * 6)];
      const obj = createVehicle(def);
      this.movingKeys.add(def.meta.key);
      this.scene.add(obj);
      const [i, j, d] = edges[n];
      const car: Car = {
        obj, len: def.len * CAR_SCALE, ti: i + d[0], tj: j + d[1], dir: d, mode: 'straight',
        curve: new THREE.LineCurve3(), clen: 1, s: r() * 20, speed: 6, max: 8 + r() * 4, next: d, wheelAngle: 0,
        sirenOn: !!def.siren && r() < 0.7,
      };
      if (def.meta.key === 'race_car') car.max = 13;
      this.setStraight(car, i, j);
      this.cars.push(car);
    }
    onTick((dt, t) => this.update(dt, t));
  }

  private setStraight(c: Car, fi: number, fj: number) {
    const d = c.dir, rt = right(d);
    const ax = roadPos(fi), az = roadPos(fj);
    const a = new THREE.Vector3(ax + d[0] * H + rt[0] * LANE, 0, az + d[1] * H + rt[1] * LANE);
    const b = new THREE.Vector3(ax + d[0] * (P - H) + rt[0] * LANE, 0, az + d[1] * (P - H) + rt[1] * LANE);
    c.mode = 'straight';
    c.curve = new THREE.LineCurve3(a, b);
    c.clen = SEG;
    c.next = this.chooseNext(c);
  }

  private chooseNext(c: Car): Dir {
    const opts = DIRS.filter((d) => !(d[0] === -c.dir[0] && d[1] === -c.dir[1]) && edgeExists(c.ti, c.tj, c.ti + d[0], c.tj + d[1]));
    if (opts.length === 0) return [-c.dir[0], -c.dir[1]];
    // prefer straight a bit
    const straight = opts.find((d) => d[0] === c.dir[0] && d[1] === c.dir[1]);
    if (straight && this.r() < 0.45) return straight;
    return opts[Math.floor(this.r() * opts.length)];
  }

  private setTurn(c: Car) {
    const d = c.dir, d2 = c.next, r1 = right(d), r2 = right(d2);
    const bx = roadPos(c.ti), bz = roadPos(c.tj);
    const a = new THREE.Vector3(bx - d[0] * H + r1[0] * LANE, 0, bz - d[1] * H + r1[1] * LANE);
    const e = new THREE.Vector3(bx + d2[0] * H + r2[0] * LANE, 0, bz + d2[1] * H + r2[1] * LANE);
    if (d[0] === d2[0] && d[1] === d2[1]) {
      c.curve = new THREE.LineCurve3(a, e);
    } else if (d[0] === -d2[0] && d[1] === -d2[1]) {
      // U-turn (dead end) – loop around the junction center
      const m = new THREE.Vector3(bx + d[0] * H, 0, bz + d[1] * H);
      c.curve = new THREE.QuadraticBezierCurve3(a, m, e);
    } else {
      const ctrl = new THREE.Vector3(bx + (r1[0] + r2[0]) * LANE, 0, bz + (r1[1] + r2[1]) * LANE);
      c.curve = new THREE.QuadraticBezierCurve3(a, ctrl, e);
    }
    c.clen = c.curve.getLength();
    c.mode = 'turn';
  }

  private tmp = new THREE.Vector3();
  private tan = new THREE.Vector3();

  private update(dt: number, t: number) {
    const cars = this.cars;
    for (const c of cars) {
      let target = c.max;
      // traffic light
      if (c.mode === 'straight' && hasLights(c.ti, c.tj)) {
        const axis = c.dir[0] !== 0 ? 'x' : 'z';
        const st = lightState(c.ti, c.tj, axis, t);
        const stopAt = c.clen - STOP_BACK - c.len / 2;
        const dist = stopAt - c.s;
        if (st !== 'green' && dist > -0.5 && !(st === 'yellow' && dist < 4)) {
          target = Math.min(target, Math.max(0, dist) * 0.9);
        }
      }
      // car ahead
      const pos = c.obj.position;
      const fwd = this.tan.set(Math.sin(c.obj.rotation.y), 0, Math.cos(c.obj.rotation.y));
      for (const o of cars) {
        if (o === c) continue;
        const rel = this.tmp.copy(o.obj.position).sub(pos);
        const ahead = rel.dot(fwd);
        if (ahead <= 0 || ahead > 16) continue;
        const lat = Math.abs(rel.x * fwd.z - rel.z * fwd.x);
        if (lat > 1.6) continue;
        const gap = ahead - (c.len + o.len) / 2 - 1.8;
        target = Math.min(target, Math.max(0, gap) * 1.2);
      }
      const acc = target > c.speed ? 4 : 14;
      c.speed += THREE.MathUtils.clamp(target - c.speed, -acc * dt, acc * dt);
      if (c.speed < 0.02 && target < 0.02) c.speed = 0;
      c.s += c.speed * dt;

      // advance along curves
      while (c.s >= c.clen) {
        c.s -= c.clen;
        if (c.mode === 'straight') this.setTurn(c);
        else {
          const fi = c.ti, fj = c.tj;
          c.dir = c.next;
          c.ti = fi + c.dir[0]; c.tj = fj + c.dir[1];
          this.setStraight(c, fi, fj);
        }
      }
      const u = Math.min(c.s / c.clen, 1);
      c.curve.getPoint(u, pos);
      c.curve.getTangent(u, this.tan);
      c.obj.rotation.y = Math.atan2(this.tan.x, this.tan.z);

      // wheels, lights, siren
      c.wheelAngle += (c.speed * dt) / (0.3 * CAR_SCALE);
      for (const w of c.obj.userData.wheels as THREE.Object3D[]) w.rotation.x = c.wheelAngle;
      (c.obj.userData.lights as THREE.Object3D).visible = env.night > 0.35;
      const siren = c.obj.userData.siren as THREE.Object3D[] | undefined;
      if (siren) {
        const on = c.sirenOn ? Math.floor(t * 6) % 2 === 0 : true;
        siren[0].visible = !c.sirenOn || on;
        siren[1].visible = !c.sirenOn || !on;
      }
    }
  }
}

export { nodeExists };
