/**
 * Lighting calculations for 3D-like shading
 */

import type { Point, GhostPoint } from './types';
import { clamp01, clamp255 } from './utils';

/**
 * Calculate the normal vector of a triangle from its vertices
 * Returns normalized vector pointing "out" of the surface
 */
export function calculateTriangleNormal(
  p0: Point | GhostPoint,
  p1: Point | GhostPoint,
  p2: Point | GhostPoint,
  zScale: number = 100
): { x: number; y: number; z: number } {
  // Create vectors from p0 to p1 and p0 to p2
  // Using z-height to create 3D effect
  const v1 = {
    x: p1.x - p0.x,
    y: p1.y - p0.y,
    z: (p1.z - p0.z) * zScale,
  };

  const v2 = {
    x: p2.x - p0.x,
    y: p2.y - p0.y,
    z: (p2.z - p0.z) * zScale,
  };

  // Cross product to get normal
  const normal = {
    x: v1.y * v2.z - v1.z * v2.y,
    y: v1.z * v2.x - v1.x * v2.z,
    z: v1.x * v2.y - v1.y * v2.x,
  };

  // Normalize
  const length = Math.sqrt(normal.x ** 2 + normal.y ** 2 + normal.z ** 2);
  if (length === 0) {
    return { x: 0, y: 0, z: 1 }; // Default to facing camera
  }

  return {
    x: normal.x / length,
    y: normal.y / length,
    z: normal.z / length,
  };
}

/**
 * Calculate diffuse lighting intensity
 * @param normal Surface normal vector
 * @param lightDir Direction to light (normalized)
 * @returns Intensity value 0-1
 */
export function calculateDiffuse(
  normal: { x: number; y: number; z: number },
  lightDir: { x: number; y: number; z: number }
): number {
  // Dot product of normal and light direction
  const dot = normal.x * lightDir.x + normal.y * lightDir.y + normal.z * lightDir.z;
  // Clamp to 0-1 (negative means facing away from light)
  return Math.max(0, dot);
}

/**
 * Calculate specular highlight intensity
 * @param normal Surface normal vector
 * @param lightDir Direction to light (normalized)
 * @param viewDir Direction to camera/viewer (normalized)
 * @param shininess Specular exponent (higher = tighter highlight)
 * @returns Intensity value 0-1
 */
export function calculateSpecular(
  normal: { x: number; y: number; z: number },
  lightDir: { x: number; y: number; z: number },
  viewDir: { x: number; y: number; z: number },
  shininess: number = 32
): number {
  // Calculate reflection vector: R = 2(N·L)N - L
  const dot = normal.x * lightDir.x + normal.y * lightDir.y + normal.z * lightDir.z;

  const reflect = {
    x: 2 * dot * normal.x - lightDir.x,
    y: 2 * dot * normal.y - lightDir.y,
    z: 2 * dot * normal.z - lightDir.z,
  };

  // Specular intensity based on reflection and view direction
  const specDot = reflect.x * viewDir.x + reflect.y * viewDir.y + reflect.z * viewDir.z;
  return Math.pow(Math.max(0, specDot), shininess);
}

/**
 * Calculate full lighting for a triangle
 */
export interface LightingResult {
  /** Combined lighting intensity (0-1) */
  intensity: number;
  /** Diffuse component (0-1) */
  diffuse: number;
  /** Specular component (0-1) */
  specular: number;
  /** Average height of triangle (0-1) */
  height: number;
}

