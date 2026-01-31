import { createApp } from 'vue';
import { createRouter, createWebHistory } from 'vue-router';
import App from './App.vue';
import HomePage from './pages/HomePage.vue';
import InteractivePage from './pages/InteractivePage.vue';
import ComponentsPage from './pages/ComponentsPage.vue';
import './index.css';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: HomePage },
    { path: '/interactive', component: InteractivePage },
    { path: '/components', component: ComponentsPage },
  ],
});

createApp(App).use(router).mount('#app');
