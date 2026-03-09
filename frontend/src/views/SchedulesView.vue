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
        <div v-if="isDayEnabled(day.value)" class="day-slots">
          <div v-for="(slot, index) in daySlots(day.value)" :key="`${day.value}-${index}`" class="slot-row">
            <input :value="slot.startTime" type="time" @input="updateDayTime(day.value, index, 'startTime', $event)" />
            <input :value="slot.endTime" type="time" @input="updateDayTime(day.value, index, 'endTime', $event)" />
            <button
              type="button"
              class="icon-button danger"
              @click="removeDaySlot(day.value, index)"
              :disabled="daySlots(day.value).length === 1"
            >
              <i class="pi pi-trash" aria-hidden="true"></i>
            </button>
          </div>
          <button type="button" class="ghost" @click="addDaySlot(day.value)">Adicionar horario</button>
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

  daySlots(weekday: number) {
    return this.slots.filter((slot) => slot.weekday === weekday);
  }

  sortSlots() {
    this.slots = [...this.slots].sort((a, b) => {
      if (a.weekday !== b.weekday) {
        return a.weekday - b.weekday;
      }
      return a.startTime.localeCompare(b.startTime);
    });
  }

  toggleDay(weekday: number, event: Event) {
    const target = event.target as HTMLInputElement;
    if (target.checked) {
      this.slots = [...this.slots, { weekday, startTime: '09:00', endTime: '18:00' }];
      this.sortSlots();
      return;
    }
    this.slots = this.slots.filter((slot) => slot.weekday !== weekday);
  }

  addDaySlot(weekday: number) {
    this.slots = [...this.slots, { weekday, startTime: '09:00', endTime: '18:00' }];
    this.sortSlots();
  }

  removeDaySlot(weekday: number, index: number) {
    const daySlots = this.daySlots(weekday);
    const slotToRemove = daySlots[index];
    if (!slotToRemove) {
      return;
    }
    const removeIndex = this.slots.findIndex(
      (slot) =>
        slot.weekday === slotToRemove.weekday &&
        slot.startTime === slotToRemove.startTime &&
        slot.endTime === slotToRemove.endTime
    );
    if (removeIndex >= 0) {
      this.slots = this.slots.filter((_, slotIndex) => slotIndex !== removeIndex);
    }
  }

  updateDayTime(weekday: number, index: number, field: 'startTime' | 'endTime', event: Event) {
    const target = event.target as HTMLInputElement;
    let currentIndex = -1;
    this.slots = this.slots.map((slot) => {
      if (slot.weekday !== weekday) {
        return slot;
      }

      currentIndex += 1;
      if (currentIndex !== index) {
        return slot;
      }

      return { ...slot, [field]: target.value };
    });
    this.sortSlots();
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
.day-slots { display: grid; gap: 0.75rem; }
.slot-row { display: flex; gap: 0.75rem; align-items: center; flex-wrap: wrap; }
.primary { padding: 0.6rem 1.1rem; border-radius: 12px; border: none; background: var(--primary); color: var(--primary-ink); font-weight: 600; cursor: pointer; width: fit-content; }
.ghost { padding: 0.55rem 0.9rem; border-radius: 12px; border: 1px solid var(--border); background: transparent; color: var(--muted); cursor: pointer; width: fit-content; }
.icon-button { border: 1px solid var(--border); background: var(--panel-strong); color: var(--primary); cursor: pointer; width: 36px; height: 36px; border-radius: 8px; display: inline-flex; align-items: center; justify-content: center; font-size: 0.9rem; }
.icon-button.danger { color: #b42318; border-color: rgba(180, 35, 24, 0.4); }
</style>
