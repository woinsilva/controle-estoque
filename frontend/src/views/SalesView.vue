<template>
  <section class="sales">
    <header class="sales-header">
      <div>
        <h2>{{ $t('sales.title') }}</h2>
        <p>{{ $t('sales.subtitle') }}</p>
      </div>
      <div class="actions">
        <InputText v-model="filters.global.value" :placeholder="$t('sales.search')" />
        <button type="button" class="primary" @click="openNew">
          {{ $t('sales.new') }}
        </button>
      </div>
    </header>

    <DataTable
      :value="sales"
      dataKey="_id"
      :paginator="true"
      :rows="10"
      :filters="filters"
      :globalFilterFields="['_id', 'status']"
      sortMode="multiple"
      responsiveLayout="scroll"
      class="table"
    >
      <Column field="clientId" :header="$t('sales.fields.client')" sortable>
        <template #body="{ data }">
          {{ clientName(data.clientId) }}
        </template>
      </Column>
      <Column field="_id" :header="$t('sales.fields.id')" sortable />
      <Column field="status" :header="$t('sales.fields.status')" sortable />
      <Column field="total" :header="$t('sales.fields.total')" sortable>
        <template #body="{ data }">
          {{ formatCurrency(data.total) }}
        </template>
      </Column>
      <Column field="createdAt" :header="$t('sales.fields.createdAt')" sortable>
        <template #body="{ data }">
          {{ formatDate(data.createdAt) }}
        </template>
      </Column>
    </DataTable>

    <section class="mobile-list">
      <article v-for="sale in sales" :key="sale._id" class="mobile-card">
        <div class="mobile-card-head">
          <div>
            <strong>{{ clientName(sale.clientId) }}</strong>
            <small>{{ sale._id }}</small>
          </div>
          <span class="status-pill">{{ sale.status }}</span>
        </div>
        <dl class="mobile-meta">
          <div>
            <dt>{{ $t('sales.fields.total') }}</dt>
            <dd>{{ formatCurrency(sale.total) }}</dd>
          </div>
          <div>
            <dt>{{ $t('sales.fields.createdAt') }}</dt>
            <dd>{{ formatDate(sale.createdAt) }}</dd>
          </div>
        </dl>
      </article>
    </section>

    <Dialog v-model:visible="dialogOpen" modal :header="$t('sales.new')" class="dialog">
      <form class="sale-form" @submit.prevent="submitSale">
        <label class="field">
          <span>{{ $t('sales.fields.client') }}</span>
          <select v-model="selectedClientId">
            <option value="">{{ $t('sales.selectClient') }}</option>
            <option v-for="client in clients" :key="client.id" :value="client.id">
              {{ client.fullName }}
            </option>
          </select>
        </label>

        <div class="row">
          <label class="field">
            <span>{{ $t('sales.fields.product') }}</span>
            <select v-model="selectedProductId">
              <option value="">{{ $t('sales.selectProduct') }}</option>
              <option v-for="product in products" :key="product._id" :value="product._id">
                {{ product.name }} ({{ product.sku }})
              </option>
            </select>
          </label>
          <label class="field">
            <span>{{ $t('sales.fields.quantity') }}</span>
            <input v-model.number="selectedQty" type="number" min="1" step="1" />
          </label>
          <button type="button" class="ghost" @click="addItem">
            {{ $t('sales.addItem') }}
          </button>
        </div>

        <div v-if="items.length" class="items">
          <div class="items-head">
            <span>{{ $t('sales.fields.product') }}</span>
            <span>{{ $t('sales.fields.quantity') }}</span>
            <span>{{ $t('sales.fields.price') }}</span>
            <span>{{ $t('sales.fields.total') }}</span>
            <span>{{ $t('sales.actions') }}</span>
          </div>
          <div v-for="item in items" :key="item.productId" class="items-row">
            <span>{{ item.name }}</span>
            <span>{{ item.quantity }}</span>
            <span>{{ formatCurrency(item.unitPrice) }}</span>
            <span>{{ formatCurrency(item.total) }}</span>
            <button type="button" class="link danger" @click="removeItem(item.productId)">
              {{ $t('sales.remove') }}
            </button>
          </div>
          <div class="items-total">
            <span>{{ $t('sales.total') }}</span>
            <strong>{{ formatCurrency(itemsTotal) }}</strong>
          </div>
        </div>

        <div class="dialog-actions">
          <button type="submit" class="primary" :disabled="loading || !items.length">
            {{ $t('sales.create') }}
          </button>
          <button type="button" class="ghost" @click="closeDialog">
            {{ $t('sales.cancel') }}
          </button>
        </div>
      </form>
    </Dialog>

    <ErrorCard :message="error" />
  </section>
