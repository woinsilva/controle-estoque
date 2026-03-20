<script lang="ts">
import { Component, Vue, toNative } from 'vue-facing-decorator';
import Toast from 'primevue/toast';
import { useToast } from 'primevue/usetoast';
import PublicLayout from './layouts/PublicLayout.vue';
import AuthLayout from './layouts/AuthLayout.vue';
import BlankLayout from './layouts/BlankLayout.vue';
import ConfirmDialog from 'primevue/confirmdialog';
import {
  type NotificationPayload,
  subscribeNotifications,
  unsubscribeNotifications
} from './services/notifications';

@Component({ components: { ConfirmDialog, Toast } })
class App extends Vue {
  toast = useToast();

  private onNotify = (payload: NotificationPayload) => {
    this.toast.add({
      severity: payload.severity,
      summary: payload.summary || 'Aviso',
      detail: payload.detail,
      life: payload.life || 5000
    });
  };

  get layout() {
    if (this.$route.meta.layout === 'auth') return AuthLayout;
    if (this.$route.meta.layout === 'blank') return BlankLayout;
    return PublicLayout;
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
  <Toast position="top-center" />
  <ConfirmDialog />
</template>
