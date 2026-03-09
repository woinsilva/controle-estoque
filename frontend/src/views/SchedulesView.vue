<template>
  <section class="schedules-view">
    <header class="page-header">
      <div>
        <h2>Agenda</h2>
        <p>Configure os dias e horarios de atendimento dos profissionais.</p>
      </div>
    </header>

    <label class="field">
      <span>Profissional</span>
      <select v-model="selectedProfessionalId" @change="loadSchedule">
        <option value="">Selecione</option>
        <option v-for="professional in professionals" :key="professional.id" :value="professional.id">
          {{ professional.name }}
        </option>
      </select>
    </label>

    <section v-if="selectedProfessionalId" class="schedule-editor">
      <article v-for="day in weekdays" :key="day.value" class="day-card">
        <label class="checkbox-row">
          <input :checked="isDayEnabled(day.value)" type="checkbox" @change="toggleDay(day.value, $event)" />
          <span>{{ day.label }}</span>
        </label>
        <div v-if="isDayEnabled(day.value)" class="slot-row">
          <input :value="dayStart(day.value)" type="time" @input="updateDayTime(day.value, 'startTime', $event)" />
          <input :value="dayEnd(day.value)" type="time" @input="updateDayTime(day.value, 'endTime', $event)" />
        </div>
      </article>
      <button type="button" class="primary" @click="saveSchedule">Salvar agenda</button>
    </section>

    <ErrorCard :message="error" />
  </section>
</template>

<script lang="ts">
import { Component, Vue, toNative } from 'vue-facing-decorator';
import { apiGet, apiPut } from '../services/api';
import { useAuthStore } from '../stores/auth';
import type { User } from '../types/user';
import type { WeeklyAvailabilitySlot, WorkSchedule } from '../types/schedule';
import ErrorCard from '../components/ErrorCard.vue';

@Component({ components: { ErrorCard } })
class SchedulesView extends Vue {
  authStore = useAuthStore();
  professionals: Pick<User, 'id' | 'name'>[] = [];
  selectedProfessionalId = '';
  slots: WeeklyAvailabilitySlot[] = [];
  error = '';
  weekdays = [
    { value: 0, label: 'Domingo' },
    { value: 1, label: 'Segunda' },
    { value: 2, label: 'Terca' },
    { value: 3, label: 'Quarta' },
    { value: 4, label: 'Quinta' },
    { value: 5, label: 'Sexta' },
    { value: 6, label: 'Sabado' }
  ];

  mounted() {
    void this.loadProfessionals();
  }

  async loadProfessionals() {
    try {
      this.professionals = await apiGet<Pick<User, 'id' | 'name'>[]>('/users/professionals', this.authStore.token);
    } catch (error) {
      this.error = error instanceof Error ? error.message : 'Nao foi possivel carregar os profissionais.';
    }
  }

  async loadSchedule() {
    if (!this.selectedProfessionalId) {
      this.slots = [];
      return;
    }
    this.error = '';
    try {
      const schedule = await apiGet<WorkSchedule>(`/schedules/${this.selectedProfessionalId}`, this.authStore.token);
      this.slots = schedule.slots || [];
    } catch {
      this.slots = [];
    }
  }

  isDayEnabled(weekday: number) {
    return this.slots.some((slot) => slot.weekday === weekday);
  }

  dayStart(weekday: number) {
    return this.slots.find((slot) => slot.weekday === weekday)?.startTime || '09:00';
  }

  dayEnd(weekday: number) {
    return this.slots.find((slot) => slot.weekday === weekday)?.endTime || '18:00';
  }

  toggleDay(weekday: number, event: Event) {
    const target = event.target as HTMLInputElement;
    if (target.checked) {
      this.slots = [...this.slots, { weekday, startTime: '09:00', endTime: '18:00' }].sort((a, b) => a.weekday - b.weekday);
      return;
    }
    this.slots = this.slots.filter((slot) => slot.weekday !== weekday);
  }

  updateDayTime(weekday: number, field: 'startTime' | 'endTime', event: Event) {
    const target = event.target as HTMLInputElement;
    this.slots = this.slots.map((slot) => (slot.weekday === weekday ? { ...slot, [field]: target.value } : slot));
  }

  async saveSchedule() {
    this.error = '';
    try {
      await apiPut(`/schedules/${this.selectedProfessionalId}`, { slots: this.slots }, this.authStore.token);
    } catch (error) {
      this.error = error instanceof Error ? error.message : 'Nao foi possivel salvar a agenda.';
    }
  }
}
export default toNative(SchedulesView);
</script>

<style scoped>
.schedules-view { display: grid; gap: 1rem; }
.page-header h2, .page-header p { margin: 0; }
.page-header p { color: var(--muted); }
.field { display: grid; gap: 0.5rem; font-weight: 500; max-width: 320px; }
.field select, .slot-row input { padding: 0.7rem 0.9rem; border-radius: 12px; border: 1px solid var(--border); background: #fffdf9; }
.schedule-editor { display: grid; gap: 0.75rem; }
.day-card { border: 1px solid var(--border); border-radius: 14px; background: var(--panel); padding: 1rem; display: grid; gap: 0.75rem; }
.checkbox-row { display: flex; gap: 0.6rem; align-items: center; font-weight: 600; }
.slot-row { display: flex; gap: 0.75rem; }
.primary { padding: 0.6rem 1.1rem; border-radius: 12px; border: none; background: var(--primary); color: var(--primary-ink); font-weight: 600; cursor: pointer; width: fit-content; }
</style>
