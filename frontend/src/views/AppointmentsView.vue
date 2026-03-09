<template>
  <section class="appointments">
    <header class="appointments-header">
      <div>
        <h2>{{ $t('appointments.title') }}</h2>
        <p>{{ $t('appointments.subtitle') }}</p>
      </div>
      <div class="actions">
        <button type="button" class="primary" @click="openNew">
          {{ $t('appointments.new') }}
        </button>
      </div>
    </header>

    <section class="filters">
      <label v-if="authStore.role !== 'CLIENT'" class="field">
        <span>{{ $t('appointments.fields.client') }}</span>
        <select v-model="filterClientId" @change="loadAppointments(1)">
          <option value="">{{ $t('appointments.allClients') }}</option>
          <option v-for="client in clients" :key="client.id" :value="client.id">
            {{ client.fullName }}
          </option>
        </select>
      </label>
      <label class="field">
        <span>{{ $t('appointments.fields.status') }}</span>
        <select v-model="filterStatus" @change="loadAppointments(1)">
          <option value="">{{ $t('appointments.allStatuses') }}</option>
          <option value="SCHEDULED">{{ $t('appointments.statuses.SCHEDULED') }}</option>
          <option value="IN_PROGRESS">{{ $t('appointments.statuses.IN_PROGRESS') }}</option>
          <option value="COMPLETED">{{ $t('appointments.statuses.COMPLETED') }}</option>
          <option value="CANCELED">{{ $t('appointments.statuses.CANCELED') }}</option>
        </select>
      </label>
      <label class="field">
        <span>{{ $t('appointments.fields.dateFrom') }}</span>
        <input v-model="dateFrom" type="date" @change="loadAppointments(1)" />
      </label>
      <label class="field">
        <span>{{ $t('appointments.fields.dateTo') }}</span>
        <input v-model="dateTo" type="date" @change="loadAppointments(1)" />
      </label>
    </section>

    <DataTable
      :value="appointments"
      dataKey="id"
      :paginator="true"
      :rows="rows"
      :first="first"
      :totalRecords="totalRecords"
      :loading="loading"
      :lazy="true"
      @page="onPage"
      class="table"
      responsiveLayout="scroll"
    >
      <Column field="clientId" :header="$t('appointments.fields.client')">
        <template #body="{ data }">
          {{ clientName(data.clientId) }}
        </template>
      </Column>
      <Column field="professionalId" header="Profissional">
        <template #body="{ data }">
          {{ professionalName(data.professionalId) }}
        </template>
      </Column>
      <Column field="serviceId" header="Servico">
        <template #body="{ data }">
          {{ serviceName(data.serviceId) }}
        </template>
      </Column>
      <Column field="scheduledAt" :header="$t('appointments.fields.scheduledAt')">
        <template #body="{ data }">
          {{ formatDateTime(data.scheduledAt) }}
        </template>
      </Column>
      <Column field="status" :header="$t('appointments.fields.status')">
        <template #body="{ data }">
          {{ $t(`appointments.statuses.${data.status}`) }}
        </template>
      </Column>
      <Column field="notes" :header="$t('appointments.fields.notes')" />
      <Column :header="$t('appointments.fields.questionnaire')">
        <template #body="{ data }">
          <span :class="questionnaireClass(data.id)">
            {{ questionnaireLabel(data.id) }}
          </span>
        </template>
      </Column>
      <Column :header="$t('appointments.actions')">
        <template #body="{ data }">
          <button type="button" class="icon-button" :title="$t('appointments.edit')" @click="openEdit(data)">
            <i class="pi pi-pencil" aria-hidden="true"></i>
          </button>
          <button
            type="button"
            class="icon-button"
            :title="$t('appointments.goQuestionnaire')"
            @click="goToQuestionnaire(data)"
          >
            <i class="pi pi-file-edit" aria-hidden="true"></i>
          </button>
          <button
            :disabled="!questionnaireByAppointment[data.id]"
            type="button"
            class="icon-button"
            :title="$t('appointments.viewResponse')"
            @click="openResponseDialog(data)"
          >
            <i class="pi pi-eye" aria-hidden="true"></i>
          </button>
          <button
            v-if="canDelete"
            type="button"
            class="icon-button danger"
            :title="$t('appointments.delete')"
            @click="confirmDelete(data)"
          >
            <i class="pi pi-trash" aria-hidden="true"></i>
          </button>
        </template>
      </Column>
    </DataTable>

    <Dialog v-model:visible="dialogOpen" modal :header="dialogTitle" class="dialog">
      <form class="form" @submit.prevent="submitAppointment">
        <label v-if="authStore.role !== 'CLIENT'" class="field">
          <span>{{ $t('appointments.fields.client') }}</span>
          <select v-model="form.clientId" required>
            <option value="">{{ $t('appointments.selectClient') }}</option>
            <option v-for="client in clients" :key="client.id" :value="client.id">
              {{ client.fullName }}
            </option>
          </select>
        </label>
        <label class="field">
          <span>Profissional</span>
          <select v-model="form.professionalId" required @change="onAvailabilityInputsChange">
            <option value="">Selecione</option>
            <option v-for="professional in professionals" :key="professional.id" :value="professional.id">
              {{ professional.name }}
            </option>
          </select>
        </label>
        <label class="field">
          <span>Servico</span>
          <select v-model="form.serviceId" required @change="onAvailabilityInputsChange">
            <option value="">Selecione</option>
            <option v-for="service in services" :key="service.id" :value="service.id">
              {{ service.name }} ({{ service.durationMinutes }} min)
            </option>
          </select>
        </label>
        <section class="field full availability-field">
          <div class="availability-header">
            <div>
              <span>{{ $t('appointments.fields.scheduledAt') }}</span>
              <p class="availability-subtitle">Escolha um dia com vaga e depois selecione um horario livre.</p>
            </div>
            <div class="availability-nav">
              <button type="button" class="ghost small" @click="changeAvailabilityMonth(-1)">Anterior</button>
              <strong>{{ availabilityMonthLabel }}</strong>
              <button type="button" class="ghost small" @click="changeAvailabilityMonth(1)">Proximo</button>
            </div>
          </div>

          <div v-if="form.professionalId && form.serviceId" class="availability-picker">
            <div class="availability-calendar">
              <div v-for="weekday in availabilityWeekdays" :key="weekday" class="weekday-label">
                {{ weekday }}
              </div>
              <button
                v-for="day in availabilityCalendarDays"
                :key="day.date"
                type="button"
                class="calendar-day"
                :class="{
                  outside: !day.inCurrentMonth,
                  available: day.available,
                  selected: selectedAvailabilityDate === day.date
                }"
                :disabled="!day.available"
                @click="selectAvailabilityDate(day.date)"
              >
                <span class="calendar-day-number">{{ day.dayNumber }}</span>
                <small v-if="day.available" class="calendar-day-count">{{ availabilityCount(day.date) }} vagas</small>
                <small v-else class="calendar-day-empty">Sem vaga</small>
              </button>
            </div>

            <div class="availability-side">
              <div class="selected-date-card">
                <span class="selected-date-label">Data selecionada</span>
                <strong>{{ selectedAvailabilityDateLabel }}</strong>
              </div>

              <div class="time-slots">
                <button
                  v-for="slot in selectedAvailabilitySlots"
                  :key="slot"
                  type="button"
                  class="time-slot"
                  :class="{ active: selectedAvailabilityTime === slot }"
                  @click="selectAvailabilityTime(slot)"
                >
                  {{ slot }}
                </button>
                <p v-if="selectedAvailabilityDate && !selectedAvailabilitySlots.length" class="availability-hint">
                  Nenhum horario disponivel nesta data.
                </p>
                <p v-if="!selectedAvailabilityDate" class="availability-hint">
                  Selecione um dia destacado no calendario.
                </p>
              </div>
            </div>
          </div>
          <p v-else class="availability-hint">Selecione profissional e servico para consultar as datas disponiveis.</p>
        </section>
        <label class="field">
          <span>{{ $t('appointments.fields.status') }}</span>
          <select v-model="form.status" required>
            <option value="SCHEDULED">{{ $t('appointments.statuses.SCHEDULED') }}</option>
            <option value="IN_PROGRESS">{{ $t('appointments.statuses.IN_PROGRESS') }}</option>
            <option value="COMPLETED">{{ $t('appointments.statuses.COMPLETED') }}</option>
            <option value="CANCELED">{{ $t('appointments.statuses.CANCELED') }}</option>
          </select>
        </label>
        <label class="field">
          <span>{{ $t('appointments.fields.notes') }}</span>
          <textarea v-model="form.notes" rows="4"></textarea>
        </label>
        <div class="dialog-actions">
          <button type="submit" class="primary" :disabled="loading">
            {{ editingId ? $t('appointments.update') : $t('appointments.create') }}
          </button>
          <button type="button" class="ghost" @click="closeDialog">
            {{ $t('common.cancel') }}
          </button>
        </div>
      </form>
    </Dialog>

    <Dialog v-model:visible="responseDialogOpen" modal :header="$t('appointments.responseTitle')" class="dialog">
      <section v-if="selectedResponse && selectedAppointment" class="response-view">
        <div class="response-meta">
          <p><strong>{{ $t('appointments.fields.client') }}:</strong> {{ clientName(selectedAppointment.clientId) }}</p>
          <p>
            <strong>{{ $t('appointments.fields.scheduledAt') }}:</strong>
            {{ formatDateTime(selectedAppointment.scheduledAt) }}
          </p>
          <p><strong>{{ $t('questionnaires.fields.template') }}:</strong> {{ selectedResponse.templateCode }}</p>
          <p><strong>{{ $t('questionnaires.fields.version') }}:</strong> {{ selectedResponse.templateVersion }}</p>
          <p><strong>{{ $t('questionnaires.fields.createdAt') }}:</strong> {{ formatDateTime(selectedResponse.createdAt) }}</p>
        </div>

        <div class="answers">
          <h4>{{ $t('questionnaires.fields.answers') }}</h4>
          <div v-if="answerEntries.length" class="answers-grid">
            <div v-for="entry in answerEntries" :key="entry.key" class="answer-item">
              <strong>{{ entry.label }}</strong>
              <span>{{ formatAnswer(entry.value) }}</span>
            </div>
          </div>
          <p v-else>-</p>
        </div>

        <div v-if="selectedResponse.signature" class="signature-view">
          <h4>{{ $t('questionnaires.signature.title') }}</h4>
          <p><strong>{{ $t('questionnaires.signature.mode') }}:</strong> {{ signatureModeLabel(selectedResponse.signature.mode) }}</p>
          <img
            v-if="selectedResponse.signature.mode === 'DRAW'"
            :src="selectedResponse.signature.value"
            alt="Signature"
            class="signature-image"
          />
          <p v-else><strong>{{ $t('questionnaires.signature.typedValue') }}:</strong> {{ selectedResponse.signature.value || '-' }}</p>
        </div>

        <div class="dialog-actions">
          <button type="button" class="primary" @click="generatePdfFromResponse">
            {{ $t('appointments.generatePdf') }}
          </button>
          <button type="button" class="ghost" @click="responseDialogOpen = false">
            {{ $t('common.cancel') }}
          </button>
        </div>
      </section>
      <section v-else>
        <p>{{ $t('appointments.noResponse') }}</p>
      </section>
    </Dialog>

    <ErrorCard :message="error" />
  </section>
