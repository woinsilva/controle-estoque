import { defineStore } from 'pinia';
import type { UserRole } from '../types/user';

type AuthState = {
  token: string | null;
  role: UserRole | null;
  userId: string | null;
  locale: 'pt' | 'en' | 'es';
  theme: 'light' | 'dark';
};

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    token: localStorage.getItem('token') || sessionStorage.getItem('token'),
    role:
      (localStorage.getItem('role') as UserRole | null) ||
      (sessionStorage.getItem('role') as UserRole | null) ||
      null,
    userId: localStorage.getItem('userId') || sessionStorage.getItem('userId'),
    locale: (localStorage.getItem('locale') as 'pt' | 'en' | 'es') || 'pt',
    theme: (localStorage.getItem('theme') as 'light' | 'dark') || 'light'
  }),
  getters: {
    isAuthenticated: (state) => Boolean(state.token)
  },
  actions: {
    setSession(
      token: string,
      role: UserRole,
      userId: string,
      remember: boolean,
      locale: 'pt' | 'en' | 'es' = 'pt',
      theme: 'light' | 'dark' = 'light'
    ) {
      this.token = token;
      this.role = role;
      this.userId = userId;
      this.locale = locale;
      this.theme = theme;
      if (remember) {
        localStorage.setItem('token', token);
        localStorage.setItem('role', role);
        localStorage.setItem('userId', userId);
        localStorage.setItem('locale', locale);
        localStorage.setItem('theme', theme);
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('role');
        sessionStorage.removeItem('userId');
      } else {
        sessionStorage.setItem('token', token);
        sessionStorage.setItem('role', role);
        sessionStorage.setItem('userId', userId);
        sessionStorage.setItem('locale', locale);
        sessionStorage.setItem('theme', theme);
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        localStorage.removeItem('userId');
      }
    },
    setPreferences(locale: 'pt' | 'en' | 'es', theme: 'light' | 'dark') {
      this.locale = locale;
      this.theme = theme;
      localStorage.setItem('locale', locale);
      localStorage.setItem('theme', theme);
    },
    clearSession() {
      this.token = null;
      this.role = null;
      this.userId = null;
      this.locale = 'pt';
      this.theme = 'light';
      localStorage.removeItem('token');
      localStorage.removeItem('role');
      localStorage.removeItem('userId');
      localStorage.removeItem('locale');
      localStorage.removeItem('theme');
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('role');
      sessionStorage.removeItem('userId');
      sessionStorage.removeItem('locale');
      sessionStorage.removeItem('theme');
    }
  }
});
