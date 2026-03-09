import { z } from 'zod';

const objectIdRegex = /^[a-f\d]{24}$/i;

const appointmentStatusEnum = z.enum(['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELED']);

export const createAppointmentSchema = z.object({
  clientId: z.string().regex(objectIdRegex, 'Invalid client id.'),
  professionalId: z.string().regex(objectIdRegex, 'Invalid professional id.'),
  serviceId: z.string().regex(objectIdRegex, 'Invalid service id.'),
  scheduledAt: z.coerce.date(),
  status: appointmentStatusEnum.optional().default('SCHEDULED'),
  notes: z.string().trim().max(2000).optional()
});

export const updateAppointmentSchema = createAppointmentSchema.partial();

export const updateAppointmentStatusSchema = z.object({
  status: appointmentStatusEnum
});

export const appointmentIdParamSchema = z.object({
  id: z.string().regex(objectIdRegex, 'Invalid appointment id.')
});

export const listAppointmentsQuerySchema = z.object({
  clientId: z.string().regex(objectIdRegex, 'Invalid client id.').optional(),
  professionalId: z.string().regex(objectIdRegex, 'Invalid professional id.').optional(),
  serviceId: z.string().regex(objectIdRegex, 'Invalid service id.').optional(),
  status: appointmentStatusEnum.optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  page: z.coerce.number().int().min(1).max(1000).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.enum(['scheduledAt', 'createdAt', 'updatedAt']).default('scheduledAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
});
