import { z } from 'zod';

const objectIdRegex = /^[a-f\d]{24}$/i;

export const questionnaireTemplateSchema = z.object({
  code: z.string().trim().min(1),
  name: z.string().min(1),
  schema: z.record(z.string(), z.unknown())
});

export const questionnaireResponseSchema = z.object({
  clientId: z.string().min(1),
  appointmentId: z.string().min(1),
  templateId: z.string().min(1),
  answers: z.record(z.string(), z.unknown()),
  signature: z
    .object({
      mode: z.enum(['DRAW', 'TYPE', 'UPLOAD']),
      value: z.string().min(1),
      signedAt: z.coerce.date(),
      signedBy: z.string().min(1)
    })
    .optional()
});

export const appointmentIdParamSchema = z.object({
  appointmentId: z.string().regex(objectIdRegex, 'Invalid appointment id.')
});

