import { getClientById } from '../clients/repository.js';
import { getAppointmentById } from '../appointments/repository.js';
import {
  countResponsesByTemplateId,
  createResponse,
  createTemplate,
  getLatestTemplateVersion,
  getResponseById,
  listResponsesByAppointment,
  getTemplateById,
  listResponsesByClient,
  listTemplates,
  publishTemplate,
  updateTemplateById
} from './repository.js';

export async function listTemplatesService(code?: string) {
  const templates = await listTemplates(code);
  const withUsage = await Promise.all(
    templates.map(async (template) => {
      const responseCount = await countResponsesByTemplateId(template.id);
      const hasResponses = responseCount > 0;
      return {
        ...template.toObject(),
        hasResponses,
        canEdit: !hasResponses
      };
    })
  );
  return withUsage;
}

export async function createTemplateService(input: {
  code: string;
  name: string;
  schema: Record<string, unknown>;
  createdBy?: string;
}) {
  const latest = await getLatestTemplateVersion(input.code);
  const version = latest ? latest.version + 1 : 1;
  return createTemplate({
    code: input.code,
    name: input.name,
    version,
    schema: input.schema,
    createdBy: input.createdBy
  });
}

export async function publishTemplateService(id: string) {
  return publishTemplate(id);
}

export async function updateTemplateService(
  id: string,
  input: {
    code: string;
    name: string;
    schema: Record<string, unknown>;
  }
) {
  const template = await getTemplateById(id);
  if (!template) {
    throw new Error('Template not found.');
  }

  const responseCount = await countResponsesByTemplateId(id);
  if (responseCount > 0) {
    throw new Error('Template cannot be edited after usage in responses.');
  }

  return updateTemplateById(id, input);
}

export async function getResponseService(id: string) {
  return getResponseById(id);
}

export async function listResponsesByClientService(clientId: string) {
  return listResponsesByClient(clientId);
}

export async function listResponsesByAppointmentService(appointmentId: string) {
  return listResponsesByAppointment(appointmentId);
}

export async function createResponseService(input: {
  clientId: string;
  appointmentId: string;
  templateId: string;
  answers: Record<string, unknown>;
  signature?: {
    mode: 'DRAW' | 'TYPE' | 'UPLOAD';
    value: string;
    signedAt: Date;
    signedBy: string;
  };
  createdBy?: string;
}) {
  const client = await getClientById(input.clientId);
  if (!client) {
    throw new Error('Client not found.');
  }

  const template = await getTemplateById(input.templateId);
  if (!template) {
    throw new Error('Template not found.');
  }
  if (template.status !== 'PUBLISHED') {
    throw new Error('Template must be published before creating a response.');
  }
  const appointment = await getAppointmentById(input.appointmentId);
  if (!appointment) {
    throw new Error('Appointment not found.');
  }
  if (appointment.clientId !== input.clientId) {
    throw new Error('Appointment does not belong to informed client.');
  }
  const existingResponses = await listResponsesByAppointment(input.appointmentId);
  if (existingResponses.length > 0) {
    throw new Error('This appointment already has a questionnaire response.');
  }

  return createResponse({
    clientId: input.clientId,
    appointmentId: input.appointmentId,
    templateId: template.id,
    templateCode: template.code,
    templateVersion: template.version,
    templateSnapshot: template.schema,
    answers: input.answers,
    signature: input.signature,
    createdBy: input.createdBy
  });
}
