# Polygon Background - Project Knowledge Base

> **Important**: Don't make assumptions and always ask questions if anything is unclear.
> **Important**: Always update this MD file if anything changes during the user's decisions.

## Project Overview

An animated background component for modern web applications that renders moving points connected via Delaunay triangulation on HTML5 Canvas. Features 3D-like lighting, topography simulation using Simplex noise, and theme support with smooth transitions.

## Quick Commands

```bash
# Install dependencies
npm install

# Development (serves test page with hot reload)
npm run dev

# Build library for production
npm run build

# Type checking
npm run typecheck
```

## Project Structure

```
/polygonbackground
├── src/
│   ├── PolygonBackground.ts    # Main component class
│   ├── types.ts                # TypeScript interfaces
│   ├── constants.ts            # Pre-calculated math constants (TWO_PI, SIMPLEX_*)
│   ├── utils.ts                # Utility functions (clamp, lerp, smoothstep)
│   ├── delaunay.ts             # Delaunator integration & ghost points
│   ├── noise.ts                # Simplex noise implementation (from scratch)
│   ├── lighting.ts             # 3D lighting calculations
│   └── themes.ts               # Theme definitions and interpolation
├── test/
│   └── index.html              # Test page with UI controls (tabs + menu)
├── index.ts                    # Library entry point (re-exports)
├── Claude.md                   # This file - project knowledge base
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## Technical Decisions Made

| Decision | Choice | Rationale | Date |
|----------|--------|-----------|------|
| Rendering | HTML5 Canvas | Best performance for animated graphics | Initial |
| Triangulation | Delaunator library | Lightweight (~3kb), fast O(n log n), well-tested | Initial |
| Module format | ES Module | Modern, tree-shakable, works with bundlers | Initial |
| Build tool | Vite | Fast HMR, minimal config, excellent TS support | Initial |
| Language | TypeScript | Type safety, better IDE support | Initial |
| Edge handling | Ghost points | Maintains triangle continuity across wrap boundaries | Initial |
| Triangle borders | Visible, configurable | User preference, strokeWidth option | Initial |
| Background | Configurable color | Flexibility for different use cases | Initial |
| Canvas position | Behind page content | Acts as true background (z-index) | Initial |
| Point visibility | Small dots (configurable) | For debugging, pointSize option | Initial |
| Noise library | Custom Simplex implementation | Zero external dependencies for noise | v2 |
| Lighting model | Diffuse + Specular | 3D-like appearance with highlights | v2 |
| Theme system | Built-in presets + custom | Flexibility with convenience | v2 |
| Theme transitions | Configurable (instant/smooth) | User preference | v2 |
| Test page UI | Tabs + collapsible menu | Better organization of many controls | v2 |
| Height animation | Configurable modes | static/animate/mouse options | v2 |
| Light position | Fixed or mouse-following | User preference, configurable | v2 |
| Animation timing | Delta time based | Consistent speed regardless of frame rate | v2 |

## Configuration Options

### Main Options

```typescript
interface PolygonBackgroundOptions {
  // Points
  pointCount?: number;          // Default: 80
  pointSize?: number;           // Default from theme (~1.5)
  pointColor?: string;          // Default from theme

  // Movement
  speed?: number;               // Velocity multiplier, default: 1

  // Triangles
  fillOpacity?: number;         // 0-1, default from theme (~0.85)
  strokeWidth?: number;         // Default from theme (~0.5)
  strokeColor?: string;         // Default from theme

  // Canvas
  backgroundColor?: string;     // Default from theme

  // Behavior
  responsive?: boolean;         // Default: true
  scalePointsWithSize?: boolean; // Default: false
  pointsPerPixel?: number;      // Default: 0.005

  // Theme
  theme?: string;               // 'midnight', 'ocean', 'sunset', 'matrix', 'monochrome'

