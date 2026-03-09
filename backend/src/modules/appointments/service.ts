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
  listAppointments,
  updateAppointment
} from './repository.js';

type AppointmentInput = {
  clientId: string;
  professionalId: string;
  serviceId: string;
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

async function validateAppointmentAvailability(input: {
  professionalId: string;
  serviceId: string;
  scheduledAt: Date;
  excludeId?: string;
}) {
  const service = await getServiceById(input.serviceId);
  if (!service || !service.active) {
    throw new AppointmentServiceError('Service not found.', 404);
  }

  const professional = await getUserById(input.professionalId);
  if (!professional || !professional.active || !professional.isProfessional || professional.role === 'CLIENT') {
    throw new AppointmentServiceError('Professional not found.', 404);
  }

  const schedule = await getScheduleByProfessionalId(input.professionalId);
  if (!schedule) {
    throw new AppointmentServiceError('Professional has no configured work schedule.', 409);
  }

  const startMinutes = getDateMinutes(input.scheduledAt);
  const endsAt = new Date(input.scheduledAt.getTime() + service.durationMinutes * 60_000);
  const endMinutes = getDateMinutes(endsAt);
  const weekday = input.scheduledAt.getDay();
  const slotMatches = schedule.slots.some(
    (slot) =>
      slot.weekday === weekday &&
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

  return { service, professional, endsAt };
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
    serviceId: input.serviceId,
    scheduledAt: input.scheduledAt
  });

  return createAppointment({
    clientId: input.clientId,
    professionalId: input.professionalId,
    serviceId: input.serviceId,
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
  const nextServiceId = input.serviceId || current.serviceId;
  const nextScheduledAt = input.scheduledAt || current.scheduledAt;

  const { endsAt } = await validateAppointmentAvailability({
    professionalId: nextProfessionalId,
    serviceId: nextServiceId,
    scheduledAt: nextScheduledAt,
    excludeId: id
  });

  return updateAppointment(id, {
    clientId: input.clientId,
    professionalId: input.professionalId,
    serviceId: input.serviceId,
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
