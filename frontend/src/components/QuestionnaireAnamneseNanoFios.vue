<template>
  <div class="questionnaire-anamnese" :class="{ 'read-only': readOnly }">
    <form class="anamnese-form" novalidate @submit.prevent="handleFormSubmit">
      <fieldset class="anamnese-fieldset" :disabled="readOnly">
      <article class="page">
        <header class="page-header">
          <h1>FICHA DE ANAMNESE PARA NANO FIOS</h1>
          <p>
            Os Nano Fios/Nanoblading sao uma tecnica de implantacao de pigmento, com a lamina nano
            (super fina), na camada superficial da pele, derme papilar. Tem a finalidade de
            preenchimento de falhas e embelezamento das sobrancelhas.
          </p>
        </header>

        <section class="line-stack">
          <label class="line-field">
            <span>Nome Completo:</span>
            <input v-model.trim="answers.nomeCompleto" type="text" autocomplete="name" required />
          </label>
          <label class="line-field">
            <span>CPF:</span>
            <input
              :value="answers.cpf"
              type="text"
              inputmode="numeric"
              maxlength="14"
              placeholder="000.000.000-00"
              @keydown="onCpfKeydown"
              @paste="onCpfPaste"
              @input="onCpfInput"
              @blur="onCpfBlur"
              :required="!readOnly"
            />
          </label>
          <label class="line-field">
            <span>Data de Nascimento:</span>
            <input v-model="answers.dataDeNascimento" type="date" autocomplete="bday" :required="!readOnly" />
          </label>
          <label class="line-field">
            <span>Endereco:</span>
            <input v-model.trim="answers.endereco" type="text" autocomplete="street-address" />
          </label>
          <label class="line-field">
            <span>Telefone:</span>
            <input
              :value="answers.telefone"
              type="tel"
              inputmode="tel"
              autocomplete="tel"
              placeholder="(00) 00000-0000"
              :required="!readOnly"
              @input="onTelefoneInput"
            />
          </label>
          <label class="line-field">
            <span>Como nos conheceu:</span>
            <input v-model.trim="answers.comoNosConheceu" type="text" />
          </label>
        </section>

        <section class="content-block">
          <h2>INFORMACOES PREVENTIVAS (ASSINALE O QUE FOR SEU CASO)</h2>
          <div class="preventive-grid">
            <div class="preventive-column" v-for="(column, index) in preventiveColumns" :key="index">
              <label v-for="item in column" :key="item.key" class="option-row checkbox-row">
                <input v-model="answers[item.key]" type="checkbox" />
                <span>{{ item.label }}</span>
              </label>
            </div>
          </div>
          <label class="line-field">
            <span>Area destinada a explicacao das informacoes acima (somente as que precisam de explicacao):</span>
            <textarea v-model.trim="answers.explicacaoInformacoes" rows="4"></textarea>
          </label>
        </section>

        <section class="content-block compact-block">
          <label class="question-line">
            <span>Qual e o seu tipo de pele?</span>
          </label>
          <div class="inline-options">
            <label v-for="option in skinTypeOptions" :key="option.value" class="option-row">
              <input v-model="answers.tipoPele" type="radio" :value="option.value" />
              <span>{{ option.label }}</span>
            </label>
            <label class="inline-note">
              <span>Obs:</span>
              <input v-model.trim="answers.observacaoTipoPele" type="text" />
            </label>
          </div>
        </section>

        <section class="content-block compact-block">
          <label class="question-line">
            <span>Ja fez micropigmentacao ou nanopigmentacao antes?</span>
          </label>
          <div class="inline-options">
            <label class="option-row">
              <input v-model="answers.jaFezMicropigmentacao" type="radio" value="sim" />
              <span>Sim</span>
            </label>
            <label class="option-row">
              <input v-model="answers.jaFezMicropigmentacao" type="radio" value="nao" />
              <span>Nao</span>
            </label>
            <label class="line-field inline-fill">
              <span>Se sim, ha quanto tempo? Fez remocao?</span>
              <input v-model.trim="answers.detalhesMicropigmentacao" type="text" />
            </label>
          </div>
        </section>

        <section class="content-block compact-block">
          <label class="line-field">
            <span>Se existir alguma outra questao que considere necessario informar antes do procedimento, descreva abaixo.</span>
            <textarea v-model.trim="answers.outrasInformacoes" rows="3"></textarea>
          </label>
        </section>

        <section class="content-block text-block">
          <h2>LEIA COM ATENCAO AS INFORMACOES ABAIXO!</h2>
          <ul>
            <li v-for="item in importantNotes" :key="item">{{ item }}</li>
          </ul>
        </section>
      </article>

      <article class="page">
        <section class="content-block text-block">
          <h2>SOBRE RETOQUE E MANUTENCAO</h2>
          <ul>
            <li v-for="item in maintenanceNotes" :key="item">{{ item }}</li>
          </ul>
        </section>

        <section class="content-block professional-block">
          <h2>ANOTACOES PROFISSIONAIS (NAO PREENCHA)</h2>
          <p v-if="!allowProfessionalNotes" class="section-note">
            Campos reservados ao preenchimento da profissional.
          </p>
          <div class="professional-grid">
            <label class="line-field">
              <span>Marca do pigmento:</span>
              <input v-model.trim="answers.marcaPigmento" type="text" :disabled="!allowProfessionalNotes" />
            </label>
            <label class="line-field">
              <span>Cor (ou cores):</span>
              <input v-model.trim="answers.corPigmento" type="text" :disabled="!allowProfessionalNotes" />
            </label>
            <label class="line-field">
              <span>Marca da lamina:</span>
              <input v-model.trim="answers.marcaLamina" type="text" :disabled="!allowProfessionalNotes" />
            </label>
            <label class="line-field">
              <span>Espessura e pontas:</span>
              <input v-model.trim="answers.espessuraPontas" type="text" :disabled="!allowProfessionalNotes" />
            </label>
            <label class="line-field full-width">
              <span>Tipo de pele (pos avaliacao):</span>
              <input
                v-model.trim="answers.tipoPelePosAvaliacao"
                type="text"
                :disabled="!allowProfessionalNotes"
              />
            </label>
            <label class="line-field full-width">
              <span>Preferencias, intercorrencias e obs:</span>
              <textarea
                v-model.trim="answers.preferenciasIntercorrencias"
                rows="3"
                :disabled="!allowProfessionalNotes"
              ></textarea>
            </label>
            <label class="line-field">
              <span>Valor atual:</span>
              <input
                :value="answers.valorAtual"
                type="text"
                inputmode="numeric"
                placeholder="R$ 0,00"
                :disabled="!allowProfessionalNotes"
                @input="onValorAtualInput"
              />
            </label>
            <label class="line-field">
              <span>Forma de pagamento:</span>
              <select v-model="answers.formaPagamento" :disabled="!allowProfessionalNotes">
                <option value="">Selecione</option>
                <option v-for="option in paymentOptions" :key="option.value" :value="option.value">
                  {{ option.label }}
                </option>
              </select>
            </label>
            <label class="line-field">
              <span>Data do retoque:</span>
              <input v-model="answers.dataRetoque" type="date" :disabled="!allowProfessionalNotes" />
            </label>
            <label class="line-field">
              <span>Alteracoes:</span>
              <input v-model.trim="answers.alteracoes" type="text" :disabled="!allowProfessionalNotes" />
            </label>
            <label class="line-field full-width">
              <span>OBS:</span>
              <textarea
                v-model.trim="answers.observacoesProfissionais"
                rows="3"
                :disabled="!allowProfessionalNotes"
              ></textarea>
            </label>
          </div>
        </section>

        <section class="content-block consent-block">
          <h2>TERMO DE CONSENTIMENTO</h2>
          <p class="consent-copy">
            Declaro que li todas as informacoes anteriores e estou de acordo com tudo que foi
            informado. As declaracoes que constam acima nessa ficha de anamnese sao verdadeiras, nao
            cabendo a profissional a responsabilidade por informacoes omitidas na avaliacao. Estou
            ciente de todas as informacoes mencionadas no pre, durante e pos procedimento,
            relacionadas aos valores, cuidados, cicatrizacao, durabilidade, prazo para retoque, etc.
            Fui orientada pela profissional e comprometo-me a seguir todos os cuidados apos o
            procedimento, entendendo que eles sao fundamentais para uma boa cicatrizacao, resultado
            final e durabilidade. Caso haja algum desconforto, complicacao ou reacao alergica, irei
            procurar imediatamente um profissional da saude. Entendo que algumas questoes
            fisiologicas fogem da responsabilidade da profissional.
          </p>

          <div class="authorization-box">
            <span>
              Eu autorizo o uso da minha imagem em registros de fotos e/ou videos para divulgacao da
              profissional em redes sociais e/ou outros meios, por tempo indeterminado.
            </span>
            <div class="inline-options authorization-options">
              <label v-for="option in authorizationOptions" :key="option.value" class="option-row">
                <input v-model="answers.autorizacaoImagem" type="radio" :value="option.value" />
                <span>{{ option.label }}</span>
              </label>
            </div>
          </div>

          <label class="line-field consent-date">
            <span>Campo Largo, data do termo:</span>
            <input v-model="answers.dataTermo" type="date" :required="!readOnly" />
          </label>

          <div class="signature-grid">
            <section class="signature-card">
              <div class="signature-header">
                <strong>Assinatura da Cliente</strong>
                <div v-if="!readOnly" class="signature-mode-switch">
                  <button
                    type="button"
                    class="mode-button"
                    :class="{ active: answers.assinaturaCliente.mode === 'DRAW' }"
                    @click="answers.assinaturaCliente.mode = 'DRAW'"
                  >
                    Desenhar
                  </button>
                  <button
                    type="button"
                    class="mode-button"
                    :class="{ active: answers.assinaturaCliente.mode === 'TYPE' }"
                    @click="answers.assinaturaCliente.mode = 'TYPE'"
                  >
                    Digitar
                  </button>
                </div>
              </div>
              <div v-if="readOnly" class="signature-static" :class="{ empty: !hasSignatureValue(answers.assinaturaCliente) }">
                <img
                  v-if="answers.assinaturaCliente.mode === 'DRAW' && answers.assinaturaCliente.drawnValue"
                  :src="answers.assinaturaCliente.drawnValue"
                  alt="Assinatura da Cliente"
                />
                <div v-else-if="answers.assinaturaCliente.typedValue" class="signature-static__typed">
                  {{ answers.assinaturaCliente.typedValue }}
                </div>
                <span v-else>Assinatura nao informada.</span>
              </div>
              <SignaturePad
                v-else-if="answers.assinaturaCliente.mode === 'DRAW'"
                v-model="answers.assinaturaCliente.drawnValue"
                clear-label="Limpar assinatura"
              />
              <label v-else class="line-field signature-typed">
                <span>Nome completo para assinatura</span>
                <input
                  v-model.trim="answers.assinaturaCliente.typedValue"
                  type="text"
                  placeholder="Digite o nome da cliente"
                />
              </label>
            </section>

            <section class="signature-card">
              <div class="signature-header">
                <strong>Assinatura da Profissional</strong>
                <div v-if="allowProfessionalNotes && !readOnly" class="signature-mode-switch">
                  <button
                    type="button"
                    class="mode-button"
                    :class="{ active: answers.assinaturaProfissional.mode === 'DRAW' }"
                    @click="answers.assinaturaProfissional.mode = 'DRAW'"
                  >
                    Desenhar
                  </button>
                  <button
                    type="button"
                    class="mode-button"
                    :class="{ active: answers.assinaturaProfissional.mode === 'TYPE' }"
                    @click="answers.assinaturaProfissional.mode = 'TYPE'"
                  >
                    Digitar
                  </button>
                </div>
              </div>
              <div
                v-if="readOnly"
                class="signature-static"
                :class="{ empty: !hasSignatureValue(answers.assinaturaProfissional) }"
              >
                <img
                  v-if="answers.assinaturaProfissional.mode === 'DRAW' && answers.assinaturaProfissional.drawnValue"
                  :src="answers.assinaturaProfissional.drawnValue"
                  alt="Assinatura da Profissional"
                />
                <div v-else-if="answers.assinaturaProfissional.typedValue" class="signature-static__typed">
                  {{ answers.assinaturaProfissional.typedValue }}
                </div>
                <span v-else>Assinatura nao informada.</span>
              </div>
              <SignaturePad
                v-else-if="allowProfessionalNotes && answers.assinaturaProfissional.mode === 'DRAW'"
                v-model="answers.assinaturaProfissional.drawnValue"
                clear-label="Limpar assinatura"
              />
              <label v-else-if="allowProfessionalNotes" class="line-field signature-typed">
                <span>Nome completo para assinatura</span>
                <input
                  v-model.trim="answers.assinaturaProfissional.typedValue"
                  type="text"
                  placeholder="Digite o nome da profissional"
                />
              </label>
              <div v-else class="signature-placeholder">Campo reservado a profissional.</div>
            </section>
          </div>
        </section>
      </article>
      </fieldset>

      <section v-if="showActions" class="actions">
        <p v-if="validationError" class="form-error">{{ validationError }}</p>
        <section v-if="showValidationSummary && currentValidationIssues.length" class="validation-summary">
          <strong>Campos invalidos</strong>
          <ul>
            <li v-for="issue in currentValidationIssues" :key="issue.key">
              <span>{{ issue.label }}:</span> {{ issue.message }}
            </li>
          </ul>
        </section>
        <div class="action-buttons">
          <button type="submit" class="btn btn-primary" :disabled="loading">
            {{ loading ? 'Salvando...' : 'Salvar anamnese' }}
          </button>
          <button type="button" class="btn btn-secondary" @click="resetForm">
            Limpar formulario
          </button>
          <button type="button" class="btn btn-ghost" @click="$emit('close')">
            Cancelar
          </button>
        </div>
      </section>
    </form>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import SignaturePad from './SignaturePad.vue';
