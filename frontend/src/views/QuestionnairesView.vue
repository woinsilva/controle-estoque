<template>
  <section class="questionnaires">
    <header class="questionnaires-header">
      <div>
        <h2>{{ $t('questionnaires.title') }}</h2>
        <p>{{ $t('questionnaires.subtitle') }}</p>
      </div>
    </header>

    <section class="panel">
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
        <button type="button" class="primary" @click="openResponseDialog">
          {{ $t('questionnaires.newResponse') }}
        </button>
      </div>

      <div class="filters">
        <label class="field">
          <span>{{ $t('questionnaires.fields.client') }}</span>
          <select v-model="selectedClientId" @change="loadResponses">
            <option value="">{{ $t('questionnaires.selectClient') }}</option>
            <option v-for="client in clients" :key="client.id" :value="client.id">
              {{ client.fullName }}
            </option>
          </select>
        </label>
      </div>

      <DataTable :value="responses" dataKey="_id" responsiveLayout="scroll" class="table">
        <Column field="templateCode" :header="$t('questionnaires.fields.template')" />
        <Column field="templateVersion" :header="$t('questionnaires.fields.version')" />
        <Column field="appointmentId" :header="$t('questionnaires.fields.appointment')" />
        <Column field="createdAt" :header="$t('questionnaires.fields.createdAt')">
          <template #body="{ data }">
            {{ formatDate(data.createdAt) }}
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
              <select v-model="builderField.type">
                <option value="text">{{ $t('questionnaires.builder.types.text') }}</option>
                <option value="textarea">{{ $t('questionnaires.builder.types.textarea') }}</option>
                <option value="number">{{ $t('questionnaires.builder.types.number') }}</option>
                <option value="date">{{ $t('questionnaires.builder.types.date') }}</option>
                <option value="boolean">{{ $t('questionnaires.builder.types.boolean') }}</option>
                <option value="select">{{ $t('questionnaires.builder.types.select') }}</option>
              </select>
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
          <select v-model="responseForm.clientId" :disabled="Boolean(prefilledClientId)" required @change="onResponseClientChange">
            <option value="">{{ $t('questionnaires.selectClient') }}</option>
            <option v-for="client in clients" :key="client.id" :value="client.id">
              {{ client.fullName }}
            </option>
          </select>
        </label>
        <label class="field">
          <span>{{ $t('questionnaires.fields.template') }}</span>
          <select v-model="responseForm.templateId" required @change="onTemplateChange">
            <option value="">{{ $t('questionnaires.selectTemplate') }}</option>
            <option
              v-for="template in templates"
              :key="template._id"
              :value="template._id"
              :disabled="template.status !== 'PUBLISHED'"
            >
              {{ formatTemplateOption(template) }}
            </option>
          </select>
          <small v-if="!publishedTemplates.length" class="field-hint">
            {{ $t('questionnaires.onlyPublishedHint') }}
          </small>
        </label>
        <label class="field">
          <span>{{ $t('questionnaires.fields.appointment') }}</span>
          <select
            v-model="responseForm.appointmentId"
            :disabled="Boolean(prefilledAppointmentId)"
            required
          >
            <option value="">{{ $t('questionnaires.selectAppointment') }}</option>
            <option
              v-for="appointment in responseAppointments"
              :key="appointment.id"
              :value="appointment.id"
              :disabled="isAppointmentAnswered(appointment.id)"
            >
              {{ formatAppointmentOption(appointment) }}
            </option>
          </select>
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
            <select
              v-else-if="field.type === 'select'"
              :value="stringValue(field.key)"
              :required="Boolean(field.required)"
              @change="onTextInput(field.key, $event)"
            >
              <option value="">{{ $t('common.select') }}</option>
              <option v-for="opt in field.options || []" :key="opt" :value="opt">{{ opt }}</option>
            </select>
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
            <select v-model="signatureMode">
              <option value="DRAW">{{ $t('questionnaires.signature.draw') }}</option>
              <option value="TYPE">{{ $t('questionnaires.signature.type') }}</option>
            </select>
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

    <ErrorCard :message="error" />
  </section>
</template>

<script lang="ts">
import { Component, Vue, toNative } from 'vue-facing-decorator';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Dialog from 'primevue/dialog';
import { apiGet, apiPost, apiPut } from '../services/api';
import { useAuthStore } from '../stores/auth';
import type { Appointment, AppointmentListResponse } from '../types/appointment';
import type { ClientListResponse } from '../types/client';
import type { QuestionnaireResponse, QuestionnaireTemplate } from '../types/questionnaire';
import ErrorCard from '../components/ErrorCard.vue';
import SignaturePad from '../components/SignaturePad.vue';