</template>

<script lang="ts">
import { Component, Vue, toNative } from 'vue-facing-decorator';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Dialog from 'primevue/dialog';
import InputText from 'primevue/inputtext';
import { FilterMatchMode } from '@primevue/core/api';
import { useAuthStore } from '../stores/auth';
import { apiGet, apiPost } from '../services/api';
import type { Product } from '../types/product';
import type { ClientListResponse } from '../types/client';
import type { Sale, SaleInput, SaleItemInput } from '../types/sale';
import { i18n } from '../i18n';
import ErrorCard from '../components/ErrorCard.vue';

type SaleItemView = {
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
};

@Component({ components: { DataTable, Column, Dialog, InputText, ErrorCard } })
class SalesView extends Vue {
  authStore = useAuthStore();
  products: Product[] = [];
  clients: ClientListResponse['items'] = [];
  sales: Sale[] = [];
  items: SaleItemView[] = [];
  selectedProductId = '';
  selectedClientId = '';
  selectedQty = 1;
  loading = false;
  error = '';
  dialogOpen = false;
  filters = {
    global: { value: '', matchMode: FilterMatchMode.CONTAINS }
  };

  mounted() {
    this.loadData();
  }

  get itemsTotal() {
    return this.items.reduce((sum, item) => sum + item.total, 0);
  }

  async loadData() {
    this.loading = true;
    this.error = '';
    try {
      const [products, sales] = await Promise.all([
        apiGet<Product[]>('/products', this.authStore.token),
        apiGet<Sale[]>('/sales', this.authStore.token)
      ]);
      const clients = await apiGet<ClientListResponse>(
        '/clients?page=1&limit=100&sortBy=fullName&sortOrder=asc',
        this.authStore.token
      );
      this.products = products;
      this.sales = sales;
      this.clients = clients.items;
    } catch (err) {
      this.error = this.extractErrorMessage(err) || this.$t('sales.error');
    } finally {
      this.loading = false;
    }
  }

  openNew() {
    this.dialogOpen = true;
    this.items = [];
    this.selectedClientId = '';
    this.selectedProductId = '';
    this.selectedQty = 1;
    this.error = '';
  }

  closeDialog() {
    this.dialogOpen = false;
  }

  addItem() {
    const product = this.products.find((item) => item._id === this.selectedProductId);
    if (!product || this.selectedQty <= 0) {
      this.error = this.$t('sales.invalidItem');
      return;
    }
    const existing = this.items.find((item) => item.productId === product._id);
    if (existing) {
      existing.quantity += this.selectedQty;
      existing.total = existing.unitPrice * existing.quantity;
    } else {
      this.items.push({
        productId: product._id,
        name: product.name,
        quantity: this.selectedQty,
        unitPrice: product.price,
        total: product.price * this.selectedQty
      });
    }
    this.selectedProductId = '';
    this.selectedQty = 1;
    this.error = '';
  }

  removeItem(productId: string) {
    this.items = this.items.filter((item) => item.productId !== productId);
  }

