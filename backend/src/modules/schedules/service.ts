import { getUserById } from '../users/repository.js';
import { getScheduleByProfessionalId, listSchedules, upsertSchedule } from './repository.js';

function timeToMinutes(value: string) {
  const [hours, minutes] = value.split(':').map(Number);
  return hours * 60 + minutes;
}

export async function listSchedulesService() {
  return listSchedules();
}

export async function getScheduleByProfessionalIdService(professionalId: string) {
  return getScheduleByProfessionalId(professionalId);
}

export async function upsertScheduleService(input: {
  professionalId: string;
  slots: { weekday: number; startTime: string; endTime: string }[];
}) {
  const professional = await getUserById(input.professionalId);
  if (!professional || !professional.active || !professional.isProfessional || professional.role === 'CLIENT') {
    throw new Error('Professional not found.');
  }

  for (const slot of input.slots) {
    if (timeToMinutes(slot.endTime) <= timeToMinutes(slot.startTime)) {
      throw new Error('Schedule end time must be after start time.');
    }
  }

  return upsertSchedule(input);
}
