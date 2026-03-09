<template>
  <section class="reports">
    <header class="reports-header">
      <div>
        <h2>{{ $t('reports.title') }}</h2>
        <p>{{ $t('reports.subtitle') }}</p>
      </div>
    </header>

    <section class="panel">
      <div class="panel-head">
        <h3>{{ $t('reports.products') }}</h3>
        <button type="button" class="primary" :disabled="loading" @click="loadReports">
          {{ $t('reports.apply') }}
        </button>
      </div>
      <div class="filters">
        <label class="field">
          <span>{{ $t('products.fields.name') }}</span>
          <input v-model="filters.products.name" type="text" />
        </label>
        <label class="field">
          <span>{{ $t('reports.stockFrom') }}</span>
          <input v-model.number="filters.products.stockFrom" type="number" min="0" />
        </label>
        <label class="field">
          <span>{{ $t('reports.stockTo') }}</span>
          <input v-model.number="filters.products.stockTo" type="number" min="0" />
        </label>
        <label class="field">
          <span>{{ $t('reports.valueFrom') }}</span>
          <input v-model.number="filters.products.priceFrom" type="number" min="0" step="0.01" />
        </label>
        <label class="field">
          <span>{{ $t('reports.valueTo') }}</span>
          <input v-model.number="filters.products.priceTo" type="number" min="0" step="0.01" />
        </label>
      </div>
      <div class="stats">
        <article class="stat"><span>{{ $t('reports.total') }}</span><strong>{{ summary.products.total }}</strong></article>
        <article class="stat"><span>{{ $t('reports.active') }}</span><strong>{{ summary.products.active }}</strong></article>
        <article class="stat"><span>{{ $t('reports.inactive') }}</span><strong>{{ summary.products.inactive }}</strong></article>
        <article class="stat"><span>{{ $t('reports.lowStock') }}</span><strong>{{ summary.products.lowStock }}</strong></article>
        <article class="stat">
          <span>{{ $t('reports.inventoryValue') }}</span>
          <strong>{{ formatCurrency(summary.products.inventoryValue) }}</strong>
        </article>
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>{{ $t('products.fields.name') }}</th>
              <th>SKU</th>
              <th>{{ $t('products.fields.stock') }}</th>
              <th>{{ $t('products.fields.price') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in summary.products.lowStockItems" :key="item.id">
              <td>{{ item.name }}</td>
              <td>{{ item.sku }}</td>
              <td>{{ item.stockQty }}</td>
              <td>{{ formatCurrency(item.price) }}</td>
            </tr>
            <tr v-if="!summary.products.lowStockItems.length"><td colspan="4">-</td></tr>
          </tbody>
        </table>
      </div>
    </section>

    <section class="panel">
      <div class="panel-head">
        <h3>{{ $t('reports.sales') }}</h3>
        <button type="button" class="primary" :disabled="loading" @click="loadReports">
          {{ $t('reports.apply') }}
        </button>
      </div>
      <div class="filters">
        <label class="field">
          <span>{{ $t('reports.dateFrom') }}</span>
          <input v-model="filters.sales.dateFrom" type="date" />
        </label>
        <label class="field">
          <span>{{ $t('reports.dateTo') }}</span>
          <input v-model="filters.sales.dateTo" type="date" />
        </label>
        <label class="field">
          <span>{{ $t('reports.valueFrom') }}</span>
          <input v-model.number="filters.sales.valueFrom" type="number" min="0" step="0.01" />
        </label>
        <label class="field">
          <span>{{ $t('reports.valueTo') }}</span>
          <input v-model.number="filters.sales.valueTo" type="number" min="0" step="0.01" />
        </label>
        <label class="field">
          <span>{{ $t('sales.fields.client') }}</span>
          <select v-model="filters.sales.clientId">
            <option value="">{{ $t('reports.all') }}</option>
            <option v-for="client in clients" :key="client.id" :value="client.id">{{ client.fullName }}</option>
          </select>
        </label>
      </div>
      <div class="stats">
        <article class="stat"><span>{{ $t('reports.total') }}</span><strong>{{ summary.sales.total }}</strong></article>
        <article class="stat">
          <span>{{ $t('reports.totalRevenue') }}</span>
          <strong>{{ formatCurrency(summary.sales.totalRevenue) }}</strong>
        </article>
        <article class="stat">
          <span>{{ $t('reports.averageTicket') }}</span>
          <strong>{{ formatCurrency(summary.sales.averageTicket) }}</strong>
        </article>
      </div>
      <div class="chips">
        <span v-for="status in summary.sales.byStatus" :key="status.status" class="chip">{{ status.status }}: {{ status.count }}</span>
        <span v-if="!summary.sales.byStatus.length" class="chip">-</span>
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>{{ $t('sales.fields.id') }}</th>
              <th>{{ $t('sales.fields.createdAt') }}</th>
              <th>{{ $t('sales.fields.status') }}</th>
              <th>{{ $t('sales.fields.quantity') }}</th>
              <th>{{ $t('sales.fields.total') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in summary.sales.recent" :key="item.id">
              <td>#{{ item.id.slice(-6).toUpperCase() }}</td>
              <td>{{ formatDate(item.createdAt) }}</td>
              <td>{{ item.status }}</td>
              <td>{{ item.itemsCount }}</td>
              <td>{{ formatCurrency(item.total) }}</td>
            </tr>
            <tr v-if="!summary.sales.recent.length"><td colspan="5">-</td></tr>
          </tbody>
        </table>
      </div>
    </section>

    <section class="panel">
      <div class="panel-head">
        <h3>{{ $t('reports.clients') }}</h3>
        <button type="button" class="primary" :disabled="loading" @click="loadReports">
          {{ $t('reports.apply') }}
        </button>
      </div>
      <div class="filters">
        <label class="field">
          <span>{{ $t('clients.fields.active') }}</span>
          <select v-model="filters.clients.active">
            <option value="">{{ $t('reports.all') }}</option>
            <option value="true">{{ $t('common.yes') }}</option>
            <option value="false">{{ $t('common.no') }}</option>
          </select>
        </label>
        <label class="field">
          <span>{{ $t('clients.fields.fullName') }}</span>
          <input v-model="filters.clients.name" type="text" />
        </label>
        <label class="field">
          <span>{{ $t('clients.fields.email') }}</span>
          <input v-model="filters.clients.email" type="text" />
        </label>
        <label class="field">
          <span>{{ $t('clients.fields.phone') }}</span>
          <input v-model="filters.clients.phone" type="text" />
        </label>
      </div>
      <div class="stats">
        <article class="stat"><span>{{ $t('reports.total') }}</span><strong>{{ summary.clients.total }}</strong></article>
        <article class="stat"><span>{{ $t('reports.active') }}</span><strong>{{ summary.clients.active }}</strong></article>
        <article class="stat"><span>{{ $t('reports.inactive') }}</span><strong>{{ summary.clients.inactive }}</strong></article>
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>{{ $t('clients.fields.fullName') }}</th>
              <th>{{ $t('clients.fields.phone') }}</th>
              <th>{{ $t('clients.fields.email') }}</th>
              <th>{{ $t('clients.fields.active') }}</th>
              <th>{{ $t('questionnaires.fields.createdAt') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in summary.clients.recent" :key="item.id">
              <td>{{ item.fullName }}</td>
              <td>{{ item.phone }}</td>
              <td>{{ item.email || '-' }}</td>
              <td>{{ item.active ? $t('common.yes') : $t('common.no') }}</td>
              <td>{{ formatDate(item.createdAt) }}</td>
            </tr>
            <tr v-if="!summary.clients.recent.length"><td colspan="5">-</td></tr>
          </tbody>
        </table>
      </div>
    </section>

    <section class="panel">
      <div class="panel-head">
        <h3>{{ $t('reports.appointments') }}</h3>
        <button type="button" class="primary" :disabled="loading" @click="loadReports">
          {{ $t('reports.apply') }}
        </button>
      </div>
      <div class="filters">
        <label class="field">
          <span>{{ $t('reports.dateFrom') }}</span>
          <input v-model="filters.appointments.dateFrom" type="date" />
        </label>
        <label class="field">
          <span>{{ $t('reports.dateTo') }}</span>
          <input v-model="filters.appointments.dateTo" type="date" />
        </label>
        <label class="field">
          <span>{{ $t('appointments.fields.status') }}</span>
          <select v-model="filters.appointments.status">
            <option value="">{{ $t('reports.all') }}</option>
            <option value="SCHEDULED">{{ $t('appointments.statuses.SCHEDULED') }}</option>
            <option value="IN_PROGRESS">{{ $t('appointments.statuses.IN_PROGRESS') }}</option>
            <option value="COMPLETED">{{ $t('appointments.statuses.COMPLETED') }}</option>
            <option value="CANCELED">{{ $t('appointments.statuses.CANCELED') }}</option>
          </select>
        </label>
        <label class="field">
          <span>{{ $t('appointments.fields.client') }}</span>
          <select v-model="filters.appointments.clientId">
            <option value="">{{ $t('reports.all') }}</option>
            <option v-for="client in clients" :key="client.id" :value="client.id">{{ client.fullName }}</option>
          </select>
        </label>
      </div>
      <div class="stats">
        <article class="stat"><span>{{ $t('reports.total') }}</span><strong>{{ summary.appointments.total }}</strong></article>
        <article class="stat"><span>{{ $t('reports.upcoming') }}</span><strong>{{ summary.appointments.upcoming }}</strong></article>
      </div>
      <div class="chips">
        <span v-for="status in summary.appointments.byStatus" :key="status.status" class="chip">{{ status.status }}: {{ status.count }}</span>
        <span v-if="!summary.appointments.byStatus.length" class="chip">-</span>
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>{{ $t('appointments.fields.client') }}</th>
              <th>{{ $t('appointments.fields.scheduledAt') }}</th>
              <th>{{ $t('appointments.fields.status') }}</th>
              <th>{{ $t('questionnaires.fields.createdAt') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in summary.appointments.recent" :key="item.id">
              <td>{{ item.clientName }}</td>
              <td>{{ formatDate(item.scheduledAt) }}</td>
              <td>{{ item.status }}</td>
              <td>{{ formatDate(item.createdAt) }}</td>
            </tr>
            <tr v-if="!summary.appointments.recent.length"><td colspan="4">-</td></tr>
          </tbody>
        </table>
      </div>
    </section>

    <p v-if="error" class="error">{{ error }}</p>
  </section>
</template>

<script lang="ts">
import { Component, Vue, toNative } from 'vue-facing-decorator';
import { apiGet } from '../services/api';
import { useAuthStore } from '../stores/auth';
import type { ReportsSummary } from '../types/reports';
import type { ClientListResponse } from '../types/client';
import { i18n } from '../i18n';

const EMPTY_SUMMARY: ReportsSummary = {
  products: { total: 0, active: 0, inactive: 0, lowStock: 0, inventoryValue: 0, lowStockItems: [] },
  sales: { total: 0, totalRevenue: 0, averageTicket: 0, byStatus: [], recent: [] },
  clients: { total: 0, active: 0, inactive: 0, createdInPeriod: 0, recent: [] },
  appointments: { total: 0, upcoming: 0, byStatus: [], recent: [] }
};

@Component({})
class ReportsView extends Vue {
  authStore = useAuthStore();
  loading = false;
  error = '';
  summary: ReportsSummary = { ...EMPTY_SUMMARY };
  clients: ClientListResponse['items'] = [];

  filters = {
    products: {
      name: '',
      stockFrom: undefined as number | undefined,
      stockTo: undefined as number | undefined,
      priceFrom: undefined as number | undefined,
      priceTo: undefined as number | undefined
    },
    sales: {
      dateFrom: '',
      dateTo: '',
      valueFrom: undefined as number | undefined,
      valueTo: undefined as number | undefined,
      clientId: ''
    },
    clients: {
      active: '',
      name: '',
      email: '',
      phone: ''
    },
    appointments: {
      dateFrom: '',
      dateTo: '',
      status: '',
      clientId: ''
    }
  };

  mounted() {
    this.setCurrentMonthRanges();
    void this.loadClients();
    void this.loadReports();
  }

  setCurrentMonthRanges() {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const from = this.toDateInput(start);
    const to = this.toDateInput(now);
    this.filters.sales.dateFrom = from;
    this.filters.sales.dateTo = to;
    this.filters.appointments.dateFrom = from;
    this.filters.appointments.dateTo = to;
  }

  toDateInput(date: Date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  async loadClients() {
    try {
      const result = await apiGet<ClientListResponse>(
        '/clients?page=1&limit=100&sortBy=createdAt&sortOrder=desc',
        this.authStore.token
      );
      this.clients = result.items;
    } catch {
      this.clients = [];
    }
  }

  async loadReports() {
    this.loading = true;
    this.error = '';
    try {
      const query = new URLSearchParams();

      if (this.filters.products.name.trim()) query.set('productsName', this.filters.products.name.trim());
      if (typeof this.filters.products.stockFrom === 'number' && Number.isFinite(this.filters.products.stockFrom)) {
        query.set('productsStockFrom', String(this.filters.products.stockFrom));
      }
      if (typeof this.filters.products.stockTo === 'number' && Number.isFinite(this.filters.products.stockTo)) {
        query.set('productsStockTo', String(this.filters.products.stockTo));
      }
      if (typeof this.filters.products.priceFrom === 'number' && Number.isFinite(this.filters.products.priceFrom)) {
        query.set('productsPriceFrom', String(this.filters.products.priceFrom));
      }
      if (typeof this.filters.products.priceTo === 'number' && Number.isFinite(this.filters.products.priceTo)) {
        query.set('productsPriceTo', String(this.filters.products.priceTo));
      }

      if (this.filters.sales.dateFrom) query.set('salesDateFrom', this.filters.sales.dateFrom);
      if (this.filters.sales.dateTo) query.set('salesDateTo', this.filters.sales.dateTo);
      if (typeof this.filters.sales.valueFrom === 'number' && Number.isFinite(this.filters.sales.valueFrom)) {
        query.set('salesValueFrom', String(this.filters.sales.valueFrom));
      }
      if (typeof this.filters.sales.valueTo === 'number' && Number.isFinite(this.filters.sales.valueTo)) {
        query.set('salesValueTo', String(this.filters.sales.valueTo));
      }
      if (this.filters.sales.clientId) query.set('salesClientId', this.filters.sales.clientId);

      if (this.filters.clients.active) query.set('clientsActive', this.filters.clients.active);
      if (this.filters.clients.name.trim()) query.set('clientsName', this.filters.clients.name.trim());
      if (this.filters.clients.email.trim()) query.set('clientsEmail', this.filters.clients.email.trim());
      if (this.filters.clients.phone.trim()) query.set('clientsPhone', this.filters.clients.phone.trim());

      if (this.filters.appointments.dateFrom) query.set('appointmentsDateFrom', this.filters.appointments.dateFrom);
      if (this.filters.appointments.dateTo) query.set('appointmentsDateTo', this.filters.appointments.dateTo);
      if (this.filters.appointments.status) query.set('appointmentsStatus', this.filters.appointments.status);
      if (this.filters.appointments.clientId) query.set('appointmentsClientId', this.filters.appointments.clientId);

      const suffix = query.toString() ? `?${query.toString()}` : '';
      this.summary = await apiGet<ReportsSummary>(`/reports/summary${suffix}`, this.authStore.token);
    } catch (err) {
      this.summary = { ...EMPTY_SUMMARY };
      this.error = err instanceof Error ? err.message : this.$t('reports.error');
    } finally {
      this.loading = false;
    }
  }

  formatDate(value?: string) {
    if (!value) return '-';
    return new Date(value).toLocaleString();
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
export default toNative(ReportsView);
</script>

<style scoped>
.reports {
  display: grid;
  gap: 1rem;
}

.reports-header h2 {
  margin: 0 0 0.35rem;
}

.reports-header p {
  margin: 0;
  color: var(--muted);
}

.panel {
  border: 1px solid var(--border);
  border-radius: 14px;
  background: var(--panel);
  padding: 1rem;
  display: grid;
  gap: 0.85rem;
}

.panel-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.8rem;
}

.panel h3 {
  margin: 0;
}

.filters {
  display: grid;
  gap: 0.75rem;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
}

.field {
  display: grid;
  gap: 0.3rem;
  font-weight: 500;
}

.field input,
.field select {
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 0.55rem 0.7rem;
  background: #fffdf9;
}

.hint {
  margin: 0;
  color: var(--muted);
  font-size: 0.85rem;
  align-self: end;
}

.stats {
  display: grid;
  gap: 0.75rem;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
}

.stat {
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 0.65rem 0.75rem;
  display: grid;
  gap: 0.2rem;
  background: var(--panel-strong);
}

.stat span {
  color: var(--muted);
  font-size: 0.85rem;
}

.stat strong {
  font-size: 1.1rem;
}

.chips {
  display: flex;
  gap: 0.45rem;
  flex-wrap: wrap;
}

.chip {
  border: 1px solid var(--border);
  border-radius: 999px;
  padding: 0.25rem 0.65rem;
  font-size: 0.82rem;
  background: var(--panel-strong);
}

.table-wrap {
  overflow: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th,
td {
  border-bottom: 1px solid var(--border);
  text-align: left;
  padding: 0.6rem;
  white-space: nowrap;
}

thead th {
  font-weight: 600;
  color: var(--muted);
}

.primary {
  padding: 0.6rem 1rem;
  border-radius: 10px;
  border: none;
  background: var(--primary);
  color: var(--primary-ink);
  font-weight: 600;
  cursor: pointer;
}

.error {
  margin: 0;
  color: #b42318;
  background: #fff1ef;
  border: 1px solid #ffd4ce;
  border-radius: 10px;
  padding: 0.75rem;
}
</style>
