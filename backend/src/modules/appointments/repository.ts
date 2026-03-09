import { FilterQuery } from 'mongoose';
import { Appointment, type AppointmentDocument, type AppointmentStatus } from './model.js';

type AppointmentFilters = {
  clientId?: string;
  professionalId?: string;
  serviceId?: string;
  status?: AppointmentStatus;
  dateFrom?: Date;
  dateTo?: Date;
};

type PaginationInput = {
  page: number;
  limit: number;
  sortBy: 'scheduledAt' | 'createdAt' | 'updatedAt';
  sortOrder: 'asc' | 'desc';
};

export async function listAppointments(filters: AppointmentFilters, pagination: PaginationInput) {
  const query: FilterQuery<AppointmentDocument> = {};
  if (filters.clientId) {
    query.clientId = filters.clientId;
  }
  if (filters.professionalId) {
    query.professionalId = filters.professionalId;
  }
  if (filters.serviceId) {
    query.serviceId = filters.serviceId;
  }
  if (filters.status) {
    query.status = filters.status;
  }
  if (filters.dateFrom || filters.dateTo) {
    query.scheduledAt = {};
    if (filters.dateFrom) {
      query.scheduledAt.$gte = filters.dateFrom;
    }
    if (filters.dateTo) {
      query.scheduledAt.$lte = filters.dateTo;
    }
  }

  const skip = (pagination.page - 1) * pagination.limit;
  const sortDirection = pagination.sortOrder === 'asc' ? 1 : -1;
  const [items, total] = await Promise.all([
    Appointment.find(query)
      .sort({ [pagination.sortBy]: sortDirection })
      .skip(skip)
      .limit(pagination.limit)
      .exec(),
    Appointment.countDocuments(query).exec()
  ]);

  return {
    items,
    total,
    page: pagination.page,
    limit: pagination.limit,
    totalPages: Math.ceil(total / pagination.limit) || 1
  };
}

export async function getAppointmentById(id: string) {
  return Appointment.findById(id).exec();
}

export async function createAppointment(data: {
  clientId: string;
  professionalId: string;
  serviceId: string;
  scheduledAt: Date;
  endsAt: Date;
  status?: AppointmentStatus;
  notes?: string;
  createdBy?: string;
}) {
  return Appointment.create(data);
}

export async function updateAppointment(
  id: string,
  data: Partial<{
    clientId: string;
    professionalId: string;
    serviceId: string;
    scheduledAt: Date;
    endsAt: Date;
    status: AppointmentStatus;
    notes?: string;
  }>
) {
  return Appointment.findByIdAndUpdate(id, data, { new: true }).exec();
}

export async function deleteAppointment(id: string) {
  return Appointment.findByIdAndDelete(id).exec();
}

export async function findConflictingAppointments(input: {
  professionalId: string;
  start: Date;
  end: Date;
  excludeId?: string;
}) {
  const query: FilterQuery<AppointmentDocument> = {
    professionalId: input.professionalId,
    status: { $ne: 'CANCELED' },
    scheduledAt: { $lt: input.end },
    endsAt: { $gt: input.start }
  };

  if (input.excludeId) {
    query._id = { $ne: input.excludeId };
  }

  return Appointment.find(query).sort({ scheduledAt: 1 }).exec();
}
