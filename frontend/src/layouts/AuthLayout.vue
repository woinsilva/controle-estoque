<template>
  <div class="auth-layout">
    <header class="topbar">
      <div class="title">
        <span class="brand-mark">CE</span>
        <strong>{{ $t('common.appName') }}</strong>
      </div>
      <nav class="menu">
        <router-link to="/app">{{ $t('common.dashboard') }}</router-link>
        <router-link v-if="canSeeProducts" to="/app/products">
          {{ $t('common.products') }}
        </router-link>
        <span v-if="canSeeSales">{{ $t('common.sales') }}</span>
        <span v-if="canSeeUsers">{{ $t('common.users') }}</span>
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

  get canSeeProducts() {
    return ['MANAGER', 'ADMIN'].includes(this.authStore.role || '');
  }

  get canSeeSales() {
    return ['OPERATOR', 'MANAGER', 'ADMIN'].includes(this.authStore.role || '');
  }

  get canSeeUsers() {
    return this.authStore.role === 'ADMIN';
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
