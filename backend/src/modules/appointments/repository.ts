import { FilterQuery } from 'mongoose';
import { Appointment, type AppointmentDocument, type AppointmentStatus } from './model.js';

type AppointmentFilters = {
  clientId?: string;
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
  scheduledAt: Date;
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
    scheduledAt: Date;
    status: AppointmentStatus;
    notes?: string;
  }>
) {
  return Appointment.findByIdAndUpdate(id, data, { new: true }).exec();
}

export async function deleteAppointment(id: string) {
  return Appointment.findByIdAndDelete(id).exec();
}
