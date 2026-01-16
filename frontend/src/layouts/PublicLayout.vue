<template>
  <div class="public-layout">
    <aside class="public-hero">
      <div class="brand">
        <span class="brand-mark">CE</span>
        <div>
          <h1>{{ $t('common.appName') }}</h1>
          <p>{{ $t('public.headline') }}</p>
        </div>
      </div>
      <div class="hero-card">
        <p>{{ $t('public.hero') }}</p>
      </div>
    </aside>
    <main class="public-content">
      <div class="language">
        <span>{{ $t('common.language') }}</span>
        <select v-model="localeValue">
          <option value="pt">PT</option>
          <option value="en">EN</option>
          <option value="es">ES</option>
        </select>
      </div>
      <slot />
    </main>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-facing-decorator';
import { i18n } from '../i18n';

@Component({})
export default class PublicLayout extends Vue {
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
.public-layout {
  display: grid;
  grid-template-columns: minmax(260px, 1fr) minmax(320px, 1fr);
  min-height: 100vh;
}

.public-hero {
  padding: 3.5rem 3rem;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 2rem;
}

.brand {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.brand-mark {
  display: grid;
  place-items: center;
  width: 48px;
  height: 48px;
  border-radius: 14px;
  background: var(--primary);
  color: var(--primary-ink);
  font-weight: 700;
  letter-spacing: 0.05em;
}

.brand h1 {
  margin: 0;
  font-size: 1.7rem;
}

.brand p {
  margin: 0.35rem 0 0;
  color: var(--muted);
}

.hero-card {
  padding: 1.5rem;
  border-radius: 20px;
  background: var(--panel);
  border: 1px solid var(--border);
  box-shadow: var(--shadow);
}

.public-content {
  display: grid;
  place-items: center;
  padding: 2.5rem;
  position: relative;
}

.language {
  position: absolute;
  top: 1.5rem;
  right: 1.5rem;
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

@media (max-width: 900px) {
  .public-layout {
    grid-template-columns: 1fr;
  }

  .public-hero {
    padding: 2.5rem 2rem;
  }
}
</style>
