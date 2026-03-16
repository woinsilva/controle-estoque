import { z } from 'zod';

const objectIdRegex = /^[a-f\d]{24}$/i;

export const serviceSchema = z.object({
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().max(2000).optional(),
  durationMinutes: z.coerce.number().int().min(5).max(1440),
  price: z.coerce.number().min(0),
  active: z.boolean().optional().default(true),
  requiresQuestionnaire: z.boolean().optional().default(false)
});

export const updateServiceSchema = serviceSchema.partial();

export const serviceIdParamSchema = z.object({
  id: z.string().regex(objectIdRegex, 'Invalid service id.')
});
