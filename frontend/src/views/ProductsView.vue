<template>
  <section class="products">
    <header class="products-header">
      <div>
        <h2>{{ $t('products.title') }}</h2>
        <p>{{ $t('products.subtitle') }}</p>
      </div>
      <div class="actions">
        <InputText v-model="filters.global.value" :placeholder="$t('products.search')" />
        <button v-if="canManage" type="button" class="primary" @click="openNew">
          {{ $t('products.new') }}
        </button>
      </div>
    </header>

    <DataTable
      :value="products"
      dataKey="_id"
      :paginator="true"
      :rows="10"
      :filters="filters"
      :globalFilterFields="['name', 'sku']"
      sortMode="multiple"
      responsiveLayout="scroll"
      class="table"
    >
      <Column field="name" :header="$t('products.fields.name')" sortable />
      <Column field="sku" header="SKU" sortable />
      <Column field="price" :header="$t('products.fields.price')" sortable>
        <template #body="{ data }">
          {{ formatCurrency(data.price) }}
        </template>
      </Column>
      <Column field="stockQty" :header="$t('products.fields.stock')" sortable />
      <Column field="active" :header="$t('products.fields.active')" sortable>
        <template #body="{ data }">
          {{ data.active ? $t('common.yes') : $t('common.no') }}
        </template>
      </Column>
      <Column v-if="canManage" :header="$t('products.actions')">
        <template #body="{ data }">
          <button type="button" class="icon-button" @click="openEdit(data)" :title="$t('products.edit')">
            <i class="pi pi-pencil" aria-hidden="true"></i>
          </button>
          <button
            v-if="canDelete"
            type="button"
            class="icon-button danger"
            @click="confirmDelete(data)"
            :title="$t('products.delete')"
          >
            <i class="pi pi-trash" aria-hidden="true"></i>
          </button>
        </template>
      </Column>
    </DataTable>

    <section class="mobile-list">
      <article v-for="product in products" :key="product._id" class="mobile-card">
        <div class="mobile-card-head">
          <div>
            <strong>{{ product.name }}</strong>
            <small>SKU {{ product.sku }}</small>
          </div>
          <span class="status-pill" :class="{ active: product.active }">
            {{ product.active ? $t('common.yes') : $t('common.no') }}
          </span>
        </div>
        <dl class="mobile-meta">
          <div>
            <dt>{{ $t('products.fields.price') }}</dt>
            <dd>{{ formatCurrency(product.price) }}</dd>
          </div>
          <div>
            <dt>{{ $t('products.fields.stock') }}</dt>
            <dd>{{ product.stockQty }}</dd>
          </div>
        </dl>
        <div v-if="canManage" class="mobile-actions">
          <button type="button" class="icon-button" @click="openEdit(product)" :title="$t('products.edit')">
            <i class="pi pi-pencil" aria-hidden="true"></i>
          </button>
          <button
            v-if="canDelete"
            type="button"
            class="icon-button danger"
            @click="confirmDelete(product)"
            :title="$t('products.delete')"
          >
            <i class="pi pi-trash" aria-hidden="true"></i>
          </button>
        </div>
      </article>
    </section>

    <Dialog v-model:visible="dialogOpen" modal :header="dialogTitle" class="dialog">
      <form class="product-form" @submit.prevent="submitProduct">
        <div class="grid">
          <label class="field">
            <span>{{ $t('products.fields.name') }}</span>
            <input v-model="form.name" type="text" />
          </label>
          <label class="field">
            <span>{{ $t('products.fields.barcode') }}</span>
            <input v-model="barcode" type="text" inputmode="numeric" @input="onBarcodeInput" />
          </label>
          <label class="field">
            <span>{{ $t('products.fields.sku') }}</span>
            <input v-model="form.sku" type="text" />
          </label>
          <label class="field">
            <span>{{ $t('products.fields.price') }}</span>
            <input :value="priceDisplay" type="text" inputmode="decimal" @input="onPriceInput" />
          </label>
          <label class="field">
            <span>{{ $t('products.fields.stock') }}</span>
            <input v-model.number="form.stockQty" type="number" min="0" step="1" />
          </label>
          <label class="field checkbox">
            <input v-model="form.active" type="checkbox" />
            <span>{{ $t('products.fields.active') }}</span>
          </label>
        </div>
        <div class="dialog-actions">
          <button type="submit" class="primary" :disabled="loading">
            {{ editingId ? $t('products.update') : $t('products.create') }}
          </button>
          <button type="button" class="ghost" @click="closeDialog">
            {{ $t('products.cancel') }}
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
import { useConfirm } from 'primevue/useconfirm';
import { useAuthStore } from '../stores/auth';
import { apiDelete, apiGet, apiPost, apiPut } from '../services/api';
import type { Product } from '../types/product';
import { i18n } from '../i18n';
import ErrorCard from '../components/ErrorCard.vue';

type ProductInput = {
  name: string;
  sku: string;
  price: number;
  stockQty: number;
  active: boolean;
};