import { notify } from '../services/notifications';

type PreventiveFieldKey =
  | 'usaAcidosCosmeticos'
  | 'usoMedicamentos'
  | 'periodoMenstrual'
  | 'hemofiliaOuCoagulo'
  | 'tratamentoEsteticoRecente'
  | 'dormeLadoEsquerdo'
  | 'dormeLadoDireito'
  | 'fazExerciciosFisicos'
  | 'tomaBanhosQuentes'
  | 'gestanteOuLactante'
  | 'fazNatacaoSaunaPraia'
  | 'cicatrizNaSobrancelha'
  | 'fumante'
  | 'historicoAlergico'
  | 'cicatrizacaoLenta'
  | 'doencaDePele'
  | 'outraDoenca'
  | 'disfuncaoTireoideMetabolismo';

type SignatureMode = 'DRAW' | 'TYPE';
type AuthorizationOption = '' | 'SIM' | 'NAO' | 'SOMENTE_REGIAO';
type SkinType = '' | 'seca' | 'normal' | 'mista' | 'oleosa';
type BinaryChoice = '' | 'sim' | 'nao';

type SignatureField = {
  mode: SignatureMode;
  typedValue: string;
  drawnValue: string;
};

type ValidationIssue = {
  key: string;
  label: string;
  message: string;
};

