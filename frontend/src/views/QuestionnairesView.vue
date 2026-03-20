<template>
  <section class="questionnaires">
    <header class="questionnaires-header">
      <div>
        <h2>{{ $t('questionnaires.title') }}</h2>
        <p>{{ $t('questionnaires.subtitle') }}</p>
      </div>
    </header>

    <section v-if="showTemplateManagement" class="panel">
      <div class="panel-head">
        <h3>{{ $t('questionnaires.templatesTitle') }}</h3>
        <button v-if="canManageTemplates" type="button" class="primary" @click="openTemplateDialog()">
          {{ $t('questionnaires.newTemplate') }}
        </button>
      </div>

      <DataTable :value="templates" dataKey="_id" responsiveLayout="scroll" class="table">
        <Column field="code" :header="$t('questionnaires.fields.code')" />
        <Column field="name" :header="$t('questionnaires.fields.name')" />
        <Column field="version" :header="$t('questionnaires.fields.version')" />
        <Column field="status" :header="$t('questionnaires.fields.status')" />
        <Column field="createdAt" :header="$t('questionnaires.fields.createdAt')">
          <template #body="{ data }">
            {{ formatDate(data.createdAt) }}
          </template>
        </Column>
        <Column v-if="canManageTemplates" :header="$t('questionnaires.actions')">
          <template #body="{ data }">
            <button
              v-if="canEditTemplate(data)"
              type="button"
              class="icon-button"
              :title="$t('questionnaires.editTemplate')"
              @click="openTemplateDialog(data)"
            >
              <i class="pi pi-pencil" aria-hidden="true"></i>
            </button>
            <button
              v-if="canDeleteTemplate(data)"
              type="button"
              class="icon-button danger"
              :title="$t('questionnaires.deleteTemplate')"
              @click="confirmDeleteTemplate(data)"
            >
              <i class="pi pi-trash" aria-hidden="true"></i>
            </button>
            <button
              v-if="data.status !== 'PUBLISHED'"
              type="button"
              class="icon-button"
              :title="$t('questionnaires.publish')"
              @click="publishTemplate(data._id)"
            >
              <i class="pi pi-check" aria-hidden="true"></i>
            </button>
          </template>
        </Column>
      </DataTable>
    </section>

    <section class="panel">
      <div class="panel-head">
        <h3>{{ $t('questionnaires.responsesTitle') }}</h3>
        <div class="panel-actions">
          <button v-if="showGenericResponseFlow" type="button" class="primary" @click="openResponseDialog">
            {{ $t('questionnaires.newResponse') }}
          </button>
          <button type="button" class="primary" @click="openAnamneseDialog()">
            Nova Anamnese Nano Fios
          </button>
        </div>
      </div>

      <div class="filters">
        <label class="field">
          <span>{{ $t('questionnaires.fields.client') }}</span>
          <AppSelect
            v-model="selectedClientId"
            :options="clientOptions"
            :placeholder="$t('questionnaires.selectClient')"
            :showClear="true"
            @change="loadResponses"
          />
        </label>
        <label class="field">
          <span>{{ $t('appointments.fields.dateFrom') }}</span>
          <input v-model="responseDateFrom" type="date" />
        </label>
        <label class="field">
          <span>{{ $t('appointments.fields.dateTo') }}</span>
          <input v-model="responseDateTo" type="date" />
        </label>
      </div>

      <DataTable :value="filteredResponses" dataKey="_id" responsiveLayout="scroll" class="table">
        <Column field="templateCode" :header="$t('questionnaires.fields.template')" />
        <Column field="templateVersion" :header="$t('questionnaires.fields.version')" />
        <Column :header="$t('questionnaires.fields.appointment')">
          <template #body="{ data }">
            <div class="appointment-cell">
              <strong>{{ responseAppointmentLabel(data) }}</strong>
              <button
                v-if="responseAppointment(data)"
                type="button"
                class="appointment-link"
                @click="goToAppointment(data)"
              >
                Abrir em atendimentos
              </button>
            </div>
          </template>
        </Column>
        <Column field="createdAt" :header="$t('questionnaires.fields.createdAt')">
          <template #body="{ data }">
            {{ formatDate(data.createdAt) }}
          </template>
        </Column>
        <Column :header="$t('appointments.generatePdf')">
          <template #body="{ data }">
            <button
              type="button"
              class="icon-button"
              :title="$t('appointments.generatePdf')"
              :disabled="!canOpenResponsePdf(data)"
              @click="openResponsePdf(data)"
            >
              <i class="pi pi-file-pdf" aria-hidden="true"></i>
            </button>
          </template>
        </Column>
      </DataTable>
    </section>

    <Dialog
      v-model:visible="templateDialogOpen"
      modal
      @hide="closeTemplateDialog"
      :header="editingTemplateId ? $t('questionnaires.editTemplate') : $t('questionnaires.newTemplate')"
      class="dialog"
    >
      <form class="form" @submit.prevent="submitTemplate">
        <label class="field">
          <span>{{ $t('questionnaires.fields.name') }}</span>
          <input v-model="templateForm.name" type="text" required />
        </label>

        <section class="builder">
          <h4>{{ $t('questionnaires.builder.title') }}</h4>
          <div class="builder-grid">
            <label class="field">
              <span>{{ $t('questionnaires.builder.label') }}</span>
              <input v-model="builderField.label" type="text" />
            </label>
            <label class="field">
              <span>{{ $t('questionnaires.builder.type') }}</span>
              <AppSelect v-model="builderField.type" :options="builderTypeOptions" />
            </label>
            <label v-if="builderField.type === 'select'" class="field full">
              <span>{{ $t('questionnaires.builder.options') }}</span>
              <input
                v-model="builderField.optionsText"
                type="text"
                :placeholder="$t('questionnaires.builder.optionsPlaceholder')"
              />
            </label>
          </div>

          <div class="builder-controls">
            <label class="checkbox-inline">
              <input v-model="builderField.required" type="checkbox" />
              <span>{{ $t('questionnaires.builder.required') }}</span>
            </label>
            <div class="builder-actions">
              <button type="button" class="primary" @click="addFieldToTemplate">
                {{
                  editingFieldIndex >= 0 ? $t('questionnaires.builder.updateField') : $t('questionnaires.builder.addField')
                }}
              </button>
              <button
                v-if="editingFieldIndex >= 0"
                type="button"
                class="ghost"
                @click="cancelFieldEdit"
              >
                {{ $t('questionnaires.builder.cancelEdit') }}
              </button>
            </div>
          </div>

          <div class="builder-list">
            <article v-for="(field, index) in templateFields" :key="`${field.key}-${index}`" class="builder-item">
              <div class="builder-item-content">
                <strong>{{ field.label }}</strong>
                <span>
                  {{ $t(`questionnaires.builder.types.${field.type}`) }} |
                  {{ field.required ? $t('questionnaires.builder.requiredState') : $t('questionnaires.builder.optionalState') }}
                </span>
              </div>
              <div class="builder-item-actions">
                <button type="button" class="icon-button" @click="startEditField(index)">
                  <i class="pi pi-pencil" aria-hidden="true"></i>
                </button>
                <button type="button" class="icon-button" :disabled="index === 0" @click="moveFieldUp(index)">
                  <i class="pi pi-arrow-up" aria-hidden="true"></i>
                </button>
                <button
                  type="button"
                  class="icon-button"
                  :disabled="index === templateFields.length - 1"
                  @click="moveFieldDown(index)"
                >
                  <i class="pi pi-arrow-down" aria-hidden="true"></i>
                </button>
                <button type="button" class="icon-button danger" @click="removeField(index)">
                  <i class="pi pi-trash" aria-hidden="true"></i>
                </button>
              </div>
            </article>
          </div>
        </section>

        <div class="dialog-actions">
          <button type="submit" class="primary" :disabled="loading">{{ $t('questionnaires.create') }}</button>
          <button type="button" class="ghost" @click="closeTemplateDialog">
            {{ $t('common.cancel') }}
          </button>
        </div>
      </form>
    </Dialog>

    <Dialog v-model:visible="responseDialogOpen" modal :header="$t('questionnaires.newResponse')" class="dialog">
      <form class="form" @submit.prevent="submitResponse">
        <label class="field">
          <span>{{ $t('questionnaires.fields.client') }}</span>
          <AppSelect
            v-model="responseForm.clientId"
            :options="clientOptions"
            :placeholder="$t('questionnaires.selectClient')"
            :disabled="Boolean(prefilledClientId)"
            @change="onResponseClientChange"
          />
        </label>
        <label class="field">
          <span>{{ $t('questionnaires.fields.template') }}</span>
          <AppSelect
            v-model="responseForm.templateId"
            :options="templateOptions"
            :placeholder="$t('questionnaires.selectTemplate')"
            :optionDisabled="'disabled'"
            @change="onTemplateChange"
          />
          <small v-if="!publishedTemplates.length" class="field-hint">
            {{ $t('questionnaires.onlyPublishedHint') }}
          </small>
        </label>
        <label class="field">
          <span>{{ $t('questionnaires.fields.appointment') }}</span>
          <AppSelect
            v-model="responseForm.appointmentId"
            :options="responseAppointmentOptions"
            :placeholder="$t('questionnaires.selectAppointment')"
            :optionDisabled="'disabled'"
            :disabled="Boolean(prefilledAppointmentId)"
          />
        </label>

        <div v-if="dynamicFields.length" class="dynamic-grid">
          <label v-for="field in dynamicFields" :key="field.key" class="field">
            <span>{{ field.label }}</span>
            <input
              v-if="field.type === 'text'"
              :value="stringValue(field.key)"
              type="text"
              :required="Boolean(field.required)"
              @input="onTextInput(field.key, $event)"
            />
            <textarea
              v-else-if="field.type === 'textarea'"
              :value="stringValue(field.key)"
              rows="3"
              :required="Boolean(field.required)"
              @input="onTextInput(field.key, $event)"
            />
            <input
              v-else-if="field.type === 'number'"
              :value="numberValue(field.key)"
              type="number"
              :required="Boolean(field.required)"
              @input="onNumberInput(field.key, $event)"
            />
            <input
              v-else-if="field.type === 'date'"
              :value="stringValue(field.key)"
              type="date"
              :required="Boolean(field.required)"
              @input="onTextInput(field.key, $event)"
            />
            <AppSelect
              v-else-if="field.type === 'select'"
              :modelValue="stringValue(field.key)"
              :options="dynamicFieldOptions(field)"
              :placeholder="$t('common.select')"
              @update:modelValue="setDynamicSelectValue(field.key, $event)"
            />
            <label v-else class="boolean-field">
              <input
                type="checkbox"
                :checked="booleanValue(field.key)"
                @change="onBooleanInput(field.key, $event)"
              />
              <span>{{ $t('common.yes') }}</span>
            </label>
          </label>
        </div>

        <label v-else class="field">
          <span>{{ $t('questionnaires.fields.answers') }}</span>
          <textarea v-model="responseForm.answersText" rows="8"></textarea>
        </label>

        <section class="signature">
          <h4>{{ $t('questionnaires.signature.title') }}</h4>
          <label class="field">
            <span>{{ $t('questionnaires.signature.mode') }}</span>
            <AppSelect v-model="signatureMode" :options="signatureModeOptions" />
          </label>
          <label v-if="signatureMode === 'TYPE'" class="field">
            <span>{{ $t('questionnaires.signature.typedValue') }}</span>
            <input v-model="signatureText" type="text" />
          </label>
          <SignaturePad
            v-else
            v-model="signatureDrawData"
            :clear-label="$t('questionnaires.signature.clear')"
          />
        </section>

        <div class="dialog-actions">
          <button type="submit" class="primary" :disabled="loading">{{ $t('questionnaires.create') }}</button>
          <button type="button" class="ghost" @click="responseDialogOpen = false">
            {{ $t('common.cancel') }}
          </button>
        </div>
      </form>
    </Dialog>

    <Dialog
      v-model:visible="anamneseDialogOpen"
      modal
      header="Nova Anamnese Nano Fios"
      class="dialog"
      :style="{ width: 'min(96vw, 1080px)' }"
      @hide="closeAnamneseDialog"
    >
      <section class="form">
        <div v-if="!anamneseRoutePrefill" class="dynamic-grid">
          <label class="field">
            <span>{{ $t('questionnaires.fields.client') }}</span>
            <AppSelect
              v-model="anamneseForm.clientId"
              :options="clientOptions"
              :placeholder="$t('questionnaires.selectClient')"
              :disabled="Boolean(prefilledClientId)"
              @change="onAnamneseClientChange"
            />
          </label>
          <label class="field">
            <span>{{ $t('questionnaires.fields.appointment') }}</span>
            <AppSelect
              v-model="anamneseForm.appointmentId"
              :options="anamneseAppointmentOptions"
              :placeholder="$t('questionnaires.selectAppointment')"
              :optionDisabled="'disabled'"
              :disabled="Boolean(prefilledAppointmentId)"
            />
          </label>
        </div>
        <div v-else class="prefill-summary">
          <article class="prefill-card">
            <span>{{ $t('questionnaires.fields.client') }}</span>
            <strong>{{ selectedAnamneseClient?.fullName || '-' }}</strong>
          </article>
          <article class="prefill-card">
            <span>{{ $t('questionnaires.fields.appointment') }}</span>
            <strong>{{ selectedAnamneseAppointment ? formatDate(selectedAnamneseAppointment.scheduledAt) : '-' }}</strong>
          </article>
        </div>

        <small v-if="!publishedAnamneseTemplate" class="field-hint">
          O template publicado da anamnese nano fios nao foi encontrado.
        </small>
        <small
          v-else-if="anamneseForm.clientId && !anamneseAppointments.length"
          class="field-hint"
        >
          Nenhum atendimento disponivel foi encontrado para esse cliente.
        </small>
        <small
          v-else-if="!anamneseForm.clientId || !anamneseForm.appointmentId"
          class="field-hint"
        >
          Selecione cliente e atendimento para preencher a anamnese.
        </small>

        <QuestionnaireAnamneseNanoFios
          v-if="publishedAnamneseTemplate && anamneseForm.clientId && anamneseForm.appointmentId"
          :key="`${anamneseForm.clientId}-${anamneseForm.appointmentId}`"
          :client-id="anamneseForm.clientId"
          :appointment-id="anamneseForm.appointmentId"
          :template-id="publishedAnamneseTemplate._id"
          :prefilled-data="anamnesePrefilledData"
          @submit="submitAnamnese"
          @close="closeAnamneseDialog"
        />
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
import AppSelect from '../components/AppSelect.vue';
import { apiDelete, apiGet, apiPost, apiPut } from '../services/api';
import { useAuthStore } from '../stores/auth';
import type { Appointment, AppointmentListResponse } from '../types/appointment';
import type { ClientListResponse } from '../types/client';
import type { QuestionnaireResponse, QuestionnaireTemplate } from '../types/questionnaire';
import ErrorCard from '../components/ErrorCard.vue';
import SignaturePad from '../components/SignaturePad.vue';
import QuestionnaireAnamneseNanoFios from '../components/QuestionnaireAnamneseNanoFios.vue';

