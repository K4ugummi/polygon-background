/**
 * Theme definitions for PolygonBackground
 */

import { clamp01, lerp } from './utils';

export interface ThemeDefinition {
  /** Theme display name */
  name: string;

  /** Gradient start color (top/left) */
  gradientStart: string;

  /** Gradient end color (bottom/right) */
  gradientEnd: string;

  /** Background color */
  backgroundColor: string;

  /** Stroke/border color */
  strokeColor: string;

  /** Stroke width */
  strokeWidth: number;

  /** Light color for highlights */
  lightColor: string;

  /** Shadow color for darker areas */
  shadowColor: string;

  /** Default light position { x: 0-1, y: 0-1 } normalized */
  lightPosition: { x: number; y: number };

  /** Shadow intensity (0-1) */
  shadowIntensity: number;

  /** Highlight intensity (0-1) */
  highlightIntensity: number;

  /** Ambient light level (0-1) - minimum brightness */
  ambientLight: number;

  /** Point color */
  pointColor: string;

  /** Point size */
  pointSize: number;

  /** Fill opacity */
  fillOpacity: number;
}

/**
 * Built-in themes
 */
export const THEMES: Record<string, ThemeDefinition> = {
  midnight: {
    name: 'Midnight',
    gradientStart: '#1a1a4e',
    gradientEnd: '#2d1b4e',
    backgroundColor: '#0d0d1a',
    strokeColor: 'rgba(100, 100, 180, 0.3)',
    strokeWidth: 0.5,
    lightColor: '#6366f1',
    shadowColor: '#1e1b4b',
    lightPosition: { x: 0.3, y: 0.2 },
    shadowIntensity: 0.7,
    highlightIntensity: 0.5,
    ambientLight: 0.2,
    pointColor: 'rgba(99, 102, 241, 0.6)',
    pointSize: 1.5,
    fillOpacity: 0.85,
  },

  ocean: {
    name: 'Ocean',
    gradientStart: '#0891b2',
    gradientEnd: '#164e63',
    backgroundColor: '#0c1929',
    strokeColor: 'rgba(34, 211, 238, 0.2)',
    strokeWidth: 0.5,
    lightColor: '#22d3ee',
    shadowColor: '#0c4a6e',
    lightPosition: { x: 0.5, y: 0.1 },
    shadowIntensity: 0.6,
    highlightIntensity: 0.6,
    ambientLight: 0.25,
    pointColor: 'rgba(34, 211, 238, 0.5)',
    pointSize: 1.5,
    fillOpacity: 0.8,
  },

  sunset: {
    name: 'Sunset',
    gradientStart: '#f97316',
    gradientEnd: '#be185d',
    backgroundColor: '#1c0a16',
    strokeColor: 'rgba(251, 146, 60, 0.2)',
    strokeWidth: 0.5,
    lightColor: '#fbbf24',
    shadowColor: '#7f1d1d',
    lightPosition: { x: 0.7, y: 0.2 },
    shadowIntensity: 0.65,
    highlightIntensity: 0.55,
    ambientLight: 0.2,
    pointColor: 'rgba(251, 146, 60, 0.5)',
    pointSize: 1.5,
    fillOpacity: 0.85,
  },

  matrix: {
    name: 'Matrix',
    gradientStart: '#22c55e',
    gradientEnd: '#15803d',
    backgroundColor: '#020a02',
    strokeColor: 'rgba(34, 197, 94, 0.25)',
    strokeWidth: 0.5,
    lightColor: '#4ade80',
    shadowColor: '#052e16',
    lightPosition: { x: 0.5, y: 0.3 },
    shadowIntensity: 0.8,
    highlightIntensity: 0.7,
    ambientLight: 0.15,
    pointColor: 'rgba(74, 222, 128, 0.6)',
    pointSize: 1,
    fillOpacity: 0.9,
  },

  monochrome: {
    name: 'Monochrome',
    gradientStart: '#525252',
    gradientEnd: '#262626',
    backgroundColor: '#0a0a0a',
    strokeColor: 'rgba(163, 163, 163, 0.2)',
    strokeWidth: 0.5,
    lightColor: '#e5e5e5',
    shadowColor: '#171717',
    lightPosition: { x: 0.3, y: 0.2 },
    shadowIntensity: 0.6,
    highlightIntensity: 0.4,
    ambientLight: 0.2,
    pointColor: 'rgba(163, 163, 163, 0.4)',
    pointSize: 1.5,
    fillOpacity: 0.85,
  },
};

