import { getUserById } from '../users/repository.js';
import { getScheduleByProfessionalId, listSchedules, upsertSchedule } from './repository.js';

function timeToMinutes(value: string) {
  const [hours, minutes] = value.split(':').map(Number);
  return hours * 60 + minutes;
}

function sortSlots(slots: { weekday: number; startTime: string; endTime: string }[]) {
  return [...slots].sort((a, b) => {
    if (a.weekday !== b.weekday) {
      return a.weekday - b.weekday;
    }
    return timeToMinutes(a.startTime) - timeToMinutes(b.startTime);
  });
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

  const sortedSlots = sortSlots(input.slots);

  for (const slot of sortedSlots) {
    if (timeToMinutes(slot.endTime) <= timeToMinutes(slot.startTime)) {
      throw new Error('Schedule end time must be after start time.');
    }
  }

  for (let index = 1; index < sortedSlots.length; index += 1) {
    const previous = sortedSlots[index - 1];
    const current = sortedSlots[index];
    if (previous.weekday !== current.weekday) {
      continue;
    }

    if (timeToMinutes(previous.endTime) > timeToMinutes(current.startTime)) {
      throw new Error('Schedule time ranges cannot overlap on the same day.');
    }
  }

  return upsertSchedule({
    professionalId: input.professionalId,
    slots: sortedSlots
  });
}