type DynamicFieldType = 'text' | 'textarea' | 'number' | 'date' | 'boolean' | 'select';

type DynamicField = {
  key: string;
  label: string;
  type: DynamicFieldType;
  required?: boolean;
  options?: string[];
};

type AnamneseSignatureField = {
  mode: 'DRAW' | 'TYPE';
  typedValue?: string;
  drawnValue?: string;
};

type AnamneseAnswers = Record<string, unknown> & {
  nomeCompleto?: string;
  telefone?: string;
  dataDeNascimento?: string;
  assinaturaCliente?: AnamneseSignatureField;
};

function toInputDate(value = new Date()) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

@Component({
  components: { DataTable, Column, Dialog, ErrorCard, SignaturePad, AppSelect, QuestionnaireAnamneseNanoFios }
})
class QuestionnairesView extends Vue {
  authStore = useAuthStore();
  confirm = useConfirm();
  showTemplateManagement = false;
  showGenericResponseFlow = false;
  templates: QuestionnaireTemplate[] = [];
  responses: QuestionnaireResponse[] = [];
  clientResponsesMap: Record<string, QuestionnaireResponse[]> = {};
  appointmentsById: Record<string, Appointment> = {};
  responseAppointments: Appointment[] = [];
  clients: ClientListResponse['items'] = [];
  selectedClientId = '';
  responseDateFrom = toInputDate();
  responseDateTo = toInputDate();
  loading = false;
  error = '';
  templateDialogOpen = false;
  responseDialogOpen = false;
  anamneseDialogOpen = false;
  anamneseRoutePrefill = false;
  prefilledClientId = '';
  prefilledAppointmentId = '';
  dynamicFields: DynamicField[] = [];
  dynamicAnswers: Record<string, unknown> = {};
  anamneseAppointments: Appointment[] = [];
  signatureMode: 'DRAW' | 'TYPE' = 'DRAW';
  signatureDrawData = '';
  signatureText = '';
  builderField: {
    key: string;
    label: string;
    type: DynamicFieldType;
    required: boolean;
    optionsText: string;
  } = {
    key: '',
    label: '',
    type: 'text',
    required: false,
    optionsText: ''
  };
  templateFields: DynamicField[] = [];
  editingFieldIndex = -1;
  editingTemplateId = '';
  templateForm = {
    name: ''
  };
  responseForm = {
    clientId: '',
    templateId: '',
    appointmentId: '',
    answersText: '{\n  "observacoes": ""\n}'
  };
  anamneseForm = {
    clientId: '',
    appointmentId: ''
  };

