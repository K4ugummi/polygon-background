/**
 * Utility functions for performance optimization
 */

/**
 * Clamp a value between min and max
 * Inlined version is faster than Math.min(Math.max())
 */
export function clamp(value: number, min: number, max: number): number {
  return value < min ? min : value > max ? max : value;
}

/**
 * Clamp to 0-1 range (common case)
 */
export function clamp01(value: number): number {
  return value < 0 ? 0 : value > 1 ? 1 : value;
}

/**
 * Clamp to 0-255 range for color values
 */
export function clamp255(value: number): number {
  return value < 0 ? 0 : value > 255 ? 255 : value;
}

/**
 * Linear interpolation
 */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * Smooth step interpolation (cubic hermite)
 */
export function smoothstep(t: number): number {
  return t * t * (3 - 2 * t);
}
