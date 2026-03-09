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
    <div class="hint-card">
      <p class="hint">{{ $t('login.hint') }}</p>
    </div>
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
    } catch (error) {
      this.error = error instanceof Error ? error.message : (this.$t('login.error') as string);
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
  padding: 2.6rem;
  border-radius: 30px;
  background: rgba(255, 255, 255, 0.78);
  border: 1px solid var(--border);
  box-shadow: var(--shadow);
  backdrop-filter: blur(18px);
}

.login-head h2 {
  margin: 0.4rem 0;
  font-size: 2.2rem;
  letter-spacing: -0.04em;
}

.tag {
  color: var(--primary-strong);
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.16em;
  font-size: 0.7rem;
  margin: 0;
}

.subtitle {
  margin: 0;
  color: var(--muted);
  font-size: 0.98rem;
}

.login-form {
  display: grid;
  gap: 1.25rem;
  margin-top: 2rem;
}

.field {
  display: grid;
  gap: 0.5rem;
  font-weight: 700;
}

.field input {
  padding: 0.92rem 1rem;
  border-radius: 16px;
  border: 1px solid var(--border-strong);
  background: rgba(255, 255, 255, 0.88);
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
  padding: 0.95rem 1rem;
  border-radius: 16px;
  border: none;
  background: linear-gradient(135deg, var(--primary), #14a39a);
  color: var(--primary-ink);
  font-weight: 800;
  cursor: pointer;
  box-shadow: 0 16px 32px rgba(15, 118, 110, 0.2);
}

.error {
  margin-top: 1rem;
  color: var(--danger);
  font-weight: 700;
  background: var(--danger-soft);
  border: 1px solid rgba(185, 56, 47, 0.18);
  border-radius: 14px;
  padding: 0.85rem 1rem;
}

.hint-card {
  margin-top: 1.5rem;
  padding: 1rem 1.1rem;
  background: rgba(247, 250, 246, 0.82);
  border: 1px solid var(--border);
  border-radius: 18px;
}

.hint {
  margin: 0;
  font-size: 0.88rem;
  color: var(--muted);
}
</style>
