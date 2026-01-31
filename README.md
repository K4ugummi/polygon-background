# Polygon Background

Beautiful, animated polygon backgrounds for web applications. Built with WebGL and WebAssembly for smooth 60fps performance.

## Features

- **WebGL Rendering** - Hardware-accelerated graphics for smooth animations
- **WASM Acceleration** - WebAssembly-powered simulation with JavaScript fallback
- **5 Built-in Themes** - midnight, ocean, sunset, matrix, monochrome
- **Mouse Interaction** - Responsive height deformation on hover
- **Smooth Transitions** - Animated theme switching
- **Fully Configurable** - Control points, speed, lighting, and more
- **TypeScript Support** - Full type definitions included
- **Framework Agnostic** - Works with React, Vue, Angular, or vanilla JS

## Installation

```bash
npm install polygon-background
```

## Quick Start

```typescript
import { PolygonBackground } from 'polygon-background';

const container = document.getElementById('background');
const bg = new PolygonBackground(container, {
  theme: 'midnight',
  pointCount: 80,
  speed: 1,
});
```

## Usage with Frameworks

See the `examples/` directory for complete framework examples:

- **React** - `examples/react/` (Vite + React 18 + TypeScript)
- **Vue** - `examples/vue/` (Vite + Vue 3 + TypeScript)
- **Angular** - `examples/angular/` (Angular 18 + TypeScript)

## Configuration

```typescript
const bg = new PolygonBackground(container, {
  // Theme
  theme: 'midnight', // 'midnight' | 'ocean' | 'sunset' | 'matrix' | 'monochrome'

  // Points
  pointCount: 80,
  pointSize: 2,

  // Animation
  speed: 1,

  // Lighting
  light: {
    mode: 'fixed', // 'fixed' | 'mouse'
    position: { x: 0.3, y: 0.2 },
  },

  // Mouse interaction
  mouse: {
    enabled: true,
    radius: 150,
    radiusUnit: 'px',
    heightInfluence: 0.8,
  },

  // Height/topography
  height: {
    mode: 'animate', // 'static' | 'animate' | 'mouse'
    intensity: 0.6,
    noiseScale: 0.003,
  },

  // Theme transitions
  transition: {
    enabled: true,
    duration: 1000,
  },

  // Performance
  performance: {
    targetFPS: 60,
    showFPS: false,
  },
});
```

## API

### Instance Methods

```typescript
// Lifecycle
bg.start();
bg.stop();
bg.pause();
bg.resume();
bg.destroy();

// State
bg.isPaused();
bg.isRunning();
bg.getFPS();

// Theme
bg.setTheme('ocean');
bg.getTheme();

// Configuration
bg.setOption('pointCount', 100);
bg.getOption('pointCount');
bg.setLightConfig({ position: { x: 0.5, y: 0.5 } });
bg.setMouseConfig({ enabled: true, radius: 200 });
bg.setHeightConfig({ intensity: 0.8 });
```

### Available Themes

| Theme | Description |
|-------|-------------|
| `midnight` | Deep blue/purple with indigo highlights (default) |
| `ocean` | Cyan blues with deep sea colors |
| `sunset` | Orange/coral with magenta accents |
| `matrix` | Bright green digital aesthetic |
| `monochrome` | Elegant grayscale |

### Custom Themes

```typescript
import { createTheme } from 'polygon-background';

const customTheme = createTheme('midnight', {
  gradientStart: '#ff0000',
  gradientEnd: '#0000ff',
  backgroundColor: '#000000',
});

bg.setTheme(customTheme);
```

## Development

### Prerequisites

- Node.js 18+
- npm 9+
- Rust (for WASM development)

### Setup

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Type check
npm run typecheck
```

### Running Examples

```bash
# Link the library globally
npm link

# Run React example
cd examples/react
npm install
npm link polygon-background
npm run dev  # http://localhost:3000

# Run Vue example
cd examples/vue
npm install
npm link polygon-background
npm run dev  # http://localhost:3001

# Run Angular example
cd examples/angular
npm install
npm link polygon-background
npm run dev  # http://localhost:3002
```

## Project Structure

```
polygon-background/
├── src/
│   ├── index.ts              # Main exports
│   ├── PolygonBackground.ts  # Core class
│   ├── themes.ts             # Theme definitions
│   ├── types.ts              # TypeScript types
│   ├── webgl/                # WebGL renderer
│   └── wasm/                 # WASM simulation
├── wasm/                     # Rust WASM source
├── examples/
│   ├── react/                # React example
│   ├── vue/                  # Vue example
│   └── angular/              # Angular example
├── dist/                     # Built library
└── package.json
```

## Browser Support

- Chrome 90+
- Firefox 90+
- Safari 15+
- Edge 90+

Requires WebGL 2.0 and WebAssembly support.

## License

MIT
