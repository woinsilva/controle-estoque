<template>
  <section class="users">
    <header class="users-header">
      <div>
        <h2>{{ isAdmin ? $t('users.title') : $t('users.profileTitle') }}</h2>
        <p>{{ isAdmin ? $t('users.subtitle') : $t('users.profileSubtitle') }}</p>
      </div>
      <div v-if="isAdmin" class="actions">
        <InputText v-model="filters.global.value" :placeholder="$t('users.search')" />
        <button type="button" class="primary" @click="openNew">
          {{ $t('users.new') }}
        </button>
      </div>
    </header>

    <section v-if="!isAdmin && currentUser" class="profile-card">
      <h3>{{ $t('users.currentUser') }}</h3>
      <form class="user-form" @submit.prevent="saveOwnProfile">
        <div class="grid profile-form-grid">
          <label class="field" :class="{ invalid: Boolean(formErrors.name) }">
            <span>{{ $t('users.fields.name') }}</span>
            <input v-model="form.name" type="text" @blur="validateField('name')" />
            <small v-if="formErrors.name" class="field-error">{{ formErrors.name }}</small>
          </label>
          <label class="field" :class="{ invalid: Boolean(formErrors.email) }">
            <span>{{ $t('users.fields.email') }}</span>
            <input v-model="form.email" type="email" @blur="validateField('email')" />
            <small v-if="formErrors.email" class="field-error">{{ formErrors.email }}</small>
          </label>
          <label class="field" :class="{ invalid: Boolean(formErrors.password) }">
            <span>{{ $t('users.fields.password') }}</span>
            <input v-model="form.password" type="password" :placeholder="$t('users.passwordOptional')" @blur="validateField('password')" />
            <small v-if="formErrors.password" class="field-error">{{ formErrors.password }}</small>
          </label>
          <label class="field" :class="{ invalid: Boolean(formErrors.confirmPassword) }">
            <span>{{ $t('users.fields.confirmPassword') }}</span>
            <input v-model="confirmPassword" type="password" :placeholder="$t('users.passwordOptional')" @blur="validateField('confirmPassword')" />
            <small v-if="formErrors.confirmPassword" class="field-error">{{ formErrors.confirmPassword }}</small>
          </label>
          <label class="field">
            <span>{{ $t('common.language') }}</span>
            <AppSelect v-model="selectedLocale" :options="localeOptions" />
            <small class="field-error"></small>
          </label>
          <label class="field">
            <span>{{ $t('users.theme') }}</span>
            <AppSelect v-model="selectedTheme" :options="themeOptions" />
            <small class="field-error"></small>
          </label>
        </div>
        <div class="dialog-actions">
          <button type="submit" class="primary" :disabled="loading">
            {{ $t('users.saveProfile') }}
          </button>
        </div>
      </form>
    </section>

    <section v-if="isAdmin" class="preferences">
      <h3>{{ $t('users.preferences') }}</h3>
      <div class="prefs-grid">
        <label class="field">
          <span>{{ $t('common.language') }}</span>
          <AppSelect v-model="selectedLocale" :options="localeOptions" />
        </label>
        <label class="field">
          <span>{{ $t('users.theme') }}</span>
          <AppSelect v-model="selectedTheme" :options="themeOptions" />
        </label>
        <button v-if="isAdmin" type="button" class="primary" @click="savePreferences" :disabled="loading">
          {{ $t('users.savePreferences') }}
        </button>
      </div>
    </section>

    <DataTable
      v-if="isAdmin"
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

    <section v-if="isAdmin" class="mobile-list">
      <article v-for="user in users" :key="user.id" class="mobile-card">
        <div class="mobile-card-head">
          <div>
            <strong>{{ user.name }}</strong>
            <small>{{ user.email }}</small>
          </div>
          <span class="status-pill" :class="{ active: user.active }">
            {{ user.active ? $t('common.yes') : $t('common.no') }}
          </span>
        </div>
        <dl class="mobile-meta">
          <div>
            <dt>{{ $t('users.fields.role') }}</dt>
            <dd>{{ roleLabel(user.role) }}</dd>
          </div>
          <div>
            <dt>Profissional</dt>
            <dd>{{ user.isProfessional ? $t('common.yes') : $t('common.no') }}</dd>
          </div>
        </dl>
        <div class="mobile-actions">
          <button type="button" class="icon-button" @click="openEdit(user)" :title="$t('users.edit')">
            <i class="pi pi-pencil" aria-hidden="true"></i>
          </button>
          <button
            type="button"
            class="icon-button danger"
            :disabled="isSelf(user.id)"
            @click="confirmDelete(user)"
            :title="$t('users.delete')"
          >
            <i class="pi pi-trash" aria-hidden="true"></i>
          </button>
        </div>
      </article>
    </section>

    <Dialog v-if="isAdmin" v-model:visible="dialogOpen" modal :header="dialogTitle" class="dialog">
      <form class="user-form" @submit.prevent="submitUser">
        <div class="grid">
          <label class="field" :class="{ invalid: Boolean(formErrors.name) }">
            <span>{{ $t('users.fields.name') }}</span>
            <input v-model="form.name" type="text" @blur="validateField('name')" />
            <small v-if="formErrors.name" class="field-error">{{ formErrors.name }}</small>
          </label>
          <label class="field" :class="{ invalid: Boolean(formErrors.email) }">
            <span>{{ $t('users.fields.email') }}</span>
            <input v-model="form.email" type="email" @blur="validateField('email')" />
            <small v-if="formErrors.email" class="field-error">{{ formErrors.email }}</small>
          </label>
          <label class="field" :class="{ invalid: Boolean(formErrors.password) }">
            <span>{{ $t('users.fields.password') }}</span>
            <input v-model="form.password" type="password" :placeholder="passwordPlaceholder" @blur="validateField('password')" />
            <small v-if="formErrors.password" class="field-error">{{ formErrors.password }}</small>
          </label>
          <label class="field" :class="{ invalid: Boolean(formErrors.role) }">
            <span>{{ $t('users.fields.role') }}</span>
            <AppSelect v-model="form.role" :options="roleOptions" @change="validateField('role')" />
            <small v-if="formErrors.role" class="field-error">{{ formErrors.role }}</small>
          </label>
          <label class="field">
            <span>{{ $t('common.language') }}</span>
            <AppSelect v-model="form.locale" :options="localeOptions" />
          </label>
          <label class="field">
            <span>{{ $t('users.theme') }}</span>
            <AppSelect v-model="form.theme" :options="themeOptions" />
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
import { notify } from '../services/notifications';
import { useAuthStore } from '../stores/auth';
import type { User, UserInput, UserRole } from '../types/user';
import { applyPreferences } from '../services/preferences';
import AppSelect from '../components/AppSelect.vue';

