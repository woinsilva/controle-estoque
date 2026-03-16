<template>
  <div class="auth-layout" :class="{ collapsed: sidebarCollapsed && !isMobile, 'mobile-open': mobileSidebarOpen, 'is-mobile': isMobile }">
    <div v-if="mobileSidebarOpen" class="mobile-backdrop" @click="closeMobileSidebar"></div>

    <aside class="sidebar">
      <div class="sidebar-head">
        <button
          type="button"
          class="sidebar-toggle ghost-icon mobile-sidebar-close"
          aria-label="Fechar menu"
          @click="closeMobileSidebar"
        >
          <i class="pi pi-times" aria-hidden="true"></i>
        </button>
        <div class="brand" :class="{ compact: sidebarCollapsed && !isMobile }">
          <span class="brand-mark">CE</span>
          <div v-if="!sidebarCollapsed || isMobile" class="brand-copy">
            <strong>{{ $t('common.appName') }}</strong>
            <small>Operacao centralizada</small>
          </div>
        </div>
        <button
          v-if="!isMobile"
          type="button"
          class="sidebar-toggle ghost-icon"
          :aria-label="sidebarCollapsed ? 'Expandir menu' : 'Recolher menu'"
          @click="toggleSidebar"
        >
          <i :class="sidebarCollapsed ? 'pi pi-angle-double-right' : 'pi pi-angle-double-left'" aria-hidden="true"></i>
        </button>
      </div>

      <nav class="sidebar-nav">
        <router-link
          v-for="item in menuItems"
          :key="item.to"
          :to="item.to"
          class="nav-item"
          :title="sidebarCollapsed && !isMobile ? item.label : ''"
          @click="onNavClick"
        >
          <i :class="item.icon" aria-hidden="true"></i>
          <span v-if="!sidebarCollapsed || isMobile">{{ item.label }}</span>
        </router-link>
      </nav>

      <div class="sidebar-foot" :class="{ compact: sidebarCollapsed && !isMobile }">
        <button type="button" class="logout-button" @click="logout">
          <i class="pi pi-sign-out" aria-hidden="true"></i>
          <span v-if="!sidebarCollapsed || isMobile">Sair</span>
        </button>
      </div>
    </aside>

    <div class="main-shell">
      <header class="mobile-topbar">
        <button type="button" class="ghost-icon" aria-label="Abrir menu" @click="toggleMobileSidebar">
          <i class="pi pi-bars" aria-hidden="true"></i>
        </button>
        <div class="mobile-brand">
          <span class="brand-mark small">CE</span>
          <strong>{{ $t('common.appName') }}</strong>
        </div>
      </header>

      <main class="content-shell">
        <section class="content">
          <slot />
        </section>
      </main>
    </div>

    <Dialog v-model:visible="statusPromptOpen" modal :header="$t('appointments.statusPromptTitle')" class="status-prompt-dialog">
      <section v-if="statusPromptAppointment" class="status-prompt">
        <p>{{ $t('appointments.statusPromptMessage') }}</p>
        <div class="status-prompt-meta">
          <p><strong>{{ $t('appointments.fields.scheduledAt') }}:</strong> {{ formatDateTime(statusPromptAppointment.scheduledAt) }}</p>
        </div>
        <div class="dialog-actions">
          <button type="button" class="primary-button" @click="updatePromptStatus('IN_PROGRESS')">
            {{ $t('appointments.statusPromptStart') }}
          </button>
          <button type="button" class="danger-button" @click="updatePromptStatus('CANCELED')">
            {{ $t('appointments.statusPromptCancel') }}
          </button>
          <button type="button" class="ghost-button" @click="dismissStatusPrompt">
            {{ $t('appointments.statusPromptLater') }}
          </button>
        </div>
      </section>
    </Dialog>
  </div>
</template>

<script lang="ts">
import { Component, Vue, toNative } from 'vue-facing-decorator';
import Dialog from 'primevue/dialog';
import { apiGet, apiPatch } from '../services/api';
import { useAuthStore } from '../stores/auth';
import type { Appointment, AppointmentListResponse, AppointmentStatus } from '../types/appointment';

type MenuItem = {
  to: string;
  label: string;
  icon: string;
  visible: boolean;
};

@Component({ components: { Dialog } })
class AuthLayout extends Vue {
  private static readonly STATUS_PROMPT_STORAGE_KEY = 'appointmentStatusPrompted';

  authStore = useAuthStore();
  sidebarCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
  mobileSidebarOpen = false;
  isMobile = false;
  statusPromptOpen = false;
  statusPromptAppointment: Appointment | null = null;
  promptedAppointmentIds: string[] = [];
  promptIntervalId: number | null = null;