  mounted() {
    void this.loadInitialData();
  }

  get canManageTemplates() {
    return ['MANAGER', 'ADMIN'].includes(this.authStore.role || '');
  }

  get publishedTemplates() {
    return this.templates.filter((item) => item.status === 'PUBLISHED');
  }

  get publishedAnamneseTemplate() {
    return this.templates.find((item) => item.code === 'ANAMNESE-NANO-FIOS' && item.status === 'PUBLISHED');
  }

  get filteredResponses() {
    const from = this.responseDateFrom ? new Date(`${this.responseDateFrom}T00:00:00`) : null;
    const to = this.responseDateTo ? new Date(`${this.responseDateTo}T23:59:59.999`) : null;

    return this.responses.filter((response) => {
      const createdAt = new Date(response.createdAt);
      if (from && createdAt < from) return false;
      if (to && createdAt > to) return false;
      return true;
    });
  }

  get selectedTemplate() {
    return this.templates.find((item) => item._id === this.responseForm.templateId);
  }

  get clientOptions() {
    return this.clients.map((client) => ({
      label: client.fullName,
      value: client.id
    }));
  }

  get builderTypeOptions() {
    return ['text', 'textarea', 'number', 'date', 'boolean', 'select'].map((type) => ({
      label: String(this.$t(`questionnaires.builder.types.${type}`)),
      value: type
    }));
  }

