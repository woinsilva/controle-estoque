<template>
  <section class="dashboard">
    <div class="hero">
      <div>
        <p class="eyebrow">{{ $t('dashboard.eyebrow') }}</p>
        <h2>{{ $t('dashboard.title') }}</h2>
        <p class="subtitle">{{ $t('dashboard.subtitle') }}</p>
      </div>
      <div class="profile-pill">{{ profileLabel }}</div>
    </div>

    <div class="cards">
      <article class="stat danger">
        <div>
          <h3>{{ $t('dashboard.lowStock') }}</h3>
          <p>{{ $t('dashboard.lowStockHint') }}</p>
        </div>
        <strong>{{ lowStock }}</strong>
      </article>
      <article class="stat">
        <div>
          <h3>{{ $t('dashboard.salesToday') }}</h3>
          <p>{{ $t('dashboard.salesTodayHint') }}</p>
        </div>
        <strong>{{ salesToday }}</strong>
      </article>
      <article class="stat muted">
        <div>
          <h3>{{ $t('dashboard.pending') }}</h3>
          <p>{{ $t('dashboard.pendingHint') }}</p>
        </div>
        <strong>{{ pendingOrders }}</strong>
      </article>
    </div>

    <div class="panels">
      <section class="panel" v-if="canSeeSales">
        <header>
          <h4>{{ $t('dashboard.recentSales') }}</h4>
          <span>{{ $t('dashboard.lastUpdated') }}</span>
        </header>
        <div class="panel-body">
          <div class="row" v-for="item in recentSales" :key="item.id">
            <div>
              <strong>{{ saleLabel(item.id) }}</strong>
              <p>{{ item.detail }}</p>
            </div>
            <span>{{ formatCurrency(item.amount) }}</span>
          </div>
          <p v-if="!recentSales.length" class="empty-row">-</p>
        </div>
      </section>

      <section class="panel" v-if="canSeeProducts">
        <header>
          <h4>{{ $t('dashboard.alerts') }}</h4>
          <span>{{ $t('dashboard.lowStockHint') }}</span>
        </header>
        <div class="panel-body">
          <div class="row" v-for="item in lowStockItems" :key="item.sku">
            <div>
              <strong>{{ item.name }}</strong>
              <p>SKU {{ item.sku }}</p>
            </div>
            <span class="pill danger">{{ item.qty }}</span>
          </div>
          <p v-if="!lowStockItems.length" class="empty-row">-</p>
        </div>
      </section>
    </div>
    <p v-if="error" class="dashboard-error">{{ error }}</p>
  </section>
</template>

<script lang="ts">
import { Component, Vue, toNative } from 'vue-facing-decorator';
import { useAuthStore } from '../stores/auth';
import { i18n } from '../i18n';
import { apiGet } from '../services/api';
import type { DashboardLowStockItem, DashboardRecentSale, DashboardSummary } from '../types/dashboard';

@Component({})
class DashboardView extends Vue {
  authStore = useAuthStore();
  lowStock = 0;
  salesToday = 0;
  pendingOrders = 0;
  recentSales: DashboardRecentSale[] = [];
  lowStockItems: DashboardLowStockItem[] = [];
  error = '';

  mounted() {
    void this.loadDashboard();
  }

  get profileLabel() {
    const role = this.authStore.role || 'OPERATOR';
    const map: Record<string, string> = {
      OPERATOR: this.$t('roles.operator'),
      MANAGER: this.$t('roles.manager'),
      ADMIN: this.$t('roles.admin')
    };
    return map[role] || role;
  }

  get canSeeSales() {
    return ['OPERATOR', 'MANAGER', 'ADMIN'].includes(this.authStore.role || '');
  }

  get canSeeProducts() {
    return ['MANAGER', 'ADMIN'].includes(this.authStore.role || '');
  }

  async loadDashboard() {
    this.error = '';
    try {
      const summary = await apiGet<DashboardSummary>('/dashboard/summary', this.authStore.token);
      this.lowStock = summary.lowStock;
      this.salesToday = summary.salesToday;
      this.pendingOrders = summary.pendingOrders;
      this.recentSales = summary.recentSales;
      this.lowStockItems = summary.lowStockItems;
    } catch (err) {
      this.error = err instanceof Error ? err.message : this.$t('dashboard.loadError');
    }
  }

  saleLabel(saleId: string) {
    return `#${saleId.slice(-6).toUpperCase()}`;
  }

  formatCurrency(value: number) {
    const locale = i18n.global.locale.value;
    const currencyMap: Record<string, { locale: string; currency: string }> = {
      pt: { locale: 'pt-BR', currency: 'BRL' },
      en: { locale: 'en-US', currency: 'USD' },
      es: { locale: 'es-ES', currency: 'EUR' }
    };
    const settings = (currencyMap[locale as keyof typeof currencyMap] ?? currencyMap.pt) as {
      locale: string;
      currency: string;
    };
    return new Intl.NumberFormat(settings.locale, {
      style: 'currency',
      currency: settings.currency
    }).format(value);
  }
}
export default toNative(DashboardView);
</script>

<style scoped>
.dashboard {
  display: grid;
  gap: 2rem;
}

.hero {
  background: linear-gradient(120deg, #ffffff, #f6efe4);
  border: 1px solid var(--border);
  border-radius: 24px;
  padding: 2rem;
  display: flex;
  justify-content: space-between;
  gap: 2rem;
  align-items: center;
}

.eyebrow {
  text-transform: uppercase;
  letter-spacing: 0.2em;
  font-size: 0.65rem;
  font-weight: 600;
  color: var(--primary);
  margin: 0 0 0.5rem;
}

.hero h2 {
  margin: 0 0 0.4rem;
  font-size: 2rem;
}

.subtitle {
  margin: 0;
  color: var(--muted);
}

.profile-pill {
  padding: 0.6rem 1.2rem;
  border-radius: 999px;
  background: #f0e6d7;
  border: 1px solid var(--border);
  font-weight: 600;
}

.cards {
  display: grid;
  gap: 1.25rem;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
}

.stat {
  padding: 1.5rem;
  border-radius: 18px;
  border: 1px solid var(--border);
  background: #fffdf8;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.stat strong {
  font-size: 1.8rem;
}

.stat h3 {
  margin: 0 0 0.4rem;
}

.stat p {
  margin: 0;
  color: var(--muted);
}

.stat.danger {
  background: #fff3ef;
  border-color: #f5c2b3;
}

.stat.muted {
  background: #f7f4ef;
}

.panels {
  display: grid;
  gap: 1.5rem;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
}

.panel {
  border-radius: 18px;
  border: 1px solid var(--border);
  background: var(--panel);
  padding: 1.5rem;
  box-shadow: var(--shadow);
}

.panel header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  color: var(--muted);
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.12em;
}

.panel h4 {
  margin: 0;
  color: var(--ink);
  font-size: 1rem;
}

.panel-body {
  display: grid;
  gap: 1rem;
}

.row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid var(--border);
}

.row:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.row p {
  margin: 0.2rem 0 0;
  color: var(--muted);
  font-size: 0.85rem;
}

.empty-row {
  margin: 0;
  color: var(--muted);
}

.pill {
  padding: 0.35rem 0.7rem;
  border-radius: 999px;
  background: #f3efe7;
  font-weight: 600;
}

.pill.danger {
  background: #ffe3db;
  color: #b42318;
}

.dashboard-error {
  margin: 0;
  color: #b42318;
  background: #fff1ef;
  border: 1px solid #ffd4ce;
  border-radius: 10px;
  padding: 0.75rem 1rem;
}

@media (max-width: 900px) {
  .hero {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
