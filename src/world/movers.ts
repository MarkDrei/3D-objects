import * as THREE from 'three';
import { onTick } from '../core/anim';

/**
 * Generic movement helpers for things that travel through the world
 * (pedestrians, boats, balloons, aircraft). Objects face +Z.
 */

/** Move along a closed curve with constant speed (m/s). */
export function followCurve(
  obj: THREE.Object3D,
  curve: THREE.Curve<THREE.Vector3>,
  speed: number,
  opts: { offset?: number; bank?: number; bob?: number; bobSpeed?: number; reverse?: boolean; y?: number } = {},
) {
  const len = curve.getLength();
  let s = (opts.offset ?? 0) * len;
  const p = new THREE.Vector3(), tan = new THREE.Vector3(), tan2 = new THREE.Vector3();
  let prevYaw = 0;
  const dir = opts.reverse ? -1 : 1;
  const step = (dt: number, t: number) => {
    s = (s + dir * speed * dt + len) % len;
    const u = s / len;
    curve.getPointAt(u, p);
    curve.getTangentAt(u, tan).multiplyScalar(dir);
    obj.position.copy(p);
    if (opts.y !== undefined) obj.position.y = opts.y;
    if (opts.bob) obj.position.y += Math.sin(t * (opts.bobSpeed ?? 1) + (opts.offset ?? 0) * 20) * opts.bob;
    const yaw = Math.atan2(tan.x, tan.z);
    obj.rotation.y = yaw;
    if (opts.bank) {
      curve.getTangentAt((u + dir * 0.01 + 1) % 1, tan2).multiplyScalar(dir);
      const turn = Math.atan2(tan.x * tan2.z - tan.z * tan2.x, tan.dot(tan2));
      obj.rotation.z = THREE.MathUtils.lerp(obj.rotation.z, -turn * opts.bank * 30, 0.05);
    }
    prevYaw = yaw;
  };
  onTick(step);
  step(0, 0);
  return () => prevYaw;
}

/** Closed curve through points (y = height). */
export function loop(points: [number, number][], y = 0, tension = 0.5) {
  return new THREE.CatmullRomCurve3(points.map(([x, z]) => new THREE.Vector3(x, y, z)), true, 'catmullrom', tension);
}

/** Closed polyline (sharp corners rounded by radius r) – good for sidewalks. */
export function roundedRect(cx: number, cz: number, hx: number, hz: number, r: number, y = 0) {
  const path = new THREE.CurvePath<THREE.Vector3>();
  const pts: THREE.Vector3[] = [];
  const corners: [number, number, number][] = [
    [cx + hx - r, cz + hz - r, 0], [cx - hx + r, cz + hz - r, Math.PI / 2], [cx - hx + r, cz - hz + r, Math.PI], [cx + hx - r, cz - hz + r, -Math.PI / 2],
  ];
  for (const [x, z, a0] of corners) {
    for (let k = 0; k <= 4; k++) {
      const a = a0 + (k / 4) * (Math.PI / 2);
      pts.push(new THREE.Vector3(x + Math.cos(a) * r, y, z + Math.sin(a) * r));
    }
  }
  pts.push(pts[0].clone());
  for (let i = 0; i < pts.length - 1; i++) path.add(new THREE.LineCurve3(pts[i], pts[i + 1]));
  return path;
}

/** Circle in the XZ plane. */
export function circle(cx: number, cz: number, r: number, y = 0, segments = 32) {
  const pts: [number, number][] = [];
  for (let i = 0; i < segments; i++) {
    const a = (i / segments) * Math.PI * 2;
    pts.push([cx + Math.cos(a) * r, cz + Math.sin(a) * r]);
  }
  return loop(pts, y);
}

/** Lazy drifting (balloons, clouds): wander around a center. */
export function drift(obj: THREE.Object3D, center: THREE.Vector3, radius: number, speed: number, phase: number, faceMotion = false) {
  onTick((_dt, t) => {
    const a = t * speed + phase;
    const x = center.x + Math.cos(a) * radius + Math.sin(a * 2.3 + phase) * radius * 0.25;
    const z = center.z + Math.sin(a) * radius * 0.7 + Math.cos(a * 1.7) * radius * 0.2;
    if (faceMotion) obj.rotation.y = Math.atan2(x - obj.position.x, z - obj.position.z);
    obj.position.set(x, center.y + Math.sin(t * 0.4 + phase) * 3, z);
  });
}
