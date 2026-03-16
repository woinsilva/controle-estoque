<script lang="ts">
import { Component, Vue, toNative } from 'vue-facing-decorator';
import PublicLayout from './layouts/PublicLayout.vue';
import AuthLayout from './layouts/AuthLayout.vue';
import ConfirmDialog from 'primevue/confirmdialog';
import {
  type NotificationPayload,
  subscribeNotifications,
  unsubscribeNotifications
} from './services/notifications';

type UiNotification = NotificationPayload & {
  id: number;
};

@Component({ components: { ConfirmDialog } })
class App extends Vue {
  notifications: UiNotification[] = [];
  private nextNotificationId = 1;

  private onNotify = (payload: NotificationPayload) => {
    const notification: UiNotification = {
      id: this.nextNotificationId++,
      severity: payload.severity,
      summary: payload.summary || 'Aviso',
      detail: payload.detail,
      life: payload.life || 5000
    };

    this.notifications = [...this.notifications, notification];
    window.setTimeout(() => this.dismissNotification(notification.id), notification.life);
  };

  get layout() {
    return this.$route.meta.layout === 'auth' ? AuthLayout : PublicLayout;
  }

  dismissNotification(id: number) {
    this.notifications = this.notifications.filter((notification) => notification.id !== id);
  }

  mounted() {
    subscribeNotifications(this.onNotify);
  }

  beforeUnmount() {
    unsubscribeNotifications(this.onNotify);
  }
}
export default toNative(App);
</script>

<template>
  <component :is="layout">
    <router-view />
  </component>
  <div class="app-notifications" aria-live="polite" aria-atomic="true">
    <article
      v-for="notification in notifications"
      :key="notification.id"
      class="app-notification"
      :class="`app-notification--${notification.severity}`"
    >
      <div class="app-notification__copy">
        <strong>{{ notification.summary }}</strong>
        <p>{{ notification.detail }}</p>
      </div>
      <button type="button" class="app-notification__close" @click="dismissNotification(notification.id)">
        <i class="pi pi-times" aria-hidden="true"></i>
      </button>
    </article>
  </div>
  <ConfirmDialog />
</template>

<style scoped>
.app-notifications {
  position: fixed;
  top: 1rem;
  left: 50%;
  transform: translateX(-50%);
  z-index: 12000;
  width: min(560px, calc(100vw - 1.5rem));
  display: grid;
  gap: 0.75rem;
  pointer-events: none;
}

.app-notification {
  pointer-events: auto;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.9rem;
  padding: 0.95rem 1rem;
  border-radius: 18px;
  border: 1px solid var(--border);
  background: rgba(255, 255, 255, 0.96);
  box-shadow: var(--shadow-soft);
}

.app-notification--error {
  border-color: rgba(180, 35, 24, 0.2);
  background: rgba(254, 243, 242, 0.98);
}

.app-notification--success {
  border-color: rgba(2, 122, 72, 0.2);
  background: rgba(236, 253, 243, 0.98);
}

.app-notification--warn {
  border-color: rgba(181, 71, 8, 0.2);
  background: rgba(255, 247, 237, 0.98);
}

.app-notification__copy {
  display: grid;
  gap: 0.25rem;
}

.app-notification__copy strong {
  font-size: 0.95rem;
}

.app-notification__copy p {
  margin: 0;
  line-height: 1.45;
  white-space: pre-wrap;
}

.app-notification__close {
  border: none;
  background: transparent;
  color: var(--muted);
  cursor: pointer;
}

@media (max-width: 760px) {
  .app-notifications {
    top: 0.75rem;
    width: calc(100vw - 1rem);
  }
}
</style>
