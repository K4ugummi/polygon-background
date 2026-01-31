<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { PolygonBackground } from 'polygon-background';

const themes = ['midnight', 'ocean', 'sunset', 'matrix', 'monochrome'] as const;
const containerRef = ref<HTMLDivElement>();
const theme = ref<typeof themes[number]>('midnight');
let bg: PolygonBackground | null = null;

onMounted(() => {
  if (containerRef.value) {
    bg = new PolygonBackground(containerRef.value, {
      theme: theme.value,
      pointCount: 80,
    });
  }
});

onUnmounted(() => {
  bg?.destroy();
});

watch(theme, (newTheme) => {
  bg?.setTheme(newTheme);
});
</script>

<template>
  <div ref="containerRef" class="container">
    <div class="content">
      <h1>Polygon Background</h1>
      <p>Beautiful, animated polygon backgrounds with physics-based mouse interactions.</p>
      <div class="themes">
        <button
          v-for="t in themes"
          :key="t"
          :class="{ active: theme === t }"
          @click="theme = t"
        >
          {{ t }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.container {
  height: calc(100vh - 60px);
  position: relative;
}

.content {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #fff;
  text-align: center;
  padding: 2rem;
}

h1 {
  font-size: 3rem;
  margin-bottom: 1rem;
}

p {
  font-size: 1.25rem;
  color: #94a3b8;
  margin-bottom: 2rem;
  max-width: 600px;
}

.themes {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  justify-content: center;
}

button {
  padding: 0.5rem 1rem;
  border: 1px solid #334155;
  background: rgba(0, 0, 0, 0.5);
  color: #fff;
  border-radius: 0.5rem;
  cursor: pointer;
  text-transform: capitalize;
}

button.active {
  border: 2px solid #6366f1;
  background: rgba(99, 102, 241, 0.2);
}
</style>
