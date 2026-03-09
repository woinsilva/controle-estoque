<template>
  <section class="activation-card">
    <div class="activation-head">
      <p class="tag">{{ $t('activate.tag') }}</p>
      <h2>{{ $t('activate.title') }}</h2>
      <p class="subtitle">{{ $t('activate.subtitle') }}</p>
    </div>

    <form v-if="!isSuccess" class="activation-form" @submit.prevent="onSubmit">
      <label class="field">
        <span>{{ $t('activate.password') }}</span>
        <input v-model="password" type="password" autocomplete="new-password" />
      </label>
      <label class="field">
        <span>{{ $t('activate.confirmPassword') }}</span>
        <input v-model="confirmPassword" type="password" autocomplete="new-password" />
      </label>
      <button type="submit" :disabled="isLoading || !token">
        {{ isLoading ? $t('activate.loading') : $t('activate.button') }}
      </button>
    </form>

    <p v-if="!token" class="error">{{ $t('activate.invalidToken') }}</p>
    <p v-else-if="error" class="error">{{ error }}</p>
    <p v-if="isSuccess" class="success">{{ $t('activate.success') }}</p>

    <RouterLink class="back-link" to="/login">{{ $t('activate.backToLogin') }}</RouterLink>
  </section>
</template>

<script lang="ts">
import { Component, Vue, toNative } from 'vue-facing-decorator';
import { RouterLink } from 'vue-router';
import { apiPost } from '../services/api';

@Component({
  components: {
    RouterLink
  }
})
class ActivateAccountView extends Vue {
  token = '';
  password = '';
  confirmPassword = '';
  isLoading = false;
  isSuccess = false;
  error = '';

  mounted() {
    const token = this.$route.query.token;
    this.token = typeof token === 'string' ? token : '';
  }

  async onSubmit() {
    this.error = '';
    if (!this.token) {
      this.error = this.$t('activate.invalidToken') as string;
      return;
    }
    if (this.password.length < 6) {
      this.error = this.$t('activate.passwordMinLength') as string;
      return;
    }
    if (this.password !== this.confirmPassword) {
      this.error = this.$t('activate.passwordMismatch') as string;
      return;
    }

    this.isLoading = true;
    try {
      await apiPost('/auth/activate-client', {
        token: this.token,
        password: this.password
      });
      this.isSuccess = true;
      this.password = '';
      this.confirmPassword = '';
    } catch (error) {
      this.error = error instanceof Error ? error.message : (this.$t('activate.error') as string);
    } finally {
      this.isLoading = false;
    }
  }
}

export default toNative(ActivateAccountView);
</script>

<style scoped>
.activation-card {
  width: min(440px, 100%);
  padding: 2.5rem;
  border-radius: 24px;
  background: var(--panel);
  border: 1px solid var(--border);
  box-shadow: var(--shadow);
}

.activation-head h2 {
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

.activation-form {
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

.success {
  margin-top: 1rem;
  color: #067647;
  font-weight: 600;
}

.back-link {
  display: inline-block;
  margin-top: 1.25rem;
  color: var(--primary);
  font-weight: 600;
}
</style>
