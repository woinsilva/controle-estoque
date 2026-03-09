<template>
  <section class="schedules-view">
    <header class="page-header">
      <div>
        <h2>Agenda</h2>
        <p>Visualize atendimentos do profissional e ajuste a disponibilidade por data.</p>
      </div>
    </header>

    <section class="toolbar">
      <label class="field professional-field">
        <span>Profissional</span>
        <select v-model="selectedProfessionalId" @change="onProfessionalChange">
          <option value="">Selecione</option>
          <option v-for="professional in professionals" :key="professional.id" :value="professional.id">
            {{ professional.name }}
          </option>
        </select>
      </label>

      <div class="calendar-actions">
        <div class="nav-group">
          <button type="button" class="ghost" @click="moveRange(-1)">Anterior</button>
          <button type="button" class="ghost" @click="goToToday">Hoje</button>
          <button type="button" class="ghost" @click="moveRange(1)">Proximo</button>
        </div>

        <div class="view-group">
          <button
            v-for="option in viewOptions"
            :key="option.value"
            type="button"
            class="view-button"
            :class="{ active: viewMode === option.value }"
            @click="changeView(option.value)"
          >
            {{ option.label }}
          </button>
        </div>
      </div>
    </section>

    <section v-if="selectedProfessionalId" class="calendar-layout">
      <div class="calendar-panel">
        <div class="calendar-header">
          <strong>{{ currentRangeLabel }}</strong>
        </div>

        <div v-if="viewMode === 'month'" class="month-grid">
          <div v-for="weekday in weekdayHeaders" :key="weekday" class="weekday-header">
            {{ weekday }}
          </div>

          <button
            v-for="day in monthGridDays"
            :key="day.date"
            type="button"
            class="day-cell"
            :class="{
              outside: !day.inCurrentMonth,
              selected: selectedDate === day.date,
              today: day.date === todayKey
            }"
            @click="selectDate(day.date)"
          >
            <div class="day-head">
              <span>{{ day.dayNumber }}</span>
              <small>{{ appointmentsForDate(day.date).length }} atendimento(s)</small>
            </div>
            <div class="day-events">
              <div
                v-for="appointment in appointmentsForDate(day.date).slice(0, 3)"
                :key="appointment.id"
                class="event-chip"
              >
                {{ formatTime(appointment.scheduledAt) }} · {{ clientName(appointment.clientId) }}
              </div>
            </div>
          </button>
        </div>

        <div v-else class="range-grid" :class="viewMode">
          <article
            v-for="day in visibleDays"
            :key="day.date"
            class="range-column"
            :class="{ selected: selectedDate === day.date, today: day.date === todayKey }"
            @click="selectDate(day.date)"
          >
            <header>
              <strong>{{ day.label }}</strong>
              <small>{{ day.subtitle }}</small>
            </header>

            <div v-if="appointmentsForDate(day.date).length" class="column-events">
              <div v-for="appointment in appointmentsForDate(day.date)" :key="appointment.id" class="event-card">
                <strong>{{ formatTimeRange(appointment.scheduledAt, appointment.endsAt) }}</strong>
                <span>{{ clientName(appointment.clientId) }}</span>
                <small>{{ serviceNames(appointment.serviceIds) }}</small>
              </div>
            </div>
            <p v-else class="empty-state">Sem atendimentos.</p>
          </article>
        </div>
      </div>

      <aside class="details-panel">
        <div class="details-header">
          <h3>{{ selectedDateLabel }}</h3>
          <p>{{ selectedDateAppointments.length }} atendimento(s) nesta data.</p>
        </div>

        <section class="panel-block">
          <h4>Atendimentos</h4>
          <div v-if="selectedDateAppointments.length" class="appointment-list">
            <article v-for="appointment in selectedDateAppointments" :key="appointment.id" class="appointment-item">
              <strong>{{ formatTimeRange(appointment.scheduledAt, appointment.endsAt) }}</strong>
              <span>{{ clientName(appointment.clientId) }}</span>
              <small>{{ serviceNames(appointment.serviceIds) }}</small>
            </article>
          </div>
          <p v-else class="empty-state">Nenhum atendimento marcado nesta data.</p>
        </section>

        <section class="panel-block">
          <div class="panel-title">
            <div>
              <h4>Disponibilidade da data</h4>
              <p>
                {{
                  hasSelectedDateOverride
                    ? 'Esta data possui horarios customizados.'
                    : 'Esta data esta herdando a agenda semanal base.'
                }}
              </p>
            </div>
          </div>

          <div class="slot-editor">
            <div v-for="slot in dateSlots" :key="slot.localId" class="slot-row">
              <input :value="slot.startTime" type="time" @input="updateDateSlot(slot.localId, 'startTime', $event)" />
              <input :value="slot.endTime" type="time" @input="updateDateSlot(slot.localId, 'endTime', $event)" />
              <button
                type="button"
                class="icon-button danger"
                @click="removeDateSlot(slot.localId)"
                :disabled="dateSlots.length === 1"
              >
                <i class="pi pi-trash" aria-hidden="true"></i>
              </button>
            </div>
            <button type="button" class="ghost" @click="addDateSlot">Adicionar horario na data</button>
          </div>

          <div class="panel-actions">
            <button type="button" class="primary" @click="saveDateAvailability">Salvar disponibilidade da data</button>
          </div>
        </section>
      </aside>
    </section>

    <section v-if="selectedProfessionalId" class="weekly-base">
      <header class="section-head">
        <div>
          <h3>Agenda semanal base</h3>
          <p>Use essa agenda recorrente como base para as datas que nao tiverem customizacao.</p>
        </div>
        <button type="button" class="primary" @click="saveWeeklySchedule">Salvar agenda semanal</button>
      </header>

      <article v-for="day in weekdays" :key="day.value" class="day-card">
        <label class="checkbox-row">
          <input :checked="isWeeklyDayEnabled(day.value)" type="checkbox" @change="toggleWeeklyDay(day.value, $event)" />
          <span>{{ day.label }}</span>
        </label>
        <div v-if="isWeeklyDayEnabled(day.value)" class="day-slots">
          <div v-for="slot in weeklyDaySlots(day.value)" :key="slot.localId" class="slot-row">
            <input :value="slot.startTime" type="time" @input="updateWeeklySlot(day.value, slot.localId, 'startTime', $event)" />
            <input :value="slot.endTime" type="time" @input="updateWeeklySlot(day.value, slot.localId, 'endTime', $event)" />
            <button
              type="button"
              class="icon-button danger"
              @click="removeWeeklySlot(slot.localId)"
              :disabled="weeklyDaySlots(day.value).length === 1"
            >
              <i class="pi pi-trash" aria-hidden="true"></i>
            </button>
          </div>
          <button type="button" class="ghost" @click="addWeeklySlot(day.value)">Adicionar horario</button>
        </div>
      </article>
    </section>
  </section>
