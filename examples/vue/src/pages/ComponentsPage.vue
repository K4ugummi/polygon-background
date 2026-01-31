<script setup lang="ts">
import { ref } from 'vue';
import LoginCard from '../components/LoginCard.vue';
import Toolbar from '../components/Toolbar.vue';
import ConfirmDialog from '../components/ConfirmDialog.vue';

const dialogOpen = ref(false);
</script>

<template>
  <div class="page">
    <h1>Component Examples</h1>

    <section>
      <h2>Login Card</h2>
      <LoginCard />
    </section>

    <section>
      <h2>Toolbar with Menu</h2>
      <Toolbar />
    </section>

    <section>
      <h2>Confirm Dialog</h2>
      <button class="btn-primary" @click="dialogOpen = true">Open Dialog</button>
    </section>

    <ConfirmDialog :open="dialogOpen" @close="dialogOpen = false" />
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
  margin-bottom: 3rem;
}

section {
  max-width: 800px;
  margin: 0 auto 4rem;
}

h2 {
  color: #94a3b8;
  margin-bottom: 1rem;
  font-size: 1rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.btn-primary {
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  border: none;
  background: #6366f1;
  color: #fff;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
}
</style>