type UserFormField = 'name' | 'email' | 'password' | 'confirmPassword' | 'role';

@Component({ components: { DataTable, Column, Dialog, InputText, AppSelect } })
class UsersView extends Vue {
  authStore = useAuthStore();
  confirm = useConfirm();
  loading = false;
  users: User[] = [];
  currentUser: User | null = null;
  dialogOpen = false;
  editingId: string | null = null;
  filters = {
    global: { value: '', matchMode: FilterMatchMode.CONTAINS }
  };
  selectedLocale: 'pt' | 'en' | 'es' = 'pt';
  selectedTheme: 'light' | 'dark' = 'light';
  formErrors: Partial<Record<UserFormField, string>> = {};
  confirmPassword = '';
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

  get isAdmin() {
    return this.authStore.role === 'ADMIN';
  }

  get passwordPlaceholder() {
    return this.editingId ? this.$t('users.passwordOptional') : '';
  }

  get dialogTitle() {
    return this.editingId ? this.$t('users.edit') : this.$t('users.new');
  }

  get localeOptions() {
    return [
      { label: 'PT', value: 'pt' },
      { label: 'EN', value: 'en' },
      { label: 'ES', value: 'es' }
    ];
  }

  get themeOptions() {
    return [
      { label: String(this.$t('users.themeLight')), value: 'light' },
      { label: String(this.$t('users.themeDark')), value: 'dark' }
    ];
  }

  get roleOptions() {
    return [
      { label: String(this.$t('roles.operator')), value: 'OPERATOR' },
      { label: String(this.$t('roles.manager')), value: 'MANAGER' },
      { label: String(this.$t('roles.admin')), value: 'ADMIN' },
      { label: 'Cliente', value: 'CLIENT' }
    ];
  }

