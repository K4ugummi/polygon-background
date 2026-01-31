# Polygon Background - React Example

A React + TypeScript demo showcasing the polygon-background library.

## Prerequisites

- Node.js 18+
- npm 9+

## Setup

1. Link the library (from polygon-background root):

   ```bash
   cd /path/to/polygon-background
   npm link
   ```

2. Install dependencies:

   ```bash
   cd examples/react
   npm install
   npm link polygon-background
   ```

3. Start development server:

   ```bash
   npm run dev
   ```

4. Open http://localhost:3000

## Examples Demonstrated

1. **Full Page Background** - Hero section with overlay content
2. **Card Backgrounds** - Multiple themed cards (ocean, sunset, matrix)
3. **Interactive Section** - Mouse-driven height deformation
4. **Theme Switcher** - Runtime theme transitions with smooth animations
5. **Custom Controls** - Dynamic option updates via sliders

## Project Structure

```
examples/react/
├── src/
│   ├── main.tsx                    # React entry point
│   ├── App.tsx                     # Main app component
│   ├── App.module.css              # App styles
│   ├── vite-env.d.ts               # Vite and CSS module type declarations
│   └── components/
│       ├── AppBar.tsx              # Header component
│       ├── AppBar.module.css
│       ├── PolygonContainer.tsx    # Reusable wrapper component
│       ├── HeroSection.tsx         # Full-page background example
│       ├── HeroSection.module.css
│       ├── CardGrid.tsx            # Card backgrounds example
│       ├── CardGrid.module.css
│       ├── InteractiveSection.tsx  # Mouse interaction example
│       ├── InteractiveSection.module.css
│       ├── ThemeSwitcher.tsx       # Theme switching demo
│       ├── ThemeSwitcher.module.css
│       ├── ControlPanel.tsx        # Custom controls demo
│       └── ControlPanel.module.css
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## Key Implementation Notes

### PolygonContainer Component

The `PolygonContainer` component wraps the polygon-background library for React:

```tsx
import PolygonContainer, { PolygonContainerRef } from './components/PolygonContainer';

// Basic usage
<PolygonContainer theme="midnight" options={{ pointCount: 100 }}>
  <YourContent />
</PolygonContainer>

// With ref for imperative access
const ref = useRef<PolygonContainerRef>(null);
// Later: ref.current?.instance.setTheme('ocean')
```

### Theme Transitions

Theme changes automatically animate when `transition.enabled` is true:

```tsx
<PolygonContainer
  theme={activeTheme}
  options={{
    transition: { enabled: true, duration: 800 }
  }}
/>
```

### Mouse Interaction

Enable mouse-based height deformation:

```tsx
<PolygonContainer
  options={{
    mouse: {
      enabled: true,
      radius: 150,
      heightInfluence: 0.8,
    },
    height: {
      mode: 'mouse',
    },
  }}
/>
```

### Dynamic Updates

Use the instance methods for real-time updates:

```tsx
useEffect(() => {
  containerRef.current?.instance?.setOption('pointCount', count);
}, [count]);
```

## CSS Modules

This example uses CSS Modules for scoped styling:

```tsx
import styles from './Component.module.css';
<div className={styles.container}>...</div>
```

## TypeScript

Full TypeScript support with types from polygon-background:

```tsx
import { PolygonBackgroundOptions } from 'polygon-background';

const options: Partial<PolygonBackgroundOptions> = {
  pointCount: 100,
  speed: 0.8,
};
```
