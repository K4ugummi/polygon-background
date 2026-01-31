<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { PolygonBackground, PolygonBackgroundOptions } from 'polygon-background';

interface Props {
  theme?: string;
  options?: Partial<PolygonBackgroundOptions>;
}

const props = withDefaults(defineProps<Props>(), {
  theme: 'midnight',
  options: () => ({}),
});

const containerRef = ref<HTMLDivElement | null>(null);
const instance = ref<PolygonBackground | null>(null);

defineExpose({
  instance,
});

onMounted(() => {
  if (containerRef.value) {
    instance.value = new PolygonBackground(containerRef.value, {
      theme: props.theme,
      ...props.options,
    });
  }
});

onUnmounted(() => {
  instance.value?.destroy();
  instance.value = null;
});

watch(
  () => props.theme,
  (newTheme) => {
    instance.value?.setTheme(newTheme);
  }
);
</script>

<template>
  <div ref="containerRef" class="polygon-container">
    <slot />
  </div>
</template>

<style scoped>
.polygon-container {
  position: relative;
}
</style>