  async loadUsers() {
    this.loading = true;
    try {
      if (this.isAdmin) {
        this.users = await apiGet<User[]>('/users', this.authStore.token);
        this.currentUser = null;
      } else {
        this.currentUser = await apiGet<User>('/users/me', this.authStore.token);
        this.users = [];
        this.form = {
          name: this.currentUser.name,
          email: this.currentUser.email,
          password: '',
          role: this.currentUser.role,
          active: this.currentUser.active,
          isProfessional: Boolean(this.currentUser.isProfessional),
          locale: this.currentUser.locale || this.selectedLocale,
          theme: this.currentUser.theme || this.selectedTheme
        };
        this.confirmPassword = '';
        this.formErrors = {};
      }
    } catch (err) {
      this.showError(this.extractErrorMessage(err) || this.$t('users.error'));
    } finally {
      this.loading = false;
    }
  }

  async savePreferences() {
    this.loading = true;
    try {
      const payload = { locale: this.selectedLocale, theme: this.selectedTheme };
      await apiPatch('/users/me/preferences', payload, this.authStore.token);
      this.authStore.setPreferences(this.selectedLocale, this.selectedTheme);
      applyPreferences(this.selectedLocale, this.selectedTheme);
    } catch (err) {
      this.showError(this.extractErrorMessage(err) || this.$t('users.error'));
    } finally {
      this.loading = false;
    }
  }