  // Sub-configurations
  light?: Partial<LightConfig>;
  mouse?: Partial<MouseConfig>;
  height?: Partial<HeightConfig>;
  transition?: Partial<TransitionConfig>;
}
```

### Light Configuration

```typescript
interface LightConfig {
  mode: 'fixed' | 'mouse';      // Default: 'fixed'
  position: { x: number; y: number }; // Normalized 0-1, default: { x: 0.3, y: 0.2 }
  color: string;                // Default from theme
  intensity: number;            // 0-1, default: 1
}
```

### Mouse Configuration

```typescript
interface MouseConfig {
  enabled: boolean;             // Default: false
  radius: number;               // Default: 150
  radiusUnit: 'px' | 'percent'; // Default: 'px'
  heightInfluence: number;      // -1 to 1, default: 0.5 (positive = rise, negative = push)
}
```

### Height Configuration

```typescript
interface HeightConfig {
  mode: 'static' | 'animate' | 'mouse'; // Default: 'animate'
  noiseScale: number;           // Default: 0.003 (larger = bigger features)
  intensity: number;            // 0-1, default: 0.6
  animationSpeed: number;       // Default: 0.00002 (very slow, subtle)
  centerFalloff: number;        // 0-1, default: 0.3 (higher in center)
}
```

### Transition Configuration

```typescript
interface TransitionConfig {
  enabled: boolean;             // Default: true
  duration: number;             // ms, default: 1000
}
```

### Performance Configuration

```typescript
interface PerformanceConfig {
  targetFPS: number;            // 0 = unlimited, default: 0
  showFPS: boolean;             // Show FPS counter overlay, default: false
}
```

## Built-in Themes

| Theme | Colors | Style |
|-------|--------|-------|
| midnight | Deep blues/purples | Professional, futuristic |
| ocean | Teals/blues | Calm, flowing |
| sunset | Oranges/pinks | Warm, vibrant |
| matrix | Greens/black | Tech, dramatic |
| monochrome | Grays | Minimal, clean |

### Theme Structure

```typescript
interface ThemeDefinition {
  name: string;
  gradientStart: string;        // Top/left color
  gradientEnd: string;          // Bottom/right color
  backgroundColor: string;
  strokeColor: string;
  strokeWidth: number;
  lightColor: string;           // Highlight color
  shadowColor: string;          // Shadow color
  lightPosition: { x: number; y: number };
  shadowIntensity: number;
  highlightIntensity: number;
  ambientLight: number;         // Minimum brightness
  pointColor: string;
  pointSize: number;
  fillOpacity: number;
}
```

## Public API

```typescript
class PolygonBackground {
  constructor(container: HTMLElement, options?: PolygonBackgroundOptions);

  // Animation control
  start(): void;
  stop(): void;
  pause(): void;
  resume(): void;
  destroy(): void;

  // State
  isPaused(): boolean;
  isRunning(): boolean;

  // Configuration
  setOption(key: string, value: any): void;
  getOption(key: string): any;
  setTheme(theme: string | ThemeDefinition): void;
  getTheme(): ThemeDefinition;
  setLightConfig(config: Partial<LightConfig>): void;
  setMouseConfig(config: Partial<MouseConfig>): void;
  setHeightConfig(config: Partial<HeightConfig>): void;
  setTransitionConfig(config: Partial<TransitionConfig>): void;
}
```

## Algorithm Details

### Simplex Noise (noise.ts)

Custom implementation based on Stefan Gustavson's work:
- `noise2D(x, y)` - 2D noise, returns [-1, 1]
- `noise3D(x, y, z)` - 3D noise for animated terrain
- `fbm2D/fbm3D` - Fractal Brownian Motion for natural terrain
- `seedNoise(seed)` - Seed the generator for reproducibility

### 3D Lighting (lighting.ts)

- **Diffuse**: Based on surface normal and light direction (Lambert's cosine law)
- **Specular**: Reflection-based highlights (Phong-like model)
- Triangle normals calculated from vertex positions including Z-height
- Colors interpolated from gradient based on Y position

### Height/Topography

Height (Z) values determine:
1. Triangle surface orientation (affects lighting)
2. Visual depth through shading
3. Mouse interaction effects

Calculated using:
- FBM noise (4 octaves) for natural terrain
- Optional center falloff (dome effect)
- Time dimension for animation
- Mouse proximity influence

### Ghost Points for Edge Wrapping

- Threshold: 15% of canvas dimensions
- Points near edges get ghost copies on opposite side
- Ghost points inherit Z-height from source
- Corner points can have up to 3 ghosts
- Included in Delaunay but use source point's properties

## Test Page Features

### Tabs
- **Theme**: Theme selection, transition settings, pause/reset
- **Points**: Count, size, speed, triangle fill/stroke
- **Light**: Mode (fixed/mouse), position, intensity settings
- **Height**: Mode, noise scale, animation speed, mouse interaction

### Controls
- Collapsible menu panel (hamburger icon)
- Range sliders with live value display
- Toggle switches for boolean options
- Theme preview grid with gradient swatches
- Smooth theme transitions

## Dependencies

- `delaunator`: ^5.0.1 - Fast Delaunay triangulation
- `@types/delaunator`: ^5.0.3 - Type definitions
- `vite`: ^5.4.11 - Build tool (dev)
- `typescript`: ^5.3.3 - Language (dev)
- `vite-plugin-dts`: ^4.3.0 - Declaration file generation (dev)

## Future Improvements (Noted for Later)

- [ ] Additional themes
- [ ] Performance optimizations for very high point counts
- [ ] WebGL renderer option for better performance
- [ ] Export/import configuration presets
- [ ] React/Vue wrapper components
- [ ] Touch support for mobile

## Known Issues / TODOs

- Ambient light, shadow intensity, highlight intensity controls in test page don't update the theme in real-time (would need custom theme support)

## Changelog

### v2 - 3D Lighting Update
- Added Simplex noise implementation from scratch
- Added 3D-like lighting with diffuse and specular components
- Added topography/height simulation
- Added theme system with 5 built-in themes
- Added smooth theme transitions
- Added mouse interaction (height influence, light following)
- Redesigned test page with tabs and collapsible menu
- Points now have Z-height affecting triangle shading
- Added FPS display and frame rate limiting
- Added delta time-based movement for consistent animation speed regardless of FPS

### v1 - Initial Implementation
- Basic Delaunay triangulation with ghost points
- Random colors (caused flickering)
- Simple test page with sliders
