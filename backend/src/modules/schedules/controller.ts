import type { Request, Response } from 'express';
import {
  getScheduleCalendarService,
  getScheduleByProfessionalIdService,
  listSchedulesService,
  upsertDateOverrideService,
  upsertScheduleService
} from './service.js';

function mapSchedule(schedule: {
  id?: string;
  _id?: { toString: () => string };
  professionalId: string;
  slots: { weekday: number; startTime: string; endTime: string }[];
  dateOverrides?: { date: string; slots: { startTime: string; endTime: string }[] }[];
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: schedule.id || schedule._id?.toString() || '',
    professionalId: schedule.professionalId,
    slots: schedule.slots,
    dateOverrides: schedule.dateOverrides || [],
    createdAt: schedule.createdAt,
    updatedAt: schedule.updatedAt
  };
}

export async function listSchedulesController(_req: Request, res: Response) {
  const schedules = await listSchedulesService();
  return res.status(200).json(schedules.map(mapSchedule));
}

export async function getScheduleController(req: Request, res: Response) {
  const schedule = await getScheduleByProfessionalIdService(req.params.professionalId);
  if (!schedule) {
    return res.status(404).json({ error: 'Schedule not found.' });
  }
  return res.status(200).json(mapSchedule(schedule));
}

export async function upsertScheduleController(req: Request, res: Response) {
  try {
    const schedule = await upsertScheduleService({
      professionalId: req.params.professionalId,
      slots: req.body.slots
    });
    return res.status(200).json(mapSchedule(schedule));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not save schedule.';
    return res.status(400).json({ error: message });
  }
}

export async function upsertDateOverrideController(req: Request, res: Response) {
  try {
    const schedule = await upsertDateOverrideService({
      professionalId: req.params.professionalId,
      date: req.params.date,
      slots: req.body.slots
    });
    return res.status(200).json(mapSchedule(schedule));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not save schedule override.';
    return res.status(400).json({ error: message });
  }
}

export async function getScheduleCalendarController(req: Request, res: Response) {
  try {
    const calendar = await getScheduleCalendarService({
      professionalId: req.params.professionalId,
      date: String(req.query.date),
      view: (req.query.view as 'day' | 'week' | 'month') || 'week'
    });
    return res.status(200).json(calendar);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not load schedule calendar.';
    return res.status(400).json({ error: message });
  }
}
