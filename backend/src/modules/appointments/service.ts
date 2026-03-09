import { getClientById } from '../clients/repository.js';
import { QuestionnaireResponse } from '../questionnaires/model.js';
import type { AppointmentStatus } from './model.js';
import {
  createAppointment,
  deleteAppointment,
  getAppointmentById,
  listAppointments,
  updateAppointment
} from './repository.js';

type AppointmentInput = {
  clientId: string;
  scheduledAt: Date;
  status?: AppointmentStatus;
  notes?: string;
  createdBy?: string;
};

type UpdateAppointmentInput = Partial<Omit<AppointmentInput, 'createdBy'>>;

type ListAppointmentsInput = {
  clientId?: string;
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

export async function listAppointmentsService(input: ListAppointmentsInput) {
  return listAppointments(
    {
      clientId: input.clientId,
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

  return createAppointment({
    clientId: input.clientId,
    scheduledAt: input.scheduledAt,
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

  return updateAppointment(id, {
    clientId: input.clientId,
    scheduledAt: input.scheduledAt,
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
