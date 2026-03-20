# Ficha de Anamnese para Nano Fios

Formulário digital completo que replica exatamente a "Ficha de Anamnese para Nano Fios" em PDF, sem os logos comerciais (Beaura).

## 📋 Componentes Criados

### 1. **Template de Dados** (`backend/src/modules/questionnaires/templates/anamnese-nano-fios.json`)
Contém a estrutura completa do questionário com todos os campos, seções e opções.

### 2. **Componente Vue** (`frontend/src/components/QuestionnaireAnamneseNanoFios.vue`)
Componente responsivo que renderiza o formulário com:
- Campos de dados pessoais
- Checkboxes para informações preventivas (2 colunas)
- Campos de texto livre para explicações
- Seleção de tipo de pele
- Histórico de procedimentos anteriores
- Seção de informações importantes
- Anotações profissionais
- Termo de consentimento com assinatura
- Botões de ações (Salvar, Limpar, Cancelar)

### 3. **Seed/Script** (`backend/src/modules/questionnaires/seeds/anamnese-nano-fios.seed.ts`)
Script para inserir o template no banco de dados como um documento `QuestionnaireTemplate`.

## 🚀 Como Usar

### Passo 1: Inserir o Template no Banco de Dados

Opção A - Executar o seed (recomendado):
```bash
cd backend
npm run seed:anamnese-nano-fios
```

Para produção, se você precisar publicar explicitamente a versão `1`:
```bash
cd backend
ANAMNESE_NANO_FIOS_TEMPLATE_VERSION=1 npm run seed:anamnese-nano-fios
```

Opção B - Manualmente via API:
```bash
curl -X POST http://localhost:3000/api/questionnaires/templates \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d @src/modules/questionnaires/templates/anamnese-nano-fios.json
```

### Passo 2: Importar e Usar o Componente Vue

```vue
<template>
  <div>
    <QuestionnaireAnamneseNanoFios
      :clientId="clientId"
      :appointmentId="appointmentId"
      :templateId="templateId"
      @submit="handleSubmit"
      @close="handleClose"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import QuestionnaireAnamneseNanoFios from '@/components/QuestionnaireAnamneseNanoFios.vue';

const clientId = ref('client-123');
const appointmentId = ref('appointment-456');
const templateId = ref('template-789');

const handleSubmit = (answers) => {
  console.log('Respostas do questionário:', answers);
  
  // Enviar para a API
  fetch('/api/questionnaires/responses', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      clientId: clientId.value,
      appointmentId: appointmentId.value,
      templateId: templateId.value,
      answers: answers
    })
  });
};

const handleClose = () => {
  console.log('Formulário fechado');
};
</script>
```

### Passo 3: Integração na Página de Questionários

Dentro do componente `QuestionnairesView.vue`:

```vue
<template>
  <section>
    <!-- ... código existente ... -->
    
    <button @click="openAnamneseForm">
      Nova Anamnese Nano Fios
    </button>

    <!-- Dialog para formulário -->
    <Dialog v-model:visible="anamneseDialogOpen" modal>
      <QuestionnaireAnamneseNanoFios
        @submit="submitAnamnese"
        @close="anamneseDialogOpen = false"
      />
    </Dialog>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import QuestionnaireAnamneseNanoFios from '@/components/QuestionnaireAnamneseNanoFios.vue';

const anamneseDialogOpen = ref(false);

const openAnamneseForm = () => {
  anamneseDialogOpen.value = true;
};

const submitAnamnese = async (answers) => {
  try {
    const response = await fetch('/api/questionnaires/responses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientId: selectedClientId.value,
        appointmentId: selectedAppointmentId.value,
        templateId: 'ANAMNESE-NANO-FIOS',
        answers: answers
      })
    });
    
    if (response.ok) {
      anamneseDialogOpen.value = false;
      // Recarregar respostas
      loadResponses();
    }
  } catch (error) {
    console.error('Erro ao salvar questionário:', error);
  }
};
</script>
```

## 📝 Estrutura do Formulário

### Seções Principais:

1. **Dados Pessoais**
   - Nome Completo
   - CPF
   - Data de Nascimento
   - Endereço
   - Telefone
   - Como nos conheceu

2. **Informações Preventivas** (Checkboxes - 2 colunas)
   - 17 opções para marcar histórico de procedimentos e condições

3. **Tipo de Pele**
   - Seca, Normal, Mista, Oleosa, Outros

4. **Histórico de Procedimentos**
   - Sim/Não/Tempo específico

5. **Observações Adicionais**
   - Campo livre para outras questões

6. **Informações Importantes**
   - Seção de leitura com pontos importantes sobre o procedimento

7. **Sobre Retoque e Manutenção**
   - Informações sobre políticas de retoque

8. **Anotações Profissionais** (Apenas leitura do profissional)
   - Marca de alimento/lâmina (preenchidas automaticamente)
   - Tipo de pele pós-avaliação
   - Preferências e intercorrências
   - Valor e forma de pagamento
   - Data do retoque
   - Alterações e observações

9. **Termo de Consentimento**
   - Textos explicativos
   - Autorização de uso de imagem para redes sociais
   - Assinatura do cliente
   - Data
   - Assinatura do profissional

## 🎨 Layout e Estilos

- **Largura máxima**: 900px (otimizado para impressão)
- **Fonte**: Arial (padrão para documentos)
- **Cores**: Padrão do PDF original (tons de cinza)
- **Grid responsivo**: Adapta para mobile com 1 coluna
- **Print-friendly**: Pronto para impressão com `@media print`

## 🔐 Validações

O componente valida:
- ✓ Campos obrigatórios (Nome, CPF, Telefone, Data de Nascimento)
- ✓ Assinaturas obrigatórias no termo de consentimento
- ✓ Data do termo

## 📤 Envio de Respostas

As respostas são enviadas como um objeto com a estrutura:

```typescript
{
  clientId: string;
  appointmentId: string;
  templateId: string;
  answers: {
    nomeCompleto: string;
    cpf: string;
    dataDeNascimento: string;
    // ... todos os outros campos
    assinaturaCliente: string;
    dataTermo: string;
    assinaturaProfissional: string;
  }
}
```

## 🔄 Fluxo Típico

1. Profissional abre a página de questionários
2. Clica em "Nova Anamnese Nano Fios"
3. Dialog abre com o formulário completo
4. Cliente/usuário preenche todos os campos
5. Ao clicar "Salvar Questionário", valida formulário
6. Envia respostas para `/api/questionnaires/responses`
7. Servidor salva resposta vinculada ao cliente e agendamento
8. Dialog fecha e lista de respostas é atualizada

## 📋 Verificação

Ao submeter, o sistema verifica:
- Todos os campos obrigatórios foram preenchidos
- Data é válida
- Formulário pode ser repetido para edição em caso de erro

## ✨ Diferenças do PDF Original

- ✅ Remoção do logo "Beaura" (canto superior direito)
- ✅ Todos os campos transformados em inputs interativos
- ✅ Mantém 100% do layout visual do PDF
- ✅ Adiciona funcionalidade de salvamento digital
- ✅ Responsivo para dispositivos móveis
- ✅ Pronto para impressão

## 🛠️ Manutenção Futura

Se precisar adicionar novos campos:

1. Atualizar `anamnese-nano-fios.json` com novo campo
2. Atualizar `TypeScript` em `QuestionnaireAnamneseNanoFios.vue`
3. Incrementar versão do template
4. Executar novo seed

## 📞 Suporte

Para dúvidas sobre integração, consulte:
- [Documentação de Questionários](../README.md)
- [API de Questionários](../controller.ts)
- [Modelo de Dados](../model.ts)
