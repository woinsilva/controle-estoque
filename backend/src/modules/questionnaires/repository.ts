import { QuestionnaireResponse, QuestionnaireTemplate } from './model.js';

export async function listTemplates(code?: string) {
  const query = code ? { code: code.toUpperCase() } : {};
  return QuestionnaireTemplate.find(query).sort({ code: 1, version: -1 }).exec();
}

export async function getTemplateById(id: string) {
  return QuestionnaireTemplate.findById(id).exec();
}

export async function getLatestTemplateVersion(code: string) {
  return QuestionnaireTemplate.findOne({ code: code.toUpperCase() }).sort({ version: -1 }).exec();
}

export async function createTemplate(data: {
  code: string;
  name: string;
  version: number;
  schema: Record<string, unknown>;
  createdBy?: string;
}) {
  return QuestionnaireTemplate.create({
    ...data,
    code: data.code.toUpperCase(),
    status: 'DRAFT'
  });
}

export async function publishTemplate(id: string) {
  const template = await QuestionnaireTemplate.findById(id).exec();
  if (!template) {
    return null;
  }
  await QuestionnaireTemplate.updateMany(
    { code: template.code, status: 'PUBLISHED' },
    { $set: { status: 'ARCHIVED' } }
  ).exec();
  template.status = 'PUBLISHED';
  template.publishedAt = new Date();
  await template.save();
  return template;
}

export async function updateTemplateById(
  id: string,
  data: { code: string; name: string; schema: Record<string, unknown> }
) {
  return QuestionnaireTemplate.findByIdAndUpdate(
    id,
    {
      $set: {
        code: data.code.toUpperCase(),
        name: data.name,
        schema: data.schema
      }
    },
    { new: true }
  ).exec();
}

export async function countResponsesByTemplateId(templateId: string) {
  return QuestionnaireResponse.countDocuments({ templateId }).exec();
}

export async function listResponsesByClient(clientId: string) {
  return QuestionnaireResponse.find({ clientId }).sort({ createdAt: -1 }).exec();
}

export async function listResponsesByAppointment(appointmentId: string) {
  return QuestionnaireResponse.find({ appointmentId }).sort({ createdAt: -1 }).exec();
}

export async function getResponseById(id: string) {
  return QuestionnaireResponse.findById(id).exec();
}

export async function createResponse(data: {
  clientId: string;
  appointmentId: string;
  templateId: string;
  templateCode: string;
  templateVersion: number;
  templateSnapshot: Record<string, unknown>;
  answers: Record<string, unknown>;
  signature?: {
    mode: 'DRAW' | 'TYPE' | 'UPLOAD';
    value: string;
    signedAt: Date;
    signedBy: string;
  };
  createdBy?: string;
}) {
  return QuestionnaireResponse.create(data);
}
