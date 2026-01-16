import { defineStore } from 'pinia';
import type { UserRole } from '../types/user';

type AuthState = {
  token: string | null;
  role: UserRole | null;
};

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    token: localStorage.getItem('token') || sessionStorage.getItem('token'),
    role:
      (localStorage.getItem('role') as UserRole | null) ||
      (sessionStorage.getItem('role') as UserRole | null) ||
      null
  }),
  getters: {
    isAuthenticated: (state) => Boolean(state.token)
  },
  actions: {
    setSession(token: string, role: UserRole, remember: boolean) {
      this.token = token;
      this.role = role;
      if (remember) {
        localStorage.setItem('token', token);
        localStorage.setItem('role', role);
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('role');
      } else {
        sessionStorage.setItem('token', token);
        sessionStorage.setItem('role', role);
        localStorage.removeItem('token');
        localStorage.removeItem('role');
      }
    },
    clearSession() {
      this.token = null;
      this.role = null;
      localStorage.removeItem('token');
      localStorage.removeItem('role');
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('role');
    }
  }
});
