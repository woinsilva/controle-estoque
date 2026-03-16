<template>
  <section class="services-view">
    <header class="page-header">
      <div>
        <h2>Servicos</h2>
        <p>Cadastre servicos com duracao e valor.</p>
      </div>
      <button type="button" class="primary" @click="openNew">Novo servico</button>
    </header>

    <DataTable :value="services" dataKey="id" responsiveLayout="scroll" class="table">
      <Column field="name" header="Servico" />
      <Column field="durationMinutes" header="Duracao (min)" />
      <Column field="price" header="Valor">
        <template #body="{ data }">
          {{ formatCurrency(data.price) }}
        </template>
      </Column>
      <Column field="active" header="Ativo">
        <template #body="{ data }">
          {{ data.active ? $t('common.yes') : $t('common.no') }}
        </template>
      </Column>
      <Column header="Acoes">
        <template #body="{ data }">
          <button type="button" class="icon-button" @click="openEdit(data)">
            <i class="pi pi-pencil" aria-hidden="true"></i>
          </button>
          <button type="button" class="icon-button danger" @click="removeService(data.id)">
            <i class="pi pi-trash" aria-hidden="true"></i>
          </button>
        </template>
      </Column>
    </DataTable>

    <section class="mobile-list">
      <article v-for="service in services" :key="service.id" class="mobile-card">
        <div class="mobile-card-head">
          <div>
            <strong>{{ service.name }}</strong>
            <small>{{ service.description || 'Sem descricao' }}</small>
          </div>
          <span class="status-pill" :class="{ active: service.active }">
            {{ service.active ? $t('common.yes') : $t('common.no') }}
          </span>
        </div>
        <dl class="mobile-meta">
          <div>
            <dt>Duracao</dt>
            <dd>{{ service.durationMinutes }} min</dd>
          </div>
          <div>
            <dt>Valor</dt>
            <dd>{{ formatCurrency(service.price) }}</dd>
          </div>
        </dl>
        <div class="mobile-actions">
          <button type="button" class="icon-button" @click="openEdit(service)">
            <i class="pi pi-pencil" aria-hidden="true"></i>
          </button>
          <button type="button" class="icon-button danger" @click="removeService(service.id)">
            <i class="pi pi-trash" aria-hidden="true"></i>
          </button>
        </div>
      </article>
    </section>

    <Dialog v-model:visible="dialogOpen" modal :header="editingId ? 'Editar servico' : 'Novo servico'" class="dialog">
      <form class="form" @submit.prevent="submitService">
        <label class="field">
          <span>Nome</span>
          <input v-model="form.name" type="text" required />
        </label>
        <label class="field">
          <span>Descricao</span>
          <textarea v-model="form.description" rows="3"></textarea>
        </label>
        <label class="field">
          <span>Duracao (minutos)</span>
          <input v-model.number="form.durationMinutes" type="number" min="5" required />
        </label>
        <label class="field">
          <span>Valor</span>
          <input v-model.number="form.price" type="number" step="0.01" min="0" required />
        </label>
        <label class="field checkbox">
          <input v-model="form.active" type="checkbox" />
          <span>Ativo</span>
        </label>
        <div class="dialog-actions">
          <button type="submit" class="primary">Salvar</button>
          <button type="button" class="ghost" @click="dialogOpen = false">{{ $t('common.cancel') }}</button>
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
import { apiDelete, apiGet, apiPost, apiPut } from '../services/api';
import { useAuthStore } from '../stores/auth';
import type { Service, ServiceInput } from '../types/service';
import ErrorCard from '../components/ErrorCard.vue';

@Component({ components: { DataTable, Column, Dialog, ErrorCard } })
class ServicesView extends Vue {
  authStore = useAuthStore();
  services: Service[] = [];
  error = '';
  dialogOpen = false;
  editingId = '';
  form: ServiceInput = {
    name: '',
    description: '',
    durationMinutes: 60,
    price: 0,
    active: true
  };

  mounted() {
    void this.loadServices();
  }