  mounted() {
    this.handleResize();
    this.restorePromptedAppointments();
    window.addEventListener('resize', this.handleResize);
    if (this.canReceiveStatusPrompts) {
      void this.checkStatusPromptCandidates();
      this.promptIntervalId = window.setInterval(() => {
        void this.checkStatusPromptCandidates();
      }, 60_000);
    }
  }

  beforeUnmount() {
    window.removeEventListener('resize', this.handleResize);
    if (this.promptIntervalId) {
      window.clearInterval(this.promptIntervalId);
      this.promptIntervalId = null;
    }
  }

  get menuItems() {
    const items: MenuItem[] = [
      {
        to: '/app',
        label: String(this.$t('common.dashboard')),
        icon: 'pi pi-home',
        visible: ['MANAGER', 'ADMIN'].includes(this.authStore.role || '')
      },
      {
        to: '/app/products',
        label: String(this.$t('common.products')),
        icon: 'pi pi-box',
        visible: ['OPERATOR', 'MANAGER', 'ADMIN'].includes(this.authStore.role || '')
      },
      {
        to: '/app/sales',
        label: String(this.$t('common.sales')),
        icon: 'pi pi-shopping-cart',
        visible: ['OPERATOR', 'MANAGER', 'ADMIN'].includes(this.authStore.role || '')
      },
      {
        to: '/app/clients',
        label: String(this.$t('common.clients')),
        icon: 'pi pi-users',
        visible: ['OPERATOR', 'MANAGER', 'ADMIN'].includes(this.authStore.role || '')
      },
      {
        to: '/app/appointments',
        label: String(this.$t('common.appointments')),
        icon: 'pi pi-calendar',
        visible: ['OPERATOR', 'MANAGER', 'ADMIN', 'CLIENT'].includes(this.authStore.role || '')
      },
      {
        to: '/app/services',
        label: 'Servicos',
        icon: 'pi pi-briefcase',
        visible: ['MANAGER', 'ADMIN'].includes(this.authStore.role || '')
      },
      {
        to: '/app/schedules',
        label: 'Agenda',
        icon: 'pi pi-clone',
        visible: ['OPERATOR', 'MANAGER', 'ADMIN'].includes(this.authStore.role || '')
      },
      {
        to: '/app/reports',
        label: String(this.$t('common.reports')),
        icon: 'pi pi-chart-line',
        visible: ['MANAGER', 'ADMIN'].includes(this.authStore.role || '')
      },
      {
        to: '/app/questionnaires',
        label: String(this.$t('common.questionnaires')),
        icon: 'pi pi-file-edit',
        visible: ['MANAGER', 'ADMIN'].includes(this.authStore.role || '')
      },
      {
        to: '/app/users',
        label: this.authStore.role === 'ADMIN' ? String(this.$t('common.users')) : String(this.$t('common.profile')),
        icon: 'pi pi-id-card',
        visible: Boolean(this.authStore.role)
      }
    ];

    return items.filter((item) => item.visible);
  }

  get canReceiveStatusPrompts() {
    return Boolean(this.authStore.token && this.authStore.userId && this.authStore.isProfessional);
  }

  handleResize = () => {
    const viewportWidth = window.visualViewport?.width || window.innerWidth || window.screen.width || 0;
    const screenWidth = window.screen.width || viewportWidth;
    const screenHeight = window.screen.height || viewportWidth;
    const shortestSide = Math.min(viewportWidth || Infinity, screenWidth || Infinity, screenHeight || Infinity);
    const cssMobileMatch = window.matchMedia?.('(max-width: 960px)').matches ?? false;
    const hasCoarsePointer = window.matchMedia?.('(pointer: coarse)').matches ?? false;
    const mobileUserAgent = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);