  get templateOptions() {
    return this.templates.map((template) => ({
      label: this.formatTemplateOption(template),
      value: template._id,
      disabled: template.status !== 'PUBLISHED'
    }));
  }

  get responseAppointmentOptions() {
    return this.responseAppointments.map((appointment) => ({
      label: this.formatAppointmentOption(appointment),
      value: appointment.id,
      disabled: this.isAppointmentAnswered(appointment.id)
    }));
  }

  get anamneseAppointmentOptions() {
    return this.anamneseAppointments.map((appointment) => ({
      label: this.formatAppointmentOption(appointment, this.anamneseForm.clientId),
      value: appointment.id,
      disabled: this.isAppointmentAnsweredForClient(appointment.id, this.anamneseForm.clientId)
    }));
  }

  get anamnesePrefilledData(): Partial<AnamneseAnswers> {
    const client = this.clients.find((item) => item.id === this.anamneseForm.clientId);
    if (!client) {
      return {};
    }

    return {
      nomeCompleto: client.fullName,
      telefone: client.phone,
      dataDeNascimento: client.birthDate ? client.birthDate.slice(0, 10) : ''
    };
  }

  get selectedAnamneseClient() {
    return this.clients.find((item) => item.id === this.anamneseForm.clientId);
  }

  get selectedAnamneseAppointment() {
    return this.anamneseAppointments.find((item) => item.id === this.anamneseForm.appointmentId);
  }

  get signatureModeOptions() {
    return [
      { label: String(this.$t('questionnaires.signature.draw')), value: 'DRAW' },
      { label: String(this.$t('questionnaires.signature.type')), value: 'TYPE' }
    ];
  }

  async loadInitialData() {
    this.loading = true;
    this.error = '';
    try {
      const [templates, clients] = await Promise.all([
        apiGet<QuestionnaireTemplate[]>('/questionnaires/templates', this.authStore.token),
        apiGet<ClientListResponse>(
          '/clients?page=1&limit=100&sortBy=createdAt&sortOrder=desc',
          this.authStore.token
        )
      ]);
      this.templates = templates;
      this.clients = clients.items;
      await this.applyRoutePrefill();
    } catch (err) {
      this.error = this.extractErrorMessage(err) || this.$t('questionnaires.error');
    } finally {
      this.loading = false;
    }
  }

  async loadResponses() {
    if (!this.selectedClientId) {
      this.responses = [];
      return;
    }
    this.loading = true;
    this.error = '';
    try {
      const list = await apiGet<QuestionnaireResponse[]>(
        `/questionnaires/responses/client/${this.selectedClientId}`,
        this.authStore.token
      );
      this.responses = list;
      this.clientResponsesMap[this.selectedClientId] = list;
      const appointments = await this.fetchAppointmentsForClient(this.selectedClientId);
      this.storeAppointments(appointments);
      await this.loadMissingAppointments(list);
    } catch (err) {
      this.error = this.extractErrorMessage(err) || this.$t('questionnaires.error');
    } finally {
      this.loading = false;
    }
  }

  canEditTemplate(template: QuestionnaireTemplate) {
    if (typeof template.canEdit === 'boolean') {
      return template.canEdit;
    }
    const hasResponses = Boolean(template.hasResponses);
    return !hasResponses;
  }

  canDeleteTemplate(template: QuestionnaireTemplate) {
    if (this.authStore.role !== 'ADMIN') {
      return false;
    }
    if (typeof template.canDelete === 'boolean') {
      return template.canDelete;
    }
    return !Boolean(template.hasResponses);
  }

  openTemplateDialog(template?: QuestionnaireTemplate) {
    const validTemplate =
      template && typeof template === 'object' && '_id' in template && 'schema' in template ? template : undefined;
    this.editingTemplateId = validTemplate?._id || '';
    this.templateForm = {
      name: validTemplate?.name || ''
    };
    this.builderField = {
      key: '',
      label: '',
      type: 'text',
      required: false,
      optionsText: ''
    };
    this.editingFieldIndex = -1;
    this.templateFields = validTemplate ? this.extractFields(validTemplate.schema) : [];
    this.templateDialogOpen = true;
  }

