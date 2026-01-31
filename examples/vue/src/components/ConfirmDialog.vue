<script setup lang="ts">
import { ref, watch, onUnmounted } from 'vue';
import { PolygonBackground } from 'polygon-background';

const props = defineProps<{
  open: boolean;
}>();

const emit = defineEmits<{
  close: [];
}>();

const containerRef = ref<HTMLDivElement>();
let bg: PolygonBackground | null = null;

watch(() => props.open, (open) => {
  if (open) {
    setTimeout(() => {
      if (containerRef.value && !bg) {
        bg = new PolygonBackground(containerRef.value, {
          theme: 'sunset',
          pointCount: 25,
          speed: 0.3,
        });
      }
    }, 0);
  } else {
    bg?.destroy();
    bg = null;
  }
});

onUnmounted(() => {
  bg?.destroy();
});
</script>

<template>
  <div v-if="open" class="overlay" @click="emit('close')">
    <div ref="containerRef" class="dialog" @click.stop>
      <div class="dialog-content">
        <div class="dialog-icon">⚠️</div>
        <h3>Delete Project?</h3>
        <p>This action cannot be undone. All data associated with this project will be permanently removed.</p>
        <div class="dialog-actions">
          <button class="btn-secondary" @click="emit('close')">Cancel</button>
          <button class="btn-danger" @click="emit('close')">Delete</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.dialog {
  position: relative;
  border-radius: 1rem;
  overflow: hidden;
  padding: 2rem;
  max-width: 400px;
  width: 90%;
  min-height: 280px;
}

.dialog-content {
  position: relative;
  z-index: 1;
  text-align: center;
}

.dialog-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.dialog-content h3 {
  color: #fff;
  margin-bottom: 0.5rem;
}

.dialog-content p {
  color: #94a3b8;
  margin-bottom: 1.5rem;
}

.dialog-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
}

.btn-secondary {
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  border: 1px solid #334155;
  background: transparent;
  color: #fff;
  font-size: 1rem;
  cursor: pointer;
}

.btn-danger {
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  border: none;
  background: #dc2626;
  color: #fff;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
}
</style>