type DynamicFieldType = 'text' | 'textarea' | 'number' | 'date' | 'boolean' | 'select';

type DynamicField = {
  key: string;
  label: string;
  type: DynamicFieldType;
  required?: boolean;
  options?: string[];
};

@Component({ components: { DataTable, Column, Dialog, ErrorCard, SignaturePad } })
class QuestionnairesView extends Vue {
  authStore = useAuthStore();
  templates: QuestionnaireTemplate[] = [];
  responses: QuestionnaireResponse[] = [];
  clientResponsesMap: Record<string, QuestionnaireResponse[]> = {};
  responseAppointments: Appointment[] = [];
  clients: ClientListResponse['items'] = [];
  selectedClientId = '';
  loading = false;
  error = '';
  templateDialogOpen = false;
  responseDialogOpen = false;
  prefilledClientId = '';
  prefilledAppointmentId = '';
  dynamicFields: DynamicField[] = [];
  dynamicAnswers: Record<string, unknown> = {};
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

  mounted() {
    void this.loadInitialData();
  }

  get canManageTemplates() {
    return ['MANAGER', 'ADMIN'].includes(this.authStore.role || '');
  }

  get publishedTemplates() {
    return this.templates.filter((item) => item.status === 'PUBLISHED');
  }

  get selectedTemplate() {
    return this.templates.find((item) => item._id === this.responseForm.templateId);
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

  async onResponseClientChange() {
    if (this.prefilledAppointmentId) {
      return;
    }
    this.responseForm.appointmentId = '';
    await this.loadResponseAppointments(this.responseForm.clientId);
  }

  async loadResponseAppointments(clientId: string) {
    const normalized = clientId.trim();
    if (!normalized) {
      this.responseAppointments = [];
      return;
    }
    try {
      const query = `/appointments?page=1&limit=100&sortBy=scheduledAt&sortOrder=desc&clientId=${encodeURIComponent(normalized)}`;
      const result = await apiGet<AppointmentListResponse>(query, this.authStore.token);
      this.responseAppointments = result.items;
      if (!this.clientResponsesMap[normalized]) {
        const responses = await apiGet<QuestionnaireResponse[]>(
          `/questionnaires/responses/client/${normalized}`,
          this.authStore.token
        );
        this.clientResponsesMap[normalized] = responses;
      }
    } catch (err) {
      this.responseAppointments = [];
      this.error = this.extractErrorMessage(err) || this.$t('questionnaires.error');
    }
  }

  async applyRoutePrefill() {
    const routeClientId = String(this.$route.query.clientId || '').trim();
    const routeAppointmentId = String(this.$route.query.appointmentId || '').trim();
    this.prefilledClientId = routeClientId;
    this.prefilledAppointmentId = routeAppointmentId;

    if (!routeClientId && !routeAppointmentId) {
      return;
    }

    if (routeClientId) {
      this.selectedClientId = routeClientId;
      await this.loadResponses();
    }

    await this.openResponseDialog();
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

  formatTemplateOption(template: QuestionnaireTemplate) {
    const base = `${template.code} v${template.version} - ${template.name}`;
    if (template.status === 'PUBLISHED') return base;
    return `${base} (${this.$t('questionnaires.statusDraft')})`;
  }

  formatAppointmentOption(appointment: Appointment) {
    const date = this.formatDate(appointment.scheduledAt);
    const status = this.$t(`appointments.statuses.${appointment.status}`);
    if (this.isAppointmentAnswered(appointment.id)) {
      return `${date} - ${status} (${this.$t('questionnaires.appointmentAlreadyAnswered')})`;
    }
    return `${date} - ${status}`;
  }

  isAppointmentAnswered(appointmentId: string) {
    const clientId = this.responseForm.clientId;
    if (!clientId) return false;
    const responses = this.clientResponsesMap[clientId] || [];
    return responses.some((item) => item.appointmentId === appointmentId);
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
  grid-template-columns: minmax(220px, 360px);
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
.field select,
.field textarea {
  padding: 0.7rem 0.9rem;
  border-radius: 12px;
  border: 1px solid var(--border);
  background: #fffdf9;
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







