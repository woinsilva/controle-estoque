<template>
  <div class="auth-layout">
    <header class="topbar">
      <div class="title">
        <span class="brand-mark">CE</span>
        <strong>{{ $t('common.appName') }}</strong>
      </div>
      <nav class="menu">
        <router-link v-if="canSeeDashboard" to="/app">{{ $t('common.dashboard') }}</router-link>
        <router-link v-if="canSeeProducts" to="/app/products">
          {{ $t('common.products') }}
        </router-link>
        <router-link v-if="canSeeSales" to="/app/sales">
          {{ $t('common.sales') }}
        </router-link>
        <router-link v-if="canSeeClients" to="/app/clients">
          {{ $t('common.clients') }}
        </router-link>
        <router-link v-if="canSeeAppointments" to="/app/appointments">
          {{ $t('common.appointments') }}
        </router-link>
        <router-link v-if="canSeeServices" to="/app/services">
          Servicos
        </router-link>
        <router-link v-if="canSeeSchedules" to="/app/schedules">
          Agenda
        </router-link>
        <router-link v-if="canSeeReports" to="/app/reports">
          {{ $t('common.reports') }}
        </router-link>
        <router-link v-if="canSeeQuestionnaires" to="/app/questionnaires">
          {{ $t('common.questionnaires') }}
        </router-link>
        <router-link v-if="canSeeUsers" to="/app/users">
          {{ $t('common.users') }}
        </router-link>
      </nav>
      <div class="language">
        <span>{{ $t('common.language') }}</span>
        <select v-model="localeValue">
          <option value="pt">PT</option>
          <option value="en">EN</option>
          <option value="es">ES</option>
        </select>
      </div>
    </header>
    <section class="content">
      <slot />
    </section>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-facing-decorator';
import { useAuthStore } from '../stores/auth';
import { i18n } from '../i18n';

@Component({})
export default class AuthLayout extends Vue {
  authStore = useAuthStore();

  get canSeeDashboard() {
    return this.authStore.role !== 'CLIENT';
  }

  get canSeeProducts() {
    return ['MANAGER', 'ADMIN'].includes(this.authStore.role || '');
  }

  get canSeeSales() {
    return ['OPERATOR', 'MANAGER', 'ADMIN'].includes(this.authStore.role || '');
  }

  get canSeeUsers() {
    return this.authStore.role === 'ADMIN';
  }

  get canSeeClients() {
    return ['OPERATOR', 'MANAGER', 'ADMIN'].includes(this.authStore.role || '');
  }

  get canSeeQuestionnaires() {
    return ['OPERATOR', 'MANAGER', 'ADMIN'].includes(this.authStore.role || '');
  }

  get canSeeAppointments() {
    return ['OPERATOR', 'MANAGER', 'ADMIN', 'CLIENT'].includes(this.authStore.role || '');
  }

  get canSeeServices() {
    return ['OPERATOR', 'MANAGER', 'ADMIN'].includes(this.authStore.role || '');
  }

  get canSeeSchedules() {
    return ['OPERATOR', 'MANAGER', 'ADMIN'].includes(this.authStore.role || '');
  }

  get canSeeReports() {
    return ['OPERATOR', 'MANAGER', 'ADMIN'].includes(this.authStore.role || '');
  }

  get localeValue() {
    return i18n.global.locale.value;
  }

  set localeValue(value: string) {
    i18n.global.locale.value = value;
    localStorage.setItem('locale', value);
  }
}
</script>

<style scoped>
.auth-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 2rem;
  background: var(--panel);
  border-bottom: 1px solid var(--border);
}

.title {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.brand-mark {
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: var(--primary);
  color: var(--primary-ink);
  font-weight: 700;
}

.menu {
  display: flex;
  gap: 1.5rem;
  color: var(--muted);
  font-weight: 500;
}

.menu a {
  color: inherit;
}

.menu a.router-link-active {
  color: var(--primary);
  font-weight: 600;
}

.language {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  color: var(--muted);
  font-weight: 500;
}

.language select {
  border-radius: 10px;
  border: 1px solid var(--border);
  background: #fffdf9;
  padding: 0.3rem 0.5rem;
}

.content {
  flex: 1;
  padding: 2rem;
}

@media (max-width: 760px) {
  .topbar {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }

  .menu {
    flex-wrap: wrap;
  }
}
</style>
