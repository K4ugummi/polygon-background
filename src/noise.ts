/**
 * Simplex Noise implementation
 * Based on Stefan Gustavson's implementation
 * Generates smooth, natural-looking pseudo-random noise
 */

import {
  SIMPLEX_F2,
  SIMPLEX_G2,
  SIMPLEX_F3,
  SIMPLEX_G3,
} from './constants';

// Permutation table
const perm: number[] = new Array(512);
const gradP: { x: number; y: number; z: number }[] = new Array(512);

// Gradient vectors for 3D
const grad3 = [
  { x: 1, y: 1, z: 0 }, { x: -1, y: 1, z: 0 }, { x: 1, y: -1, z: 0 }, { x: -1, y: -1, z: 0 },
  { x: 1, y: 0, z: 1 }, { x: -1, y: 0, z: 1 }, { x: 1, y: 0, z: -1 }, { x: -1, y: 0, z: -1 },
  { x: 0, y: 1, z: 1 }, { x: 0, y: -1, z: 1 }, { x: 0, y: 1, z: -1 }, { x: 0, y: -1, z: -1 },
];

// Use pre-calculated constants
const F2 = SIMPLEX_F2;
const G2 = SIMPLEX_G2;
const F3 = SIMPLEX_F3;
const G3 = SIMPLEX_G3;

/**
 * Seed the noise generator
 */
export function seedNoise(seed: number): void {
  const p: number[] = new Array(256);

  // Initialize with values 0-255
  for (let i = 0; i < 256; i++) {
    p[i] = i;
  }

  // Shuffle using seed
  let n: number;
  let q: number;
  for (let i = 255; i > 0; i--) {
    seed = (seed * 16807) % 2147483647;
    n = seed % (i + 1);
    q = p[i];
    p[i] = p[n];
    p[n] = q;
  }

  // Extend to 512 for overflow handling
  for (let i = 0; i < 512; i++) {
    perm[i] = p[i & 255];
    gradP[i] = grad3[perm[i] % 12];
  }
}

// Initialize with default seed
seedNoise(Date.now());

/**
 * 2D Simplex Noise
 * Returns value in range [-1, 1]
 */
export function noise2D(x: number, y: number): number {
  // Skew input space
  const s = (x + y) * F2;
  const i = Math.floor(x + s);
  const j = Math.floor(y + s);

  // Unskew back to simplex cell origin
  const t = (i + j) * G2;
  const X0 = i - t;
  const Y0 = j - t;

  // Distances from cell origin
  const x0 = x - X0;
  const y0 = y - Y0;

  // Determine which simplex we're in
  let i1: number, j1: number;
  if (x0 > y0) {
    i1 = 1;
    j1 = 0;
  } else {
    i1 = 0;
    j1 = 1;
  }

  // Offsets for corners
  const x1 = x0 - i1 + G2;
  const y1 = y0 - j1 + G2;
  const x2 = x0 - 1 + 2 * G2;
  const y2 = y0 - 1 + 2 * G2;

  // Hash coordinates
  const ii = i & 255;
  const jj = j & 255;

  // Calculate contributions from corners
  let n0 = 0, n1 = 0, n2 = 0;

  let t0 = 0.5 - x0 * x0 - y0 * y0;
  if (t0 >= 0) {
    const gi0 = gradP[ii + perm[jj]];
    t0 *= t0;
    n0 = t0 * t0 * (gi0.x * x0 + gi0.y * y0);
  }

  let t1 = 0.5 - x1 * x1 - y1 * y1;
  if (t1 >= 0) {
    const gi1 = gradP[ii + i1 + perm[jj + j1]];
    t1 *= t1;
    n1 = t1 * t1 * (gi1.x * x1 + gi1.y * y1);
  }

  let t2 = 0.5 - x2 * x2 - y2 * y2;
  if (t2 >= 0) {
    const gi2 = gradP[ii + 1 + perm[jj + 1]];
    t2 *= t2;
    n2 = t2 * t2 * (gi2.x * x2 + gi2.y * y2);
  }

  // Scale to [-1, 1]
  return 70 * (n0 + n1 + n2);
}

/**
 * 3D Simplex Noise (used for animated noise with time dimension)
 * Returns value in range [-1, 1]
 */
