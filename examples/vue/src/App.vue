<script setup lang="ts">
import AppBar from './components/AppBar.vue';
import HeroSection from './components/HeroSection.vue';
import CardGrid from './components/CardGrid.vue';
import InteractiveSection from './components/InteractiveSection.vue';
import ThemeSwitcher from './components/ThemeSwitcher.vue';
import ControlPanel from './components/ControlPanel.vue';
</script>

<template>
  <div class="app">
    <AppBar />
    <main class="main">
      <HeroSection />
      <CardGrid />
      <InteractiveSection />
      <ThemeSwitcher />
      <ControlPanel />
    </main>
  </div>
</template>

<style scoped>
.app {
  min-height: 100vh;
}

.main {
  display: flex;
  flex-direction: column;
  gap: 0;
}
</style>
