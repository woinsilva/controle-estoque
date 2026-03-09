<script lang="ts">
import { Component, Vue } from 'vue-facing-decorator';
import PublicLayout from './layouts/PublicLayout.vue';
import AuthLayout from './layouts/AuthLayout.vue';
import ConfirmDialog from 'primevue/confirmdialog';

@Component({ components: { ConfirmDialog } })
export default class App extends Vue {
  get layout() {
    return this.$route.meta.layout === 'auth' ? AuthLayout : PublicLayout;
  }
}
</script>

<template>
  <component :is="layout">
    <router-view />
  </component>
  <ConfirmDialog />
</template>
