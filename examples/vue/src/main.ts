import { createApp } from 'vue';
import { createRouter, createWebHistory } from 'vue-router';
import App from './App.vue';
import HomePage from './pages/HomePage.vue';
import InteractivePage from './pages/InteractivePage.vue';
import ThemesPage from './pages/ThemesPage.vue';
import './index.css';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: HomePage },
    { path: '/interactive', component: InteractivePage },
    { path: '/themes', component: ThemesPage },
  ],
});

createApp(App).use(router).mount('#app');