  addFieldToTemplate() {
    const label = this.builderField.label.trim();
    if (!label || !this.builderField.type) {
      this.error = this.$t('questionnaires.builder.fieldRequired');
      return;
    }

    const baseKey = this.builderField.key.trim() || this.createFieldKey(label);
    const key = this.ensureUniqueFieldKey(baseKey, this.editingFieldIndex);
    const duplicatedKey = this.templateFields.some(
      (item, index) => index !== this.editingFieldIndex && item.key.toLowerCase() === key.toLowerCase()
    );
    if (duplicatedKey) {
      this.error = this.$t('questionnaires.builder.keyDuplicated');
      return;
    }

    const field: DynamicField = {
      key,
      label,
      type: this.builderField.type,
      required: this.builderField.required
    };

    if (field.type === 'select') {
      const options = this.builderField.optionsText
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
      field.options = options;
    }

    if (this.editingFieldIndex >= 0) {
      this.templateFields.splice(this.editingFieldIndex, 1, field);
    } else {
      this.templateFields.push(field);
    }
    this.cancelFieldEdit();
    this.error = '';
  }

  createFieldKey(label: string) {
    const normalized = label
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');

    return normalized || 'campo';
  }

  ensureUniqueFieldKey(baseKey: string, ignoreIndex = -1) {
    let key = baseKey;
    let suffix = 2;
    while (
      this.templateFields.some(
        (item, index) => index !== ignoreIndex && item.key.toLowerCase() === key.toLowerCase()
      )
    ) {
      key = `${baseKey}_${suffix}`;
      suffix += 1;
    }
    return key;
  }

  startEditField(index: number) {
    const field = this.templateFields[index];
    if (!field) return;
    this.builderField = {
      key: field.key,
      label: field.label,
      type: field.type,
      required: Boolean(field.required),
      optionsText: Array.isArray(field.options) ? field.options.join(', ') : ''
    };
    this.editingFieldIndex = index;
    this.error = '';
  }

  cancelFieldEdit() {
    this.builderField = {
      key: '',
      label: '',
      type: 'text',
      required: false,
      optionsText: ''
    };
    this.editingFieldIndex = -1;
  }

  moveFieldUp(index: number) {
    if (index <= 0) return;
    const list = [...this.templateFields];
    const [field] = list.splice(index, 1);
    if (!field) return;
    list.splice(index - 1, 0, field);
    this.templateFields = list;
    if (this.editingFieldIndex === index) {
      this.editingFieldIndex = index - 1;
    } else if (this.editingFieldIndex === index - 1) {
      this.editingFieldIndex = index;
    }
  }

  moveFieldDown(index: number) {
    if (index >= this.templateFields.length - 1) return;
    const list = [...this.templateFields];
    const [field] = list.splice(index, 1);
    if (!field) return;
    list.splice(index + 1, 0, field);
    this.templateFields = list;
    if (this.editingFieldIndex === index) {
      this.editingFieldIndex = index + 1;
    } else if (this.editingFieldIndex === index + 1) {
      this.editingFieldIndex = index;
    }
  }

  removeField(index: number) {
    this.templateFields = this.templateFields.filter((_, current) => current !== index);
    if (this.editingFieldIndex === index) {
      this.cancelFieldEdit();
      return;
    }
    if (this.editingFieldIndex > index) {
      this.editingFieldIndex -= 1;
    }
  }

  closeTemplateDialog() {
    this.templateDialogOpen = false;
    this.editingTemplateId = '';
    this.cancelFieldEdit();
  }

  async openResponseDialog() {
    this.responseForm = {
      clientId: this.prefilledClientId || this.selectedClientId || '',
      templateId: '',
      appointmentId: this.prefilledAppointmentId || '',
      answersText: '{\n  "observacoes": ""\n}'
    };
    this.dynamicFields = [];
    this.dynamicAnswers = {};
    this.signatureMode = 'DRAW';
    this.signatureDrawData = '';
    this.signatureText = '';
    this.responseAppointments = [];
    await this.loadResponseAppointments(this.responseForm.clientId);
    this.responseDialogOpen = true;
  }

  async openAnamneseDialog(fromRoute = false) {
    if (!this.publishedAnamneseTemplate) {
      this.error = 'Template publicado da anamnese nano fios nao encontrado.';
      return;
    }

    this.error = '';
    this.anamneseRoutePrefill = fromRoute && Boolean(this.prefilledClientId && this.prefilledAppointmentId);
    this.anamneseForm = {
      clientId: this.prefilledClientId || this.selectedClientId || '',
      appointmentId: this.prefilledAppointmentId || ''
    };
    this.anamneseAppointments = [];

    if (this.anamneseForm.clientId) {
      await this.loadAnamneseAppointments(this.anamneseForm.clientId);
    }

    this.anamneseDialogOpen = true;
  }

  closeAnamneseDialog() {
    this.anamneseDialogOpen = false;
    this.anamneseAppointments = [];
    const shouldClearRoutePrefill = this.anamneseRoutePrefill;
    this.anamneseRoutePrefill = false;
    this.anamneseForm = {
      clientId: '',
      appointmentId: ''
    };
    if (shouldClearRoutePrefill) {
      void this.clearQuestionnaireRoutePrefill();
    }
  }

  async onAnamneseClientChange() {
    if (this.prefilledAppointmentId) {
      return;
    }

    this.anamneseForm.appointmentId = '';
    await this.loadAnamneseAppointments(this.anamneseForm.clientId);
  }

  async onResponseClientChange() {
    if (this.prefilledAppointmentId) {
      return;
    }
    this.responseForm.appointmentId = '';
    await this.loadResponseAppointments(this.responseForm.clientId);
  }

  async fetchAppointmentsForClient(clientId: string) {
    const normalized = clientId.trim();
    if (!normalized) {
      return [];
    }

    const query = `/appointments?page=1&limit=100&sortBy=scheduledAt&sortOrder=desc&clientId=${encodeURIComponent(normalized)}`;
    const result = await apiGet<AppointmentListResponse>(query, this.authStore.token);

    if (!this.clientResponsesMap[normalized]) {
      const responses = await apiGet<QuestionnaireResponse[]>(
        `/questionnaires/responses/client/${normalized}`,
        this.authStore.token
      );
      this.clientResponsesMap[normalized] = responses;
    }

    return result.items;
  }