  async submitSale() {
    this.loading = true;
    this.error = '';
    const payload: SaleInput = {
      clientId: this.selectedClientId,
      items: this.items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity
      })) as SaleItemInput[]
    };
    try {
      if (!this.selectedClientId) {
        this.error = this.$t('sales.selectClient');
        this.loading = false;
        return;
      }
      await apiPost('/sales', payload, this.authStore.token);
      await this.loadData();
      this.dialogOpen = false;
    } catch (err) {
      this.error = this.extractErrorMessage(err) || this.$t('sales.error');
    } finally {
      this.loading = false;
    }
  }

  extractErrorMessage(error: unknown) {
    if (error instanceof Error) {
      return error.message;
    }
    return '';
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

  formatDate(value: string) {
    return new Date(value).toLocaleString();
  }

  clientName(clientId?: string) {
    if (!clientId) return '-';
    const client = this.clients.find((item) => item.id === clientId);
    return client?.fullName || clientId;
  }
}
export default toNative(SalesView);
</script>

<style scoped>
.sales {
  display: grid;
  gap: 1.5rem;
}

.sales-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.sales-header h2 {
  margin: 0 0 0.4rem;
  font-size: 1.8rem;
}

.sales-header p {
  margin: 0;
  color: var(--muted);
}

.actions {
  display: flex;
  gap: 0.75rem;
  align-items: center;
}

.primary {
  padding: 0.6rem 1.1rem;
  border-radius: 12px;
  border: none;
  background: var(--primary);
  color: var(--primary-ink);
  font-weight: 600;
  cursor: pointer;
}

.ghost {
  padding: 0.6rem 1.1rem;
  border-radius: 12px;
  border: 1px solid var(--border);
  background: transparent;
  color: var(--muted);
  cursor: pointer;
}

.table {
  border-radius: 18px;
  border: 1px solid var(--border);
  background: var(--panel);
}

.mobile-list {
  display: none;
}

.mobile-card {
  border: 1px solid var(--border);
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.78);
  padding: 1rem;
  display: grid;
  gap: 0.9rem;
}

.mobile-card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.mobile-card-head small {
  color: var(--muted);
}

.mobile-meta {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.8rem;
  margin: 0;
}

.mobile-meta dt {
  color: var(--muted);
  font-size: 0.8rem;
  margin-bottom: 0.2rem;
}

.mobile-meta dd {
  margin: 0;
  font-weight: 700;
}

.status-pill {
  padding: 0.35rem 0.7rem;
  border-radius: 999px;
  background: var(--primary-soft);
  color: var(--primary-strong);
  font-size: 0.78rem;
  font-weight: 800;
}

.dialog {
  min-width: min(760px, 92vw);
}

.sale-form {
  display: grid;
  gap: 1rem;
}

.row {
  display: grid;
  gap: 1rem;
  grid-template-columns: 2fr 1fr auto;
  align-items: end;
}

.field {
  display: grid;
  gap: 0.5rem;
  font-weight: 500;
}

.field input,
.field select {
  padding: 0.7rem 0.9rem;
  border-radius: 12px;
  border: 1px solid var(--border);
  background: #fffdf9;
}

.items {
  border: 1px solid var(--border);
  border-radius: 14px;
  overflow: hidden;
}

.items-head,
.items-row {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr auto;
  gap: 1rem;
  padding: 0.8rem 1rem;
  align-items: center;
}

.items-head {
  background: #f7f2ea;
  color: var(--muted);
  font-weight: 600;
}

.items-row {
  border-top: 1px solid var(--border);
}

.items-total {
  display: flex;
  justify-content: space-between;
  padding: 0.9rem 1rem;
  border-top: 1px solid var(--border);
  background: #fffdf8;
}

.dialog-actions {
  display: flex;
  gap: 0.75rem;
}

.link {
  border: none;
  background: transparent;
  color: var(--primary);
  cursor: pointer;
  padding: 0;
}

.link.danger {
  color: #b42318;
}

@media (max-width: 900px) {
  .sales-header,
  .actions,
  .dialog-actions {
    flex-direction: column;
    align-items: stretch;
  }

  .actions > * {
    width: 100%;
  }

  .row {
    grid-template-columns: 1fr;
  }

  .items-head {
    display: none;
  }

  .items-row {
    grid-template-columns: 1fr;
    gap: 0.4rem;
  }

  .table {
    display: none;
  }

  .mobile-list {
    display: grid;
    gap: 0.85rem;
  }
}
</style>
