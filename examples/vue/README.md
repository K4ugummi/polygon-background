# Polygon Background - Vue Example

A Vue 3 + TypeScript demo showcasing the polygon-background library.

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
   cd examples/vue
   npm install
   npm link polygon-background
   ```

3. Start development server:

   ```bash
   npm run dev
   ```

4. Open http://localhost:3001

## Examples Demonstrated

1. **Full Page Background** - Hero section with overlay content
2. **Card Backgrounds** - Multiple themed cards (ocean, sunset, matrix)
3. **Interactive Section** - Mouse-driven height deformation
4. **Theme Switcher** - Runtime theme transitions with smooth animations
5. **Custom Controls** - Dynamic option updates via sliders

## Project Structure

```
examples/vue/
├── src/
│   ├── main.ts                     # Vue entry point
│   ├── App.vue                     # Main app component
│   ├── vite-env.d.ts               # Vite type declarations
│   └── components/
│       ├── AppBar.vue              # Header component
│       ├── PolygonContainer.vue    # Reusable wrapper component
│       ├── HeroSection.vue         # Full-page background example
│       ├── CardGrid.vue            # Card backgrounds example
│       ├── InteractiveSection.vue  # Mouse interaction example
│       ├── ThemeSwitcher.vue       # Theme switching demo
│       └── ControlPanel.vue        # Custom controls demo
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## Key Implementation Notes

### PolygonContainer Component

The `PolygonContainer` component wraps the polygon-background library for Vue:

```vue
<script setup lang="ts">
import PolygonContainer from './components/PolygonContainer.vue';

const containerRef = ref<{ instance: PolygonBackground } | null>(null);
</script>

<template>
  <!-- Basic usage -->
  <PolygonContainer theme="midnight" :options="{ pointCount: 100 }">
    <YourContent />
  </PolygonContainer>

  <!-- With ref for imperative access -->
  <PolygonContainer ref="containerRef" theme="ocean" />
</template>

<script setup lang="ts">
// Access instance: containerRef.value?.instance.setTheme('sunset')
</script>
```

### Theme Transitions

Theme changes automatically animate when `transition.enabled` is true:

```vue
<PolygonContainer
  :theme="activeTheme"
  :options="{
    transition: { enabled: true, duration: 800 }
  }"
/>
```

### Mouse Interaction

Enable mouse-based height deformation:

```vue
<PolygonContainer
  :options="{
    mouse: {
      enabled: true,
      radius: 150,
      heightInfluence: 0.8,
    },
    height: {
      mode: 'mouse',
    },
  }"
/>
```

### Reactive Updates with Watch

Use Vue's watch for real-time updates:

```vue
<script setup lang="ts">
const containerRef = ref(null);
const pointCount = ref(80);

watch(pointCount, (value) => {
  containerRef.value?.instance?.setOption('pointCount', value);
});
</script>
```

## Scoped CSS

This example uses Vue's scoped CSS for component styling:

```vue
<style scoped>
.container {
  /* styles are scoped to this component */
}
</style>
```

## Composition API

Uses Vue 3 Composition API with `<script setup>`:

```vue
<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';

const theme = ref('midnight');
</script>
```

## TypeScript

Full TypeScript support with types from polygon-background:

```typescript
import type { PolygonBackground, PolygonBackgroundOptions } from 'polygon-background';
```
