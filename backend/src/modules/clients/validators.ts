import { z } from 'zod';

const objectIdRegex = /^[a-f\d]{24}$/i;

export const createClientSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  email: z.string().trim().toLowerCase().email(),
  phone: z.string().trim().min(8).max(20),
  birthDate: z.coerce.date().optional(),
  notes: z.string().trim().max(2000).optional(),
  active: z.boolean().optional().default(true)
});

export const updateClientSchema = createClientSchema.partial();

export const clientIdParamSchema = z.object({
  id: z.string().regex(objectIdRegex, 'Invalid client id.')
});

export const listClientsQuerySchema = z.object({
  q: z.string().trim().max(120).optional(),
  active: z
    .union([z.boolean(), z.enum(['true', 'false'])])
    .transform((value) => (typeof value === 'boolean' ? value : value === 'true'))
    .optional(),
  page: z.coerce.number().int().min(1).max(1000).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.enum(['fullName', 'createdAt', 'updatedAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
});
