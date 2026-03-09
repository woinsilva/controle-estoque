<script lang="ts">
import { Component, Vue, toNative } from 'vue-facing-decorator';
import PublicLayout from './layouts/PublicLayout.vue';
import AuthLayout from './layouts/AuthLayout.vue';
import ConfirmDialog from 'primevue/confirmdialog';
import Toast from 'primevue/toast';

@Component({ components: { ConfirmDialog, Toast } })
class App extends Vue {
  get layout() {
    return this.$route.meta.layout === 'auth' ? AuthLayout : PublicLayout;
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
