import { getClientById } from '../clients/repository.js';
import { QuestionnaireResponse } from '../questionnaires/model.js';
import { getServiceById } from '../services/repository.js';
import { getScheduleByProfessionalId } from '../schedules/repository.js';
import { getUserById } from '../users/repository.js';
import type { AppointmentStatus } from './model.js';
import {
  createAppointment,
  deleteAppointment,
  findConflictingAppointments,
  getAppointmentById,
  listAppointmentsByProfessionalAndRange,
  listAppointments,
  updateAppointment
} from './repository.js';

type AppointmentInput = {
  clientId: string;
  professionalId: string;
  serviceIds: string[];
  scheduledAt: Date;
  status?: AppointmentStatus;
  notes?: string;
  createdBy?: string;
};

type UpdateAppointmentInput = Partial<Omit<AppointmentInput, 'createdBy'>>;

type ListAppointmentsInput = {
  clientId?: string;
  professionalId?: string;
  serviceId?: string;
  status?: AppointmentStatus;
  dateFrom?: Date;
  dateTo?: Date;
  page: number;
  limit: number;
  sortBy: 'scheduledAt' | 'createdAt' | 'updatedAt';
  sortOrder: 'asc' | 'desc';
};

export class AppointmentServiceError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
  }
}

function getAppointmentServiceIds(appointment: { serviceIds?: string[]; serviceId?: string }) {
  return appointment.serviceIds || (appointment.serviceId ? [appointment.serviceId] : []);
}

function normalizeNotes(value?: string) {
  if (!value) return undefined;
  const trimmed = value.trim();
  return trimmed || undefined;
}

function timeToMinutes(value: string) {
  const [hours, minutes] = value.split(':').map(Number);
  return hours * 60 + minutes;
}

function getDateMinutes(date: Date) {
  return date.getHours() * 60 + date.getMinutes();
}

function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
}

function endOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
}