@Component({ components: { DataTable, Column, Dialog, InputText, ErrorCard } })
class ProductsView extends Vue {
  authStore = useAuthStore();
  confirm = useConfirm();
  products: Product[] = [];
  loading = false;
  error = '';
  dialogOpen = false;
  editingId: string | null = null;
  barcode = '';
  priceDisplay = '';
  filters = {
    global: { value: '', matchMode: FilterMatchMode.CONTAINS }
  };
  form: ProductInput = {
    name: '',
    sku: '',
    price: 0,
    stockQty: 0,
    active: true
  };

  mounted() {
    this.loadProducts();
  }

  get canManage() {
    return ['MANAGER', 'ADMIN'].includes(this.authStore.role || '');
  }

  get canDelete() {
    return this.authStore.role === 'ADMIN';
  }

  get dialogTitle() {
    return this.editingId ? this.$t('products.edit') : this.$t('products.new');
  }

  async loadProducts() {
    this.loading = true;
    this.error = '';
    try {
      this.products = await apiGet<Product[]>('/products', this.authStore.token);
    } catch (err) {
      this.error = this.extractErrorMessage(err) || this.$t('products.error');
    } finally {
      this.loading = false;
    }
  }

  openNew() {
    this.editingId = null;
    this.form = {
      name: '',
      sku: '',
      price: 0,
      stockQty: 0,
      active: true
    };
    this.barcode = '';
    this.priceDisplay = '';
    this.dialogOpen = true;
  }

  openEdit(product: Product) {
    this.editingId = product._id;
    this.form = {
      name: product.name,
      sku: product.sku,
      price: product.price,
      stockQty: product.stockQty,
      active: product.active
    };
    this.barcode = product.sku;
    this.priceDisplay = this.formatCurrency(product.price);
    this.dialogOpen = true;
  }

  closeDialog() {
    this.dialogOpen = false;
  }

  async submitProduct() {
    this.loading = true;
    this.error = '';
    try {
      if (this.editingId) {
        await apiPut(`/products/${this.editingId}`, this.form, this.authStore.token);
      } else {
        await apiPost('/products', this.form, this.authStore.token);
      }
      await this.loadProducts();
      this.dialogOpen = false;
    } catch (err) {
      this.error = this.extractErrorMessage(err) || this.$t('products.error');
    } finally {
      this.loading = false;
    }
  }

  confirmDelete(product: Product) {
    this.confirm.require({
      message: this.$t('products.confirmDelete'),
      header: this.$t('products.delete'),
      acceptLabel: this.$t('common.confirm'),
      rejectLabel: this.$t('common.cancel'),
      accept: () => this.deleteProduct(product)
    });
  }

  async deleteProduct(product: Product) {
    this.loading = true;
    this.error = '';
    try {
      await apiDelete(`/products/${product._id}`, this.authStore.token);
      await this.loadProducts();
    } catch (err) {
      this.error = this.extractErrorMessage(err) || this.$t('products.error');
    } finally {
      this.loading = false;
    }
  }

  onPriceInput(event: Event) {
    const target = event.target as HTMLInputElement;
    const digits = target.value.replace(/[^\d]/g, '');
    const parsed = digits ? Number(digits) / 100 : 0;
    this.form.price = parsed;
    this.priceDisplay = digits ? this.formatCurrency(parsed) : '';
  }

  onBarcodeInput(event: Event) {
    const target = event.target as HTMLInputElement;
    const value = target.value.trim();
    this.barcode = value;
    this.form.sku = value;
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

  extractErrorMessage(error: unknown) {
    if (error instanceof Error) {
      return error.message;
    }
    return '';
  }
}
export default toNative(ProductsView);
</script>

<style scoped>
.products {
  display: grid;
  gap: 1.5rem;
}

.products-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.products-header h2 {
  margin: 0 0 0.4rem;
  font-size: 1.8rem;
}

.products-header p {
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

.mobile-card-head,
.mobile-actions {
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
  background: var(--danger-soft);
  color: var(--danger);
  font-size: 0.78rem;
  font-weight: 800;
}

.status-pill.active {
  background: var(--primary-soft);
  color: var(--primary-strong);
}

.dialog {
  min-width: min(680px, 90vw);
}

.product-form {
  display: grid;
  gap: 1rem;
}

.grid {
  display: grid;
  gap: 1.4rem 1rem;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  align-items: start;
}

.field {
  display: grid;
  gap: 0.45rem;
  align-content: start;
  font-weight: 500;
}

.field input {
  padding: 0.7rem 0.9rem;
  border-radius: 12px;
  border: 1px solid var(--border);
  background: #fffdf9;
}

.field.checkbox {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.dialog-actions {
  display: flex;
  gap: 0.75rem;
}

.icon-button {
  border: 1px solid var(--border);
  background: var(--panel-strong);
  color: var(--primary);
  cursor: pointer;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.9rem;
}

.icon-button.danger {
  color: #b42318;
  border-color: rgba(180, 35, 24, 0.4);
}

@media (max-width: 760px) {
  .products-header,
  .actions,
  .dialog-actions {
    flex-direction: column;
    align-items: stretch;
  }

  .actions > * {
    width: 100%;
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