</template>

<script lang="ts">
import { Component, Vue, toNative } from 'vue-facing-decorator';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Dialog from 'primevue/dialog';
import { useConfirm } from 'primevue/useconfirm';
import { apiDelete, apiGet, apiPost, apiPut } from '../services/api';
import { useAuthStore } from '../stores/auth';
import type {
  Appointment,
  AppointmentAvailabilityResponse,
  AppointmentInput,
  AppointmentListResponse,
  AppointmentStatus
} from '../types/appointment';
import type { ClientListResponse } from '../types/client';
import type { QuestionnaireResponse } from '../types/questionnaire';
import type { Service } from '../types/service';
import type { User } from '../types/user';
import ErrorCard from '../components/ErrorCard.vue';

@Component({ components: { DataTable, Column, Dialog, ErrorCard } })
class AppointmentsView extends Vue {
  authStore = useAuthStore();
  confirm = useConfirm();
  appointments: Appointment[] = [];
  clients: ClientListResponse['items'] = [];
  professionals: Pick<User, 'id' | 'name'>[] = [];
  services: Service[] = [];
  loading = false;
  error = '';
  dialogOpen = false;
  editingId: string | null = null;
  page = 1;
  rows = 10;
  totalRecords = 0;
  questionnaireByAppointment: Record<string, boolean> = {};
  responseByAppointment: Record<string, QuestionnaireResponse | null> = {};
  filterClientId = '';
  filterStatus: '' | AppointmentStatus = '';
  dateFrom = '';
  dateTo = '';
  form: AppointmentInput = {
    clientId: '',
    professionalId: '',
    serviceId: '',
    scheduledAt: '',
    status: 'SCHEDULED',
    notes: ''
  };
  responseDialogOpen = false;
  selectedResponse: QuestionnaireResponse | null = null;
  selectedAppointment: Appointment | null = null;
  availabilityMonth = this.toMonthKey(new Date());
  availability: AppointmentAvailabilityResponse | null = null;
  selectedAvailabilityDate = '';
  selectedAvailabilityTime = '';
  availabilityWeekdays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];

  mounted() {
    this.loadInitialData();
  }

  get first() {
    return (this.page - 1) * this.rows;
  }

  get canDelete() {
    return ['MANAGER', 'ADMIN'].includes(this.authStore.role || '');
  }

  get dialogTitle() {
    return this.editingId ? this.$t('appointments.edit') : this.$t('appointments.new');
  }

  get availabilityMonthLabel() {
    const [year, month] = this.availabilityMonth.split('-').map(Number);
    return new Date(year || 0, (month || 1) - 1, 1).toLocaleDateString('pt-BR', {
      month: 'long',
      year: 'numeric'
    });
  }

  get selectedAvailabilityDateLabel() {
    if (!this.selectedAvailabilityDate) {
      return 'Nenhuma data selecionada';
    }
    return new Date(`${this.selectedAvailabilityDate}T12:00:00`).toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: '2-digit',
      month: 'long'
    });
  }

  get selectedAvailabilitySlots() {
    if (!this.selectedAvailabilityDate) return [];
    const slots = this.availability?.days.find((day) => day.date === this.selectedAvailabilityDate)?.slots || [];
    if (this.editingId && this.form.scheduledAt) {
      const currentDate = this.toDateKey(new Date(this.form.scheduledAt));
      const currentTime = this.toTimeKey(new Date(this.form.scheduledAt));
      if (currentDate === this.selectedAvailabilityDate && currentTime && !slots.includes(currentTime)) {
        return [currentTime, ...slots].sort();
      }
    }
    return slots;
  }

  get availabilityCalendarDays() {
    const [year, month] = this.availabilityMonth.split('-').map(Number);
    const monthStart = new Date(year || 0, (month || 1) - 1, 1);
    const gridStart = new Date(monthStart);
    gridStart.setDate(gridStart.getDate() - gridStart.getDay());
    const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0);
    const gridEnd = new Date(monthEnd);
    gridEnd.setDate(gridEnd.getDate() + (6 - gridEnd.getDay()));
    const days: { date: string; dayNumber: number; inCurrentMonth: boolean; available: boolean }[] = [];

    for (let cursor = new Date(gridStart); cursor <= gridEnd; cursor.setDate(cursor.getDate() + 1)) {
      const date = this.toDateKey(cursor);
      days.push({
        date,
        dayNumber: cursor.getDate(),
        inCurrentMonth: cursor.getMonth() === monthStart.getMonth(),
        available: this.availabilityCount(date) > 0
      });
    }

    return days;
  }

  async loadInitialData() {
    this.loading = true;
    this.error = '';
    try {
      const requests: Promise<unknown>[] = [
        apiGet<Pick<User, 'id' | 'name'>[]>('/users/professionals', this.authStore.token),
        apiGet<Service[]>('/services?active=true', this.authStore.token)
      ];
      if (this.authStore.role !== 'CLIENT') {
        requests.unshift(
          apiGet<ClientListResponse>(
            '/clients?page=1&limit=100&sortBy=createdAt&sortOrder=desc',
            this.authStore.token
          )
        );
      }

      const results = await Promise.all(requests);
      if (this.authStore.role !== 'CLIENT') {
        const [clients, professionals, services] = results as [ClientListResponse, Pick<User, 'id' | 'name'>[], Service[]];
        this.clients = clients.items;
        this.professionals = professionals;
        this.services = services;
      } else {
        const [professionals, services] = results as [Pick<User, 'id' | 'name'>[], Service[]];
        this.professionals = professionals;
        this.services = services;
      }
      await this.loadAppointments();
    } catch (err) {
      this.error = this.extractErrorMessage(err) || this.$t('appointments.error');
      this.loading = false;
    }
  }

  async loadAppointments(page?: number) {
    if (page) {
      this.page = page;
    }
    this.loading = true;
    this.error = '';
    try {
      const query = new URLSearchParams({
        page: String(this.page),
        limit: String(this.rows),
        sortBy: 'scheduledAt',
        sortOrder: 'desc'
      });
      if (this.filterClientId) query.set('clientId', this.filterClientId);
      if (this.filterStatus) query.set('status', this.filterStatus);
      if (this.dateFrom) query.set('dateFrom', new Date(`${this.dateFrom}T00:00:00`).toISOString());
      if (this.dateTo) query.set('dateTo', new Date(`${this.dateTo}T23:59:59`).toISOString());

      const result = await apiGet<AppointmentListResponse>(
        `/appointments?${query.toString()}`,
        this.authStore.token
      );
      this.appointments = result.items;
      this.totalRecords = result.total;
      this.page = result.page;
      await this.loadQuestionnaireStatusForPage(result.items);
    } catch (err) {
      this.error = this.extractErrorMessage(err) || this.$t('appointments.error');
    } finally {
      this.loading = false;
    }
  }

  onPage(event: { page: number; rows: number }) {
    this.rows = event.rows;
    this.loadAppointments(event.page + 1);
  }

  openNew() {
    this.editingId = null;
    this.form = {
      clientId: this.authStore.clientId || '',
      professionalId: '',
      serviceId: '',
      scheduledAt: '',
      status: 'SCHEDULED',
      notes: ''
    };
    this.availabilityMonth = this.toMonthKey(new Date());
    this.availability = null;
    this.selectedAvailabilityDate = '';
    this.selectedAvailabilityTime = '';
    this.dialogOpen = true;
  }

  async openEdit(appointment: Appointment) {
    this.editingId = appointment.id;
    this.form = {
      clientId: appointment.clientId,
      professionalId: appointment.professionalId,
      serviceId: appointment.serviceId,
      scheduledAt: appointment.scheduledAt,
      status: appointment.status,
      notes: appointment.notes || ''
    };
    const currentDate = new Date(appointment.scheduledAt);
    this.availabilityMonth = this.toMonthKey(currentDate);
    this.selectedAvailabilityDate = this.toDateKey(currentDate);
    this.selectedAvailabilityTime = this.toTimeKey(currentDate);
    this.dialogOpen = true;
    await this.loadAvailability();
  }

  closeDialog() {
    this.dialogOpen = false;
  }

  async onAvailabilityInputsChange() {
    this.selectedAvailabilityDate = '';
    this.selectedAvailabilityTime = '';
    this.form.scheduledAt = '';
    await this.loadAvailability();
  }

  async changeAvailabilityMonth(direction: -1 | 1) {
    const [year, month] = this.availabilityMonth.split('-').map(Number);
    const next = new Date(year || 0, ((month || 1) - 1) + direction, 1);
    this.availabilityMonth = this.toMonthKey(next);
    this.selectedAvailabilityDate = '';
    this.selectedAvailabilityTime = '';
    this.form.scheduledAt = '';
    await this.loadAvailability();
  }

  async loadAvailability() {
    if (!this.form.professionalId || !this.form.serviceId) {
      this.availability = null;
      return;
    }
    try {
      this.availability = await apiGet<AppointmentAvailabilityResponse>(
        `/appointments/availability?professionalId=${this.form.professionalId}&serviceId=${this.form.serviceId}&month=${this.availabilityMonth}`,
        this.authStore.token
      );
    } catch (err) {
      this.error = this.extractErrorMessage(err) || this.$t('appointments.error');
      this.availability = null;
    }
  }

  availabilityCount(date: string) {
    return this.availability?.days.find((day) => day.date === date)?.slots.length || 0;
  }

  selectAvailabilityDate(date: string) {
    if (this.availabilityCount(date) === 0) return;
    this.selectedAvailabilityDate = date;
    const currentSlots = this.selectedAvailabilitySlots;
    this.selectedAvailabilityTime = currentSlots[0] || '';
    this.syncScheduledAtFromAvailability();
  }

  selectAvailabilityTime(value: string) {
    this.selectedAvailabilityTime = value;
    this.syncScheduledAtFromAvailability();
  }

  syncScheduledAtFromAvailability() {
    if (!this.selectedAvailabilityDate || !this.selectedAvailabilityTime) {
      this.form.scheduledAt = '';
      return;
    }
    this.form.scheduledAt = new Date(`${this.selectedAvailabilityDate}T${this.selectedAvailabilityTime}:00`).toISOString();
  }

  async submitAppointment() {
    this.loading = true;
    this.error = '';
    this.syncScheduledAtFromAvailability();
    if (!this.form.scheduledAt) {
      this.error = 'Selecione uma data e horario disponiveis.';
      this.loading = false;
      return;
    }
    const payload = {
      clientId: this.form.clientId,
      professionalId: this.form.professionalId,
      serviceId: this.form.serviceId,
      scheduledAt: this.form.scheduledAt,
      status: this.form.status,
      notes: this.form.notes?.trim() || undefined
    };
    try {
      if (this.editingId) {
        await apiPut(`/appointments/${this.editingId}`, payload, this.authStore.token);
      } else {
        await apiPost('/appointments', payload, this.authStore.token);
      }
      this.dialogOpen = false;
      await this.loadAppointments();
    } catch (err) {
      this.error = this.extractErrorMessage(err) || this.$t('appointments.error');
    } finally {
      this.loading = false;
    }
  }

  confirmDelete(appointment: Appointment) {
    this.confirm.require({
      message: this.$t('appointments.confirmDelete'),
      header: this.$t('appointments.delete'),
      acceptLabel: this.$t('common.confirm'),
      rejectLabel: this.$t('common.cancel'),
      accept: () => this.deleteAppointment(appointment)
    });
  }

  async deleteAppointment(appointment: Appointment) {
    this.loading = true;
    this.error = '';
    try {
      await apiDelete(`/appointments/${appointment.id}`, this.authStore.token);
      await this.loadAppointments();
    } catch (err) {
      this.error = this.extractErrorMessage(err) || this.$t('appointments.error');
    } finally {
      this.loading = false;
    }
  }

  goToQuestionnaire(appointment: Appointment) {
    void this.$router.push({
      path: '/app/questionnaires',
      query: {
        clientId: appointment.clientId,
        appointmentId: appointment.id
      }
    });
  }

  async loadQuestionnaireStatusForPage(items: Appointment[]) {
    const boolMap: Record<string, boolean> = {};
    const responseMap: Record<string, QuestionnaireResponse | null> = {};
    const entries = await Promise.all(
      items.map(async (appointment) => {
        try {
          const responses = await apiGet<QuestionnaireResponse[]>(
            `/questionnaires/responses/appointment/${appointment.id}`,
            this.authStore.token
          );
          const latest = responses.length ? responses[0] : null;
          return [appointment.id, latest] as const;
        } catch {
          return [appointment.id, null] as const;
        }
      })
    );
    for (const [appointmentId, latestResponse] of entries) {
      boolMap[appointmentId] = Boolean(latestResponse);
      responseMap[appointmentId] = latestResponse ?? null;
    }
    this.questionnaireByAppointment = boolMap;
    this.responseByAppointment = responseMap;
  }

  questionnaireLabel(appointmentId: string) {
    return this.questionnaireByAppointment[appointmentId]
      ? this.$t('appointments.questionnaireDone')
      : this.$t('appointments.questionnairePending');
  }

  questionnaireClass(appointmentId: string) {
    return this.questionnaireByAppointment[appointmentId] ? 'badge done' : 'badge pending';
  }

  get answerEntries() {
    if (!this.selectedResponse) return [];
    return Object.entries(this.selectedResponse.answers || {}).map(([key, value]) => ({
      key,
      label: this.answerLabel(key),
      value
    }));
  }

  openResponseDialog(appointment: Appointment) {
    this.selectedAppointment = appointment;
    this.selectedResponse = this.responseByAppointment[appointment.id] || null;
    this.responseDialogOpen = true;
  }

  formatAnswer(value: unknown) {
    if (value === null || value === undefined || value === '') return '-';
    if (typeof value === 'boolean') {
      return value ? this.$t('common.yes') : this.$t('common.no');
    }
    if (typeof value === 'object') {
      return JSON.stringify(value);
    }
    return String(value);
  }

  answerLabel(key: string) {
    if (!this.selectedResponse) return key;

    const snapshot = this.selectedResponse.templateSnapshot;
    const fields = snapshot?.fields;
    if (Array.isArray(fields)) {
      const match = fields.find(
        (item) =>
          item &&
          typeof item === 'object' &&
          String((item as Record<string, unknown>).key || '') === key
      ) as Record<string, unknown> | undefined;
      if (match) {
        return String(match.label || match.key || key);
      }
    }

    const properties = snapshot?.properties;
    if (properties && typeof properties === 'object') {
      const field = (properties as Record<string, unknown>)[key];
      if (field && typeof field === 'object') {
        return String((field as Record<string, unknown>).title || key);
      }
    }

    return key;
  }

  escapeHtml(value: string) {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  signatureModeLabel(mode: 'DRAW' | 'TYPE' | 'UPLOAD') {
    if (mode === 'DRAW') return this.$t('questionnaires.signature.draw');
    if (mode === 'TYPE') return this.$t('questionnaires.signature.type');
    return mode;
  }

  generatePdfFromResponse() {
    if (!this.selectedResponse || !this.selectedAppointment) return;
    const client = this.clientName(this.selectedAppointment.clientId);
    const answersRows = this.answerEntries
      .map(
        (entry) =>
          `<tr><td style="padding:6px;border:1px solid #ccc;"><strong>${this.escapeHtml(entry.label)}</strong></td><td style="padding:6px;border:1px solid #ccc;">${this.escapeHtml(this.formatAnswer(entry.value))}</td></tr>`
      )
      .join('');
    const signatureBlock = this.selectedResponse.signature
      ? this.selectedResponse.signature.mode === 'DRAW'
        ? `<p><strong>${this.escapeHtml(String(this.$t('questionnaires.signature.mode')))}:</strong> ${this.escapeHtml(String(this.signatureModeLabel(this.selectedResponse.signature.mode)))}</p><img src="${this.selectedResponse.signature.value}" style="max-width:320px;border:1px solid #ccc;border-radius:8px;" />`
        : `<p><strong>${this.escapeHtml(String(this.$t('questionnaires.signature.mode')))}:</strong> ${this.escapeHtml(String(this.signatureModeLabel(this.selectedResponse.signature.mode)))}</p><p><strong>${this.escapeHtml(String(this.$t('questionnaires.signature.typedValue')))}:</strong> ${this.escapeHtml(this.selectedResponse.signature.value || '-')}</p>`
      : '<p><strong>Assinatura:</strong> -</p>';

    const html = `
      <html>
        <head>
          <title>Ficha de Atendimento</title>
          <style>
            body { font-family: Arial, sans-serif; color: #111; padding: 24px; }
            h1 { margin: 0 0 10px; font-size: 22px; }
            p { margin: 4px 0; }
            table { border-collapse: collapse; width: 100%; margin-top: 12px; }
            .block { margin-top: 18px; }
          </style>
        </head>
        <body>
          <h1>Ficha de Atendimento / Anamnese</h1>
          <p><strong>Cliente:</strong> ${this.escapeHtml(client)}</p>
          <p><strong>Data e hora:</strong> ${this.escapeHtml(this.formatDateTime(this.selectedAppointment.scheduledAt))}</p>
          <p><strong>Template:</strong> ${this.escapeHtml(this.selectedResponse.templateCode)} v${this.selectedResponse.templateVersion}</p>
          <p><strong>Preenchido em:</strong> ${this.escapeHtml(this.formatDateTime(this.selectedResponse.createdAt))}</p>

          <div class="block">
            <h3>Respostas</h3>
            <table>${answersRows || '<tr><td>-</td></tr>'}</table>
          </div>

          <div class="block">
            <h3>Assinatura</h3>
            ${signatureBlock}
          </div>
        </body>
      </html>
    `;

    const popup = window.open('', '_blank', 'width=900,height=720');
    if (!popup) return;
    popup.document.open();
    popup.document.write(html);
    popup.document.close();
    popup.focus();
    setTimeout(() => popup.print(), 250);
  }

  clientName(clientId: string) {
    if (this.authStore.role === 'CLIENT' && this.authStore.clientId === clientId) {
      return 'Meu cadastro';
    }
    return this.clients.find((item) => item.id === clientId)?.fullName || clientId;
  }

  professionalName(professionalId: string) {
    return this.professionals.find((item) => item.id === professionalId)?.name || professionalId;
  }

  serviceName(serviceId: string) {
    return this.services.find((item) => item.id === serviceId)?.name || serviceId;
  }

  formatDateTime(value: string) {
    return new Date(value).toLocaleString();
  }

  toMonthKey(value: Date) {
    return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}`;
  }

  toDateKey(value: Date) {
    return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`;
  }

  toTimeKey(value: Date) {
    return `${String(value.getHours()).padStart(2, '0')}:${String(value.getMinutes()).padStart(2, '0')}`;
  }

  extractErrorMessage(error: unknown) {
    if (error instanceof Error) {
      return error.message;
    }
    return '';
  }
}
export default toNative(AppointmentsView);
</script>