</template>

<script lang="ts">
import { Component, Vue, toNative } from 'vue-facing-decorator';
import { useToast } from 'primevue/usetoast';
import { apiGet, apiPut } from '../services/api';
import { useAuthStore } from '../stores/auth';
import type { ClientListResponse } from '../types/client';
import type {
  DailyAvailabilitySlot,
  ScheduleCalendarResponse,
  ScheduleCalendarView,
  WeeklyAvailabilitySlot
} from '../types/schedule';
import type { Service } from '../types/service';
import type { User } from '../types/user';

type EditableDateSlot = DailyAvailabilitySlot & {
  localId: string;
};

type EditableWeeklySlot = WeeklyAvailabilitySlot & {
  localId: string;
};

type CalendarDay = {
  date: string;
  dayNumber: number;
  inCurrentMonth: boolean;
  label: string;
  subtitle: string;
};

@Component({})
class SchedulesView extends Vue {
  authStore = useAuthStore();
  toast = useToast();
  professionals: Pick<User, 'id' | 'name'>[] = [];
  clients: ClientListResponse['items'] = [];
  services: Service[] = [];
  selectedProfessionalId = '';
  viewMode: ScheduleCalendarView = 'week';
  selectedDate = this.toDateKey(new Date());
  referenceDate = this.toDateKey(new Date());
  calendar: ScheduleCalendarResponse | null = null;
  weeklySlots: EditableWeeklySlot[] = [];
  dateSlots: EditableDateSlot[] = [];
  weeklySlotSequence = 0;
  dateSlotSequence = 0;
  weekdays = [
    { value: 0, label: 'Domingo' },
    { value: 1, label: 'Segunda-feira' },
    { value: 2, label: 'Terca-feira' },
    { value: 3, label: 'Quarta-feira' },
    { value: 4, label: 'Quinta-feira' },
    { value: 5, label: 'Sexta-feira' },
    { value: 6, label: 'Sabado' }
  ];
  viewOptions = [
    { value: 'day' as ScheduleCalendarView, label: 'Dia' },
    { value: 'week' as ScheduleCalendarView, label: 'Semana' },
    { value: 'month' as ScheduleCalendarView, label: 'Mes' }
  ];
  weekdayHeaders = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];

  mounted() {
    void this.loadInitialData();
  }

  get todayKey() {
    return this.toDateKey(new Date());
  }

  get currentRangeLabel() {
    const date = this.fromDateKey(this.referenceDate);
    if (this.viewMode === 'day') {
      return date.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
    }
    if (this.viewMode === 'week') {
      const start = this.startOfWeek(date);
      const end = this.endOfWeek(date);
      return `${start.toLocaleDateString('pt-BR')} - ${end.toLocaleDateString('pt-BR')}`;
    }
    return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  }

  get selectedDateLabel() {
    return this.fromDateKey(this.selectedDate).toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  }

  get selectedDateAppointments() {
    return this.appointmentsForDate(this.selectedDate);
  }

  get hasSelectedDateOverride() {
    return Boolean(this.calendar?.overrides.find((item) => item.date === this.selectedDate));
  }

  get visibleDays() {
    if (this.viewMode === 'day') {
      const date = this.fromDateKey(this.referenceDate);
      return [this.buildCalendarDay(date, true)];
    }

    const start = this.startOfWeek(this.fromDateKey(this.referenceDate));
    return Array.from({ length: 7 }, (_, index) => this.buildCalendarDay(this.addDays(start, index), true));
  }

  get monthGridDays() {
    const monthStart = new Date(this.fromDateKey(this.referenceDate).getFullYear(), this.fromDateKey(this.referenceDate).getMonth(), 1);
    const gridStart = this.startOfWeek(monthStart);
    const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0);
    const gridEnd = this.endOfWeek(monthEnd);
    const days: CalendarDay[] = [];

    for (let cursor = new Date(gridStart); cursor <= gridEnd; cursor = this.addDays(cursor, 1)) {
      days.push(this.buildCalendarDay(cursor, cursor.getMonth() === monthStart.getMonth()));
    }

    return days;
  }

  notify(severity: 'warn' | 'error' | 'success', message: string) {
    this.toast.add({
      severity,
      summary: 'Agenda',
      detail: message,
      life: severity === 'success' ? 2500 : 3500
    });
  }

  async loadInitialData() {
    try {
      const [professionals, clients, services] = await Promise.all([
        apiGet<Pick<User, 'id' | 'name'>[]>('/users/professionals', this.authStore.token),
        apiGet<ClientListResponse>('/clients?page=1&limit=100&sortBy=createdAt&sortOrder=desc', this.authStore.token),
        apiGet<Service[]>('/services?active=true', this.authStore.token)
      ]);

      this.professionals = professionals;
      this.clients = clients.items;
      this.services = services;
      if (professionals[0]) {
        this.selectedProfessionalId = professionals[0].id;
        await this.loadCalendar();
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Nao foi possivel carregar a agenda.';
      this.notify('error', message);
    }
  }

  async onProfessionalChange() {
    await this.loadCalendar();
  }

  async changeView(view: ScheduleCalendarView) {
    this.viewMode = view;
    this.referenceDate = this.selectedDate;
    await this.loadCalendar();
  }

  async moveRange(direction: -1 | 1) {
    const date = this.fromDateKey(this.referenceDate);
    if (this.viewMode === 'day') {
      this.referenceDate = this.toDateKey(this.addDays(date, direction));
    } else if (this.viewMode === 'week') {
      this.referenceDate = this.toDateKey(this.addDays(date, 7 * direction));
    } else {
      this.referenceDate = this.toDateKey(new Date(date.getFullYear(), date.getMonth() + direction, 1));
    }
    this.selectedDate = this.referenceDate;
    await this.loadCalendar();
  }

  async goToToday() {
    const today = this.toDateKey(new Date());
    this.referenceDate = today;
    this.selectedDate = today;
    await this.loadCalendar();
  }

  async selectDate(date: string) {
    this.selectedDate = date;
    this.syncDateSlots();
  }

  async loadCalendar() {
    if (!this.selectedProfessionalId) {
      this.calendar = null;
      this.weeklySlots = [];
      this.dateSlots = [];
      return;
    }

    try {
      const calendar = await apiGet<ScheduleCalendarResponse>(
        `/schedules/${this.selectedProfessionalId}/calendar?date=${this.referenceDate}&view=${this.viewMode}`,
        this.authStore.token
      );
      this.calendar = calendar;
      this.syncWeeklySlots(calendar.weeklySlots);
      if (!this.isDateInCurrentRange(this.selectedDate)) {
        this.selectedDate = this.referenceDate;
      }
      this.syncDateSlots();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Nao foi possivel carregar o calendario.';
      this.notify('error', message);
    }
  }

  syncWeeklySlots(slots: WeeklyAvailabilitySlot[]) {
    this.weeklySlotSequence = 0;
    this.weeklySlots = slots.map((slot) => this.createWeeklySlot(slot));
  }

  syncDateSlots() {
    const override = this.calendar?.overrides.find((item) => item.date === this.selectedDate);
    const source = override?.slots || this.inheritedWeeklySlots(this.selectedDate);
    this.dateSlotSequence = 0;
    this.dateSlots = source.length ? source.map((slot) => this.createDateSlot(slot)) : [this.createDateSlot({ startTime: '', endTime: '' })];
  }

  createWeeklySlot(input: WeeklyAvailabilitySlot): EditableWeeklySlot {
    this.weeklySlotSequence += 1;
    return {
      ...input,
      localId: `weekly-${this.weeklySlotSequence}`
    };
  }

  createDateSlot(input: DailyAvailabilitySlot): EditableDateSlot {
    this.dateSlotSequence += 1;
    return {
      ...input,
      localId: `date-${this.dateSlotSequence}`
    };
  }

  toDateKey(date: Date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  fromDateKey(value: string) {
    return new Date(`${value}T12:00:00`);
  }

  addDays(date: Date, days: number) {
    const next = new Date(date);
    next.setDate(next.getDate() + days);
    return next;
  }

  startOfWeek(date: Date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate() - date.getDay());
  }

  endOfWeek(date: Date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate() + (6 - date.getDay()));
  }

  buildCalendarDay(date: Date, inCurrentMonth: boolean): CalendarDay {
    return {
      date: this.toDateKey(date),
      dayNumber: date.getDate(),
      inCurrentMonth,
      label: date.toLocaleDateString('pt-BR', { weekday: 'long' }),
      subtitle: date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
    };
  }

  isDateInCurrentRange(dateKey: string) {
    const date = this.fromDateKey(dateKey);
    const reference = this.fromDateKey(this.referenceDate);
    if (this.viewMode === 'day') {
      return dateKey === this.referenceDate;
    }
    if (this.viewMode === 'week') {
      return date >= this.startOfWeek(reference) && date <= this.endOfWeek(reference);
    }
    return date.getMonth() === reference.getMonth() && date.getFullYear() === reference.getFullYear();
  }

  inheritedWeeklySlots(dateKey: string) {
    const weekday = this.fromDateKey(dateKey).getDay();
    return this.weeklySlots
      .filter((slot) => slot.weekday === weekday)
      .map(({ startTime, endTime }) => ({ startTime, endTime }));
  }

  appointmentsForDate(dateKey: string) {
    return (this.calendar?.appointments || []).filter((appointment) => this.toDateKey(new Date(appointment.scheduledAt)) === dateKey);
  }

  clientName(clientId: string) {
    return this.clients.find((item) => item.id === clientId)?.fullName || clientId;
  }

  serviceNames(serviceIds: string[] = []) {
    return serviceIds
      .map((serviceId) => this.services.find((item) => item.id === serviceId)?.name || serviceId)
      .join(', ') || '-';
  }

  formatTime(value: string) {
    return new Date(value).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }

  formatTimeRange(start: string, end: string) {
    return `${this.formatTime(start)} - ${this.formatTime(end)}`;
  }

  timeToMinutes(value: string) {
    const [hours, minutes] = value.split(':').map(Number);
    return (hours || 0) * 60 + (minutes || 0);
  }

  isCompleteTime(value: string) {
    return /^\d{2}:\d{2}$/.test(value);
  }

  validateRangeSlots(
    slots: { startTime: string; endTime: string }[],
    dayLabel: string,
    options: { requireComplete: boolean } = { requireComplete: true }
  ) {
    const filledSlots = slots.filter((slot) => slot.startTime || slot.endTime).sort((a, b) => a.startTime.localeCompare(b.startTime));
    for (const slot of filledSlots) {
      if (!slot.startTime || !slot.endTime) {
        if (!options.requireComplete) {
          continue;
        }
        return `Preencha todos os horarios em ${dayLabel}.`;
      }

      if (!this.isCompleteTime(slot.startTime) || !this.isCompleteTime(slot.endTime)) {
        if (!options.requireComplete) {
          continue;
        }
        return `Preencha todos os horarios em ${dayLabel}.`;
      }

      if (this.timeToMinutes(slot.endTime) <= this.timeToMinutes(slot.startTime)) {
        return `O horario final deve ser maior que o inicial em ${dayLabel}.`;
      }
    }
    for (let index = 1; index < filledSlots.length; index += 1) {
      const previous = filledSlots[index - 1];
      const current = filledSlots[index];
      if (previous && current && this.timeToMinutes(previous.endTime) > this.timeToMinutes(current.startTime)) {
        return `Existem horarios conflitantes em ${dayLabel}.`;
      }
    }
    return '';
  }

  updateDateSlot(localId: string, field: 'startTime' | 'endTime', event: Event) {
    const target = event.target as HTMLInputElement;
    const slotIndex = this.dateSlots.findIndex((slot) => slot.localId === localId);
    if (slotIndex < 0) return;

    const current = this.dateSlots[slotIndex];
    if (!current) return;

    const nextSlots = [...this.dateSlots];
    nextSlots[slotIndex] = { ...current, [field]: target.value };
    const validationError = this.validateRangeSlots(nextSlots, this.selectedDateLabel.toLowerCase(), {
      requireComplete: false
    });
    if (validationError) {
      nextSlots[slotIndex] = { ...current, [field]: '' };
      this.dateSlots = nextSlots;
      this.notify('warn', validationError);
      return;
    }

    this.dateSlots = nextSlots;
  }

  addDateSlot() {
    this.dateSlots = [...this.dateSlots, this.createDateSlot({ startTime: '', endTime: '' })];
  }

  removeDateSlot(localId: string) {
    this.dateSlots = this.dateSlots.filter((slot) => slot.localId !== localId);
  }

  async saveDateAvailability() {
    const slots = this.dateSlots
      .filter((slot) => slot.startTime || slot.endTime)
      .map(({ startTime, endTime }) => ({ startTime, endTime }));
    const validationError = this.validateRangeSlots(slots, this.selectedDateLabel.toLowerCase());
    if (validationError) {
      this.notify('warn', validationError);
      return;
    }

    try {
      await apiPut(
        `/schedules/${this.selectedProfessionalId}/overrides/${this.selectedDate}`,
        { slots },
        this.authStore.token
      );
      this.notify('success', 'Disponibilidade da data salva com sucesso.');
      await this.loadCalendar();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Nao foi possivel salvar a disponibilidade da data.';
      this.notify('error', message);
    }
  }

  isWeeklyDayEnabled(weekday: number) {
    return this.weeklySlots.some((slot) => slot.weekday === weekday);
  }

  weeklyDaySlots(weekday: number) {
    return this.weeklySlots.filter((slot) => slot.weekday === weekday);
  }

  toggleWeeklyDay(weekday: number, event: Event) {
    const target = event.target as HTMLInputElement;
    if (target.checked) {
      this.weeklySlots = [...this.weeklySlots, this.createWeeklySlot({ weekday, startTime: '', endTime: '' })];
      return;
    }
    this.weeklySlots = this.weeklySlots.filter((slot) => slot.weekday !== weekday);
  }

  addWeeklySlot(weekday: number) {
    this.weeklySlots = [...this.weeklySlots, this.createWeeklySlot({ weekday, startTime: '', endTime: '' })];
  }

  removeWeeklySlot(localId: string) {
    this.weeklySlots = this.weeklySlots.filter((slot) => slot.localId !== localId);
  }

  updateWeeklySlot(weekday: number, localId: string, field: 'startTime' | 'endTime', event: Event) {
    const target = event.target as HTMLInputElement;
    const slotIndex = this.weeklySlots.findIndex((slot) => slot.localId === localId);
    if (slotIndex < 0) return;

    const current = this.weeklySlots[slotIndex];
    if (!current) return;

    const nextSlots = [...this.weeklySlots];
    nextSlots[slotIndex] = { ...current, [field]: target.value };
    const dayLabel = this.weekdays.find((day) => day.value === weekday)?.label.toLowerCase() || 'este dia';
    const validationError = this.validateRangeSlots(
      nextSlots.filter((slot) => slot.weekday === weekday),
      dayLabel,
      { requireComplete: false }
    );

    if (validationError) {
      nextSlots[slotIndex] = { ...current, [field]: '' };
      this.weeklySlots = nextSlots;
      this.notify('warn', validationError);
      return;
    }

    this.weeklySlots = nextSlots;
  }

  async saveWeeklySchedule() {
    const payload = this.weeklySlots
      .filter((slot) => slot.startTime || slot.endTime)
      .map(({ localId: _localId, ...slot }) => slot);

    for (const day of this.weekdays) {
      const validationError = this.validateRangeSlots(
        payload.filter((slot) => slot.weekday === day.value),
        day.label.toLowerCase()
      );
      if (validationError) {
        this.notify('warn', validationError);
        return;
      }
    }

    try {
      await apiPut(`/schedules/${this.selectedProfessionalId}`, { slots: payload }, this.authStore.token);
      this.notify('success', 'Agenda semanal salva com sucesso.');
      await this.loadCalendar();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Nao foi possivel salvar a agenda semanal.';
      this.notify('error', message);
    }
  }
}