interface FormAnswers {
  nomeCompleto: string;
  cpf: string;
  dataDeNascimento: string;
  endereco: string;
  telefone: string;
  comoNosConheceu: string;
  usaAcidosCosmeticos: boolean;
  usoMedicamentos: boolean;
  periodoMenstrual: boolean;
  hemofiliaOuCoagulo: boolean;
  tratamentoEsteticoRecente: boolean;
  dormeLadoEsquerdo: boolean;
  dormeLadoDireito: boolean;
  fazExerciciosFisicos: boolean;
  tomaBanhosQuentes: boolean;
  gestanteOuLactante: boolean;
  fazNatacaoSaunaPraia: boolean;
  cicatrizNaSobrancelha: boolean;
  fumante: boolean;
  historicoAlergico: boolean;
  cicatrizacaoLenta: boolean;
  doencaDePele: boolean;
  outraDoenca: boolean;
  disfuncaoTireoideMetabolismo: boolean;
  explicacaoInformacoes: string;
  tipoPele: SkinType;
  observacaoTipoPele: string;
  jaFezMicropigmentacao: BinaryChoice;
  detalhesMicropigmentacao: string;
  outrasInformacoes: string;
  marcaPigmento: string;
  corPigmento: string;
  marcaLamina: string;
  espessuraPontas: string;
  tipoPelePosAvaliacao: string;
  preferenciasIntercorrencias: string;
  valorAtual: string;
  formaPagamento: string;
  dataRetoque: string;
  alteracoes: string;
  observacoesProfissionais: string;
  autorizacaoImagem: AuthorizationOption;
  dataTermo: string;
  assinaturaCliente: SignatureField;
  assinaturaProfissional: SignatureField;
}