export function calculateTriangleLighting(
  p0: Point | GhostPoint,
  p1: Point | GhostPoint,
  p2: Point | GhostPoint,
  lightX: number,
  lightY: number,
  ambientLight: number = 0.2,
  shadowIntensity: number = 0.6,
  highlightIntensity: number = 0.5
): LightingResult {
  // Calculate triangle centroid
  const centroidX = (p0.x + p1.x + p2.x) / 3;
  const centroidY = (p0.y + p1.y + p2.y) / 3;
  const centroidZ = (p0.z + p1.z + p2.z) / 3;

  // Calculate surface normal - triangles are mostly flat with slight Z variation
  const normal = calculateTriangleNormal(p0, p1, p2, 50);

  // Ensure normal points toward camera (positive z)
  if (normal.z < 0) {
    normal.x = -normal.x;
    normal.y = -normal.y;
    normal.z = -normal.z;
  }

  // Calculate direction from centroid to light
  // Light is positioned at lightX, lightY, elevated above the surface
  const dx = lightX - centroidX;
  const dy = lightY - centroidY;

  // Light height creates the "above surface" effect
  // Using a fixed elevation that creates good angular variation
  const lightElevation = 300; // pixels above the surface plane
  const dz = lightElevation;

  const lightDist = Math.sqrt(dx * dx + dy * dy + dz * dz);
  const lightDir = {
    x: dx / lightDist,
    y: dy / lightDist,
    z: dz / lightDist,
  };

  // View direction (looking down at surface)
  const viewDir = { x: 0, y: 0, z: 1 };

  // Calculate base diffuse lighting
  // This gives triangles facing the light more brightness
  const diffuse = calculateDiffuse(normal, lightDir);

  // Specular highlights for shiny effect
  const specular = calculateSpecular(normal, lightDir, viewDir, 24);

  // Soft distance falloff - closer to light = brighter
  // But keep it subtle so the whole scene is still visible
  const xyDist = Math.sqrt(dx * dx + dy * dy);
  const falloffStart = 200;
  const falloffEnd = 1200;
  const distanceFactor = xyDist < falloffStart
    ? 1.0
    : Math.max(0.3, 1.0 - (xyDist - falloffStart) / (falloffEnd - falloffStart) * 0.7);

  // Height-based shading: higher triangles catch more light
  const heightBonus = centroidZ * 0.3;

  // Combine all lighting factors
  const diffuseContribution = (diffuse * 0.6 + 0.4) * shadowIntensity * distanceFactor;
  const specularContribution = specular * highlightIntensity * distanceFactor;

  const intensity = clamp01(ambientLight + diffuseContribution + specularContribution + heightBonus);

  return {
    intensity,
    diffuse,
    specular,
    height: centroidZ,
  };
}

/**
 * Apply lighting to a base color
 */
export function applyLighting(
  baseColor: { r: number; g: number; b: number },
  lightColor: { r: number; g: number; b: number },
  shadowColor: { r: number; g: number; b: number },
  lighting: LightingResult,
  opacity: number
): string {
  // Blend between shadow and base based on intensity
  let r = shadowColor.r + (baseColor.r - shadowColor.r) * lighting.intensity;
  let g = shadowColor.g + (baseColor.g - shadowColor.g) * lighting.intensity;
  let b = shadowColor.b + (baseColor.b - shadowColor.b) * lighting.intensity;

  // Add specular highlight
  if (lighting.specular > 0.05) {
    const specAmount = lighting.specular * 0.6;
    r = r + (lightColor.r - r) * specAmount;
    g = g + (lightColor.g - g) * specAmount;
    b = b + (lightColor.b - b) * specAmount;
  }

  // Clamp values
  r = clamp255(Math.round(r));
  g = clamp255(Math.round(g));
  b = clamp255(Math.round(b));

  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

/**
 * Parse a color string to RGB components
 */
export function parseColorToRGB(color: string): { r: number; g: number; b: number } {
  // Handle rgba
  if (color.startsWith('rgba') || color.startsWith('rgb')) {
    const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (match) {
      return {
        r: parseInt(match[1]),
        g: parseInt(match[2]),
        b: parseInt(match[3]),
      };
    }
  }

  // Handle hex
  if (color.startsWith('#')) {
    const hex = color.slice(1);
    if (hex.length === 3) {
      return {
        r: parseInt(hex[0] + hex[0], 16),
        g: parseInt(hex[1] + hex[1], 16),
        b: parseInt(hex[2] + hex[2], 16),
      };
    }
    if (hex.length >= 6) {
      return {
        r: parseInt(hex.substring(0, 2), 16),
        g: parseInt(hex.substring(2, 4), 16),
        b: parseInt(hex.substring(4, 6), 16),
      };
    }
  }

  // Fallback
  return { r: 128, g: 128, b: 128 };
}

/**
 * Interpolate between two colors based on position
 */
export function interpolateGradient(
  startColor: { r: number; g: number; b: number },
  endColor: { r: number; g: number; b: number },
  t: number
): { r: number; g: number; b: number } {
  return {
    r: startColor.r + (endColor.r - startColor.r) * t,
    g: startColor.g + (endColor.g - startColor.g) * t,
    b: startColor.b + (endColor.b - startColor.b) * t,
  };
}