export default toNative(SchedulesView);
</script>

<style scoped>
.schedules-view {
  display: grid;
  gap: 1.5rem;
}

.page-header h2,
.page-header p,
.section-head h3,
.section-head p,
.details-header h3,
.details-header p,
.panel-title h4,
.panel-title p {
  margin: 0;
}

.page-header p,
.section-head p,
.details-header p,
.panel-title p {
  color: var(--muted);
}

.toolbar {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}

.professional-field {
  max-width: 320px;
}

.field {
  display: grid;
  gap: 0.5rem;
  font-weight: 500;
}

.field select,
.slot-row input {
  padding: 0.7rem 0.9rem;
  border-radius: 12px;
  border: 1px solid var(--border);
  background: #fffdf9;
}

.calendar-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  align-items: end;
}

.nav-group,
.view-group,
.panel-actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.calendar-layout {
  display: grid;
  grid-template-columns: minmax(0, 2fr) minmax(320px, 1fr);
  gap: 1rem;
}

.calendar-panel,
.details-panel,
.weekly-base,
.day-card {
  border: 1px solid var(--border);
  border-radius: 18px;
  background: var(--panel);
}

.calendar-panel,
.details-panel,
.weekly-base {
  padding: 1rem;
}

.calendar-header {
  margin-bottom: 1rem;
}

