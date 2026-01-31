<script setup lang="ts">
import PolygonContainer from './PolygonContainer.vue';

const cards = [
  {
    theme: 'ocean',
    title: 'Ocean Theme',
    description: 'Deep sea colors with cyan highlights',
  },
  {
    theme: 'sunset',
    title: 'Sunset Theme',
    description: 'Warm oranges and coral tones',
  },
  {
    theme: 'matrix',
    title: 'Matrix Theme',
    description: 'Digital green with dark backdrop',
  },
];
</script>

<template>
  <section class="section">
    <div class="container">
      <h2 class="heading">Card Backgrounds</h2>
      <p class="description">
        Each card contains its own polygon background with a different theme.
      </p>
      <div class="grid">
        <PolygonContainer
          v-for="card in cards"
          :key="card.theme"
          :theme="card.theme"
          :options="{ pointCount: 40, speed: 0.5 }"
          class="card"
        >
          <div class="card-content">
            <h3 class="card-title">{{ card.title }}</h3>
            <p class="card-description">{{ card.description }}</p>
          </div>
        </PolygonContainer>
      </div>
    </div>
  </section>
</template>

<style scoped>
.section {
  padding: 6rem 2rem;
  background: #0f172a;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
}

.heading {
  font-size: 2.5rem;
  font-weight: 700;
  text-align: center;
  margin-bottom: 1rem;
  color: #f8fafc;
}

.description {
  text-align: center;
  color: #94a3b8;
  margin-bottom: 3rem;
  font-size: 1.125rem;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
}

.card {
  border-radius: 12px;
  overflow: hidden;
  min-height: 250px;
  border: 1px solid rgba(99, 102, 241, 0.2);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.card:hover {
  transform: translateY(-4px);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
}

.card-content {
  position: relative;
  z-index: 1;
  padding: 2rem;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.7) 0%, transparent 100%);
}

.card-title {
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: #f8fafc;
}

.card-description {
  color: #94a3b8;
  font-size: 0.875rem;
}
</style>
