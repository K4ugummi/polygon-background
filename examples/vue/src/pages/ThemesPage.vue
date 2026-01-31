<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { PolygonBackground, THEMES } from 'polygon-background';

const themeNames = Object.keys(THEMES);
const containers = ref<Map<string, HTMLDivElement>>(new Map());
const instances: PolygonBackground[] = [];

onMounted(() => {
  containers.value.forEach((el, theme) => {
    const bg = new PolygonBackground(el, {
      theme,
      pointCount: 40,
      speed: 0.5,
      mouse: { enabled: true },
    });
    instances.push(bg);
  });
});

onUnmounted(() => {
  instances.forEach(bg => bg.destroy());
});

function setContainer(theme: string) {
  return (el: HTMLDivElement | null) => {
    if (el) containers.value.set(theme, el);
  };
}
</script>

<template>
  <div class="page">
    <h1>All Themes</h1>
    <div class="grid">
      <div
        v-for="theme in themeNames"
        :key="theme"
        :ref="setContainer(theme)"
        class="card"
      >
        <div class="label">{{ theme }}</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page {
  padding: 2rem;
  background: #0f172a;
  min-height: calc(100vh - 60px);
}

h1 {
  color: #fff;
  text-align: center;
  margin-bottom: 2rem;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 1.5rem;
  max-width: 1200px;
  margin: 0 auto;
}

.card {
  height: 300px;
  border-radius: 1rem;
  overflow: hidden;
  position: relative;
}

.label {
  position: absolute;
  bottom: 1rem;
  left: 1rem;
  color: #fff;
  font-size: 1.25rem;
  font-weight: 600;
  text-transform: capitalize;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
}
</style>
