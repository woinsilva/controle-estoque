import { getUserById } from '../users/repository.js';
import { listAppointmentsByProfessionalAndRange } from '../appointments/repository.js';
import { getScheduleByProfessionalId, listSchedules, upsertDateOverride, upsertSchedule } from './repository.js';

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

function sortDailySlots<T extends { startTime: string; endTime: string }>(slots: T[]) {
  return [...slots].sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
}

function validateRanges<T extends { startTime: string; endTime: string }>(slots: T[]) {
  const sortedSlots = sortDailySlots(slots);

  for (const slot of sortedSlots) {
    if (timeToMinutes(slot.endTime) <= timeToMinutes(slot.startTime)) {
      throw new Error('Schedule end time must be after start time.');
    }
  }

  for (let index = 1; index < sortedSlots.length; index += 1) {
    const previous = sortedSlots[index - 1];
    const current = sortedSlots[index];
    if (timeToMinutes(previous.endTime) > timeToMinutes(current.startTime)) {
      throw new Error('Schedule time ranges cannot overlap on the same day.');
    }
  }

  return sortedSlots;
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
}

function endOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function getRangeStart(date: Date, view: 'day' | 'week' | 'month') {
  if (view === 'day') return startOfDay(date);
  if (view === 'week') return startOfDay(addDays(date, -date.getDay()));
  return startOfDay(new Date(date.getFullYear(), date.getMonth(), 1));
}

function getRangeEnd(date: Date, view: 'day' | 'week' | 'month') {
  if (view === 'day') return endOfDay(date);
  if (view === 'week') return endOfDay(addDays(date, 6 - date.getDay()));
  return endOfDay(new Date(date.getFullYear(), date.getMonth() + 1, 0));
}

function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
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
  for (const weekday of [0, 1, 2, 3, 4, 5, 6]) {
    validateRanges(sortedSlots.filter((slot) => slot.weekday === weekday));
  }

  return upsertSchedule({
    professionalId: input.professionalId,
    slots: sortedSlots
  });
}

export async function upsertDateOverrideService(input: {
  professionalId: string;
  date: string;
  slots: { startTime: string; endTime: string }[];
}) {
  const professional = await getUserById(input.professionalId);
  if (!professional || !professional.active || !professional.isProfessional || professional.role === 'CLIENT') {
    throw new Error('Professional not found.');
  }

  const sortedSlots = validateRanges(input.slots);
  return upsertDateOverride({
    professionalId: input.professionalId,
    date: input.date,
    slots: sortedSlots
  });
}

export async function getScheduleCalendarService(input: {
  professionalId: string;
  date: string;
  view: 'day' | 'week' | 'month';
}) {
  const professional = await getUserById(input.professionalId);
  if (!professional || !professional.active || !professional.isProfessional || professional.role === 'CLIENT') {
    throw new Error('Professional not found.');
  }

  const referenceDate = new Date(`${input.date}T12:00:00`);
  const rangeStart = getRangeStart(referenceDate, input.view);
  const rangeEnd = getRangeEnd(referenceDate, input.view);
  const schedule = await getScheduleByProfessionalId(input.professionalId);
  const appointments = await listAppointmentsByProfessionalAndRange({
    professionalId: input.professionalId,
    start: rangeStart,
    end: rangeEnd
  });

  const dateKeys: string[] = [];
  for (let cursor = new Date(rangeStart); cursor <= rangeEnd; cursor = addDays(cursor, 1)) {
    dateKeys.push(toDateKey(cursor));
  }

  const overrides = (schedule?.dateOverrides || []).filter((item) => dateKeys.includes(item.date));

  return {
    professional: {
      id: professional.id,
      name: professional.name
    },
    weeklySlots: schedule?.slots || [],
    overrides,
    selectedDateOverride: overrides.find((item) => item.date === input.date) || null,
    appointments,
    rangeStart,
    rangeEnd,
    selectedDate: input.date,
    view: input.view
  };
}