<style scoped>
.appointments {
  display: grid;
  gap: 1.5rem;
}

.appointments-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.appointments-header h2 {
  margin: 0 0 0.4rem;
  font-size: 1.8rem;
}

.appointments-header p {
  margin: 0;
  color: var(--muted);
}

.actions {
  display: flex;
  gap: 0.75rem;
  align-items: center;
}

.filters {
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  padding: 1rem;
  border: 1px solid var(--border);
  border-radius: 14px;
  background: var(--panel);
}

.field {
  display: grid;
  gap: 0.5rem;
  font-weight: 500;
}

.field input,
.field select,
.field textarea {
  padding: 0.7rem 0.9rem;
  border-radius: 12px;
  border: 1px solid var(--border);
  background: #fffdf9;
}

.table {
  border-radius: 18px;
  border: 1px solid var(--border);
  background: var(--panel);
}

.dialog {
  min-width: min(720px, 92vw);
}

.form {
  display: grid;
  gap: 1rem;
}

.full {
  grid-column: 1 / -1;
}

.availability-field {
  border: 1px solid var(--border);
  border-radius: 18px;
  background: linear-gradient(180deg, rgba(8, 116, 172, 0.04), rgba(255, 255, 255, 0.7));
  padding: 1rem;
}

.availability-header {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: center;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}

