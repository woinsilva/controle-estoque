<template>
  <section class="login-card">
    <div class="login-head">
      <p class="tag">{{ $t('login.tag') }}</p>
      <h2>{{ $t('common.login') }}</h2>
      <p class="subtitle">{{ $t('login.subtitle') }}</p>
    </div>
    <form class="login-form" @submit.prevent="onSubmit">
      <label class="field">
        <span>{{ $t('login.email') }}</span>
        <input v-model="email" type="email" placeholder="voce@empresa.com" />
      </label>
      <label class="field">
        <span>{{ $t('login.password') }}</span>
        <input v-model="password" type="password" placeholder="••••••••" />
      </label>
      <label class="remember">
        <input v-model="rememberMe" type="checkbox" />
        <span>{{ $t('login.remember') }}</span>
      </label>
      <button type="submit" :disabled="isLoading">
        {{ isLoading ? $t('login.loading') : $t('login.button') }}
      </button>
    </form>
    <p class="hint">{{ $t('login.hint') }}</p>
    <p v-if="error" class="error">{{ error }}</p>
  </section>
</template>

<script lang="ts">
import { Component, Vue, toNative } from 'vue-facing-decorator';
import { apiPost } from '../services/api';
import { applyPreferences } from '../services/preferences';
import { useAuthStore } from '../stores/auth';
import type { UserRole } from '../types/user';

type LoginResponse = {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    clientId?: string | null;
    isProfessional?: boolean;
    locale?: 'pt' | 'en' | 'es';
    theme?: 'light' | 'dark';
  };
};

@Component({})
class LoginView extends Vue {
  email = '';
  password = '';
  rememberMe = true;
  isLoading = false;
  error = '';
  authStore = useAuthStore();

  async onSubmit() {
    this.error = '';
    this.isLoading = true;
    try {
      const result = await apiPost<LoginResponse>('/auth/login', {
        email: this.email,
        password: this.password
      });
      const locale = result.user.locale || 'pt';
      const theme = result.user.theme || 'light';
      this.authStore.setSession(
        result.token,
        result.user.role,
        result.user.id,
        result.user.clientId || null,
        Boolean(result.user.isProfessional),
        this.rememberMe,
        locale,
        theme
      );
      applyPreferences(locale, theme);
      await this.$router.push('/app');
    } catch {
      this.error = this.$t('login.error');
    } finally {
      this.isLoading = false;
    }
  }
}
export default toNative(LoginView);
</script>

<style scoped>
.login-card {
  width: min(420px, 100%);
  padding: 2.5rem;
  border-radius: 24px;
  background: var(--panel);
  border: 1px solid var(--border);
  box-shadow: var(--shadow);
}

.login-head h2 {
  margin: 0.4rem 0;
  font-size: 2rem;
}

.tag {
  color: var(--primary);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  font-size: 0.7rem;
  margin: 0;
}

.subtitle {
  margin: 0;
  color: var(--muted);
}

.login-form {
  display: grid;
  gap: 1.25rem;
  margin-top: 2rem;
}

.field {
  display: grid;
  gap: 0.5rem;
  font-weight: 500;
}

.field input {
  padding: 0.75rem 0.9rem;
  border-radius: 12px;
  border: 1px solid var(--border);
  background: #fffdf9;
}

.remember {
  display: flex;
  gap: 0.6rem;
  align-items: center;
  color: var(--muted);
  font-weight: 500;
}

.remember input {
  width: 18px;
  height: 18px;
}

button {
  padding: 0.85rem 1rem;
  border-radius: 14px;
  border: none;
  background: var(--primary);
  color: var(--primary-ink);
  font-weight: 600;
  cursor: pointer;
}

.error {
  margin-top: 1rem;
  color: #b42318;
  font-weight: 500;
}

.hint {
  margin-top: 1.5rem;
  font-size: 0.85rem;
  color: var(--muted);
}
</style>
