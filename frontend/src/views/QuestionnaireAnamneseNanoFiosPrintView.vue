<template>
  <section class="print-view">
    <header class="print-toolbar">
      <div>
        <h1>Anamnese Nano Fios</h1>
        <p>Visualizacao preparada para impressao e geracao de PDF.</p>
      </div>
      <div class="print-actions">
        <button type="button" class="primary" @click="printDocument">Imprimir / Gerar PDF</button>
        <button type="button" class="ghost" @click="closeWindow">Fechar</button>
      </div>
    </header>

    <p v-if="loading" class="status-copy">Carregando documento...</p>
    <ErrorCard v-else-if="error" :message="error" />
    <QuestionnaireAnamneseNanoFios
      v-else-if="responseAnswers"
      :prefilled-data="responseAnswers"
      :allow-professional-notes="true"
      :read-only="true"
      :show-actions="false"
    />
  </section>
</template>

<script lang="ts">
import { Component, Vue, toNative } from 'vue-facing-decorator';
import QuestionnaireAnamneseNanoFios from '../components/QuestionnaireAnamneseNanoFios.vue';
import ErrorCard from '../components/ErrorCard.vue';
import { apiGet } from '../services/api';
import { useAuthStore } from '../stores/auth';
import type { Appointment } from '../types/appointment';
import type { QuestionnaireResponse } from '../types/questionnaire';

@Component({ components: { QuestionnaireAnamneseNanoFios, ErrorCard } })
class QuestionnaireAnamneseNanoFiosPrintView extends Vue {
  authStore = useAuthStore();
  loading = false;
  error = '';
  responseAnswers: Record<string, unknown> | null = null;
  private autoPrintRequested = true;

  mounted() {
    const autoPrintQuery = String(this.$route.query.autoPrint || '1');
    this.autoPrintRequested = autoPrintQuery !== '0';
    document.title = 'Anamnese Nano Fios';
    void this.loadResponse();
  }

  async loadResponse() {
    const responseId = String(this.$route.params.id || '').trim();
    if (!responseId) {
      this.error = 'Resposta nao encontrada.';
      return;
    }

    this.loading = true;
    this.error = '';

    try {
      const response = await apiGet<QuestionnaireResponse>(
        `/questionnaires/responses/${responseId}`,
        this.authStore.token
      );

      if (response.templateCode !== 'ANAMNESE-NANO-FIOS') {
        this.error = 'A impressao especial so esta disponivel para a anamnese nano fios.';
        return;
      }

      this.responseAnswers = response.answers || {};
      const appointment = await this.loadAppointment(response.appointmentId);
      document.title = this.buildPrintTitle(response, appointment);

      if (this.autoPrintRequested) {
        await this.$nextTick();
        window.setTimeout(() => this.printDocument(), 350);
      }
    } catch (err) {
      this.error = err instanceof Error ? err.message : 'Nao foi possivel carregar a resposta.';
    } finally {
      this.loading = false;
    }
  }

  async loadAppointment(appointmentId: string) {
    if (!appointmentId.trim()) {
      return null;
    }

    try {
      return await apiGet<Appointment>(`/appointments/${appointmentId}`, this.authStore.token);
    } catch {
      return null;
    }
  }

  buildPrintTitle(response: QuestionnaireResponse, appointment: Appointment | null) {
    const answers = response.answers || {};
    const rawClientName =
      (typeof answers.nomeCompleto === 'string' && answers.nomeCompleto.trim()) ||
      response.signature?.signedBy ||
      'Cliente';

    const safeClientName = rawClientName
      .replace(/[\\/:*?"<>|]/g, '-')
      .replace(/\s+/g, ' ')
      .trim();

    const dateSource = appointment?.scheduledAt || response.createdAt;
    const date = new Date(dateSource);
    const isValidDate = !Number.isNaN(date.getTime());

    if (!isValidDate) {
      return safeClientName || 'Anamnese Nano Fios';
    }

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    return `${safeClientName} - ${year}-${month}-${day} ${hours}h${minutes}`;
  }

  printDocument() {
    window.print();
  }

  closeWindow() {
    window.close();
  }
}

export default toNative(QuestionnaireAnamneseNanoFiosPrintView);
</script>

<style scoped>
.print-view {
  min-height: 100vh;
  padding: 1.5rem 0 2rem;
}

.print-toolbar {
  width: min(100%, 210mm);
  margin: 0 auto 1rem;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.print-toolbar h1 {
  margin: 0;
  font-size: 1.5rem;
}

.print-toolbar p,
.status-copy {
  margin: 0.35rem 0 0;
  color: var(--muted);
}

.print-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 0.75rem;
}

.primary,
.ghost {
  border-radius: 999px;
  padding: 0.8rem 1.2rem;
  font: inherit;
  font-weight: 700;
  cursor: pointer;
  border: 1px solid transparent;
}

.primary {
  background: #1f2937;
  color: #fff;
}

.ghost {
  background: transparent;
  border-color: #9ca3af;
  color: #374151;
}

.status-copy {
  width: min(100%, 210mm);
  margin: 0 auto;
}

@media print {
  .print-view {
    padding: 0;
    background: #fff;
  }

  .print-toolbar {
    display: none !important;
  }
}
</style>