.availability-subtitle {
  margin: 0.35rem 0 0;
  color: var(--muted);
  font-size: 0.92rem;
}

.availability-nav {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  flex-wrap: wrap;
}

.availability-picker {
  display: grid;
  grid-template-columns: minmax(0, 1.5fr) minmax(240px, 0.9fr);
  gap: 1rem;
}

.availability-calendar {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 0.6rem;
}

.weekday-label {
  text-align: center;
  font-size: 0.82rem;
  font-weight: 700;
  color: var(--muted);
}

.calendar-day {
  min-height: 86px;
  border-radius: 16px;
  border: 1px solid var(--border);
  background: #fff;
  padding: 0.65rem 0.5rem;
  display: grid;
  align-content: start;
  gap: 0.35rem;
  text-align: left;
  cursor: pointer;
  transition: border-color 0.15s ease, transform 0.15s ease, box-shadow 0.15s ease;
}

.calendar-day.available {
  border-color: rgba(8, 116, 172, 0.35);
  background: linear-gradient(180deg, rgba(8, 116, 172, 0.08), rgba(255, 255, 255, 0.96));
}

.calendar-day.available:hover {
  transform: translateY(-1px);
  box-shadow: 0 10px 22px rgba(8, 116, 172, 0.12);
}

.calendar-day.selected {
  border-color: var(--primary);
  box-shadow: 0 0 0 2px rgba(8, 116, 172, 0.18);
}