const preventiveColumns: Array<Array<{ key: PreventiveFieldKey; label: string }>> = [
  [
    { key: 'usaAcidosCosmeticos', label: 'Usa acidos cosmeticos (cite quais abaixo)' },
    { key: 'usoMedicamentos', label: 'Uso de medicamentos (cite quais abaixo)' },
    { key: 'periodoMenstrual', label: 'Esta no periodo menstrual' },
    { key: 'hemofiliaOuCoagulo', label: 'Tem hemofilia ou coagulo' },
    {
      key: 'tratamentoEsteticoRecente',
      label: 'Fez tratamento estetico facial recente em menos de 30 dias (cite qual abaixo)'
    },
    { key: 'dormeLadoEsquerdo', label: 'Dorme do lado esquerdo' },
    { key: 'dormeLadoDireito', label: 'Dorme do lado direito' },
    { key: 'fazExerciciosFisicos', label: 'Faz academia ou exercicios fisicos' },
    { key: 'tomaBanhosQuentes', label: 'Toma banhos quentes' },
    { key: 'gestanteOuLactante', label: 'Gestante ou lactante' }
  ],
  [
    { key: 'fazNatacaoSaunaPraia', label: 'Faz natacao, sauna ou ira a praia' },
    { key: 'cicatrizNaSobrancelha', label: 'Tem cicatriz(es) na sobrancelha (cite quais abaixo)' },
    { key: 'fumante', label: 'E fumante' },
    { key: 'historicoAlergico', label: 'Tem historico alergico (cite qual abaixo)' },
    { key: 'cicatrizacaoLenta', label: 'Tem cicatrizacao demorada/lenta' },
    {
      key: 'doencaDePele',
      label: 'Tem alguma doenca de pele, como: Vitiligo, Rosacea, Alopecia, Psoriase, Dermatite (cite qual abaixo)'
    },
    {
      key: 'outraDoenca',
      label: 'Tem alguma outra doenca, como Cancer, HIV, Diabetes, Hepatite, Lupus, Hipertensao, Trombose, Epilepsia, Tumores, Herpes ou outras doencas'
    },
    { key: 'disfuncaoTireoideMetabolismo', label: 'Disfuncao na tireoide e/ou metabolismo lento' }
  ]
];

const skinTypeOptions = [
  { value: 'seca', label: 'Seca' },
  { value: 'normal', label: 'Normal' },
  { value: 'mista', label: 'Mista' },
  { value: 'oleosa', label: 'Oleosa' }
] as const;

const authorizationOptions = [
  { value: 'SIM', label: 'SIM' },
  { value: 'NAO', label: 'NAO' },
  { value: 'SOMENTE_REGIAO', label: 'SOMENTE DA REGIAO' }
] as const;

const paymentOptions = [
  { value: 'credito', label: 'Credito' },
  { value: 'debito', label: 'Debito' },
  { value: 'dinheiro', label: 'Dinheiro' },
  { value: 'pix', label: 'Pix' }
] as const;

const importantNotes = [
  'O valor nao sera reembolsado caso nao seja a tecnica de sua preferencia e prefira algo mais marcado e artificial. Para isso existe a conversa de alinhamento pre-procedimento. Nano fios sao indicados para quem busca um resultado mais natural.',
  'Devido a leveza do procedimento, ele pode ficar com algumas falhas apos a cicatrizacao. A pele humana nao e um papel: possui poros e questoes fisiologicas pessoais. Apos 30 dias, deve-se observar a necessidade de retoque nos pontos que clarearem.',
  'A durabilidade media e de 6 a 18 meses, dependendo do tipo de pele, idade, rotina e cuidados de cada cliente.',
  'Nem sempre o procedimento some por completo apos a durabilidade media. Alguns fios podem permanecer. Caso voce opte por refazer o procedimento antes de degradar ao menos 80% dos fios, a remocao a laser pode ser indicada.',
  'Alguns fatores podem interferir no resultado do procedimento, como disfuncoes hormonais, doencas de pele, tipo de pele, rotina de cuidados e outros fatores adversos. Peles muito oleosas e/ou sensiveis podem apresentar resultado menos perceptivel.',
  'Algumas correcoes de assimetrias, principalmente internas e musculares, nem sempre sao possiveis.',
  'Durante o periodo de cicatrizacao, voce pode sentir coceira, descamacao ou um certo incomodo leve.',
  'Nos primeiros dias, e normal a cor ficar bastante intensa e escura. Mesmo que voce goste dessa intensidade, apos cicatrizado o pigmento tende a clarear ao menos 30%.',
  'Em 10 a 15 dias, o procedimento pode parecer falhado e manchado, ou ate parecer que sumiu em algumas partes. Na maioria dos casos ele volta com 30 dias. Tenha paciencia com o processo.',
  'Com 30 dias teremos o resultado final cicatrizado. Nenhuma alteracao podera ser decidida antes disso.'
];

