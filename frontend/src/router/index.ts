import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import LoginView from '../views/LoginView.vue';
import DashboardView from '../views/DashboardView.vue';
import ProductsView from '../views/ProductsView.vue';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: '/login' },
    {
      path: '/login',
      name: 'login',
      component: LoginView,
      meta: { layout: 'public' }
    },
    {
      path: '/app',
      name: 'dashboard',
      component: DashboardView,
      meta: { layout: 'auth', requiresAuth: true, roles: ['OPERATOR', 'MANAGER', 'ADMIN'] }
    },
    {
      path: '/app/products',
      name: 'products',
      component: ProductsView,
      meta: { layout: 'auth', requiresAuth: true, roles: ['OPERATOR', 'MANAGER', 'ADMIN'] }
    }
  ]
});

router.beforeEach((to) => {
  if (!to.meta.requiresAuth) {
    return true;
  }
  const authStore = useAuthStore();
  if (!authStore.isAuthenticated) {
    return { name: 'login' };
  }
  const roles = to.meta.roles as string[] | undefined;
  if (roles && authStore.role && !roles.includes(authStore.role)) {
    return { name: 'login' };
  }
  return true;
});

export default router;