  async loadResponseAppointments(clientId: string) {
    const normalized = clientId.trim();
    if (!normalized) {
      this.responseAppointments = [];
      return;
    }
    try {
      this.responseAppointments = await this.fetchAppointmentsForClient(normalized);
      this.storeAppointments(this.responseAppointments);
    } catch (err) {
      this.responseAppointments = [];
      this.error = this.extractErrorMessage(err) || this.$t('questionnaires.error');
    }
  }

  async loadAnamneseAppointments(clientId: string) {
    const normalized = clientId.trim();
    if (!normalized) {
      this.anamneseAppointments = [];
      return;
    }

    try {
      this.anamneseAppointments = await this.fetchAppointmentsForClient(normalized);
      this.storeAppointments(this.anamneseAppointments);
    } catch (err) {
      this.anamneseAppointments = [];
      this.error = this.extractErrorMessage(err) || this.$t('questionnaires.error');
    }
  }

  async applyRoutePrefill() {
    const routeClientId = String(this.$route.query.clientId || '').trim();
    const routeAppointmentId = String(this.$route.query.appointmentId || '').trim();
    const routeMode = String(this.$route.query.mode || '').trim();
    this.prefilledClientId = routeClientId;
    this.prefilledAppointmentId = routeAppointmentId;

    if (!routeClientId && !routeAppointmentId) {
      return;
    }

    if (routeClientId) {
      this.selectedClientId = routeClientId;
      await this.loadResponses();
    }

    if (routeMode === 'anamnese') {
      await this.openAnamneseDialog(true);
      return;
    }

    if (this.showGenericResponseFlow) {
      await this.openResponseDialog();
    }
  }

  async clearQuestionnaireRoutePrefill() {
    const query = { ...this.$route.query };
    delete query.clientId;
    delete query.appointmentId;
    delete query.mode;
    this.prefilledClientId = '';
    this.prefilledAppointmentId = '';
    await this.$router.replace({
      path: this.$route.path,
      query
    });
  }

  onTemplateChange() {
    const template = this.selectedTemplate;
    if (!template) {
      this.dynamicFields = [];
      this.dynamicAnswers = {};
      return;
    }
    this.dynamicFields = this.extractFields(template.schema);
    this.dynamicAnswers = {};
    for (const field of this.dynamicFields) {
      this.dynamicAnswers[field.key] = field.type === 'boolean' ? false : '';
    }
  }

  extractFields(schema: Record<string, unknown>) {
    const fieldsFromArray = schema.fields;
    if (Array.isArray(fieldsFromArray)) {
      return fieldsFromArray
        .filter((item): item is Record<string, unknown> => Boolean(item && typeof item === 'object'))
        .map((item) => ({
          key: String(item.key || ''),
          label: String(item.label || item.key || ''),
          type: this.normalizeFieldType(item.type),
          required: Boolean(item.required),
          options: Array.isArray(item.options) ? item.options.map((value) => String(value)) : undefined
        }))
        .filter((item) => item.key.length > 0);
    }

    const props = schema.properties;
    if (props && typeof props === 'object') {
      return Object.entries(props as Record<string, unknown>)
        .filter(([, value]) => Boolean(value && typeof value === 'object'))
        .map(([key, value]) => {
          const field = value as Record<string, unknown>;
          return {
            key,
            label: String(field.title || key),
            type: this.normalizeJsonSchemaType(field.type),
            required: false,
            options: Array.isArray(field.enum) ? field.enum.map((opt) => String(opt)) : undefined
          };
        });
    }

    return [];
  }

  normalizeFieldType(raw: unknown): DynamicFieldType {
    const value = String(raw || 'text').toLowerCase();
    if (value === 'textarea') return 'textarea';
    if (value === 'number') return 'number';
    if (value === 'date') return 'date';
    if (value === 'boolean') return 'boolean';
    if (value === 'select') return 'select';
    return 'text';
  }

  normalizeJsonSchemaType(raw: unknown): DynamicFieldType {
    const value = String(raw || 'string').toLowerCase();
    if (value === 'number' || value === 'integer') return 'number';
    if (value === 'boolean') return 'boolean';
    return 'text';
  }

  stringValue(key: string) {
    const value = this.dynamicAnswers[key];
    return value == null ? '' : String(value);
  }

  numberValue(key: string) {
    const value = this.dynamicAnswers[key];
    return typeof value === 'number' ? value : '';
  }

  booleanValue(key: string) {
    return Boolean(this.dynamicAnswers[key]);
  }

  dynamicFieldOptions(field: DynamicField) {
    return (field.options || []).map((option) => ({
      label: option,
      value: option
    }));
  }

  setDynamicSelectValue(key: string, value: string) {
    this.dynamicAnswers[key] = value;
  }

  onTextInput(key: string, event: Event) {
    const target = event.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
    this.dynamicAnswers[key] = target.value;
  }

  onNumberInput(key: string, event: Event) {
    const target = event.target as HTMLInputElement;
    this.dynamicAnswers[key] = target.value ? Number(target.value) : '';
  }

  onBooleanInput(key: string, event: Event) {
    const target = event.target as HTMLInputElement;
    this.dynamicAnswers[key] = target.checked;
  }

