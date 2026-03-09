import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import LoginView from '../views/LoginView.vue';
import DashboardView from '../views/DashboardView.vue';
import ProductsView from '../views/ProductsView.vue';
import SalesView from '../views/SalesView.vue';
import UsersView from '../views/UsersView.vue';
import ClientsView from '../views/ClientsView.vue';
import QuestionnairesView from '../views/QuestionnairesView.vue';
import AppointmentsView from '../views/AppointmentsView.vue';
import ReportsView from '../views/ReportsView.vue';
import ServicesView from '../views/ServicesView.vue';
import SchedulesView from '../views/SchedulesView.vue';

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
    },
    {
      path: '/app/sales',
      name: 'sales',
      component: SalesView,
      meta: { layout: 'auth', requiresAuth: true, roles: ['OPERATOR', 'MANAGER', 'ADMIN'] }
    },
    {
      path: '/app/clients',
      name: 'clients',
      component: ClientsView,
      meta: { layout: 'auth', requiresAuth: true, roles: ['OPERATOR', 'MANAGER', 'ADMIN'] }
    },
    {
      path: '/app/questionnaires',
      name: 'questionnaires',
      component: QuestionnairesView,
      meta: { layout: 'auth', requiresAuth: true, roles: ['OPERATOR', 'MANAGER', 'ADMIN'] }
    },
    {
      path: '/app/appointments',
      name: 'appointments',
      component: AppointmentsView,
      meta: { layout: 'auth', requiresAuth: true, roles: ['OPERATOR', 'MANAGER', 'ADMIN', 'CLIENT'] }
    },
    {
      path: '/app/services',
      name: 'services',
      component: ServicesView,
      meta: { layout: 'auth', requiresAuth: true, roles: ['OPERATOR', 'MANAGER', 'ADMIN'] }
    },
    {
      path: '/app/schedules',
      name: 'schedules',
      component: SchedulesView,
      meta: { layout: 'auth', requiresAuth: true, roles: ['OPERATOR', 'MANAGER', 'ADMIN'] }
    },
    {
      path: '/app/reports',
      name: 'reports',
      component: ReportsView,
      meta: { layout: 'auth', requiresAuth: true, roles: ['OPERATOR', 'MANAGER', 'ADMIN'] }
    },
    {
      path: '/app/users',
      name: 'users',
      component: UsersView,
      meta: { layout: 'auth', requiresAuth: true, roles: ['ADMIN'] }
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
  if (authStore.role === 'CLIENT' && to.name !== 'appointments') {
    return { name: 'appointments' };
  }
  const roles = to.meta.roles as string[] | undefined;
  if (roles && authStore.role && !roles.includes(authStore.role)) {
    return { name: 'login' };
  }
  return true;
});

export default router;
