import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import { i18n } from './i18n';
import router from './router';
import PrimeVue from 'primevue/config';
import ConfirmationService from 'primevue/confirmationservice';
import ToastService from 'primevue/toastservice';
import Lara from '@primevue/themes/lara';
import 'primeicons/primeicons.css';
import { applyTheme } from './services/preferences';
import './style.css';

applyTheme((localStorage.getItem('theme') as 'light' | 'dark') || 'light');

createApp(App)
  .use(createPinia())
  .use(i18n)
  .use(router)
  .use(PrimeVue, { theme: { preset: Lara, options: { darkModeSelector: '.app-dark' } } })
  .use(ConfirmationService)
  .use(ToastService)
  .mount('#app');
