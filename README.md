# Polygon Background

Beautiful, animated polygon backgrounds for web applications. Built with WebGL and WebAssembly for smooth 60fps performance.

## Features

- **WebGL Rendering** - Hardware-accelerated graphics for smooth animations
- **WASM Acceleration** - WebAssembly-powered physics simulation
- **5 Built-in Themes** - midnight, ocean, sunset, matrix, monochrome
- **Interactive Physics** - Push, pull, and swirl effects with spring physics
- **Click Shockwaves** - Expanding wave effects on click
- **Gravity Wells** - Hold to attract or repel points
- **Smooth Transitions** - Animated theme switching
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
});
```

## Usage with Frameworks

See the `examples/` directory for complete framework examples:

- **React** - `examples/react/`
- **Vue** - `examples/vue/`
- **Angular** - `examples/angular/`

Each example includes:
- Home page with theme switching
- Interactive page demonstrating mouse physics
- Themes page showcasing all available themes

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
    radius: 200,
    radiusUnit: 'px',
    strength: 80,           // displacement strength (0-150)
    mode: 'push',           // 'push' | 'pull' | 'swirl'
    springBack: 0.08,       // how fast points return (0-1)
    velocityInfluence: 0.5, // mouse speed effect (0-1)
  },

  // Click/hold interactions
  interaction: {
    clickShockwave: true,     // trigger shockwave on click
    holdGravityWell: true,    // create gravity well on hold
    gravityWellAttract: false, // attract (true) or repel (false)
  },

  // Height/topography (static, for lighting variation)
  height: {
    noiseScale: 0.003,
    intensity: 0.6,
    centerFalloff: 0.3,
  },

  // Theme transitions
  transition: {
    enabled: true,
    duration: 1000,
  },

  // Performance
  performance: {
    targetFPS: 0, // 0 = unlimited
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
bg.setLightConfig({ mode: 'mouse' });
bg.setMouseConfig({ mode: 'swirl', strength: 100 });
bg.setInteractionConfig({ clickShockwave: false });
bg.setHeightConfig({ intensity: 0.8 });

// Interactive effects
bg.triggerShockwave(x?, y?);  // trigger shockwave at position (default: center)
bg.setGravityWell(x, y, active, attract?);  // control gravity well
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
```

### Running Examples

```bash
# Link the library globally
npm link

# Run React example
cd examples/react && npm install && npm link polygon-background && npm run dev

# Run Vue example
cd examples/vue && npm install && npm link polygon-background && npm run dev

# Run Angular example
cd examples/angular && npm install && npm link polygon-background && npm run dev
```

## Browser Support

- Chrome 90+
- Firefox 90+
- Safari 15+
- Edge 90+

Requires WebGL 2.0 and WebAssembly support.

## License

MIT
