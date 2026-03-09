<template>
  <section class="users">
    <header class="users-header">
      <div>
        <h2>{{ $t('users.title') }}</h2>
        <p>{{ $t('users.subtitle') }}</p>
      </div>
      <div class="actions">
        <InputText v-model="filters.global.value" :placeholder="$t('users.search')" />
        <button type="button" class="primary" @click="openNew">
          {{ $t('users.new') }}
        </button>
      </div>
    </header>

    <section class="preferences">
      <h3>{{ $t('users.preferences') }}</h3>
      <div class="prefs-grid">
        <label class="field">
          <span>{{ $t('common.language') }}</span>
          <select v-model="selectedLocale">
            <option value="pt">PT</option>
            <option value="en">EN</option>
            <option value="es">ES</option>
          </select>
        </label>
        <label class="field">
          <span>{{ $t('users.theme') }}</span>
          <select v-model="selectedTheme">
            <option value="light">{{ $t('users.themeLight') }}</option>
            <option value="dark">{{ $t('users.themeDark') }}</option>
          </select>
        </label>
        <button type="button" class="primary" @click="savePreferences" :disabled="loading">
          {{ $t('users.savePreferences') }}
        </button>
      </div>
    </section>

    <DataTable
      :value="users"
      dataKey="id"
      :paginator="true"
      :rows="10"
      :filters="filters"
      :globalFilterFields="['name', 'email', 'role']"
      sortMode="multiple"
      responsiveLayout="scroll"
      class="table"
    >
      <Column field="name" :header="$t('users.fields.name')" sortable />
      <Column field="email" :header="$t('users.fields.email')" sortable />
      <Column field="role" :header="$t('users.fields.role')" sortable>
        <template #body="{ data }">
          {{ roleLabel(data.role) }}
        </template>
      </Column>
      <Column field="active" :header="$t('users.fields.active')" sortable>
        <template #body="{ data }">
          {{ data.active ? $t('common.yes') : $t('common.no') }}
        </template>
      </Column>
      <Column field="isProfessional" header="Profissional">
        <template #body="{ data }">
          {{ data.isProfessional ? $t('common.yes') : $t('common.no') }}
        </template>
      </Column>
      <Column :header="$t('users.actions')">
        <template #body="{ data }">
          <button type="button" class="icon-button" @click="openEdit(data)" :title="$t('users.edit')">
            <i class="pi pi-pencil" aria-hidden="true"></i>
          </button>
          <button
            type="button"
            class="icon-button danger"
            :disabled="isSelf(data.id)"
            @click="confirmDelete(data)"
            :title="$t('users.delete')"
          >
            <i class="pi pi-trash" aria-hidden="true"></i>
          </button>
        </template>
      </Column>
    </DataTable>

    <Dialog v-model:visible="dialogOpen" modal :header="dialogTitle" class="dialog">
      <form class="user-form" @submit.prevent="submitUser">
        <div class="grid">
          <label class="field">
            <span>{{ $t('users.fields.name') }}</span>
            <input v-model="form.name" type="text" />
          </label>
          <label class="field">
            <span>{{ $t('users.fields.email') }}</span>
            <input v-model="form.email" type="email" />
          </label>
          <label class="field">
            <span>{{ $t('users.fields.password') }}</span>
            <input v-model="form.password" type="password" :placeholder="passwordPlaceholder" />
          </label>
          <label class="field">
            <span>{{ $t('users.fields.role') }}</span>
            <select v-model="form.role">
              <option value="OPERATOR">{{ $t('roles.operator') }}</option>
              <option value="MANAGER">{{ $t('roles.manager') }}</option>
              <option value="ADMIN">{{ $t('roles.admin') }}</option>
              <option value="CLIENT">Cliente</option>
            </select>
          </label>
          <label class="field">
            <span>{{ $t('common.language') }}</span>
            <select v-model="form.locale">
              <option value="pt">PT</option>
              <option value="en">EN</option>
              <option value="es">ES</option>
            </select>
          </label>
          <label class="field">
            <span>{{ $t('users.theme') }}</span>
            <select v-model="form.theme">
              <option value="light">{{ $t('users.themeLight') }}</option>
              <option value="dark">{{ $t('users.themeDark') }}</option>
            </select>
          </label>
          <label class="field checkbox">
            <input v-model="form.active" type="checkbox" />
            <span>{{ $t('users.fields.active') }}</span>
          </label>
          <label v-if="form.role !== 'CLIENT'" class="field checkbox">
            <input v-model="form.isProfessional" type="checkbox" />
            <span>Profissional</span>
          </label>
        </div>
        <div class="dialog-actions">
          <button type="submit" class="primary" :disabled="loading">
            {{ editingId ? $t('users.update') : $t('users.create') }}
          </button>
          <button type="button" class="ghost" @click="closeDialog">
            {{ $t('users.cancel') }}
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
import { apiDelete, apiGet, apiPatch, apiPost, apiPut } from '../services/api';
import { useAuthStore } from '../stores/auth';
import type { User, UserInput, UserRole } from '../types/user';
import { applyPreferences } from '../services/preferences';
import ErrorCard from '../components/ErrorCard.vue';

