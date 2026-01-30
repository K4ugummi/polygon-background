/**
 * Pre-calculated mathematical constants for performance optimization
 */

/** 2 * PI - full circle in radians */
export const TWO_PI = Math.PI * 2;

/** PI / 2 - quarter circle */
export const HALF_PI = Math.PI / 2;

/** Square root of 3 */
export const SQRT3 = Math.sqrt(3);

/** Simplex noise skewing factor for 2D: 0.5 * (sqrt(3) - 1) */
export const SIMPLEX_F2 = 0.5 * (SQRT3 - 1);

/** Simplex noise unskewing factor for 2D: (3 - sqrt(3)) / 6 */
export const SIMPLEX_G2 = (3 - SQRT3) / 6;

/** Simplex noise skewing factor for 3D: 1/3 */
export const SIMPLEX_F3 = 1 / 3;

/** Simplex noise unskewing factor for 3D: 1/6 */
export const SIMPLEX_G3 = 1 / 6;