const maintenanceNotes = [
  'O retoque nao e obrigatorio e e gratuito quando feito de 30 ate 60 dias do procedimento inicial.',
  'Caso nao seja realizado em ate 60 dias da presente data, sera cobrada a taxa de R$ 250. Voce tem 1 mes para se organizar no pos cicatrizado.',
  'O prazo maximo considerado retoque e de 90 dias. Ate 60 dias de forma gratuita, de 60 a 90 dias com a taxa.',
  'Devido ao retoque nao ser obrigatorio e nem necessario em todos os casos, o agendamento e de sua responsabilidade. Se tiver duvidas quanto a necessidade, pedimos que entre em contato.',
  'Sugerimos que, se necessario o retoque, seja agendado logo apos o periodo de cicatrizacao de 30 dias. Se nao houver disponibilidade de agenda, apos 60 dias ele sera cobrado. Se antecipe.',
  'Caso nao compareca ao retoque gratuito ou nao faca a confirmacao em ate 24 horas antes do procedimento, o agendamento sera cancelado e sera cobrado valor do proximo agendamento, de R$ 250.',
  'Caso queira fazer um segundo retoque, este nao sera mais gratuito e voce podera agendar em ate 30 dias apos o retorno, com o valor de R$ 250.',
  'Em um periodo de ate 6 meses apos o procedimento inicial, podemos realizar uma manutencao com o custo de 70% do valor atual do procedimento, sem incluir um novo retoque gratuito. Para essa manutencao, deve haver pelo menos 60% dos fios desenhados aparentes na pele.',
  'Apos 6 meses sera cobrado um novo procedimento, mesmo que ainda haja algum pigmento na pele.'
];

const props = withDefaults(
  defineProps<{
    clientId?: string;
    appointmentId?: string;
    templateId?: string;
    prefilledData?: Partial<FormAnswers>;
    allowProfessionalNotes?: boolean;
    readOnly?: boolean;
    showActions?: boolean;
  }>(),
  {
    clientId: '',
    appointmentId: '',
    templateId: '',
    prefilledData: undefined,
    allowProfessionalNotes: true,
    readOnly: false,
    showActions: true
  }
);

const emit = defineEmits<{
  submit: [answers: FormAnswers];
  close: [];
}>();

function createInitialAnswers(prefilledData?: Partial<FormAnswers>): FormAnswers {
  const defaults: FormAnswers = {
    nomeCompleto: '',
    cpf: '',
    dataDeNascimento: '',
    endereco: '',
    telefone: '',
    comoNosConheceu: '',
    usaAcidosCosmeticos: false,
    usoMedicamentos: false,
    periodoMenstrual: false,
    hemofiliaOuCoagulo: false,
    tratamentoEsteticoRecente: false,
    dormeLadoEsquerdo: false,
    dormeLadoDireito: false,
    fazExerciciosFisicos: false,
    tomaBanhosQuentes: false,
    gestanteOuLactante: false,
    fazNatacaoSaunaPraia: false,
    cicatrizNaSobrancelha: false,
    fumante: false,
    historicoAlergico: false,
    cicatrizacaoLenta: false,
    doencaDePele: false,
    outraDoenca: false,
    disfuncaoTireoideMetabolismo: false,
    explicacaoInformacoes: '',
    tipoPele: '',
    observacaoTipoPele: '',
    jaFezMicropigmentacao: '',
    detalhesMicropigmentacao: '',
    outrasInformacoes: '',
    marcaPigmento: 'Lovbeauty - com ANVISA',
    corPigmento: '',
    marcaLamina: 'LovBeauty - com ANVISA',
    espessuraPontas: '',
    tipoPelePosAvaliacao: '',
    preferenciasIntercorrencias: '',
    valorAtual: '',
    formaPagamento: '',
    dataRetoque: '',
    alteracoes: '',
    observacoesProfissionais: '',
    autorizacaoImagem: '',
    dataTermo: '',
    assinaturaCliente: {
      mode: 'DRAW',
      typedValue: '',
      drawnValue: ''
    },
    assinaturaProfissional: {
      mode: 'DRAW',
      typedValue: '',
      drawnValue: ''
    }
  };

  return {
    ...defaults,
    ...prefilledData,
    assinaturaCliente: {
      ...defaults.assinaturaCliente,
      ...(prefilledData?.assinaturaCliente || {})
    },
    assinaturaProfissional: {
      ...defaults.assinaturaProfissional,
      ...(prefilledData?.assinaturaProfissional || {})
    }
  };
}

function hasSignatureValue(signature: SignatureField) {
  return signature.mode === 'DRAW'
    ? signature.drawnValue.trim().length > 0
    : signature.typedValue.trim().length > 0;
}

function formatCpf(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  return digits
    .replace(/^(\d{3})(\d)/, '$1.$2')
    .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1-$2');
}

