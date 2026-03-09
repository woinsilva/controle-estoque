<template>
  <section class="clients">
    <header class="clients-header">
      <div>
        <h2>{{ $t('clients.title') }}</h2>
        <p>{{ $t('clients.subtitle') }}</p>
      </div>
      <div class="actions">
        <InputText v-model="search" :placeholder="$t('clients.search')" @keyup.enter="loadClients(1)" />
        <button v-if="canManage" type="button" class="primary" @click="openNew">
          {{ $t('clients.new') }}
        </button>
      </div>
    </header>

    <DataTable
      :value="clients"
      dataKey="id"
      :paginator="true"
      :rows="rows"
      :first="first"
      :totalRecords="totalRecords"
      :loading="loading"
      :lazy="true"
      @page="onPage"
      class="table"
      responsiveLayout="scroll"
    >
      <Column field="fullName" :header="$t('clients.fields.fullName')" />
      <Column field="email" :header="$t('clients.fields.email')" />
      <Column field="phone" :header="$t('clients.fields.phone')">
        <template #body="{ data }">
          {{ formatPhoneValue(data.phone) }}
        </template>
      </Column>
      <Column field="birthDate" :header="$t('clients.fields.birthDate')">
        <template #body="{ data }">
          {{ formatDate(data.birthDate) }}
        </template>
      </Column>
      <Column field="active" :header="$t('clients.fields.active')">
        <template #body="{ data }">
          {{ data.active ? $t('common.yes') : $t('common.no') }}
        </template>
      </Column>
      <Column v-if="canManage" :header="$t('clients.actions')">
        <template #body="{ data }">
          <button type="button" class="icon-button" @click="openEdit(data)" :title="$t('clients.edit')">
            <i class="pi pi-pencil" aria-hidden="true"></i>
          </button>
          <button
            v-if="canDelete"
            type="button"
            class="icon-button danger"
            @click="confirmDelete(data)"
            :title="$t('clients.delete')"
          >
            <i class="pi pi-trash" aria-hidden="true"></i>
          </button>
        </template>
      </Column>
    </DataTable>

    <section class="mobile-list">
      <article v-for="client in clients" :key="client.id" class="mobile-card">
        <div class="mobile-card-head">
          <div>
            <strong>{{ client.fullName }}</strong>
            <small>{{ client.email || '-' }}</small>
          </div>
          <span class="status-pill" :class="{ active: client.active }">
            {{ client.active ? $t('common.yes') : $t('common.no') }}
          </span>
        </div>
        <dl class="mobile-meta">
          <div>
            <dt>{{ $t('clients.fields.phone') }}</dt>
            <dd>{{ formatPhoneValue(client.phone) }}</dd>
          </div>
          <div>
            <dt>{{ $t('clients.fields.birthDate') }}</dt>
            <dd>{{ formatDate(client.birthDate) }}</dd>
          </div>
        </dl>
        <div v-if="canManage" class="mobile-actions">
          <button type="button" class="icon-button" @click="openEdit(client)" :title="$t('clients.edit')">
            <i class="pi pi-pencil" aria-hidden="true"></i>
          </button>
          <button
            v-if="canDelete"
            type="button"
            class="icon-button danger"
            @click="confirmDelete(client)"
            :title="$t('clients.delete')"
          >
            <i class="pi pi-trash" aria-hidden="true"></i>
          </button>
        </div>
      </article>
    </section>

    <Dialog v-model:visible="dialogOpen" modal :header="dialogTitle" class="dialog">
      <form class="client-form" @submit.prevent="submitClient">
        <div class="grid">
          <label class="field">
            <span>{{ $t('clients.fields.fullName') }}</span>
            <input v-model="form.fullName" type="text" required />
          </label>
          <label class="field">
            <span>{{ $t('clients.fields.email') }}</span>
            <input v-model="form.email" type="email" required />
          </label>
          <label class="field">
            <span>{{ $t('clients.fields.phone') }}</span>
            <input :value="form.phone" type="text" required @input="onPhoneInput" />
          </label>
          <label class="field">
            <span>{{ $t('clients.fields.birthDate') }}</span>
            <input v-model="form.birthDate" type="date" />
          </label>
          <label class="field full">
            <span>{{ $t('clients.fields.notes') }}</span>
            <textarea v-model="form.notes" rows="3"></textarea>
          </label>
          <label class="field checkbox">
            <input v-model="form.active" type="checkbox" />
            <span>{{ $t('clients.fields.active') }}</span>
          </label>
        </div>
        <div class="dialog-actions">
          <button type="submit" class="primary" :disabled="loading">
            {{ editingId ? $t('clients.update') : $t('clients.create') }}
          </button>
          <button type="button" class="ghost" @click="closeDialog">
            {{ $t('clients.cancel') }}
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
import { useConfirm } from 'primevue/useconfirm';
import { apiDelete, apiGet, apiPost, apiPut } from '../services/api';
import { formatPhone } from '../services/phone';
import { useAuthStore } from '../stores/auth';
import type { Client, ClientInput, ClientListResponse } from '../types/client';
import ErrorCard from '../components/ErrorCard.vue';