    this.isMobile = cssMobileMatch || shortestSide <= 960 || (hasCoarsePointer && shortestSide <= 1280) || mobileUserAgent;
    if (this.isMobile) {
      this.mobileSidebarOpen = false;
    }
  };

  toggleSidebar() {
    if (this.isMobile) {
      this.closeMobileSidebar();
      return;
    }
    this.sidebarCollapsed = !this.sidebarCollapsed;
    localStorage.setItem('sidebarCollapsed', String(this.sidebarCollapsed));
  }

  toggleMobileSidebar() {
    this.mobileSidebarOpen = !this.mobileSidebarOpen;
  }

  closeMobileSidebar() {
    this.mobileSidebarOpen = false;
  }

  onNavClick() {
    if (this.isMobile) {
      this.mobileSidebarOpen = false;
    }
  }

  restorePromptedAppointments() {
    try {
      const raw = sessionStorage.getItem(AuthLayout.STATUS_PROMPT_STORAGE_KEY);
      this.promptedAppointmentIds = raw ? JSON.parse(raw) : [];
    } catch {
      this.promptedAppointmentIds = [];
    }
  }

  persistPromptedAppointments() {
    sessionStorage.setItem(AuthLayout.STATUS_PROMPT_STORAGE_KEY, JSON.stringify(this.promptedAppointmentIds));
  }

  markAppointmentPrompted(appointmentId: string) {
    if (this.promptedAppointmentIds.includes(appointmentId)) {
      return;
    }
    this.promptedAppointmentIds = [...this.promptedAppointmentIds, appointmentId];
    this.persistPromptedAppointments();
  }

  async checkStatusPromptCandidates() {
    if (!this.canReceiveStatusPrompts || this.statusPromptOpen || !this.authStore.userId) {
      return;
    }

    const now = new Date().toISOString();
    const query = new URLSearchParams({
      professionalId: this.authStore.userId,
      status: 'SCHEDULED',
      dateTo: now,
      page: '1',
      limit: '10',
      sortBy: 'scheduledAt',
      sortOrder: 'asc'
    });

    try {
      const result = await apiGet<AppointmentListResponse>(`/appointments?${query.toString()}`, this.authStore.token);
      const candidate = result.items.find((appointment) => !this.promptedAppointmentIds.includes(appointment.id));
      if (!candidate) {
        return;
      }

      this.statusPromptAppointment = candidate;
      this.statusPromptOpen = true;
      this.markAppointmentPrompted(candidate.id);
    } catch {
      // Ignore background polling errors here to avoid noisy global failures.
    }
  }

  dismissStatusPrompt() {
    this.statusPromptOpen = false;
    this.statusPromptAppointment = null;
  }

  async updatePromptStatus(status: Extract<AppointmentStatus, 'IN_PROGRESS' | 'CANCELED'>) {
    if (!this.statusPromptAppointment) {
      return;
    }

    try {
      await apiPatch(`/appointments/${this.statusPromptAppointment.id}/status`, { status }, this.authStore.token);
      this.dismissStatusPrompt();
      await this.checkStatusPromptCandidates();
    } catch {
      this.dismissStatusPrompt();
    }
  }

  formatDateTime(value: string) {
    return new Date(value).toLocaleString();
  }

  async logout() {
    this.authStore.clearSession();
    await this.$router.push('/login');
  }
}
export default toNative(AuthLayout);
</script>

<style scoped>
.auth-layout {
  min-height: 100vh;
  display: grid;
  grid-template-columns: 288px minmax(0, 1fr);
}

.auth-layout.collapsed {
  grid-template-columns: 104px minmax(0, 1fr);
}

.sidebar {
  position: sticky;
  top: 0;
  height: 100vh;
  padding: 1rem;
  display: grid;
  grid-template-rows: auto 1fr auto;
  gap: 1rem;
  background: rgba(247, 250, 246, 0.7);
  backdrop-filter: blur(18px);
  border-right: 1px solid var(--border);
  z-index: 25;
}

.sidebar-head,
.sidebar-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.85rem;
}

.brand {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  min-width: 0;
}

.brand.compact {
  justify-content: center;
}

