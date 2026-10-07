import * as THREE from 'three';

/**
 * Night windows for the Kenney buildings: pixels of the texture that are "window blue" get a warm
 * emissive glow at night. Whether a window is lit is decided by a hash of its world position cell,
 * so every building gets a different pattern without extra geometry.
 */
export const nightUniform = { value: 0 };

export function patchWindows(shader: { uniforms: Record<string, THREE.IUniform>; vertexShader: string; fragmentShader: string }) {
  shader.uniforms.uNight = nightUniform;
  shader.vertexShader = shader.vertexShader
    .replace('#include <common>', '#include <common>\nvarying vec3 vWinPos;')
    .replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\nvWinPos = (modelMatrix * vec4(transformed, 1.0)).xyz;');
  shader.fragmentShader = shader.fragmentShader
    .replace('#include <common>', `#include <common>
uniform float uNight; varying vec3 vWinPos;
float winHash(vec3 p){ return fract(sin(dot(floor(p), vec3(12.9898, 78.233, 37.719))) * 43758.5453); }`)
    // the mask is computed right after the texture lookup (before e.g. the roof hue shift)
    .replace('#include <map_fragment>', `#include <map_fragment>
float winMask = 0.0;
{ vec3 c = diffuseColor.rgb; if (c.b > 0.35 && c.b > c.r * 1.25 && c.b > c.g * 1.02) winMask = 1.0; }`)
    .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
if (uNight > 0.01 && winMask > 0.5) {
  float h = winHash(vWinPos * vec3(0.55, 0.45, 0.55));
  float lit = step(0.55, h);
  totalEmissiveRadiance += mix(vec3(1.0, 0.72, 0.38), vec3(0.75, 0.85, 1.0), step(0.9, h)) * lit * uNight * 0.55;
}`);
}

/** Install the window patch on a material (keeps any existing onBeforeCompile). */
export function withWindows(mat: THREE.Material, extra?: (shader: any) => void, key = 'win') {
  mat.onBeforeCompile = (sh) => {
    extra?.(sh);
    patchWindows(sh);
  };
  mat.customProgramCacheKey = () => key;
}