@Component({ components: { DataTable, Column, Dialog, InputText, ErrorCard } })
class ClientsView extends Vue {
  authStore = useAuthStore();
  confirm = useConfirm();
  clients: Client[] = [];
  loading = false;
  error = '';
  dialogOpen = false;
  editingId: string | null = null;
  search = '';
  page = 1;
  rows = 10;
  totalRecords = 0;
  form: ClientInput = {
    fullName: '',
    email: '',
    phone: '',
    birthDate: '',
    notes: '',
    active: true
  };

  mounted() {
    this.loadClients();
  }

  get first() {
    return (this.page - 1) * this.rows;
  }

  get canManage() {
    return ['MANAGER', 'ADMIN'].includes(this.authStore.role || '');
  }

  get canDelete() {
    return this.authStore.role === 'ADMIN';
  }

  get dialogTitle() {
    return this.editingId ? this.$t('clients.edit') : this.$t('clients.new');
  }

  async loadClients(page?: number) {
    if (page) {
      this.page = page;
    }
    this.loading = true;
    this.error = '';
    try {
      const query = new URLSearchParams({
        page: String(this.page),
        limit: String(this.rows),
        sortBy: 'createdAt',
        sortOrder: 'desc'
      });
      if (this.search.trim()) {
        query.set('q', this.search.trim());
      }
      const response = await apiGet<ClientListResponse>(
        `/clients?${query.toString()}`,
        this.authStore.token
      );
      this.clients = response.items;
      this.totalRecords = response.total;
      this.page = response.page;
    } catch (err) {
      this.error = this.extractErrorMessage(err) || this.$t('clients.error');
    } finally {
      this.loading = false;
    }
  }

  onPage(event: { page: number; rows: number }) {
    this.rows = event.rows;
    this.loadClients(event.page + 1);
  }

  openNew() {
    this.editingId = null;
    this.form = {
      fullName: '',
      email: '',
      phone: '',
      birthDate: '',
      notes: '',
      active: true
    };
    this.dialogOpen = true;
  }

  openEdit(client: Client) {
    this.editingId = client.id;
    this.form = {
      fullName: client.fullName,
      email: client.email || '',
      phone: client.phone,
      birthDate: client.birthDate ? client.birthDate.slice(0, 10) : '',
      notes: client.notes || '',
      active: client.active
    };
    this.dialogOpen = true;
  }

  closeDialog() {
    this.dialogOpen = false;
  }

  onPhoneInput(event: Event) {
    const target = event.target as HTMLInputElement;
    this.form.phone = formatPhone(target.value);
  }

  async submitClient() {
    this.loading = true;
    this.error = '';
    const payload = {
      fullName: this.form.fullName.trim(),
      email: this.form.email.trim(),
      phone: this.form.phone.trim(),
      birthDate: this.form.birthDate || undefined,
      notes: this.form.notes?.trim() || undefined,
      active: this.form.active
    };
    try {
      if (this.editingId) {
        await apiPut(`/clients/${this.editingId}`, payload, this.authStore.token);
      } else {
        await apiPost('/clients', payload, this.authStore.token);
      }
      await this.loadClients();
      this.dialogOpen = false;
    } catch (err) {
      this.error = this.extractErrorMessage(err) || this.$t('clients.error');
    } finally {
      this.loading = false;
    }
  }

  confirmDelete(client: Client) {
    this.confirm.require({
      message: this.$t('clients.confirmDelete'),
      header: this.$t('clients.delete'),
      acceptLabel: this.$t('common.confirm'),
      rejectLabel: this.$t('common.cancel'),
      accept: () => this.deleteClient(client)
    });
  }

  async deleteClient(client: Client) {
    this.loading = true;
    this.error = '';
    try {
      await apiDelete(`/clients/${client.id}`, this.authStore.token);
      await this.loadClients();
    } catch (err) {
      this.error = this.extractErrorMessage(err) || this.$t('clients.error');
    } finally {
      this.loading = false;
    }
  }

  formatDate(value?: string) {
    if (!value) return '-';
    return new Date(value).toLocaleDateString();
  }

  formatPhoneValue(value?: string) {
    if (!value) return '-';
    return formatPhone(value);
  }

  extractErrorMessage(error: unknown) {
    if (error instanceof Error) {
      return error.message;
    }
    return '';
  }
}
export default toNative(ClientsView);
</script>

<style>
.clients {
  display: grid;
  gap: 1.5rem;
}

.clients-header {
  display: flex !important;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.clients-header h2 {
  margin: 0 0 0.4rem;
  font-size: 1.8rem;
}

.clients-header p {
  margin: 0;
  color: var(--muted);
}

.actions {
  display: flex;
  gap: 0.75rem;
  align-items: center;
}

.actions .p-inputtext {
  min-width: 220px;
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
  min-width: min(740px, 92vw);
}

.client-form {
  display: grid;
  gap: 1rem;
}

.grid {
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
}

.field {
  display: grid;
  gap: 0.5rem;
  font-weight: 500;
}

.field.full {
  grid-column: 1 / -1;
}

.field input,
.field textarea {
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

@media (max-width: 900px) {
  .clients-header {
    flex-direction: column;
    align-items: flex-start;
  }

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