.calendar-day.outside {
  opacity: 0.45;
}

.calendar-day-number {
  font-size: 1.05rem;
  font-weight: 700;
}

.calendar-day-count,
.calendar-day-empty {
  font-size: 0.76rem;
  color: var(--muted);
}

.availability-side {
  display: grid;
  gap: 0.9rem;
  align-content: start;
}

.selected-date-card {
  border: 1px solid var(--border);
  border-radius: 16px;
  background: #fff;
  padding: 0.9rem 1rem;
  display: grid;
  gap: 0.25rem;
}

.selected-date-label {
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--muted);
}

.time-slots {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(88px, 1fr));
  gap: 0.65rem;
}

.time-slot {
  padding: 0.7rem 0.8rem;
  border-radius: 14px;
  border: 1px solid var(--border);
  background: #fff;
  color: var(--text);
  font-weight: 600;
  cursor: pointer;
}

.time-slot.active {
  border-color: var(--primary);
  background: var(--primary);
  color: var(--primary-ink);
}

.dialog-actions {
  display: flex;
  gap: 0.75rem;
}

.primary {
  padding: 0.6rem 1.1rem;
  border-radius: 12px;
  border: none;
  background: var(--primary);
  color: var(--primary-ink);
  font-weight: 600;
  cursor: pointer;
}

