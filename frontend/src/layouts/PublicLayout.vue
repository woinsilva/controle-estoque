<template>
  <div class="public-layout">
    <aside class="public-hero">
      <div class="hero-stack">
        <div class="brand">
          <span class="brand-mark">BT</span>
          <div>
            <h1>{{ $t('common.appName') }}</h1>
            <p>{{ $t('public.headline') }}</p>
          </div>
        </div>
        <div class="hero-copy">
          <span class="eyebrow">Workspace inteligente</span>
          <h2>Gestao com cara de produto premium, simples para a equipe e clara para o cliente.</h2>
          <p>
            Controle atendimentos, servicos, questionarios e operacao em uma interface mais limpa, moderna e confiante.
          </p>
        </div>
      </div>
      <div class="hero-card">
        <p>{{ $t('public.hero') }}</p>
        <div class="hero-points">
          <span>Agenda visual</span>
          <span>Fluxo de atendimento</span>
          <span>Relatorios e vendas</span>
        </div>
      </div>
    </aside>
    <main class="public-content">
      <div class="language">
        <span>{{ $t('common.language') }}</span>
        <AppSelect v-model="localeValue" :options="localeOptions" />
      </div>
      <slot />
    </main>
  </div>
</template>

<script lang="ts">
import { Component, Vue, toNative } from 'vue-facing-decorator';
import { i18n } from '../i18n';
import AppSelect from '../components/AppSelect.vue';

@Component({ components: { AppSelect } })
class PublicLayout extends Vue {
  get localeOptions() {
    return [
      { label: 'PT', value: 'pt' },
      { label: 'EN', value: 'en' },
      { label: 'ES', value: 'es' }
    ];
  }

  get localeValue() {
    return i18n.global.locale.value;
  }

  set localeValue(value: 'pt' | 'en' | 'es') {
    i18n.global.locale.value = value;
    localStorage.setItem('locale', value);
  }
}
export default toNative(PublicLayout);
</script>

<style scoped>
.public-layout {
  display: grid;
  grid-template-columns: minmax(360px, 1.05fr) minmax(360px, 0.95fr);
  min-height: 100vh;
}

.public-hero {
  padding: 3rem;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 2rem;
  position: relative;
  overflow: hidden;
}

.public-hero::before,
.public-hero::after {
  content: '';
  position: absolute;
  border-radius: 999px;
  filter: blur(10px);
}

.public-hero::before {
  width: 280px;
  height: 280px;
  top: -70px;
  left: -90px;
  background: rgba(86, 196, 184, 0.18);
}

.public-hero::after {
  width: 220px;
  height: 220px;
  right: -60px;
  bottom: 24px;
  background: rgba(223, 190, 124, 0.16);
}

.hero-stack {
  display: grid;
  gap: 2.4rem;
  position: relative;
  z-index: 1;
}

.brand {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.brand-mark {
  display: grid;
  place-items: center;
  width: 54px;
  height: 54px;
  border-radius: 18px;
  background: linear-gradient(135deg, var(--primary), #7cd7cd);
  color: var(--primary-ink);
  font-weight: 800;
  letter-spacing: 0.05em;
  box-shadow: var(--shadow-soft);
}

.brand h1 {
  margin: 0;
  font-size: 1.85rem;
  letter-spacing: -0.03em;
}

.brand p {
  margin: 0.35rem 0 0;
  color: var(--muted);
}

.eyebrow {
  display: inline-flex;
  width: fit-content;
  padding: 0.45rem 0.8rem;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.62);
  border: 1px solid var(--border);
  color: var(--primary-strong);
  font-size: 0.76rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.14em;
}

.hero-copy {
  display: grid;
  gap: 1rem;
  max-width: 620px;
}

.hero-copy h2 {
  margin: 0;
  font-size: clamp(2.25rem, 5vw, 4.1rem);
  line-height: 0.96;
  letter-spacing: -0.05em;
}

.hero-copy p {
  margin: 0;
  max-width: 560px;
  color: var(--muted);
  font-size: 1.02rem;
}

.hero-card {
  padding: 1.6rem;
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.66);
  border: 1px solid var(--border);
  box-shadow: var(--shadow);
  position: relative;
  z-index: 1;
  display: grid;
  gap: 1rem;
}

.hero-card p {
  margin: 0;
  font-size: 1rem;
}

.hero-points {
  display: flex;
  gap: 0.65rem;
  flex-wrap: wrap;
}

.hero-points span {
  padding: 0.55rem 0.85rem;
  border-radius: 999px;
  background: var(--panel-strong);
  border: 1px solid var(--border);
  font-weight: 700;
  color: var(--muted);
}

.public-content {
  display: grid;
  place-items: center;
  padding: 2.5rem 3rem;
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
  font-weight: 700;
  background: rgba(255, 255, 255, 0.68);
  border: 1px solid var(--border);
  border-radius: 999px;
  padding: 0.45rem 0.55rem 0.45rem 0.8rem;
  box-shadow: var(--shadow-soft);
}

:deep(.language .app-select) {
  min-width: 86px;
}

@media (max-width: 900px) {
  .public-layout {
    grid-template-columns: 1fr;
  }

  .public-hero {
    padding: 2rem 1.2rem 1.2rem;
  }

  .public-content {
    padding: 1.4rem 1.2rem 2rem;
  }
}

@media (max-width: 640px) {
  .hero-copy h2 {
    font-size: 2.4rem;
  }
}
</style>