function isValidCpf(value: string) {
  const digits = value.replace(/\D/g, '');
  if (digits.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(digits)) return false;

  let sum = 0;
  for (let index = 0; index < 9; index += 1) {
    sum += Number(digits[index]) * (10 - index);
  }

  let remainder = (sum * 10) % 11;
  if (remainder === 10) remainder = 0;
  if (remainder !== Number(digits[9])) return false;

  sum = 0;
  for (let index = 0; index < 10; index += 1) {
    sum += Number(digits[index]) * (11 - index);
  }

  remainder = (sum * 10) % 11;
  if (remainder === 10) remainder = 0;
  return remainder === Number(digits[10]);
}

function formatCurrency(value: string) {
  const digits = value.replace(/\D/g, '');
  if (!digits) return '';

  const amount = Number(digits) / 100;
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(amount);
}

function formatPhone(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 11);

  if (digits.length <= 2) return digits ? `(${digits}` : '';
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

const loading = ref(false);
const validationError = ref('');
const cpfValidationNotified = ref<'none' | 'incomplete' | 'invalid'>('none');
const showValidationSummary = ref(false);
const answers = reactive<FormAnswers>(createInitialAnswers(props.prefilledData));
const allowProfessionalNotes = props.allowProfessionalNotes;
const readOnly = props.readOnly;
const showActions = props.showActions;

const showValidationError = (message: string) => {
  validationError.value = message;
  notify({
    severity: 'error',
    summary: 'Erro',
    detail: message
  });
};

const hasPositiveCurrencyValue = (value: string) => {
  const digits = value.replace(/\D/g, '');
  return Number(digits) > 0;
};

const collectValidationIssues = (): ValidationIssue[] => {
  const issues: ValidationIssue[] = [];
  const cpfDigits = answers.cpf.replace(/\D/g, '');

  if (!answers.nomeCompleto.trim()) {
    issues.push({
      key: 'nomeCompleto',
      label: 'Nome Completo',
      message: 'preencha este campo.'
    });
  }

  if (!cpfDigits) {
    issues.push({
      key: 'cpf',
      label: 'CPF',
      message: 'preencha este campo.'
    });
  } else if (cpfDigits.length !== 11) {
    issues.push({
      key: 'cpf',
      label: 'CPF',
      message: 'complete o CPF com 11 digitos.'
    });
  } else if (!isValidCpf(answers.cpf)) {
    issues.push({
      key: 'cpf',
      label: 'CPF',
      message: 'informe um CPF valido.'
    });
  }

  if (!answers.dataDeNascimento) {
    issues.push({
      key: 'dataDeNascimento',
      label: 'Data de Nascimento',
      message: 'preencha este campo.'
    });
  }

  if (!answers.endereco.trim()) {
    issues.push({
      key: 'endereco',
      label: 'Endereco',
      message: 'preencha este campo.'
    });
  }

  if (!answers.telefone.trim()) {
    issues.push({
      key: 'telefone',
      label: 'Telefone',
      message: 'preencha este campo.'
    });
  }

  if (allowProfessionalNotes && !hasPositiveCurrencyValue(answers.valorAtual)) {
    issues.push({
      key: 'valorAtual',
      label: 'Valor atual',
      message: 'informe um valor maior que zero.'
    });
  }

  if (allowProfessionalNotes && !answers.formaPagamento) {
    issues.push({
      key: 'formaPagamento',
      label: 'Forma de pagamento',
      message: 'selecione uma opcao.'
    });
  }

  if (!answers.dataTermo) {
    issues.push({
      key: 'dataTermo',
      label: 'Data do termo',
      message: 'preencha este campo.'
    });
  }

  if (!hasSignatureValue(answers.assinaturaCliente)) {
    issues.push({
      key: 'assinaturaCliente',
      label: 'Assinatura da Cliente',
      message: 'preencha este campo.'
    });
  }

  if (allowProfessionalNotes && !hasSignatureValue(answers.assinaturaProfissional)) {
    issues.push({
      key: 'assinaturaProfissional',
      label: 'Assinatura da Profissional',
      message: 'preencha este campo.'
    });
  }

  return issues;
};

const currentValidationIssues = computed(() => collectValidationIssues());

const onCpfKeydown = (event: KeyboardEvent) => {
  if (readOnly) return;
  if (event.ctrlKey || event.metaKey || event.altKey) return;

  const allowedKeys = new Set([
    'Backspace',
    'Delete',
    'Tab',
    'Enter',
    'Escape',
    'ArrowLeft',
    'ArrowRight',
    'ArrowUp',
    'ArrowDown',
    'Home',
    'End'
  ]);

  if (allowedKeys.has(event.key)) return;
  if (/^\d$/.test(event.key)) return;

  event.preventDefault();
};

const onCpfPaste = (event: ClipboardEvent) => {
  if (readOnly) return;
  event.preventDefault();

  const target = event.target as HTMLInputElement;
  const pastedText = event.clipboardData?.getData('text') ?? '';
  const selectionStart = target.selectionStart ?? target.value.length;
  const selectionEnd = target.selectionEnd ?? selectionStart;
  const rawValue = `${target.value.slice(0, selectionStart)}${pastedText}${target.value.slice(selectionEnd)}`;
  const formattedCpf = formatCpf(rawValue);

  answers.cpf = formattedCpf;
  target.value = formattedCpf;
};

