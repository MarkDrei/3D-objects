import * as THREE from 'three';
import { env } from './anim';
import { setNightFactor } from './materials';

const DAY = {
  top: new THREE.Color('#4fa3ff'),
  horizon: new THREE.Color('#cfe8ff'),
  hemiSky: new THREE.Color('#dff0ff'),
  hemiGround: new THREE.Color('#7a8f5a'),
  sun: new THREE.Color('#fff2d6'),
};
const NIGHT = {
  top: new THREE.Color('#050818'),
  horizon: new THREE.Color('#1d2550'),
  hemiSky: new THREE.Color('#3a4a8a'),
  hemiGround: new THREE.Color('#1a1f30'),
  sun: new THREE.Color('#8fa8ff'),
};

/** Sky dome, sun, ambient light, fog, stars and the day/night transition. */
export class Environment {
  readonly sun: THREE.DirectionalLight;
  readonly hemi: THREE.HemisphereLight;
  private skyMat: THREE.ShaderMaterial;
  private stars: THREE.Points;
  private moon: THREE.Mesh;
  private sunDisc: THREE.Mesh;
  target = 0;

  constructor(private scene: THREE.Scene) {
    this.skyMat = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      fog: false,
      uniforms: { top: { value: DAY.top.clone() }, horizon: { value: DAY.horizon.clone() } },
      vertexShader: `varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
      fragmentShader: `uniform vec3 top; uniform vec3 horizon; varying vec3 vP;
        void main(){ float h = clamp(vP.y*1.6, 0.0, 1.0); gl_FragColor = vec4(mix(horizon, top, pow(h, 0.7)), 1.0); }`,
    });
    const sky = new THREE.Mesh(new THREE.SphereGeometry(900, 24, 12), this.skyMat);
    sky.raycast = () => {};
    sky.renderOrder = -10;
    scene.add(sky);

    scene.fog = new THREE.Fog(DAY.horizon.clone(), 320, 1250);

    this.hemi = new THREE.HemisphereLight(DAY.hemiSky, DAY.hemiGround, 1.3);
    scene.add(this.hemi);

    this.sun = new THREE.DirectionalLight(DAY.sun, 2.6);
    this.sun.position.set(-140, 220, 110);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(2048, 2048);
    const sc = this.sun.shadow.camera;
    sc.left = -190; sc.right = 190; sc.top = 190; sc.bottom = -190; sc.near = 50; sc.far = 600;
    this.sun.shadow.bias = -0.0006;
    this.sun.shadow.normalBias = 0.6;
    scene.add(this.sun, this.sun.target);

    // stars
    const starGeo = new THREE.BufferGeometry();
    const pos: number[] = [];
    for (let i = 0; i < 900; i++) {
      const u = Math.random(), v = Math.random() * 0.9 + 0.08;
      const th = u * Math.PI * 2, ph = Math.acos(1 - v);
      pos.push(800 * Math.sin(ph) * Math.cos(th), 800 * Math.cos(ph), 800 * Math.sin(ph) * Math.sin(th));
    }
    starGeo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    this.stars = new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xffffff, size: 2.2, sizeAttenuation: false, transparent: true, opacity: 0, fog: false, depthWrite: false }));
    this.stars.raycast = () => {};
    scene.add(this.stars);

    this.sunDisc = new THREE.Mesh(new THREE.CircleGeometry(30, 24), new THREE.MeshBasicMaterial({ color: '#fff6c8', fog: false, toneMapped: false, transparent: true }));
    this.sunDisc.position.set(-140, 220, 110).normalize().multiplyScalar(850);
    this.sunDisc.lookAt(0, 0, 0);
    this.sunDisc.raycast = () => {};
    scene.add(this.sunDisc);

    this.moon = new THREE.Mesh(new THREE.CircleGeometry(22, 24), new THREE.MeshBasicMaterial({ color: '#e8eeff', fog: false, toneMapped: false, transparent: true, opacity: 0 }));
    this.moon.position.set(160, 260, -200).normalize().multiplyScalar(850);
    this.moon.lookAt(0, 0, 0);
    this.moon.raycast = () => {};
    scene.add(this.moon);
  }

  toggle() {
    this.target = this.target > 0.5 ? 0 : 1;
  }

  update(dt: number) {
    const n0 = env.night;
    if (Math.abs(this.target - n0) > 1e-3) {
      env.night = n0 + Math.sign(this.target - n0) * Math.min(Math.abs(this.target - n0), dt * 0.45);
    }
    const n = smooth(env.night);
    this.skyMat.uniforms.top.value.copy(DAY.top).lerp(NIGHT.top, n);
    this.skyMat.uniforms.horizon.value.copy(DAY.horizon).lerp(NIGHT.horizon, n);
    (this.scene.fog as THREE.Fog).color.copy(DAY.horizon).lerp(NIGHT.horizon, n);
    this.hemi.color.copy(DAY.hemiSky).lerp(NIGHT.hemiSky, n);
    this.hemi.groundColor.copy(DAY.hemiGround).lerp(NIGHT.hemiGround, n);
    this.hemi.intensity = 1.3 - n * 0.75;
    this.sun.color.copy(DAY.sun).lerp(NIGHT.sun, n);
    this.sun.intensity = 2.6 - n * 2.2;
    (this.stars.material as THREE.PointsMaterial).opacity = n;
    (this.moon.material as THREE.MeshBasicMaterial).opacity = n;
    (this.sunDisc.material as THREE.MeshBasicMaterial).opacity = 1 - n;
    setNightFactor(n);
  }
}

function smooth(x: number) {
  return x * x * (3 - 2 * x);
}
