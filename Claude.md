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

# Build WASM only (from wasm/ directory)
cd wasm && wasm-pack build --target web --out-dir ../src/wasm-pkg

# Test page (after build)
npx vite --port 5173
# Open http://localhost:5173/test/
```

## Project Structure

```
/polygonbackground
├── src/
│   ├── PolygonBackground.ts    # Main component class (TypeScript orchestration)
│   ├── types.ts                # TypeScript interfaces
│   ├── constants.ts            # Pre-calculated math constants (TWO_PI, SIMPLEX_*)
│   ├── utils.ts                # Utility functions (clamp, lerp, smoothstep)
│   ├── delaunay.ts             # Delaunator integration & ghost points (JS fallback)
│   ├── noise.ts                # Simplex noise implementation (JS fallback)
│   ├── lighting.ts             # 3D lighting calculations
│   ├── themes.ts               # Theme definitions and interpolation
│   └── wasm-pkg/               # Built WASM package (generated, gitignored)
│       ├── polygon_background_wasm.js
│       ├── polygon_background_wasm_bg.wasm
│       └── polygon_background_wasm.d.ts
├── wasm/                       # Rust WASM source
│   ├── Cargo.toml              # Rust dependencies (delaunator, wasm-bindgen)
│   └── src/
│       ├── lib.rs              # WASM module entry point
│       ├── simulation.rs       # Core simulation (points, physics, spatial grid)
│       └── noise.rs            # Simplex/FBM noise in Rust
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
| Core simulation | Rust/WASM | ~5-10x faster physics, triangulation, noise | v3 |
| Spatial partitioning | Uniform grid (AABB) | O(k) instead of O(n) for interactions | v3 |
| WASM build | wasm-pack + vite integration | Seamless bundling, inline WASM | v3 |

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

## WASM Architecture (v3)

### Overview

The simulation core is implemented in Rust and compiled to WebAssembly for performance. The TypeScript layer handles rendering, user input, and theme management.

### Key Files

- **`wasm/src/simulation.rs`**: Core simulation with ~900 lines
  - `Simulation` struct: Main state container
  - `Point` struct: Position, velocity, displacement, height
  - `SpatialGrid` struct: Uniform grid for spatial partitioning
  - `Shockwave` / `GravityWell`: Effect structs
  - Physics: spring-back, damping, velocity influence

- **`wasm/src/noise.rs`**: Simplex noise + FBM
  - `noise3d()`: 3D Simplex noise
  - `fbm3d()`: Fractal Brownian Motion (4 octaves default)

### Simulation Struct Fields

```rust
pub struct Simulation {
    points: Vec<Point>,           // All simulation points
    width: f32, height: f32,      // Canvas dimensions
    rng: Rng,                     // xorshift32 RNG

    // Output buffers (reused each frame)
    triangle_vertices: Vec<f32>,  // [x,y,z,cy,cx,cy] per vertex
    stroke_vertices: Vec<f32>,    // [x1,y1,x2,y2] per edge
    point_vertices: Vec<f32>,     // [x,y] per point

    // Mouse state
    mouse_x, mouse_y: f32,
    mouse_vx, mouse_vy: f32,      // Smoothed velocity
    mouse_in_canvas: bool,
    mouse_radius, mouse_strength: f32,
    mouse_mode: MouseMode,        // Push/Pull/Swirl

    // Physics
    spring_back: f32,             // Default 0.06
    damping: f32,                 // Default 0.92
    velocity_influence: f32,      // Default 0.3

    // Effects
    shockwaves: Vec<Shockwave>,   // Max 10 concurrent
    gravity_well: Option<GravityWell>,

    // Spatial partitioning
    spatial_grid: SpatialGrid,    // Rebuilt every frame
}
```

### Spatial Partitioning (SpatialGrid)

Uniform grid for O(k) spatial queries instead of O(n):

```rust
struct SpatialGrid {
    cells: Vec<Vec<usize>>,  // cell -> point indices
    cell_size: f32,          // Dynamic, based on max interaction radius
    cols: usize, rows: usize,
    width: f32, height: f32,
}
```

**Key methods**:
- `new(width, height, cell_size)`: Create grid
- `clear()`: Clear all cells (keeps capacity)
- `resize()`: Resize grid when dimensions change
- `insert(point_idx, x, y)`: Add point to grid
- `query_radius(cx, cy, radius)`: Iterator over nearby point indices

**Cell size calculation** (in `update_points`):
```rust
let max_radius = mouse_radius
    .max(max_shockwave_radius)
    .max(GRAVITY_WELL_MAX_RANGE);  // 1000.0
let cell_size = (max_radius / 2.0).max(50.0);
```

