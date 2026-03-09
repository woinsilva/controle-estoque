import type { Request, Response } from 'express';
import {
  createResponseService,
  createTemplateService,
  getResponseService,
  listResponsesByAppointmentService,
  listResponsesByClientService,
  listTemplatesService,
  publishTemplateService,
  updateTemplateService
} from './service.js';

export async function listTemplatesController(req: Request, res: Response) {
  const code = typeof req.query.code === 'string' ? req.query.code : undefined;
  const templates = await listTemplatesService(code);
  return res.status(200).json(templates);
}

export async function createTemplateController(req: Request, res: Response) {
  const template = await createTemplateService({
    name: req.body.name,
    schema: req.body.schema,
    createdBy: req.user?.id
  });
  return res.status(201).json(template);
}

export async function publishTemplateController(req: Request, res: Response) {
  const template = await publishTemplateService(req.params.id);
  if (!template) {
    return res.status(404).json({ error: 'Template not found.' });
  }
  return res.status(200).json(template);
}

export async function updateTemplateController(req: Request, res: Response) {
  try {
    const template = await updateTemplateService(req.params.id, {
      name: req.body.name,
      schema: req.body.schema
    });
    return res.status(200).json(template);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not update template.';
    if (message === 'Template not found.') {
      return res.status(404).json({ error: message });
    }
    return res.status(400).json({ error: message });
  }
}

export async function createResponseController(req: Request, res: Response) {
  try {
    const response = await createResponseService({
      clientId: req.body.clientId,
      appointmentId: req.body.appointmentId,
      templateId: req.body.templateId,
      answers: req.body.answers,
      signature: req.body.signature,
      createdBy: req.user?.id
    });
    return res.status(201).json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not create questionnaire response.';
    return res.status(400).json({ error: message });
  }
}

export async function getResponseController(req: Request, res: Response) {
  const response = await getResponseService(req.params.id);
  if (!response) {
    return res.status(404).json({ error: 'Response not found.' });
  }
  return res.status(200).json(response);
}

export async function listResponsesByClientController(req: Request, res: Response) {
  const responses = await listResponsesByClientService(req.params.clientId);
  return res.status(200).json(responses);
}

export async function listResponsesByAppointmentController(req: Request, res: Response) {
  const responses = await listResponsesByAppointmentService(req.params.appointmentId);
  return res.status(200).json(responses);
}
