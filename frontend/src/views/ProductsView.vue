<template>
  <section class="products">
    <header class="products-header">
      <div>
        <h2>{{ $t('products.title') }}</h2>
        <p>{{ $t('products.subtitle') }}</p>
      </div>
      <button v-if="canManage" type="button" @click="toggleForm">
        {{ formOpen ? $t('products.closeForm') : $t('products.new') }}
      </button>
    </header>

    <form v-if="formOpen" class="product-form" @submit.prevent="onSubmit">
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
      <div class="actions">
        <button type="submit" :disabled="loading">
          {{ editingId ? $t('products.update') : $t('products.create') }}
        </button>
        <button type="button" class="secondary" @click="resetForm">
          {{ $t('products.cancel') }}
        </button>
      </div>
    </form>

    <div v-if="loading" class="loading">{{ $t('products.loading') }}</div>
    <div v-else class="table">
      <div class="table-head">
        <span>{{ $t('products.fields.name') }}</span>
        <span>SKU</span>
        <span>{{ $t('products.fields.price') }}</span>
        <span>{{ $t('products.fields.stock') }}</span>
        <span>{{ $t('products.fields.active') }}</span>
        <span v-if="canManage">{{ $t('products.actions') }}</span>
      </div>
      <div v-for="product in products" :key="product._id" class="table-row">
        <span>{{ product.name }}</span>
        <span>{{ product.sku }}</span>
        <span>{{ formatCurrency(product.price) }}</span>
        <span>{{ product.stockQty }}</span>
        <span>{{ product.active ? $t('common.yes') : $t('common.no') }}</span>
        <span v-if="canManage" class="row-actions">
          <button type="button" class="link" @click="editProduct(product)">
            {{ $t('products.edit') }}
          </button>
          <button
            v-if="canDelete"
            type="button"
            class="link danger"
            @click="deleteProduct(product)"
          >
            {{ $t('products.delete') }}
          </button>
        </span>
      </div>
    </div>
    <p v-if="error" class="error">{{ error }}</p>
  </section>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-facing-decorator';
import { i18n } from '../i18n';
import { useAuthStore } from '../stores/auth';
import { apiDelete, apiGet, apiPost, apiPut } from '../services/api';
import type { Product } from '../types/product';

type ProductInput = {
  name: string;
  sku: string;
  price: number;
  stockQty: number;
  active: boolean;
};

@Component({})
export default class ProductsView extends Vue {
  authStore = useAuthStore();
  products: Product[] = [];
  loading = false;
  error = '';
  formOpen = false;
  editingId: string | null = null;
  form: ProductInput = {
    name: '',
    sku: '',
    price: 0,
    stockQty: 0,
    active: true
  };
  barcode = '';
  priceDisplay = '';

  get canManage() {
    return ['MANAGER', 'ADMIN'].includes(this.authStore.role || '');
  }

  get canDelete() {
    return this.authStore.role === 'ADMIN';
  }

  mounted() {
    this.loadProducts();
  }

  async loadProducts() {
    this.loading = true;
    this.error = '';
    try {
      this.products = await apiGet<Product[]>('/products', this.authStore.token);
    } catch (err) {
      const message = this.extractErrorMessage(err);
      this.error = message || this.$t('products.error');
    } finally {
      this.loading = false;
    }
  }

  toggleForm() {
    this.formOpen = !this.formOpen;
    if (!this.formOpen) {
      this.resetForm();
    }
  }

  editProduct(product: Product) {
    this.formOpen = true;
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
  }

  resetForm() {
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
  }

  async onSubmit() {
    this.loading = true;
    this.error = '';
    try {
      if (this.editingId) {
        await apiPut(`/products/${this.editingId}`, this.form, this.authStore.token);
      } else {
        await apiPost('/products', this.form, this.authStore.token);
      }
      await this.loadProducts();
      this.resetForm();
      this.formOpen = false;
    } catch (err) {
      const message = this.extractErrorMessage(err);
      this.error = message || this.$t('products.error');
    } finally {
      this.loading = false;
    }
  }

  async deleteProduct(product: Product) {
    if (!confirm(this.$t('products.confirmDelete'))) {
      return;
    }
    this.loading = true;
    this.error = '';
    try {
      await apiDelete(`/products/${product._id}`, this.authStore.token);
      await this.loadProducts();
    } catch (err) {
      const message = this.extractErrorMessage(err);
      this.error = message || this.$t('products.error');
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
    const settings = currencyMap[locale] || currencyMap.pt;
    return new Intl.NumberFormat(settings.locale, {
      style: 'currency',
      currency: settings.currency
    }).format(value);
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
}
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

.products-header button {
  padding: 0.75rem 1.2rem;
  border-radius: 12px;
  border: none;
  background: var(--primary);
  color: var(--primary-ink);
  font-weight: 600;
  cursor: pointer;
}

.product-form {
  display: grid;
  gap: 1rem;
  padding: 1.5rem;
  border-radius: 18px;
  border: 1px solid var(--border);
  background: var(--panel);
}

.field {
  display: grid;
  gap: 0.5rem;
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

.actions {
  display: flex;
  gap: 0.75rem;
}

.actions button {
  padding: 0.75rem 1.2rem;
  border-radius: 12px;
  border: none;
  background: var(--primary);
  color: var(--primary-ink);
  font-weight: 600;
  cursor: pointer;
}

.actions button.secondary {
  background: transparent;
  border: 1px solid var(--border);
  color: var(--muted);
}

.table {
  border-radius: 18px;
  border: 1px solid var(--border);
  background: var(--panel);
  overflow: hidden;
}

.table-head,
.table-row {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr 1fr 1fr;
  padding: 0.9rem 1.2rem;
  gap: 1rem;
  align-items: center;
}

.table-head {
  background: #f7f2ea;
  font-weight: 600;
  color: var(--muted);
}

.table-row {
  border-top: 1px solid var(--border);
}

.row-actions {
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

.loading {
  color: var(--muted);
}

.error {
  color: #b42318;
  font-weight: 500;
}

@media (max-width: 900px) {
  .table-head,
  .table-row {
    grid-template-columns: 1fr;
  }

  .table-head span {
    display: none;
  }

  .table-row {
    gap: 0.35rem;
  }
}
</style>
