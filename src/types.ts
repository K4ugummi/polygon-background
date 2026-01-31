/**
 * A point with position, velocity, and height
 */
export interface Point {
  x: number;
  y: number;
  /** Z-height for 3D effect (0-1 normalized) */
  z: number;
  vx: number;
  vy: number;
  /** Base height from noise (before mouse influence) */
  baseZ: number;
}

/**
 * A ghost point used for edge wrapping continuity
 */
export interface GhostPoint {
  x: number;
  y: number;
  z: number;
  /** Index of the source point this ghost was created from */
  sourceIndex: number;
}

/**
 * Light source configuration
 */
export interface LightConfig {
  /** Light position mode */
  mode: 'fixed' | 'mouse';
  /** Fixed position (normalized 0-1) - used when mode is 'fixed' */
  position: { x: number; y: number };
  /** Light color */
  color: string;
  /** Light intensity (0-1) */
  intensity: number;
}

/**
 * Mouse interaction configuration
 */
export interface MouseConfig {
  /** Enable mouse interaction */
  enabled: boolean;
  /** Mouse influence radius in pixels or percentage */
  radius: number;
  /** Whether radius is in pixels ('px') or percentage ('percent') */
  radiusUnit: 'px' | 'percent';
  /** Displacement strength in pixels (0-150) - how much points are pushed/pulled */
  strength: number;
  /** Interaction mode: push, pull, or swirl */
  mode: 'push' | 'pull' | 'swirl';
  /** How fast points spring back (0=never, 1=instant). Default: 0.08 */
  springBack: number;
  /** How much mouse velocity influences push (0-1). Default: 0.5 */
  velocityInfluence: number;
}

/**
 * Interaction configuration for clicks and holds
 */
export interface InteractionConfig {
  /** Enable click shockwave effect */
  clickShockwave: boolean;
  /** Enable hold-to-create gravity well */
  holdGravityWell: boolean;
  /** Whether gravity well attracts (true) or repels (false) */
  gravityWellAttract: boolean;
}

/**
 * Height/topography configuration
 * Height is static (generated once at startup for lighting variation)
 */
export interface HeightConfig {
  /** Noise scale - larger = bigger features */
  noiseScale: number;
  /** Height intensity (0-1) - how much height affects shading */
  intensity: number;
  /** Distance falloff from center (0 = none, 1 = strong) */
  centerFalloff: number;
}

/**
 * Theme transition configuration
 */
export interface TransitionConfig {
  /** Enable smooth transitions between themes */
  enabled: boolean;
  /** Transition duration in milliseconds */
  duration: number;
}

/**
 * Performance configuration
 */
export interface PerformanceConfig {
  /** Target frames per second (0 = unlimited). Default: 0 */
  targetFPS: number;
  /** Show FPS counter for debugging. Default: false */
  showFPS: boolean;
}

/**
 * Configuration options for PolygonBackground
 */
export interface PolygonBackgroundOptions {
  // Points
  /** Number of points to render. Default: 80 */
  pointCount?: number;
  /** Radius of point dots in pixels. Default from theme */
  pointSize?: number;
  /** Color of point dots. Default from theme */
  pointColor?: string;

  // Movement
  /** Velocity multiplier. Higher = faster. Default: 1 */
  speed?: number;

  // Triangles
  /** Opacity of triangle fills (0-1). Default from theme */
  fillOpacity?: number;
  /** Width of triangle borders in pixels. Default from theme */
  strokeWidth?: number;
  /** Color of triangle borders. Default from theme */
  strokeColor?: string;

  // Canvas
  /** Background color of the canvas. Default from theme */
  backgroundColor?: string;

  // Behavior
  /** Automatically resize canvas on window resize. Default: true */
  responsive?: boolean;
  /** Scale point count based on canvas size. Default: false */
  scalePointsWithSize?: boolean;
  /** Points per 10000 square pixels when scaling. Default: 0.005 */
  pointsPerPixel?: number;

  // Theme
  /** Theme name or custom theme definition */
  theme?: string;

  // Lighting
  /** Light configuration */
  light?: Partial<LightConfig>;

  // Mouse interaction
  /** Mouse interaction configuration */
  mouse?: Partial<MouseConfig>;

  // Interaction (clicks, holds)
  /** Interaction configuration */
  interaction?: Partial<InteractionConfig>;

  // Height/topography
  /** Height map configuration */
  height?: Partial<HeightConfig>;

  // Transitions
  /** Theme transition configuration */
  transition?: Partial<TransitionConfig>;

  // Performance
  /** Performance configuration */
  performance?: Partial<PerformanceConfig>;
}

/**
 * Internal resolved options with all defaults applied
 */
export interface ResolvedOptions {
  pointCount: number;
  pointSize: number;
  pointColor: string;
  speed: number;
  fillOpacity: number;
  strokeWidth: number;
  strokeColor: string;
  backgroundColor: string;
  responsive: boolean;
  scalePointsWithSize: boolean;
  pointsPerPixel: number;
  theme: string;
  light: LightConfig;
  mouse: MouseConfig;
  interaction: InteractionConfig;
  height: HeightConfig;
  transition: TransitionConfig;
  performance: PerformanceConfig;
}

/**
 * Default light configuration
 */
export const DEFAULT_LIGHT: LightConfig = {
  mode: 'fixed',
  position: { x: 0.3, y: 0.2 },
  color: '#ffffff',
  intensity: 1,
};

/**
 * Default mouse configuration
 */