  async submitTemplate() {
    this.loading = true;
    this.error = '';
    try {
      const hasBuilderInput =
        this.builderField.label.trim().length > 0 ||
        this.builderField.optionsText.trim().length > 0;
      if (hasBuilderInput) {
        this.addFieldToTemplate();
        if (this.error) {
          this.loading = false;
          return;
        }
      }

      if (!this.templateFields.length) {
        this.error = this.$t('questionnaires.builder.emptyTemplate');
        this.loading = false;
        return;
      }
      const schema = {
        fields: this.templateFields.map((field) => ({
          key: field.key,
          label: field.label,
          type: field.type,
          required: Boolean(field.required),
          ...(field.type === 'select' ? { options: field.options || [] } : {})
        }))
      } as Record<string, unknown>;
      const payload = {
        name: this.templateForm.name.trim(),
        schema
      };
      if (this.editingTemplateId) {
        await apiPut(`/questionnaires/templates/${this.editingTemplateId}`, payload, this.authStore.token);
      } else {
        await apiPost('/questionnaires/templates', payload, this.authStore.token);
      }
      this.editingTemplateId = '';
      this.templateDialogOpen = false;
      await this.loadInitialData();
    } catch (err) {
      this.error = this.extractErrorMessage(err) || this.$t('questionnaires.error');
    } finally {
      this.loading = false;
    }
  }

  async publishTemplate(templateId: string) {
    this.loading = true;
    this.error = '';
    try {
      await apiPost(`/questionnaires/templates/${templateId}/publish`, {}, this.authStore.token);
      await this.loadInitialData();
    } catch (err) {
      this.error = this.extractErrorMessage(err) || this.$t('questionnaires.error');
    } finally {
      this.loading = false;
    }
  }

  confirmDeleteTemplate(template: QuestionnaireTemplate) {
    this.confirm.require({
      message: this.$t('questionnaires.confirmDeleteTemplate'),
      header: this.$t('questionnaires.deleteTemplate'),
      acceptLabel: this.$t('common.confirm'),
      rejectLabel: this.$t('common.cancel'),
      accept: () => this.deleteTemplate(template)
    });
  }

  async deleteTemplate(template: QuestionnaireTemplate) {
    this.loading = true;
    this.error = '';
    try {
      await apiDelete(`/questionnaires/templates/${template._id}`, this.authStore.token);
      await this.loadInitialData();
    } catch (err) {
      this.error = this.extractErrorMessage(err) || this.$t('questionnaires.error');
    } finally {
      this.loading = false;
    }
  }

  async submitResponse() {
    this.loading = true;
    this.error = '';
    try {
      const answers =
        this.dynamicFields.length > 0
          ? this.dynamicAnswers
          : (JSON.parse(this.responseForm.answersText) as Record<string, unknown>);

      const signatureValue = this.signatureMode === 'DRAW' ? this.signatureDrawData : this.signatureText.trim();
      const selectedClient = this.clients.find((item) => item.id === this.responseForm.clientId);
      const signature =
        signatureValue.length > 0
          ? {
              mode: this.signatureMode,
              value: signatureValue,
              signedAt: new Date().toISOString(),
              signedBy: selectedClient?.fullName || 'Cliente'
            }
          : undefined;

      await apiPost(
        '/questionnaires/responses',
        {
          clientId: this.responseForm.clientId,
          appointmentId: this.responseForm.appointmentId.trim(),
          templateId: this.responseForm.templateId,
          answers,
          signature
        },
        this.authStore.token
      );
      this.responseDialogOpen = false;
      this.selectedClientId = this.responseForm.clientId;
      await this.loadResponses();
    } catch (err) {
      this.error = this.extractErrorMessage(err) || this.$t('questionnaires.error');
    } finally {
      this.loading = false;
    }
  }

  async submitAnamnese(answers: AnamneseAnswers) {
    const template = this.publishedAnamneseTemplate;
    if (!template) {
      this.error = 'Template publicado da anamnese nano fios nao encontrado.';
      return;
    }

    if (!this.anamneseForm.clientId || !this.anamneseForm.appointmentId) {
      this.error = 'Selecione cliente e atendimento para salvar a anamnese.';
      return;
    }

    this.loading = true;
    this.error = '';
    try {
      const selectedClient = this.clients.find((item) => item.id === this.anamneseForm.clientId);
      const signatureField = answers.assinaturaCliente;
      const signatureValue =
        signatureField?.mode === 'DRAW'
          ? String(signatureField.drawnValue || '').trim()
          : String(signatureField?.typedValue || '').trim();

      const signature =
        signatureField && signatureValue
          ? {
              mode: signatureField.mode,
              value: signatureValue,
              signedAt: new Date().toISOString(),
              signedBy: String(answers.nomeCompleto || selectedClient?.fullName || 'Cliente')
            }
          : undefined;

      await apiPost(
        '/questionnaires/responses',
        {
          clientId: this.anamneseForm.clientId,
          appointmentId: this.anamneseForm.appointmentId.trim(),
          templateId: template._id,
          answers,
          signature
        },
        this.authStore.token
      );

      const savedClientId = this.anamneseForm.clientId;
      this.selectedClientId = savedClientId;
      this.closeAnamneseDialog();
      await this.loadResponses();
    } catch (err) {
      this.error = this.extractErrorMessage(err) || this.$t('questionnaires.error');
    } finally {
      this.loading = false;
    }
  }

  formatTemplateOption(template: QuestionnaireTemplate) {
    const base = `${template.code} v${template.version} - ${template.name}`;
    if (template.status === 'PUBLISHED') return base;
    return `${base} (${this.$t('questionnaires.statusDraft')})`;
  }

  formatAppointmentOption(appointment: Appointment, clientId = this.responseForm.clientId) {
    const date = this.formatDate(appointment.scheduledAt);
    const status = this.$t(`appointments.statuses.${appointment.status}`);
    if (this.isAppointmentAnsweredForClient(appointment.id, clientId)) {
      return `${date} - ${status} (${this.$t('questionnaires.appointmentAlreadyAnswered')})`;
    }
    return `${date} - ${status}`;
  }

  isAppointmentAnsweredForClient(appointmentId: string, clientId: string) {
    if (!clientId) return false;
    const responses = this.clientResponsesMap[clientId] || [];
    return responses.some((item) => item.appointmentId === appointmentId);
  }

  isAppointmentAnswered(appointmentId: string) {
    return this.isAppointmentAnsweredForClient(appointmentId, this.responseForm.clientId);
  }