@Component({ components: { DataTable, Column, Dialog, InputText, ErrorCard } })
class UsersView extends Vue {
  authStore = useAuthStore();
  confirm = useConfirm();
  loading = false;
  error = '';
  users: User[] = [];
  dialogOpen = false;
  editingId: string | null = null;
  filters = {
    global: { value: '', matchMode: FilterMatchMode.CONTAINS }
  };
  selectedLocale: 'pt' | 'en' | 'es' = 'pt';
  selectedTheme: 'light' | 'dark' = 'light';
  form: UserInput = {
    name: '',
    email: '',
    password: '',
    role: 'OPERATOR',
    active: true,
    isProfessional: false,
    locale: 'pt',
    theme: 'light'
  };

  mounted() {
    this.loadUsers();
    this.selectedLocale = this.authStore.locale;
    this.selectedTheme = this.authStore.theme;
  }

  get passwordPlaceholder() {
    return this.editingId ? this.$t('users.passwordOptional') : '';
  }

  get dialogTitle() {
    return this.editingId ? this.$t('users.edit') : this.$t('users.new');
  }

  async loadUsers() {
    this.loading = true;
    this.error = '';
    try {
      this.users = await apiGet<User[]>('/users', this.authStore.token);
    } catch (err) {
      this.error = this.extractErrorMessage(err) || this.$t('users.error');
    } finally {
      this.loading = false;
    }
  }

  async savePreferences() {
    this.loading = true;
    this.error = '';
    try {
      const payload = { locale: this.selectedLocale, theme: this.selectedTheme };
      await apiPatch('/users/me/preferences', payload, this.authStore.token);
      this.authStore.setPreferences(this.selectedLocale, this.selectedTheme);
      applyPreferences(this.selectedLocale, this.selectedTheme);
    } catch (err) {
      this.error = this.extractErrorMessage(err) || this.$t('users.error');
    } finally {
      this.loading = false;
    }
  }

  openNew() {
    this.editingId = null;
    this.form = {
      name: '',
      email: '',
      password: '',
      role: 'OPERATOR',
      active: true,
      isProfessional: false,
      locale: 'pt',
      theme: 'light'
    };
    this.dialogOpen = true;
  }

  openEdit(user: User) {
    this.editingId = user.id;
    this.form = {
      name: user.name,
      email: user.email,
      password: '',
      role: user.role,
      active: user.active,
      isProfessional: Boolean(user.isProfessional),
      locale: user.locale || 'pt',
      theme: user.theme || 'light'
    };
    this.dialogOpen = true;
  }

  closeDialog() {
    this.dialogOpen = false;
  }

  async submitUser() {
    this.loading = true;
    this.error = '';
    try {
      if (this.editingId) {
        await apiPut(`/users/${this.editingId}`, this.form, this.authStore.token);
      } else {
        await apiPost('/users', this.form, this.authStore.token);
      }
      await this.loadUsers();
      this.dialogOpen = false;
    } catch (err) {
      this.error = this.extractErrorMessage(err) || this.$t('users.error');
    } finally {
      this.loading = false;
    }
  }

  confirmDelete(user: User) {
    if (this.isSelf(user.id)) {
      this.error = this.$t('users.selfDelete');
      return;
    }
    this.confirm.require({
      message: this.$t('users.confirmDelete'),
      header: this.$t('users.delete'),
      acceptLabel: this.$t('common.confirm'),
      rejectLabel: this.$t('common.cancel'),
      accept: () => this.deleteUser(user)
    });
  }

  async deleteUser(user: User) {
    this.loading = true;
    this.error = '';
    try {
      await apiDelete(`/users/${user.id}`, this.authStore.token);
      await this.loadUsers();
    } catch (err) {
      this.error = this.extractErrorMessage(err) || this.$t('users.error');
    } finally {
      this.loading = false;
    }
  }

  roleLabel(role: UserRole) {
    const map: Record<UserRole, string> = {
      OPERATOR: this.$t('roles.operator'),
      MANAGER: this.$t('roles.manager'),
      ADMIN: this.$t('roles.admin'),
      CLIENT: 'Cliente'
    };
    return map[role];
  }

  isSelf(userId: string) {
    return this.authStore.userId === userId;
  }

  extractErrorMessage(error: unknown) {
    if (error instanceof Error) {
      return error.message;
    }
    return '';
  }
}
export default toNative(UsersView);
</script>

<style scoped>
.users {
  display: grid;
  gap: 1.5rem;
}

.users-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.users-header h2 {
  margin: 0 0 0.4rem;
  font-size: 1.8rem;
}

.users-header p {
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

.preferences {
  border-radius: 18px;
  border: 1px solid var(--border);
  background: var(--panel);
  padding: 1.2rem 1.5rem;
}

.preferences h3 {
  margin: 0 0 1rem;
  font-size: 1.1rem;
}

.prefs-grid {
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  align-items: end;
}

.table {
  border-radius: 18px;
  border: 1px solid var(--border);
  background: var(--panel);
}

.dialog {
  min-width: min(640px, 90vw);
}

.user-form {
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

.field input,
.field select {
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

</style>
