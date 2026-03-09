<template>
  <div class="auth-layout" :class="{ collapsed: sidebarCollapsed, 'mobile-open': mobileSidebarOpen }">
    <div v-if="mobileSidebarOpen" class="mobile-backdrop" @click="closeMobileSidebar"></div>

    <aside class="sidebar">
      <div class="sidebar-head">
        <button
          v-if="isMobile"
          type="button"
          class="sidebar-toggle ghost-icon"
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
  </div>
</template>

<script lang="ts">
import { Component, Vue, toNative } from 'vue-facing-decorator';
import { useAuthStore } from '../stores/auth';

type MenuItem = {
  to: string;
  label: string;
  icon: string;
  visible: boolean;
};

@Component({})
class AuthLayout extends Vue {
  authStore = useAuthStore();
  sidebarCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
  mobileSidebarOpen = false;
  isMobile = false;

  mounted() {
    this.handleResize();
    window.addEventListener('resize', this.handleResize);
  }

  beforeUnmount() {
    window.removeEventListener('resize', this.handleResize);
  }

  get menuItems() {
    const items: MenuItem[] = [
      {
        to: '/app',
        label: String(this.$t('common.dashboard')),
        icon: 'pi pi-home',
        visible: this.authStore.role !== 'CLIENT'
      },
      {
        to: '/app/products',
        label: String(this.$t('common.products')),
        icon: 'pi pi-box',
        visible: ['MANAGER', 'ADMIN'].includes(this.authStore.role || '')
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
        visible: ['OPERATOR', 'MANAGER', 'ADMIN'].includes(this.authStore.role || '')
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
        visible: ['OPERATOR', 'MANAGER', 'ADMIN'].includes(this.authStore.role || '')
      },
      {
        to: '/app/questionnaires',
        label: String(this.$t('common.questionnaires')),
        icon: 'pi pi-file-edit',
        visible: ['OPERATOR', 'MANAGER', 'ADMIN'].includes(this.authStore.role || '')
      },
      {
        to: '/app/users',
        label: String(this.$t('common.users')),
        icon: 'pi pi-id-card',
        visible: this.authStore.role === 'ADMIN'
      }
    ];

    return items.filter((item) => item.visible);
  }

  handleResize = () => {
    this.isMobile = window.innerWidth <= 960;
    if (this.isMobile) {
      this.mobileSidebarOpen = false;
    }
  };

  toggleSidebar() {
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
  grid-template-columns: 92px minmax(0, 1fr);
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
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  min-height: 50px;
  padding: 0.9rem 1rem;
  border-radius: 18px;
  color: var(--muted);
  font-weight: 700;
}

.collapsed .nav-item {
  justify-content: center;
  padding-left: 0.6rem;
  padding-right: 0.6rem;
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
  align-items: stretch;
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

.ghost-icon {
  width: 44px;
  height: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
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
}
</style>