  async loadServices() {
    try {
      this.services = await apiGet<Service[]>('/services', this.authStore.token);
    } catch (error) {
      this.error = error instanceof Error ? error.message : 'Nao foi possivel carregar os servicos.';
    }
  }

  openNew() {
    this.editingId = '';
    this.form = { name: '', description: '', durationMinutes: 60, price: 0, active: true };
    this.dialogOpen = true;
  }

  openEdit(service: Service) {
    this.editingId = service.id;
    this.form = {
      name: service.name,
      description: service.description || '',
      durationMinutes: service.durationMinutes,
      price: service.price,
      active: service.active
    };
    this.dialogOpen = true;
  }

  async submitService() {
    this.error = '';
    try {
      const payload = {
        ...this.form,
        name: this.form.name.trim(),
        description: this.form.description?.trim() || undefined
      };
      if (this.editingId) {
        await apiPut(`/services/${this.editingId}`, payload, this.authStore.token);
      } else {
        await apiPost('/services', payload, this.authStore.token);
      }
      this.dialogOpen = false;
      await this.loadServices();
    } catch (error) {
      this.error = error instanceof Error ? error.message : 'Nao foi possivel salvar o servico.';
    }
  }

  async removeService(id: string) {
    this.error = '';
    try {
      await apiDelete(`/services/${id}`, this.authStore.token);
      await this.loadServices();
    } catch (error) {
      this.error = error instanceof Error ? error.message : 'Nao foi possivel remover o servico.';
    }
  }

  formatCurrency(value: number) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  }
}
export default toNative(ServicesView);
</script>

<style scoped>
.services-view, .page-header, .form { display: grid; gap: 1rem; }
.page-header { grid-template-columns: 1fr auto; align-items: center; }
.page-header h2 { margin: 0; }
.page-header p { margin: 0; color: var(--muted); }
.table { border-radius: 18px; border: 1px solid var(--border); background: var(--panel); }
.mobile-list { display: none; }
.mobile-card { border: 1px solid var(--border); border-radius: 20px; background: rgba(255,255,255,0.78); padding: 1rem; display: grid; gap: 0.85rem; }
.mobile-card-head, .mobile-actions { display: flex; align-items: center; justify-content: space-between; gap: 0.75rem; }
.mobile-card-head small { color: var(--muted); }
.mobile-meta { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.8rem; margin: 0; }
.mobile-meta dt { color: var(--muted); font-size: 0.8rem; margin-bottom: 0.2rem; }
.mobile-meta dd { margin: 0; font-weight: 700; }
.status-pill { padding: 0.35rem 0.7rem; border-radius: 999px; background: var(--danger-soft); color: var(--danger); font-size: 0.78rem; font-weight: 800; }
.status-pill.active { background: var(--primary-soft); color: var(--primary-strong); }
.dialog { min-width: min(640px, 90vw); }
.field { display: grid; gap: 0.45rem; align-content: start; font-weight: 500; }
.field input, .field textarea { padding: 0.7rem 0.9rem; border-radius: 12px; border: 1px solid var(--border); background: #fffdf9; }
.field.checkbox { display: flex; align-items: center; gap: 0.6rem; }
.dialog-actions, .page-header { display: flex; gap: 0.75rem; }
.primary { padding: 0.6rem 1.1rem; border-radius: 12px; border: none; background: var(--primary); color: var(--primary-ink); font-weight: 600; cursor: pointer; }
.ghost { padding: 0.6rem 1.1rem; border-radius: 12px; border: 1px solid var(--border); background: transparent; color: var(--muted); cursor: pointer; }
.icon-button { border: 1px solid var(--border); background: var(--panel-strong); color: var(--primary); cursor: pointer; width: 32px; height: 32px; border-radius: 8px; display: inline-flex; align-items: center; justify-content: center; }
.icon-button.danger { color: #b42318; border-color: rgba(180, 35, 24, 0.4); }
@media (max-width: 760px) {
  .page-header, .dialog-actions { flex-direction: column; align-items: stretch; }
  .page-header > * { width: 100%; }
  .table { display: none; }
  .mobile-list { display: grid; gap: 0.85rem; }
}
</style>
