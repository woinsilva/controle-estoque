import { z } from 'zod';

const objectIdRegex = /^[a-f\d]{24}$/i;
const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

export const slotSchema = z.object({
  weekday: z.coerce.number().int().min(0).max(6),
  startTime: z.string().regex(timeRegex, 'Invalid start time.'),
  endTime: z.string().regex(timeRegex, 'Invalid end time.')
});

export const scheduleSchema = z.object({
  slots: z.array(slotSchema).default([])
});

export const dailySlotSchema = z.object({
  startTime: z.string().regex(timeRegex, 'Invalid start time.'),
  endTime: z.string().regex(timeRegex, 'Invalid end time.')
});

export const dateOverrideSchema = z.object({
  slots: z.array(dailySlotSchema).default([])
});

export const professionalIdParamSchema = z.object({
  professionalId: z.string().regex(objectIdRegex, 'Invalid professional id.')
});

export const dateParamSchema = z.object({
  date: z.string().regex(dateRegex, 'Invalid date.')
});

export const calendarQuerySchema = z.object({
  date: z.string().regex(dateRegex, 'Invalid date.'),
  view: z.enum(['day', 'week', 'month']).default('week')
});