.month-grid {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 0.6rem;
}

.weekday-header {
  text-align: center;
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--muted);
}

.day-cell {
  min-height: 132px;
  padding: 0.75rem;
  border-radius: 16px;
  border: 1px solid var(--border);
  background: #fffdf9;
  text-align: left;
  display: grid;
  gap: 0.6rem;
  cursor: pointer;
}

.day-cell.outside {
  opacity: 0.55;
}

.day-cell.selected,
.range-column.selected {
  border-color: var(--primary);
  box-shadow: 0 0 0 1px rgba(8, 116, 172, 0.22);
}

.day-cell.today,
.range-column.today {
  background: rgba(8, 116, 172, 0.06);
}

.day-head {
  display: flex;
  justify-content: space-between;
  gap: 0.5rem;
  align-items: center;
}

.day-events,
.column-events,
.appointment-list,
.slot-editor,
.day-slots {
  display: grid;
  gap: 0.6rem;
}

.event-chip,
.event-card,
.appointment-item {
  border-radius: 12px;
  border: 1px solid var(--border);
  background: rgba(8, 116, 172, 0.06);
  padding: 0.45rem 0.6rem;
  display: grid;
  gap: 0.15rem;
}

.event-chip {
  font-size: 0.78rem;
}

.range-grid.week {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 0.75rem;
}