  storeAppointments(appointments: Appointment[]) {
    for (const appointment of appointments) {
      this.appointmentsById[appointment.id] = appointment;
    }
  }

  async loadMissingAppointments(responses: QuestionnaireResponse[]) {
    const missingIds = Array.from(
      new Set(
        responses
          .map((response) => response.appointmentId.trim())
          .filter((appointmentId) => appointmentId && !this.appointmentsById[appointmentId])
      )
    );

    if (!missingIds.length) {
      return;
    }

    const appointments = await Promise.all(
      missingIds.map(async (appointmentId) => {
        try {
          return await apiGet<Appointment>(`/appointments/${appointmentId}`, this.authStore.token);
        } catch {
          return null;
        }
      })
    );

    this.storeAppointments(appointments.filter((appointment): appointment is Appointment => Boolean(appointment)));
  }

  responseAppointment(response: QuestionnaireResponse) {
    return this.appointmentsById[response.appointmentId] || null;
  }

  responseAppointmentLabel(response: QuestionnaireResponse) {
    const appointment = this.responseAppointment(response);
    if (!appointment) {
      return response.appointmentId || '-';
    }

    return this.formatDate(appointment.scheduledAt);
  }

  goToAppointment(response: QuestionnaireResponse) {
    const appointment = this.responseAppointment(response);
    if (!appointment) {
      return;
    }

    const appointmentDate = appointment.scheduledAt.slice(0, 10);
    void this.$router.push({
      path: '/app/appointments',
      query: {
        appointmentId: appointment.id,
        clientId: appointment.clientId,
        professionalId: appointment.professionalId,
        dateFrom: appointmentDate,
        dateTo: appointmentDate
      }
    });
  }

  canOpenResponsePdf(response: QuestionnaireResponse) {
    return response.templateCode === 'ANAMNESE-NANO-FIOS';
  }

  openResponsePdf(response: QuestionnaireResponse) {
    if (!this.canOpenResponsePdf(response)) {
      return;
    }

    const route = this.$router.resolve({
      name: 'questionnaire-anamnese-print',
      params: { id: response._id },
      query: { autoPrint: '1' }
    });
    window.open(route.href, '_blank', 'noopener,noreferrer');
  }

  formatDate(value?: string) {
    if (!value) return '-';
    return new Date(value).toLocaleString();
  }

  extractErrorMessage(error: unknown) {
    if (error instanceof Error) {
      return error.message;
    }
    return '';
  }
}
export default toNative(QuestionnairesView);
</script>

<style scoped>
.questionnaires {
  display: grid;
  gap: 1.5rem;
}

.questionnaires-header h2 {
  margin: 0 0 0.4rem;
  font-size: 1.8rem;
}

.questionnaires-header p {
  margin: 0;
  color: var(--muted);
}

.panel {
  border: 1px solid var(--border);
  border-radius: 18px;
  background: var(--panel);
  padding: 1rem;
  display: grid;
  gap: 1rem;
}

.panel-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.panel-head h3 {
  margin: 0;
}

.filters {
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
}

.table {
  border-radius: 14px;
  border: 1px solid var(--border);
  background: var(--panel);
}

.dialog {
  min-width: min(760px, 92vw);
}

.form {
  display: grid;
  gap: 1.4rem;
}

.builder {
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 1rem;
  display: grid;
  gap: 0.9rem;
}

.builder h4 {
  margin: 0;
}

.builder-grid {
  display: grid;
  gap: 1.2rem 0.8rem;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  align-items: start;
}

.builder-grid .full {
  grid-column: 1 / -1;
}

.builder-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.builder-actions {
  display: inline-flex;
  gap: 0.6rem;
  align-items: center;
}

.checkbox-inline {
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  font-weight: 600;
  color: var(--muted);
}

.checkbox-inline input {
  width: 16px;
  height: 16px;
}

.builder-list {
  display: grid;
  gap: 0.6rem;
}

.builder-item {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 0.6rem 0.75rem;
  background: var(--panel-strong);
}

.builder-item-content {
  display: grid;
  gap: 0.2rem;
}

.builder-item-content span {
  font-size: 0.85rem;
  color: var(--muted);
}

.builder-item-actions {
  display: inline-flex;
  gap: 0.35rem;
  align-items: center;
}

.dynamic-grid {
  display: grid;
  gap: 1.4rem 1rem;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  align-items: start;
}

.field {
  display: grid;
  gap: 0.45rem;
  align-content: start;
  font-weight: 500;
}

.field-hint {
  color: var(--danger, #b42318);
  font-size: 0.8rem;
  min-height: 1.1rem;
}

.boolean-field {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500;
}

.field input,
.field textarea {
  padding: 0.7rem 0.9rem;
  border-radius: 12px;
  border: 1px solid var(--border);
  background: #fffdf9;
}

.prefill-summary {
  display: grid;
  gap: 0.9rem;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
}

.prefill-card {
  display: grid;
  gap: 0.35rem;
  padding: 0.9rem 1rem;
  border: 1px solid var(--border);
  border-radius: 12px;
  background: #fffdf9;
}

.prefill-card span {
  color: var(--muted);
  font-size: 0.82rem;
}

.appointment-cell {
  display: grid;
  gap: 0.25rem;
}

.appointment-link {
  width: fit-content;
  padding: 0;
  border: none;
  background: transparent;
  color: var(--primary);
  font: inherit;
  font-size: 0.85rem;
  font-weight: 700;
  cursor: pointer;
  text-decoration: underline;
  text-underline-offset: 0.15em;
}

.prefill-card strong {
  font-size: 0.95rem;
}

.signature {
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 1rem;
  display: grid;
  gap: 1rem;
}

.signature h4 {
  margin: 0;
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

@media (max-width: 900px) {
  .builder-grid {
    grid-template-columns: 1fr;
  }

  .builder-controls {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
