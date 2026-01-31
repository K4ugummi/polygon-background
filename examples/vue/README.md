# Vue Example

## Setup

```bash
# From the repository root
npm link

# Install and run
cd examples/vue
npm install
npm link polygon-background
npm run dev
```

Open http://localhost:3001

## Pages

- **Home** - Theme switching demo
- **Interactive** - Mouse physics (push/pull/swirl modes)
- **Themes** - All themes displayed in a grid

## Usage

```vue
<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { PolygonBackground } from 'polygon-background';

const containerRef = ref<HTMLDivElement>();
let bg: PolygonBackground | null = null;

onMounted(() => {
  if (containerRef.value) {
    bg = new PolygonBackground(containerRef.value, {
      theme: 'midnight',
      pointCount: 80,
    });
  }
});

onUnmounted(() => {
  bg?.destroy();
});
</script>

<template>
  <div ref="containerRef" style="width: 100%; height: 100vh" />
</template>
```

## Changing Theme

```vue
<script setup lang="ts">
import { ref, watch } from 'vue';

const theme = ref('midnight');

watch(theme, (newTheme) => {
  bg?.setTheme(newTheme);
});
</script>
```

## Mouse Interaction

```typescript
bg = new PolygonBackground(container, {
  theme: 'ocean',
  mouse: {
    enabled: true,
    mode: 'push',      // 'push' | 'pull' | 'swirl'
    strength: 80,
  },
  interaction: {
    clickShockwave: true,
    holdGravityWell: true,
  },
});
```
