<template>
  <div class="error-wrap" role="alert" v-if="message">
    <div class="error-card">
      <i class="pi pi-exclamation-triangle" aria-hidden="true"></i>
      <span>{{ message }}</span>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-facing-decorator';

@Component({})
export default class ErrorCard extends Vue {
  @Prop({ default: '' }) readonly message!: string;
}
</script>

<style scoped>
.error-wrap {
  display: flex;
  justify-content: center;
}

.error-card {
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  background: #ffe9e7;
  border: 1px solid #f4b4ad;
  color: #9f1239;
  border-radius: 12px;
  padding: 0.7rem 1rem;
  font-weight: 600;
  box-shadow: 0 10px 24px rgba(159, 18, 57, 0.12);
}
</style>