.brand-mark {
  display: grid;
  place-items: center;
  width: 46px;
  height: 46px;
  border-radius: 16px;
  background: linear-gradient(135deg, var(--primary), #7cd7cd);
  color: var(--primary-ink);
  font-weight: 800;
  box-shadow: var(--shadow-soft);
}

.brand-mark.small {
  width: 38px;
  height: 38px;
  border-radius: 14px;
  font-size: 0.9rem;
}

.brand-copy {
  display: grid;
  gap: 0.15rem;
}

.brand-copy strong {
  font-size: 1rem;
  letter-spacing: -0.03em;
}

.brand-copy small {
  color: var(--muted);
}

.sidebar-nav {
  display: grid;
  gap: 0.35rem;
  align-content: start;
  min-width: 0;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  width: 100%;
  min-width: 0;
  min-height: 50px;
  padding: 0.9rem 1rem;
  border-radius: 18px;
  box-sizing: border-box;
  color: var(--muted);
  font-weight: 700;
}

.collapsed .sidebar {
  padding-left: 0.75rem;
  padding-right: 0.75rem;
}

.collapsed .sidebar-nav {
  justify-items: center;
}

.collapsed .nav-item {
  justify-content: center;
  width: 52px;
  min-width: 52px;
  min-height: 52px;
  padding-left: 0;
  padding-right: 0;
  border-radius: 16px;
}

.collapsed .nav-item.router-link-active {
  box-shadow: 0 10px 22px rgba(15, 118, 110, 0.16);
}

.nav-item:hover {
  background: rgba(255, 255, 255, 0.72);
  color: var(--ink);
}

.nav-item.router-link-active {
  background: linear-gradient(135deg, var(--primary), #14a39a);
  color: var(--primary-ink);
  box-shadow: 0 18px 36px rgba(15, 118, 110, 0.18);
}

.nav-item i {
  font-size: 1rem;
}

.sidebar-foot.compact {
  flex-direction: column;
  align-items: center;
}

.logout-button,
.ghost-icon {
  border-radius: 14px;
  border: 1px solid var(--border);
  background: rgba(255, 255, 255, 0.82);
  color: var(--ink);
}

.logout-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.65rem;
  min-height: 44px;
  padding: 0.75rem 1rem;
  cursor: pointer;
  font-weight: 800;
}

.sidebar-foot.compact .logout-button {
  width: 52px;
  min-width: 52px;
  min-height: 52px;
  padding: 0;
  border-radius: 16px;
}

.ghost-icon {
  width: 44px;
  height: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.mobile-sidebar-close {
  display: none;
}

.main-shell {
  min-width: 0;
  display: grid;
  grid-template-rows: auto 1fr;
}

.mobile-topbar {
  display: none;
}

.content-shell {
  padding: 1.25rem 1.35rem 2rem;
}

.content {
  max-width: 1440px;
  margin: 0 auto;
}

.mobile-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(11, 18, 15, 0.38);
  backdrop-filter: blur(3px);
  z-index: 24;
}

.auth-layout.is-mobile,
.auth-layout.is-mobile.collapsed {
  grid-template-columns: 1fr;
}

.auth-layout.is-mobile .sidebar {
  position: fixed;
  left: 0;
  top: 0;
  width: min(320px, 86vw);
  transform: translateX(-100%);
  transition: transform 0.22s ease;
  box-shadow: var(--shadow);
}

.auth-layout.is-mobile.mobile-open .sidebar {
  transform: translateX(0);
}

.auth-layout.is-mobile .mobile-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.9rem 0.9rem 0;
}

.auth-layout.is-mobile .mobile-sidebar-close {
  display: inline-flex;
}

.auth-layout.is-mobile .sidebar-head > .sidebar-toggle:not(.mobile-sidebar-close) {
  display: none;
}

.auth-layout.is-mobile .mobile-brand {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  min-width: 0;
}

.auth-layout.is-mobile .mobile-brand strong {
  letter-spacing: -0.03em;
}

.auth-layout.is-mobile .content-shell {
  padding: 0.95rem 0.9rem 1.5rem;
}

.status-prompt-dialog {
  width: min(560px, 92vw);
}

.status-prompt {
  display: grid;
  gap: 1rem;
}

.status-prompt p {
  margin: 0;
}

.status-prompt-meta {
  display: grid;
  gap: 0.35rem;
  padding: 0.85rem 1rem;
  border: 1px solid var(--border);
  border-radius: 14px;
  background: var(--panel-strong);
}

.dialog-actions {
  display: flex;
  gap: 0.75rem;
}

.primary-button,
.ghost-button,
.danger-button {
  padding: 0.6rem 1.1rem;
  border-radius: 12px;
  font-weight: 700;
  cursor: pointer;
}

.primary-button {
  border: none;
  background: var(--primary);
  color: var(--primary-ink);
}

.ghost-button {
  border: 1px solid var(--border);
  background: transparent;
  color: var(--muted);
}

.danger-button {
  border: 1px solid rgba(180, 35, 24, 0.25);
  background: var(--danger-soft);
  color: var(--danger);
}

@media (max-width: 960px) {
  .auth-layout,
  .auth-layout.collapsed {
    grid-template-columns: 1fr;
  }

  .sidebar {
    position: fixed;
    left: 0;
    top: 0;
    width: min(320px, 86vw);
    transform: translateX(-100%);
    transition: transform 0.22s ease;
    box-shadow: var(--shadow);
  }

  .auth-layout.mobile-open .sidebar {
    transform: translateX(0);
  }

  .mobile-topbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    padding: 0.9rem 0.9rem 0;
  }

  .mobile-brand {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    min-width: 0;
  }

  .mobile-brand strong {
    letter-spacing: -0.03em;
  }

  .content-shell {
    padding: 0.95rem 0.9rem 1.5rem;
  }
}

@media (max-width: 640px) {
  .content-shell {
    padding-left: 0.75rem;
    padding-right: 0.75rem;
  }

  .dialog-actions {
    flex-direction: column;
  }
}
</style>