  async saveOwnProfile() {
    this.formErrors = this.validateOwnProfileForm();
    if (Object.keys(this.formErrors).length > 0) {
      this.showError(String(this.$t('users.validation.fixFields')));
      return;
    }

    this.loading = true;
    try {
      const payload = {
        name: this.form.name.trim(),
        email: this.form.email.trim(),
        password: this.form.password?.trim() || undefined,
        locale: this.selectedLocale,
        theme: this.selectedTheme
      };
      const updatedUser = await apiPatch<User>('/users/me', payload, this.authStore.token);
      this.currentUser = updatedUser;
      this.form = {
        name: updatedUser.name,
        email: updatedUser.email,
        password: '',
        role: updatedUser.role,
        active: updatedUser.active,
        isProfessional: Boolean(updatedUser.isProfessional),
        locale: updatedUser.locale || this.selectedLocale,
        theme: updatedUser.theme || this.selectedTheme
      };
      this.confirmPassword = '';
      this.authStore.setPreferences(this.selectedLocale, this.selectedTheme);
      applyPreferences(this.selectedLocale, this.selectedTheme);
    } catch (err) {
      const message = this.extractErrorMessage(err) || this.$t('users.error');
      this.applyApiFieldErrors(message);
      this.showError(message);
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
    this.confirmPassword = '';
    this.formErrors = {};
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
    this.confirmPassword = '';
    this.formErrors = {};
    this.dialogOpen = true;
  }

  closeDialog() {
    this.dialogOpen = false;
    this.confirmPassword = '';
    this.formErrors = {};
  }

  async submitUser() {
    this.formErrors = this.validateForm();
    if (Object.keys(this.formErrors).length > 0) {
      this.showError(String(this.$t('users.validation.fixFields')));
      return;
    }

    this.loading = true;
    try {
      if (this.editingId) {
        await apiPut(`/users/${this.editingId}`, this.form, this.authStore.token);
      } else {
        await apiPost('/users', this.form, this.authStore.token);
      }
      await this.loadUsers();
      this.dialogOpen = false;
    } catch (err) {
      const message = this.extractErrorMessage(err) || this.$t('users.error');
      this.applyApiFieldErrors(message);
      this.showError(message);
    } finally {
      this.loading = false;
    }
  }

  confirmDelete(user: User) {
    if (this.isSelf(user.id)) {
      this.showError(String(this.$t('users.selfDelete')));
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
    try {
      await apiDelete(`/users/${user.id}`, this.authStore.token);
      await this.loadUsers();
    } catch (err) {
      this.showError(this.extractErrorMessage(err) || this.$t('users.error'));
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

  validateField(field: UserFormField) {
    const nextErrors = { ...this.formErrors };
    const message = this.getFieldValidationMessage(field);
    if (message) {
      nextErrors[field] = message;
    } else {
      delete nextErrors[field];
    }
    this.formErrors = nextErrors;
  }

  validateForm() {
    const fields: UserFormField[] = ['name', 'email', 'password', 'role'];
    return fields.reduce<Partial<Record<UserFormField, string>>>((errors, field) => {
      const message = this.getFieldValidationMessage(field);
      if (message) {
        errors[field] = message;
      }
      return errors;
    }, {});
  }

  validateOwnProfileForm() {
    const fields: UserFormField[] = ['name', 'email', 'password', 'confirmPassword'];
    return fields.reduce<Partial<Record<UserFormField, string>>>((errors, field) => {
      const message = this.getFieldValidationMessage(field);
      if (message) {
        errors[field] = message;
      }
      return errors;
    }, {});
  }

  getFieldValidationMessage(field: UserFormField) {
    switch (field) {
      case 'name':
        if (!this.form.name.trim()) {
          return String(this.$t('users.validation.nameRequired'));
        }
        return '';
      case 'email':
        if (!this.form.email.trim()) {
          return String(this.$t('users.validation.emailRequired'));
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.form.email.trim())) {
          return String(this.$t('users.validation.emailInvalid'));
        }
        return '';
      case 'password':
        if (!this.editingId && !this.form.password?.trim()) {
          return String(this.$t('users.validation.passwordRequired'));
        }
        if (this.form.password?.trim() && this.form.password.trim().length < 6) {
          return String(this.$t('users.validation.passwordMin'));
        }
        return '';
      case 'confirmPassword':
        if (this.form.password?.trim() && !this.confirmPassword.trim()) {
          return String(this.$t('users.validation.confirmPasswordRequired'));
        }
        if (this.form.password?.trim() && this.form.password.trim() !== this.confirmPassword.trim()) {
          return String(this.$t('users.validation.passwordMismatch'));
        }
        return '';
      case 'role':
        if (!this.form.role) {
          return String(this.$t('users.validation.roleRequired'));
        }
        return '';
      default:
        return '';
    }
  }

  extractErrorMessage(error: unknown) {
    if (error instanceof Error) {
      return error.message;
    }
    return '';
  }

  applyApiFieldErrors(message: string) {
    const nextErrors = { ...this.formErrors };

    if (/email already in use/i.test(message)) {
      nextErrors.email = String(this.$t('users.validation.emailInUse'));
    }

    if (/password:/i.test(message) || /expected string to have >=6 characters/i.test(message)) {
      nextErrors.password = String(this.$t('users.validation.passwordMin'));
    }

    this.formErrors = nextErrors;
  }

  showError(message: string) {
    if (!message) {
      return;
    }

    notify({
      severity: 'error',
      summary: 'Erro',
      detail: message
    });
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

.profile-card {
  border-radius: 18px;
  border: 1px solid var(--border);
  background: var(--panel);
  padding: 1.2rem 1.5rem;
  display: grid;
  gap: 1rem;
}

.profile-card-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.profile-card-head h3,
.profile-card-head p {
  margin: 0;
}

.profile-card-head p {
  color: var(--muted);
  margin-top: 0.3rem;
}

.profile-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 1rem;
  margin: 0;
}

.profile-grid dt {
  color: var(--muted);
  font-size: 0.82rem;
  margin-bottom: 0.25rem;
}

.profile-grid dd {
  margin: 0;
  font-weight: 700;
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
  min-width: min(640px, 90vw);
}

.user-form {
  display: grid;
  gap: 1rem;
}

.grid {
  display: grid;
  gap: 1.4rem 1rem;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  align-items: start;
}

.profile-form-grid {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.field {
  display: grid;
  gap: 0.45rem;
  align-content: start;
  font-weight: 500;
}

.field input,
.field select {
  padding: 0.7rem 0.9rem;
  border-radius: 12px;
  border: 1px solid var(--border);
  background: #fffdf9;
}

.field.invalid input,
.field.invalid select {
  border-color: #f97316;
  box-shadow: 0 0 0 1px rgba(249, 115, 22, 0.18);
}

.field-error {
  color: #ef4444;
  font-size: 0.82rem;
  line-height: 1.3;
  min-height: 1.1rem;
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
  .users-header,
  .actions,
  .dialog-actions {
    flex-direction: column;
    align-items: stretch;
  }

  .actions > * {
    width: 100%;
  }

  .prefs-grid {
    grid-template-columns: 1fr;
  }

  .profile-form-grid {
    grid-template-columns: 1fr;
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