const onCpfInput = (event: Event) => {
  if (readOnly) return;
  const target = event.target as HTMLInputElement;
  const formattedCpf = formatCpf(target.value);
  answers.cpf = formattedCpf;
  target.value = formattedCpf;

  const digits = formattedCpf.replace(/\D/g, '');
  if (digits.length === 11 && !isValidCpf(formattedCpf)) {
    if (cpfValidationNotified.value !== 'invalid') {
      showValidationError('CPF invalido. Informe um CPF valido para continuar.');
      cpfValidationNotified.value = 'invalid';
    }
    return;
  }

  cpfValidationNotified.value = 'none';
};

const onCpfBlur = () => {
  if (readOnly) return;
  const digits = answers.cpf.replace(/\D/g, '');
  if (!digits.length) {
    cpfValidationNotified.value = 'none';
    return;
  }

  if (digits.length !== 11) {
    if (cpfValidationNotified.value !== 'incomplete') {
      showValidationError('Complete o CPF com 11 digitos.');
      cpfValidationNotified.value = 'incomplete';
    }
    return;
  }

  if (!isValidCpf(answers.cpf)) {
    if (cpfValidationNotified.value !== 'invalid') {
      showValidationError('CPF invalido. Informe um CPF valido para continuar.');
      cpfValidationNotified.value = 'invalid';
    }
    return;
  }

  cpfValidationNotified.value = 'none';
};

const onValorAtualInput = (event: Event) => {
  if (readOnly) return;
  const target = event.target as HTMLInputElement;
  answers.valorAtual = formatCurrency(target.value);
};

const onTelefoneInput = (event: Event) => {
  if (readOnly) return;
  const target = event.target as HTMLInputElement;
  const formattedPhone = formatPhone(target.value);
  answers.telefone = formattedPhone;
  target.value = formattedPhone;
};

const buildSubmitPayload = (): FormAnswers => ({
  ...answers,
  assinaturaCliente: {
    ...answers.assinaturaCliente
  },
  assinaturaProfissional: {
    ...answers.assinaturaProfissional
  }
});

const handleFormSubmit = () => {
  if (readOnly) return;
  void submitForm();
};

const submitForm = async () => {
  validationError.value = '';
  showValidationSummary.value = true;
  const issues = currentValidationIssues.value;

  if (issues.length) {
    const firstIssue = issues[0];
    const message =
      issues.length === 1 && firstIssue
        ? `${firstIssue.label}: ${firstIssue.message}`
        : 'Revise os campos invalidos listados ao final da pagina antes de salvar.';
    showValidationError(message);
    return;
  }

  loading.value = true;
  try {
    showValidationSummary.value = false;
    emit('submit', buildSubmitPayload());
  } finally {
    loading.value = false;
  }
};

const resetForm = () => {
  validationError.value = '';
  cpfValidationNotified.value = 'none';
  showValidationSummary.value = false;
  Object.assign(answers, createInitialAnswers());
};
</script>

<style scoped>
.questionnaire-anamnese {
  background: #f3f4f6;
  padding: 1.5rem;
}

.anamnese-form {
  display: grid;
  gap: 1.5rem;
}

.anamnese-fieldset {
  margin: 0;
  padding: 0;
  border: none;
  display: grid;
  gap: 1.5rem;
  min-inline-size: 0;
}

.page {
  width: min(100%, 210mm);
  min-height: 297mm;
  margin: 0 auto;
  padding: 14mm;
  background: #fff;
  color: #2f2f2f;
  border: 1px solid #d6d3d1;
  box-shadow: 0 20px 45px rgba(15, 23, 42, 0.08);
  display: grid;
  gap: 1rem;
}

.page-header {
  display: grid;
  gap: 0.6rem;
  text-align: center;
}

.page-header h1,
.content-block h2 {
  margin: 0;
  color: #4b5563;
  font-size: 1.05rem;
  font-weight: 700;
}

.page-header p,
.consent-copy,
.text-block li,
.section-note,
.authorization-box {
  font-size: 0.89rem;
  line-height: 1.55;
}

.line-stack,
.content-block,
.consent-block,
.professional-block {
  display: grid;
  gap: 0.8rem;
}

.line-field {
  display: grid;
  gap: 0.35rem;
}

.line-field > span,
.question-line > span,
.signature-typed > span {
  font-size: 0.9rem;
}

.line-field input,
.line-field select,
.line-field textarea,
.inline-note input {
  width: 100%;
  border: none;
  border-bottom: 1px solid #7c7c7c;
  border-radius: 0;
  padding: 0.3rem 0;
  background: transparent;
  color: #1f2937;
  font: inherit;
}

.line-field textarea {
  min-height: 5.5rem;
  resize: vertical;
}

.line-field input:focus,
.line-field select:focus,
.line-field textarea:focus,
.inline-note input:focus {
  outline: none;
  border-bottom-color: #111827;
}

.preventive-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.25rem 1.5rem;
}

.preventive-column {
  display: grid;
  gap: 0.45rem;
}

.option-row {
  display: inline-flex;
  align-items: flex-start;
  gap: 0.45rem;
  font-size: 0.89rem;
  line-height: 1.45;
}

.checkbox-row input,
.option-row input[type='radio'] {
  margin-top: 0.15rem;
  accent-color: #1f2937;
}

.inline-options {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem 1.1rem;
  align-items: center;
}

.inline-note {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  min-width: min(100%, 18rem);
  flex: 1 1 18rem;
  font-size: 0.89rem;
}

.inline-fill {
  min-width: min(100%, 18rem);
  flex: 1 1 18rem;
}

.question-line {
  display: block;
}

.compact-block {
  gap: 0.55rem;
}