/**
 * Get theme by name, with fallback to midnight
 */
export function getTheme(name: string): ThemeDefinition {
  return THEMES[name.toLowerCase()] || THEMES.midnight;
}

/**
 * Get list of available theme names
 */
export function getThemeNames(): string[] {
  return Object.keys(THEMES);
}

/**
 * Create a custom theme by extending a base theme
 */
export function createTheme(
  base: string | ThemeDefinition,
  overrides: Partial<ThemeDefinition>
): ThemeDefinition {
  const baseTheme = typeof base === 'string' ? getTheme(base) : base;
  return { ...baseTheme, ...overrides };
}

/**
 * Interpolate between two themes for smooth transitions
 * @param from Starting theme
 * @param to Target theme
 * @param t Interpolation factor (0-1)
 */
export function interpolateThemes(
  from: ThemeDefinition,
  to: ThemeDefinition,
  t: number
): ThemeDefinition {
  return {
    name: t < 0.5 ? from.name : to.name,
    gradientStart: interpolateColor(from.gradientStart, to.gradientStart, t),
    gradientEnd: interpolateColor(from.gradientEnd, to.gradientEnd, t),
    backgroundColor: interpolateColor(from.backgroundColor, to.backgroundColor, t),
    strokeColor: interpolateColor(from.strokeColor, to.strokeColor, t),
    strokeWidth: lerp(from.strokeWidth, to.strokeWidth, t),
    lightColor: interpolateColor(from.lightColor, to.lightColor, t),
    shadowColor: interpolateColor(from.shadowColor, to.shadowColor, t),
    lightPosition: {
      x: lerp(from.lightPosition.x, to.lightPosition.x, t),
      y: lerp(from.lightPosition.y, to.lightPosition.y, t),
    },
    shadowIntensity: lerp(from.shadowIntensity, to.shadowIntensity, t),
    highlightIntensity: lerp(from.highlightIntensity, to.highlightIntensity, t),
    ambientLight: lerp(from.ambientLight, to.ambientLight, t),
    pointColor: interpolateColor(from.pointColor, to.pointColor, t),
    pointSize: lerp(from.pointSize, to.pointSize, t),
    fillOpacity: lerp(from.fillOpacity, to.fillOpacity, t),
  };
}

/**
 * Parse color string to RGB components
 */
function parseColor(color: string): { r: number; g: number; b: number; a: number } {
  // Handle rgba
  if (color.startsWith('rgba')) {
    const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
    if (match) {
      return {
        r: parseInt(match[1]),
        g: parseInt(match[2]),
        b: parseInt(match[3]),
        a: match[4] ? parseFloat(match[4]) : 1,
      };
    }
  }

  // Handle rgb
  if (color.startsWith('rgb')) {
    const match = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (match) {
      return {
        r: parseInt(match[1]),
        g: parseInt(match[2]),
        b: parseInt(match[3]),
        a: 1,
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
        a: 1,
      };
    }
    if (hex.length === 6) {
      return {
        r: parseInt(hex.substring(0, 2), 16),
        g: parseInt(hex.substring(2, 4), 16),
        b: parseInt(hex.substring(4, 6), 16),
        a: 1,
      };
    }
    if (hex.length === 8) {
      return {
        r: parseInt(hex.substring(0, 2), 16),
        g: parseInt(hex.substring(2, 4), 16),
        b: parseInt(hex.substring(4, 6), 16),
        a: parseInt(hex.substring(6, 8), 16) / 255,
      };
    }
  }

  // Fallback
  return { r: 128, g: 128, b: 128, a: 1 };
}

/**
 * Interpolate between two colors
 */
function interpolateColor(from: string, to: string, t: number): string {
  const c1 = parseColor(from);
  const c2 = parseColor(to);

  const r = Math.round(c1.r + (c2.r - c1.r) * t);
  const g = Math.round(c1.g + (c2.g - c1.g) * t);
  const b = Math.round(c1.b + (c2.b - c1.b) * t);
  const a = c1.a + (c2.a - c1.a) * t;

  if (a < 1) {
    return `rgba(${r}, ${g}, ${b}, ${a.toFixed(2)})`;
  }
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

/**
 * Blend a color with another color based on intensity
 * Used for lighting calculations
 */
export function blendColors(
  base: string,
  blend: string,
  intensity: number
): string {
  return interpolateColor(base, blend, clamp01(intensity));
}