**Complexity improvement**:
| Operation | Before | After |
|-----------|--------|-------|
| Mouse influence | O(n) | O(k) |
| Gravity well | O(n) | O(k) |
| Shockwave | O(n) | O(k) |
| Grid rebuild | N/A | O(n) |
| **Total** | O(3n) | O(n + 3k) |

### WASM Public API

```rust
// Main combined tick (reduces JS-WASM crossings)
pub fn tick(&mut self, delta_time, speed, mouse_x, mouse_y,
            mouse_in_canvas, mouse_radius, mouse_strength, mouse_mode) -> usize;

// State management
pub fn new(width, height, point_count, seed) -> Self;
pub fn resize(&mut self, new_width, new_height);
pub fn set_point_count(&mut self, count, seed);
pub fn set_noise_params(&mut self, noise_scale, height_intensity);
pub fn set_physics_params(&mut self, spring_back, damping, velocity_influence);

// Effects
pub fn trigger_shockwave(&mut self, x, y, strength);
pub fn set_gravity_well(&mut self, x, y, active, attract);
pub fn update_gravity_well_position(&mut self, x, y);

// Data access (returns Float32Array views)
pub fn get_triangle_vertices(&self) -> Float32Array;
pub fn get_stroke_vertices(&self) -> Float32Array;
pub fn get_point_vertices(&self) -> Float32Array;
```

### Physics Constants

```rust
const GHOST_THRESHOLD: f32 = 0.15;        // 15% of canvas for ghost points
const MAX_SHOCKWAVES: usize = 10;
const DEFAULT_SPRING_BACK: f32 = 0.06;
const DEFAULT_DAMPING: f32 = 0.92;
const DEFAULT_VELOCITY_INFLUENCE: f32 = 0.3;
const SHOCKWAVE_DECAY: f32 = 0.96;
const SHOCKWAVE_WAVE_WIDTH: f32 = 60.0;
const SHOCKWAVE_SPEED: f32 = 12.0;
const GRAVITY_WELL_MIN_DIST: f32 = 20.0;
const GRAVITY_WELL_ATTRACT_STRENGTH: f32 = 3.0;
const GRAVITY_WELL_REPEL_STRENGTH: f32 = -5.0;
const GRAVITY_WELL_MAX_RANGE: f32 = 1000.0;
const MIN_DIST_SQ: f32 = 1.0;
```

### Mouse Interaction Modes

- **Push (0)**: Points pushed away from cursor
- **Pull (1)**: Points pulled toward cursor (0.5x strength)
- **Swirl (2)**: Tangential orbit (0.7x) + slight outward push (0.2x)

All modes use smoothstep falloff: `t² × (3 - 2t)` where `t = 1 - dist/radius`

### Build Process

1. Build WASM: `cd wasm && wasm-pack build --target web --out-dir ../src/wasm-pkg`
2. Vite bundles the WASM and inlines it as base64
3. Post-build script converts base64 to Uint8Array for smaller bundles

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

### JavaScript/TypeScript
- `delaunator`: ^5.0.1 - Fast Delaunay triangulation (JS fallback)
- `@types/delaunator`: ^5.0.3 - Type definitions
- `vite`: ^5.4.11 - Build tool (dev)
- `typescript`: ^5.3.3 - Language (dev)
- `vite-plugin-dts`: ^4.3.0 - Declaration file generation (dev)

### Rust/WASM (wasm/Cargo.toml)
- `wasm-bindgen`: 0.2 - JS bindings for Rust
- `js-sys`: 0.3 - JS types in Rust
- `delaunator`: 1.0.2 - Delaunay triangulation in Rust

### Build Requirements
- `wasm-pack`: Install via `cargo install wasm-pack`
- `rustc`: Stable Rust toolchain with wasm32-unknown-unknown target

## Future Improvements (Noted for Later)

- [ ] Additional themes
- [x] Performance optimizations for very high point counts (WASM + spatial partitioning)
- [ ] WebGL renderer option for even better performance
- [ ] Export/import configuration presets
- [ ] React/Vue wrapper components
- [ ] Touch support for mobile
- [ ] WebWorker for WASM to avoid main thread blocking

## Known Issues / TODOs

- Ambient light, shadow intensity, highlight intensity controls in test page don't update the theme in real-time (would need custom theme support)

## Changelog

### v3 - WASM Performance Update
- Migrated core simulation to Rust/WASM for ~5-10x performance improvement
- Implemented spatial partitioning (uniform grid) for O(k) interactions
- Added shockwave effects (click to trigger, up to 10 concurrent)
- Added gravity well effects (hold click for attract, shift+hold for repel)
- Added mouse push/pull/swirl interaction modes
- Physics now runs entirely in WASM with single `tick()` call per frame
- WASM inline bundling via Vite (no separate .wasm file needed)
- Triangulation moved to WASM (Delaunator Rust crate)
- Ghost points and edge wrapping handled in WASM

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
