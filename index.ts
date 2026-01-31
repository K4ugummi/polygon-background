/**
 * Polygon Background - Animated background component using Delaunay triangulation
 * with 3D-like lighting and topography
 */

export { PolygonBackground } from './src/PolygonBackground';

export type {
  PolygonBackgroundOptions,
  Point,
  ResolvedOptions,
  LightConfig,
  MouseConfig,
  InteractionConfig,
  HeightConfig,
  TransitionConfig,
  PerformanceConfig,
} from './src/types';

export {
  DEFAULT_OPTIONS,
  DEFAULT_LIGHT,
  DEFAULT_MOUSE,
  DEFAULT_INTERACTION,
  DEFAULT_HEIGHT,
  DEFAULT_TRANSITION,
  DEFAULT_PERFORMANCE,
} from './src/types';

export type { ThemeDefinition } from './src/themes';

export {
  THEMES,
  getTheme,
  getThemeNames,
  createTheme,
} from './src/themes';