export const DEFAULT_MOUSE: MouseConfig = {
  enabled: false,
  radius: 200,
  radiusUnit: 'px',
  strength: 80,
  mode: 'push',
  springBack: 0.08,
  velocityInfluence: 0.5,
};

/**
 * Default interaction configuration
 */
export const DEFAULT_INTERACTION: InteractionConfig = {
  clickShockwave: false,
  holdGravityWell: false,
  gravityWellAttract: false,
};

/**
 * Default height configuration (static noise for lighting variation)
 */
export const DEFAULT_HEIGHT: HeightConfig = {
  noiseScale: 0.003,
  intensity: 0.6,
  centerFalloff: 0.3,
};

/**
 * Default transition configuration
 */
export const DEFAULT_TRANSITION: TransitionConfig = {
  enabled: true,
  duration: 1000,
};

/**
 * Default performance configuration
 */
export const DEFAULT_PERFORMANCE: PerformanceConfig = {
  targetFPS: 0,
  showFPS: false,
};

/**
 * Validation constraints
 */
export const VALIDATION = {
  pointCount: { min: 3, max: 10000 },
  pointSize: { min: 0.1, max: 50 },
  speed: { min: 0, max: 10 },
  fillOpacity: { min: 0, max: 1 },
  strokeWidth: { min: 0, max: 10 },
  radius: { min: 1, max: 2000 },
  strength: { min: 0, max: 500 },
  springBack: { min: 0, max: 1 },
  velocityInfluence: { min: 0, max: 2 },
  noiseScale: { min: 0.0001, max: 1 },
  intensity: { min: 0, max: 2 },
  centerFalloff: { min: 0, max: 1 },
  duration: { min: 0, max: 10000 },
  targetFPS: { min: 0, max: 240 },
} as const;

/**
 * Clamp a value between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Validate and clamp options
 */
export function validateOptions(options: PolygonBackgroundOptions): PolygonBackgroundOptions {
  const validated = { ...options };

  if (validated.pointCount !== undefined) {
    validated.pointCount = clamp(validated.pointCount, VALIDATION.pointCount.min, VALIDATION.pointCount.max);
  }
  if (validated.pointSize !== undefined) {
    validated.pointSize = clamp(validated.pointSize, VALIDATION.pointSize.min, VALIDATION.pointSize.max);
  }
  if (validated.speed !== undefined) {
    validated.speed = clamp(validated.speed, VALIDATION.speed.min, VALIDATION.speed.max);
  }
  if (validated.fillOpacity !== undefined) {
    validated.fillOpacity = clamp(validated.fillOpacity, VALIDATION.fillOpacity.min, VALIDATION.fillOpacity.max);
  }
  if (validated.strokeWidth !== undefined) {
    validated.strokeWidth = clamp(validated.strokeWidth, VALIDATION.strokeWidth.min, VALIDATION.strokeWidth.max);
  }

  if (validated.mouse) {
    if (validated.mouse.radius !== undefined) {
      validated.mouse.radius = clamp(validated.mouse.radius, VALIDATION.radius.min, VALIDATION.radius.max);
    }
    if (validated.mouse.strength !== undefined) {
      validated.mouse.strength = clamp(validated.mouse.strength, VALIDATION.strength.min, VALIDATION.strength.max);
    }
    if (validated.mouse.springBack !== undefined) {
      validated.mouse.springBack = clamp(validated.mouse.springBack, VALIDATION.springBack.min, VALIDATION.springBack.max);
    }
    if (validated.mouse.velocityInfluence !== undefined) {
      validated.mouse.velocityInfluence = clamp(validated.mouse.velocityInfluence, VALIDATION.velocityInfluence.min, VALIDATION.velocityInfluence.max);
    }
  }

  if (validated.height) {
    if (validated.height.noiseScale !== undefined) {
      validated.height.noiseScale = clamp(validated.height.noiseScale, VALIDATION.noiseScale.min, VALIDATION.noiseScale.max);
    }
    if (validated.height.intensity !== undefined) {
      validated.height.intensity = clamp(validated.height.intensity, VALIDATION.intensity.min, VALIDATION.intensity.max);
    }
    if (validated.height.centerFalloff !== undefined) {
      validated.height.centerFalloff = clamp(validated.height.centerFalloff, VALIDATION.centerFalloff.min, VALIDATION.centerFalloff.max);
    }
  }

  if (validated.transition) {
    if (validated.transition.duration !== undefined) {
      validated.transition.duration = clamp(validated.transition.duration, VALIDATION.duration.min, VALIDATION.duration.max);
    }
  }

  if (validated.performance) {
    if (validated.performance.targetFPS !== undefined) {
      validated.performance.targetFPS = clamp(validated.performance.targetFPS, VALIDATION.targetFPS.min, VALIDATION.targetFPS.max);
    }
  }

  return validated;
}

/**
 * Default configuration values
 */
export const DEFAULT_OPTIONS: ResolvedOptions = {
  pointCount: 80,
  pointSize: 1.5,
  pointColor: '#ffffff',
  speed: 1,
  fillOpacity: 0.85,
  strokeWidth: 0.5,
  strokeColor: 'rgba(255, 255, 255, 0.2)',
  backgroundColor: '#0d0d1a',
  responsive: true,
  scalePointsWithSize: false,
  pointsPerPixel: 0.005,
  theme: 'midnight',
  light: { ...DEFAULT_LIGHT },
  mouse: { ...DEFAULT_MOUSE },
  interaction: { ...DEFAULT_INTERACTION },
  height: { ...DEFAULT_HEIGHT },
  transition: { ...DEFAULT_TRANSITION },
  performance: { ...DEFAULT_PERFORMANCE },
};