.range-grid.day {
  display: block;
}

.range-column {
  border: 1px solid var(--border);
  border-radius: 16px;
  background: #fffdf9;
  padding: 0.85rem;
  display: grid;
  gap: 0.85rem;
  cursor: pointer;
}

.details-panel {
  display: grid;
  gap: 1rem;
  align-content: start;
}

.panel-block {
  display: grid;
  gap: 0.75rem;
}

.panel-title {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
}

.slot-row {
  display: flex;
  gap: 0.75rem;
  align-items: center;
  flex-wrap: wrap;
}

.weekly-base {
  display: grid;
  gap: 0.85rem;
}

.section-head {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: center;
  flex-wrap: wrap;
}

.day-card {
  padding: 1rem;
  display: grid;
  gap: 0.75rem;
}

.checkbox-row {
  display: flex;
  gap: 0.6rem;
  align-items: center;
  font-weight: 600;
}

.primary,
.ghost,
.view-button {
  padding: 0.6rem 1rem;
  border-radius: 12px;
  cursor: pointer;
  font-weight: 600;
}

.primary {
  border: none;
  background: var(--primary);
  color: var(--primary-ink);
}

.ghost,
.view-button {
  border: 1px solid var(--border);
  background: transparent;
  color: var(--muted);
}

.view-button.active {
  background: var(--primary);
  color: var(--primary-ink);
  border-color: var(--primary);
}

.icon-button {
  border: 1px solid var(--border);
  background: var(--panel-strong);
  color: var(--primary);
  cursor: pointer;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.9rem;
}

.icon-button.danger {
  color: #b42318;
  border-color: rgba(180, 35, 24, 0.4);
}

.empty-state {
  margin: 0;
  color: var(--muted);
}

@media (max-width: 1100px) {
  .calendar-layout {
    grid-template-columns: 1fr;
  }

  .range-grid.week {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 760px) {
  .toolbar,
  .section-head,
  .panel-actions,
  .nav-group,
  .view-group {
    flex-direction: column;
    align-items: stretch;
  }

  .professional-field {
    max-width: none;
  }

  .day-cell {
    min-height: auto;
  }

  .day-head {
    flex-direction: column;
    align-items: flex-start;
  }

  .month-grid,
  .range-grid.week {
    grid-template-columns: 1fr;
  }

  .slot-row {
    flex-direction: column;
    align-items: stretch;
  }

  .primary,
  .ghost,
  .view-button,
  .slot-row button {
    width: 100%;
    justify-content: center;
  }
}
</style>
