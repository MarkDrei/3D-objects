/**
 * City grid of "Polyhafen". All world units are meters, Y is up.
 *
 *   4 x 4 blocks, roads between them. The 2 x 2 blocks in the middle are merged into
 *   the central park (the road node in the very center does not exist).
 *
 *        north (-z): hills, wind turbines, rocket launch site
 *   west (-x): farm          east (+x): forest + camping
 *        south (+z): harbor and sea
 */
export const N = 4;
export const ROAD = 10; // full road width (two lanes)
export const BLOCK = 44; // block size incl. sidewalk
export const P = BLOCK + ROAD; // grid pitch = 54
export const SIDEWALK = 3;
export const LANE = 2.6; // lane center offset from road center
export const HALF = (N / 2) * P + ROAD / 2; // 113: outer edge of the outer roads

/** x/z of road i (0..N) */
export const roadPos = (i: number) => (i - N / 2) * P;
/** x/z center of block b (0..N-1) */
export const blockPos = (b: number) => (b - (N - 1) / 2) * P;

/** Is the grid node (i, j) part of the road network? */
export const nodeExists = (i: number, j: number) => !(i === 2 && j === 2);

/** Road segment between nodes exists? (h = horizontal, along x) */
export function edgeExists(i: number, j: number, i2: number, j2: number) {
  if (!nodeExists(i, j) || !nodeExists(i2, j2)) return false;
  if (i2 < 0 || j2 < 0 || i2 > N || j2 > N) return false;
  return true;
}

export const PARK_HALF = P - ROAD / 2; // 49: park spans [-49, 49]
export const SEA_Z = HALF + 34; // where the water starts in the south

/** Junctions with traffic lights: all inner nodes (the boundary T-junctions are yield-only). */
export const hasLights = (i: number, j: number) => i >= 1 && i <= N - 1 && j >= 1 && j <= N - 1 && nodeExists(i, j);