export function noise3D(x: number, y: number, z: number): number {
  // Skew input space
  const s = (x + y + z) * F3;
  const i = Math.floor(x + s);
  const j = Math.floor(y + s);
  const k = Math.floor(z + s);

  // Unskew back
  const t = (i + j + k) * G3;
  const X0 = i - t;
  const Y0 = j - t;
  const Z0 = k - t;

  // Distances from cell origin
  const x0 = x - X0;
  const y0 = y - Y0;
  const z0 = z - Z0;

  // Determine simplex
  let i1: number, j1: number, k1: number;
  let i2: number, j2: number, k2: number;

  if (x0 >= y0) {
    if (y0 >= z0) {
      i1 = 1; j1 = 0; k1 = 0; i2 = 1; j2 = 1; k2 = 0;
    } else if (x0 >= z0) {
      i1 = 1; j1 = 0; k1 = 0; i2 = 1; j2 = 0; k2 = 1;
    } else {
      i1 = 0; j1 = 0; k1 = 1; i2 = 1; j2 = 0; k2 = 1;
    }
  } else {
    if (y0 < z0) {
      i1 = 0; j1 = 0; k1 = 1; i2 = 0; j2 = 1; k2 = 1;
    } else if (x0 < z0) {
      i1 = 0; j1 = 1; k1 = 0; i2 = 0; j2 = 1; k2 = 1;
    } else {
      i1 = 0; j1 = 1; k1 = 0; i2 = 1; j2 = 1; k2 = 0;
    }
  }

  // Offsets
  const x1 = x0 - i1 + G3;
  const y1 = y0 - j1 + G3;
  const z1 = z0 - k1 + G3;
  const x2 = x0 - i2 + 2 * G3;
  const y2 = y0 - j2 + 2 * G3;
  const z2 = z0 - k2 + 2 * G3;
  const x3 = x0 - 1 + 3 * G3;
  const y3 = y0 - 1 + 3 * G3;
  const z3 = z0 - 1 + 3 * G3;

  // Hash coordinates
  const ii = i & 255;
  const jj = j & 255;
  const kk = k & 255;

  // Calculate contributions
  let n0 = 0, n1 = 0, n2 = 0, n3 = 0;

  let t0 = 0.6 - x0 * x0 - y0 * y0 - z0 * z0;
  if (t0 >= 0) {
    const gi0 = gradP[ii + perm[jj + perm[kk]]];
    t0 *= t0;
    n0 = t0 * t0 * (gi0.x * x0 + gi0.y * y0 + gi0.z * z0);
  }

  let t1 = 0.6 - x1 * x1 - y1 * y1 - z1 * z1;
  if (t1 >= 0) {
    const gi1 = gradP[ii + i1 + perm[jj + j1 + perm[kk + k1]]];
    t1 *= t1;
    n1 = t1 * t1 * (gi1.x * x1 + gi1.y * y1 + gi1.z * z1);
  }

  let t2 = 0.6 - x2 * x2 - y2 * y2 - z2 * z2;
  if (t2 >= 0) {
    const gi2 = gradP[ii + i2 + perm[jj + j2 + perm[kk + k2]]];
    t2 *= t2;
    n2 = t2 * t2 * (gi2.x * x2 + gi2.y * y2 + gi2.z * z2);
  }

  let t3 = 0.6 - x3 * x3 - y3 * y3 - z3 * z3;
  if (t3 >= 0) {
    const gi3 = gradP[ii + 1 + perm[jj + 1 + perm[kk + 1]]];
    t3 *= t3;
    n3 = t3 * t3 * (gi3.x * x3 + gi3.y * y3 + gi3.z * z3);
  }

  // Scale to [-1, 1]
  return 32 * (n0 + n1 + n2 + n3);
}

/**
 * Fractal Brownian Motion - layered noise for more natural terrain
 * @param x X coordinate
 * @param y Y coordinate
 * @param octaves Number of noise layers (more = more detail)
 * @param persistence How much each octave contributes (0.5 typical)
 * @param lacunarity Frequency multiplier per octave (2.0 typical)
 */
export function fbm2D(
  x: number,
  y: number,
  octaves: number = 4,
  persistence: number = 0.5,
  lacunarity: number = 2.0
): number {
  let total = 0;
  let frequency = 1;
  let amplitude = 1;
  let maxValue = 0;

  for (let i = 0; i < octaves; i++) {
    total += noise2D(x * frequency, y * frequency) * amplitude;
    maxValue += amplitude;
    amplitude *= persistence;
    frequency *= lacunarity;
  }

  return total / maxValue;
}

/**
 * Fractal Brownian Motion in 3D (for animated terrain)
 */
export function fbm3D(
  x: number,
  y: number,
  z: number,
  octaves: number = 4,
  persistence: number = 0.5,
  lacunarity: number = 2.0
): number {
  let total = 0;
  let frequency = 1;
  let amplitude = 1;
  let maxValue = 0;

  for (let i = 0; i < octaves; i++) {
    total += noise3D(x * frequency, y * frequency, z * frequency) * amplitude;
    maxValue += amplitude;
    amplitude *= persistence;
    frequency *= lacunarity;
  }

  return total / maxValue;
}