function formatTime(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

function getAvailableSlotsForDate(input: {
  date: Date;
  durationMinutes: number;
  weeklySlots: { weekday: number; startTime: string; endTime: string }[];
  dateOverrides?: { date: string; slots: { startTime: string; endTime: string }[] }[];
  appointments: { scheduledAt: Date; endsAt: Date }[];
}) {
  const dateKey = toDateKey(input.date);
  const override = input.dateOverrides?.find((item) => item.date === dateKey);
  const baseSlots = override
    ? override.slots
    : input.weeklySlots.filter((slot) => slot.weekday === input.date.getDay());

  const slots: string[] = [];
  for (const slot of baseSlots) {
    const start = timeToMinutes(slot.startTime);
    const end = timeToMinutes(slot.endTime);
    for (let cursor = start; cursor + input.durationMinutes <= end; cursor += 15) {
      const candidateStart = new Date(input.date.getFullYear(), input.date.getMonth(), input.date.getDate(), 0, cursor, 0, 0);
      const candidateEnd = new Date(candidateStart.getTime() + input.durationMinutes * 60_000);
      const conflicts = input.appointments.some(
        (appointment) => candidateStart < appointment.endsAt && candidateEnd > appointment.scheduledAt
      );
      if (!conflicts) {
        slots.push(formatTime(cursor));
      }
    }
  }

  return slots;
}

async function validateAppointmentAvailability(input: {
  professionalId: string;
  serviceIds: string[];
  scheduledAt: Date;
  excludeId?: string;
}) {
  if (input.serviceIds.length === 0) {
    throw new AppointmentServiceError('At least one service is required.', 400);
  }
  const services = await Promise.all(input.serviceIds.map((serviceId) => getServiceById(serviceId)));
  if (services.some((service) => !service || !service.active)) {
    throw new AppointmentServiceError('Service not found.', 404);
  }
  const totalDurationMinutes = services.reduce((sum, service) => sum + (service?.durationMinutes || 0), 0);

  const professional = await getUserById(input.professionalId);
  if (!professional || !professional.active || !professional.isProfessional || professional.role === 'CLIENT') {
    throw new AppointmentServiceError('Professional not found.', 404);
  }

  const schedule = await getScheduleByProfessionalId(input.professionalId);
  if (!schedule) {
    throw new AppointmentServiceError('Professional has no configured work schedule.', 409);
  }

  const startMinutes = getDateMinutes(input.scheduledAt);
  const endsAt = new Date(input.scheduledAt.getTime() + totalDurationMinutes * 60_000);
  const endMinutes = getDateMinutes(endsAt);
  const weekday = input.scheduledAt.getDay();
  const dateKey = toDateKey(input.scheduledAt);
  const override = schedule.dateOverrides?.find((item) => item.date === dateKey);
  const availableSlots = override
    ? override.slots
    : schedule.slots.filter((slot) => slot.weekday === weekday);
  const slotMatches = availableSlots.some(
    (slot) =>
      startMinutes >= timeToMinutes(slot.startTime) &&
      endMinutes <= timeToMinutes(slot.endTime)
  );

  if (!slotMatches) {
    throw new AppointmentServiceError('Selected time is outside the professional schedule.', 409);
  }

  const conflicts = await findConflictingAppointments({
    professionalId: input.professionalId,
    start: input.scheduledAt,
    end: endsAt,
    excludeId: input.excludeId
  });

  if (conflicts.length > 0) {
    throw new AppointmentServiceError('Selected time conflicts with another appointment.', 409);
  }

  return { services, professional, endsAt, totalDurationMinutes };
}

export async function listAppointmentsService(input: ListAppointmentsInput) {
  return listAppointments(
    {
      clientId: input.clientId,
      professionalId: input.professionalId,
      serviceId: input.serviceId,
      status: input.status,
      dateFrom: input.dateFrom,
      dateTo: input.dateTo
    },
    {
      page: input.page,
      limit: input.limit,
      sortBy: input.sortBy,
      sortOrder: input.sortOrder
    }
  );
}

export async function getAppointmentAvailabilityService(input: {
  professionalId: string;
  serviceIds: string[];
  month: string;
}) {
  if (input.serviceIds.length === 0) {
    throw new AppointmentServiceError('At least one service is required.', 400);
  }

  const professional = await getUserById(input.professionalId);
  if (!professional || !professional.active || !professional.isProfessional || professional.role === 'CLIENT') {
    throw new AppointmentServiceError('Professional not found.', 404);
  }

  const services = await Promise.all(input.serviceIds.map((serviceId) => getServiceById(serviceId)));
  if (services.some((service) => !service || !service.active)) {
    throw new AppointmentServiceError('Service not found.', 404);
  }
  const totalDurationMinutes = services.reduce((sum, service) => sum + (service?.durationMinutes || 0), 0);

  const schedule = await getScheduleByProfessionalId(input.professionalId);
  if (!schedule) {
    return {
      month: input.month,
      days: []
    };
  }

  const [year, month] = input.month.split('-').map(Number);
  const rangeStart = startOfDay(new Date(year || 0, (month || 1) - 1, 1));
  const rangeEnd = endOfDay(new Date(year || 0, month || 1, 0));
  const appointments = await listAppointmentsByProfessionalAndRange({
    professionalId: input.professionalId,
    start: rangeStart,
    end: rangeEnd
  });

  const days: { date: string; slots: string[] }[] = [];
  for (let cursor = new Date(rangeStart); cursor <= rangeEnd; cursor = addDays(cursor, 1)) {
    const slots = getAvailableSlotsForDate({
      date: cursor,
      durationMinutes: totalDurationMinutes,
      weeklySlots: schedule.slots,
      dateOverrides: schedule.dateOverrides,
      appointments: appointments
        .filter((appointment: { scheduledAt: Date }) => toDateKey(appointment.scheduledAt) === toDateKey(cursor))
        .map((appointment: { scheduledAt: Date; endsAt: Date }) => ({
          scheduledAt: appointment.scheduledAt,
          endsAt: appointment.endsAt
        }))
    });

    if (slots.length > 0) {
      days.push({
        date: toDateKey(cursor),
        slots
      });
    }
  }

  return {
    month: input.month,
    days
  };
}

export async function getAppointmentService(id: string) {
  return getAppointmentById(id);
}

export async function createAppointmentService(input: AppointmentInput) {
  const client = await getClientById(input.clientId);
  if (!client) {
    throw new AppointmentServiceError('Client not found.', 404);
  }

  const { endsAt } = await validateAppointmentAvailability({
    professionalId: input.professionalId,
    serviceIds: input.serviceIds,
    scheduledAt: input.scheduledAt
  });

  return createAppointment({
    clientId: input.clientId,
    professionalId: input.professionalId,
    serviceIds: input.serviceIds,
    scheduledAt: input.scheduledAt,
    endsAt,
    status: input.status || 'SCHEDULED',
    notes: normalizeNotes(input.notes),
    createdBy: input.createdBy
  });
}

export async function updateAppointmentService(id: string, input: UpdateAppointmentInput) {
  const current = await getAppointmentById(id);
  if (!current) {
    return null;
  }

  if (input.clientId && input.clientId !== current.clientId) {
    const client = await getClientById(input.clientId);
    if (!client) {
      throw new AppointmentServiceError('Client not found.', 404);
    }
  }

  const nextClientId = input.clientId || current.clientId;
  const client = await getClientById(nextClientId);
  if (!client) {
    throw new AppointmentServiceError('Client not found.', 404);
  }

  const nextProfessionalId = input.professionalId || current.professionalId;
  const nextServiceIds = input.serviceIds || getAppointmentServiceIds(current);
  const nextScheduledAt = input.scheduledAt || current.scheduledAt;

  const { endsAt } = await validateAppointmentAvailability({
    professionalId: nextProfessionalId,
    serviceIds: nextServiceIds,
    scheduledAt: nextScheduledAt,
    excludeId: id
  });

  return updateAppointment(id, {
    clientId: input.clientId,
    professionalId: input.professionalId,
    serviceIds: input.serviceIds,
    scheduledAt: input.scheduledAt,
    endsAt,
    status: input.status,
    notes: normalizeNotes(input.notes)
  });
}

export async function updateAppointmentStatusService(id: string, status: AppointmentStatus) {
  const current = await getAppointmentById(id);
  if (!current) {
    return null;
  }
  return updateAppointment(id, { status });
}

export async function deleteAppointmentService(id: string) {
  const hasQuestionnaire = await QuestionnaireResponse.exists({ appointmentId: id });
  if (hasQuestionnaire) {
    throw new AppointmentServiceError(
      'Appointment cannot be deleted because it has questionnaire history.',
      409
    );
  }
  return deleteAppointment(id);
}
