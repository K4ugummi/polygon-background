import Delaunator from 'delaunator';
import type { Point, GhostPoint } from './types';

/**
 * Threshold for ghost point creation as a fraction of canvas dimensions.
 * Points within this distance from an edge will have ghosts created on the opposite side.
 */
const GHOST_THRESHOLD = 0.15; // 15%

/**
 * Result of triangulation including ghost point information
 */
export interface TriangulationResult {
  /** Triangle indices (groups of 3) referencing the combined points array */
  triangles: Uint32Array;
  /** Combined array of real points followed by ghost points */
  allPoints: Array<Point | GhostPoint>;
  /** Number of real points (first N points in allPoints are real) */
  realPointCount: number;
}

/**
 * Generate ghost points for edge wrapping continuity
 * Ghost points inherit the z-height from their source point
 */
export function generateGhostPoints(
  points: Point[],
  width: number,
  height: number
): GhostPoint[] {
  const ghosts: GhostPoint[] = [];
  const thresholdX = width * GHOST_THRESHOLD;
  const thresholdY = height * GHOST_THRESHOLD;

  for (let i = 0; i < points.length; i++) {
    const p = points[i];
    const nearLeft = p.x < thresholdX;
    const nearRight = p.x > width - thresholdX;
    const nearTop = p.y < thresholdY;
    const nearBottom = p.y > height - thresholdY;

    // Create ghosts on opposite edges (inherit z from source)
    if (nearLeft) {
      ghosts.push({ x: p.x + width, y: p.y, z: p.z, sourceIndex: i });
    }
    if (nearRight) {
      ghosts.push({ x: p.x - width, y: p.y, z: p.z, sourceIndex: i });
    }
    if (nearTop) {
      ghosts.push({ x: p.x, y: p.y + height, z: p.z, sourceIndex: i });
    }
    if (nearBottom) {
      ghosts.push({ x: p.x, y: p.y - height, z: p.z, sourceIndex: i });
    }

    // Corner ghosts (diagonal)
    if (nearLeft && nearTop) {
      ghosts.push({ x: p.x + width, y: p.y + height, z: p.z, sourceIndex: i });
    }
    if (nearLeft && nearBottom) {
      ghosts.push({ x: p.x + width, y: p.y - height, z: p.z, sourceIndex: i });
    }
    if (nearRight && nearTop) {
      ghosts.push({ x: p.x - width, y: p.y + height, z: p.z, sourceIndex: i });
    }
    if (nearRight && nearBottom) {
      ghosts.push({ x: p.x - width, y: p.y - height, z: p.z, sourceIndex: i });
    }
  }

  return ghosts;
}

/**
 * Perform Delaunay triangulation on points with ghost point handling
 */
export function triangulate(
  points: Point[],
  width: number,
  height: number
): TriangulationResult {
  // Generate ghost points for edge continuity
  const ghosts = generateGhostPoints(points, width, height);

  // Combine real points and ghosts
  const allPoints: Array<Point | GhostPoint> = [...points, ...ghosts];

  // Create flat coordinate array for Delaunator
  const coords = new Float64Array(allPoints.length * 2);
  for (let i = 0; i < allPoints.length; i++) {
    coords[i * 2] = allPoints[i].x;
    coords[i * 2 + 1] = allPoints[i].y;
  }

  // Perform triangulation
  const delaunay = new Delaunator(coords);

  return {
    triangles: delaunay.triangles,
    allPoints,
    realPointCount: points.length,
  };
}

/**
 * Check if a point index refers to a real point (not a ghost)
 */
export function isRealPoint(index: number, realPointCount: number): boolean {
  return index < realPointCount;
}

/**
 * Get the source point index for a point (handles both real and ghost points)
 */
export function getSourceIndex(
  index: number,
  allPoints: Array<Point | GhostPoint>,
  realPointCount: number
): number {
  if (index < realPointCount) {
    return index;
  }
  return (allPoints[index] as GhostPoint).sourceIndex;
}
