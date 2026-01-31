<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { PolygonBackground } from 'polygon-background';

const containerRef = ref<HTMLDivElement>();
let bg: PolygonBackground | null = null;

onMounted(() => {
  if (containerRef.value) {
    bg = new PolygonBackground(containerRef.value, {
      theme: 'midnight',
      pointCount: 30,
      speed: 0.3,
    });
  }
});

onUnmounted(() => {
  bg?.destroy();
});
</script>

<template>
  <div ref="containerRef" class="login-card">
    <div class="login-content">
      <h3>Welcome Back</h3>
      <div class="form-group">
        <label>Email</label>
        <input type="email" placeholder="you@example.com" />
      </div>
      <div class="form-group">
        <label>Password</label>
        <input type="password" placeholder="••••••••" />
      </div>
      <button class="btn-primary">Sign In</button>
      <button class="btn-secondary">Create Account</button>
    </div>
  </div>
</template>

<style scoped>
.login-card {
  position: relative;
  border-radius: 1rem;
  overflow: hidden;
  padding: 2rem;
  max-width: 400px;
  min-height: 400px;
}

.login-content {
  position: relative;
  z-index: 1;
}

.login-content h3 {
  color: #fff;
  margin-bottom: 1.5rem;
  text-align: center;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  color: #94a3b8;
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
}

.form-group input {
  width: 100%;
  padding: 0.75rem;
  border-radius: 0.5rem;
  border: 1px solid #334155;
  background: rgba(0, 0, 0, 0.5);
  color: #fff;
  font-size: 1rem;
}

.btn-primary {
  width: 100%;
  padding: 0.75rem;
  border-radius: 0.5rem;
  border: none;
  background: #6366f1;
  color: #fff;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  margin-bottom: 1rem;
}

.btn-secondary {
  width: 100%;
  padding: 0.75rem;
  border-radius: 0.5rem;
  border: 1px solid #334155;
  background: transparent;
  color: #94a3b8;
  font-size: 0.875rem;
  cursor: pointer;
}
</style>
