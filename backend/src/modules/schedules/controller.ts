import type { Request, Response } from 'express';
import {
  getScheduleByProfessionalIdService,
  listSchedulesService,
  upsertScheduleService
} from './service.js';

function mapSchedule(schedule: {
  id?: string;
  _id?: { toString: () => string };
  professionalId: string;
  slots: { weekday: number; startTime: string; endTime: string }[];
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: schedule.id || schedule._id?.toString() || '',
    professionalId: schedule.professionalId,
    slots: schedule.slots,
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