.text-block ul {
  margin: 0;
  padding-left: 1.25rem;
  display: grid;
  gap: 0.55rem;
}

.professional-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.75rem 1rem;
}

.full-width {
  grid-column: 1 / -1;
}

.authorization-box {
  display: grid;
  gap: 0.75rem;
  padding: 0.85rem 1rem;
  border: 1px solid #8a8a8a;
  font-weight: 600;
}

.authorization-options {
  gap: 0.75rem 1.5rem;
  font-weight: 500;
}

.consent-date {
  max-width: 20rem;
}

.signature-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
}

.signature-card {
  display: grid;
  gap: 0.75rem;
  padding-top: 0.5rem;
  border-top: 1px solid #7c7c7c;
}

.signature-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.signature-header strong {
  font-size: 0.92rem;
}

.signature-mode-switch {
  display: inline-flex;
  gap: 0.45rem;
}

.mode-button {
  border: 1px solid #9ca3af;
  background: #fff;
  color: #374151;
  border-radius: 999px;
  padding: 0.3rem 0.8rem;
  font: inherit;
  font-size: 0.82rem;
  cursor: pointer;
}

.mode-button.active {
  background: #1f2937;
  border-color: #1f2937;
  color: #fff;
}

.signature-typed input {
  font-family: 'Segoe Script', 'Brush Script MT', cursive;
  font-size: 1.3rem;
  letter-spacing: 0.03em;
}

.signature-placeholder {
  min-height: 9rem;
  display: flex;
  align-items: flex-end;
  border-bottom: 1px solid #7c7c7c;
  padding-bottom: 0.4rem;
  color: #6b7280;
  font-size: 0.88rem;
}

.signature-static {
  min-height: 9rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px dashed #9ca3af;
  border-radius: 12px;
  background: #fff;
  overflow: hidden;
  padding: 0.5rem;
  color: #6b7280;
  text-align: center;
}

.signature-static img {
  display: block;
  max-width: 100%;
  max-height: 8rem;
  object-fit: contain;
}

.signature-static__typed {
  width: 100%;
  border-bottom: 1px solid #7c7c7c;
  padding: 1.2rem 0 0.4rem;
  font-family: 'Segoe Script', 'Brush Script MT', cursive;
  font-size: 1.3rem;
  letter-spacing: 0.03em;
  color: #1f2937;
}

.signature-static.empty {
  justify-content: flex-start;
  align-items: flex-end;
}

.section-note {
  margin: 0;
  color: #6b7280;
}

.actions {
  width: min(100%, 210mm);
  margin: 0 auto;
  display: grid;
  gap: 0.75rem;
}

.action-buttons {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 0.75rem;
}

.btn {
  border-radius: 999px;
  padding: 0.8rem 1.25rem;
  font: inherit;
  font-weight: 600;
  cursor: pointer;
  border: 1px solid transparent;
}

.btn-primary {
  background: #1f2937;
  color: #fff;
}

.btn-primary:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.btn-secondary {
  background: #d1d5db;
  color: #111827;
}

.btn-ghost {
  background: transparent;
  border-color: #9ca3af;
  color: #374151;
}

.form-error {
  margin: 0;
  color: #b91c1c;
  font-size: 0.9rem;
}

.read-only :is(input, textarea, select, button):disabled {
  opacity: 1;
  color: #1f2937;
  cursor: default;
}

.read-only .mode-button:disabled {
  border-color: #9ca3af;
}

.validation-summary {
  display: grid;
  gap: 0.45rem;
  padding: 0.9rem 1rem;
  border: 1px solid rgba(185, 28, 28, 0.22);
  border-radius: 14px;
  background: rgba(254, 242, 242, 0.96);
  color: #991b1b;
}

.validation-summary strong {
  font-size: 0.95rem;
}

.validation-summary ul {
  margin: 0;
  padding-left: 1.1rem;
  display: grid;
  gap: 0.3rem;
}

.validation-summary li {
  line-height: 1.45;
}

.validation-summary li span {
  font-weight: 700;
}

:deep(.signature-pad .canvas) {
  border-radius: 10px;
  border: 1px dashed #9ca3af;
  background: #fff;
}

:deep(.signature-pad .ghost) {
  border-radius: 999px;
  border-color: #9ca3af;
}

@media (max-width: 900px) {
  .questionnaire-anamnese {
    padding: 0.75rem;
  }

  .page {
    min-height: auto;
    padding: 1rem;
  }

  .preventive-grid,
  .professional-grid,
  .signature-grid {
    grid-template-columns: 1fr;
  }

  .signature-header {
    align-items: flex-start;
    flex-direction: column;
  }

  .action-buttons {
    justify-content: stretch;
  }

  .btn {
    width: 100%;
  }
}

@media print {
  .questionnaire-anamnese {
    padding: 0;
    background: #fff;
  }

  .page {
    width: auto;
    min-height: auto;
    margin: 0;
    padding: 0;
    box-shadow: none;
    border: none;
    page-break-after: always;
  }

  .page:last-of-type {
    page-break-after: auto;
  }

  .actions,
  .signature-mode-switch,
  :deep(.signature-pad .actions) {
    display: none !important;
  }

  .line-field input,
  .line-field textarea,
  .inline-note input {
    color: #111827;
  }

  :deep(.signature-pad .canvas) {
    border: none;
    border-bottom: 1px solid #7c7c7c;
    border-radius: 0;
  }
}
</style>
