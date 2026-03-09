import { z } from 'zod';

const objectIdRegex = /^[a-f\d]{24}$/i;
const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

export const slotSchema = z.object({
  weekday: z.coerce.number().int().min(0).max(6),
  startTime: z.string().regex(timeRegex, 'Invalid start time.'),
  endTime: z.string().regex(timeRegex, 'Invalid end time.')
});

export const scheduleSchema = z.object({
  slots: z.array(slotSchema).default([])
});

export const professionalIdParamSchema = z.object({
  professionalId: z.string().regex(objectIdRegex, 'Invalid professional id.')
});