.ghost {
  padding: 0.6rem 1.1rem;
  border-radius: 12px;
  border: 1px solid var(--border);
  background: transparent;
  color: var(--muted);
  cursor: pointer;
}

.ghost.small {
  padding: 0.5rem 0.85rem;
}

.icon-button {
  border: 1px solid var(--border);
  background: var(--panel-strong);
  color: var(--primary);
  cursor: pointer;
  width: 32px;
  height: 32px;
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

.badge {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 0.2rem 0.65rem;
  font-size: 0.8rem;
  font-weight: 600;
}

.badge.done {
  color: #0f5132;
  background: #d1fae5;
  border: 1px solid #a7f3d0;
}

.badge.pending {
  color: #7c2d12;
  background: #ffedd5;
  border: 1px solid #fed7aa;
}

.response-view {
  display: grid;
  gap: 1rem;
}

.response-meta {
  display: grid;
  gap: 0.25rem;
}

.answers-grid {
  display: grid;
  gap: 0.6rem;
}

.answer-item {
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 0.55rem 0.7rem;
  display: grid;
  gap: 0.2rem;
}

.signature-view {
  display: grid;
  gap: 0.4rem;
}

.signature-image {
  max-width: 320px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: #fff;
}

.availability-hint {
  margin: 0;
  color: var(--muted);
}

@media (max-width: 960px) {
  .availability-picker {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 700px) {
  .availability-calendar {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}
</style>
