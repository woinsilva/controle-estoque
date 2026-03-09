import type { Request, Response } from 'express';
import { recordAudit } from '../audit/service.js';
import {
  AppointmentServiceError,
  createAppointmentService,
  deleteAppointmentService,
  getAppointmentService,
  listAppointmentsService,
  updateAppointmentService,
  updateAppointmentStatusService
} from './service.js';

function mapAppointment(appointment: {
  id?: string;
  _id?: { toString: () => string };
  clientId: string;
  professionalId: string;
  serviceId: string;
  scheduledAt: Date;
  endsAt: Date;
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELED';
  notes?: string;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: appointment.id || appointment._id?.toString() || '',
    clientId: appointment.clientId,
    professionalId: appointment.professionalId,
    serviceId: appointment.serviceId,
    scheduledAt: appointment.scheduledAt,
    endsAt: appointment.endsAt,
    status: appointment.status,
    notes: appointment.notes,
    createdBy: appointment.createdBy,
    createdAt: appointment.createdAt,
    updatedAt: appointment.updatedAt
  };
}

export async function listAppointmentsController(req: Request, res: Response) {
  const query = req.query as unknown as {
    clientId?: string;
    professionalId?: string;
    serviceId?: string;
    status?: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELED';
    dateFrom?: Date;
    dateTo?: Date;
    page: number;
    limit: number;
    sortBy: 'scheduledAt' | 'createdAt' | 'updatedAt';
    sortOrder: 'asc' | 'desc';
  };
  if (req.user?.role === 'CLIENT') {
    if (!req.user.clientId) {
      return res.status(200).json({ items: [], total: 0, page: query.page, limit: query.limit, totalPages: 1 });
    }
    query.clientId = req.user.clientId || '';
  }
  const result = await listAppointmentsService(query);
  return res.status(200).json({
    ...result,
    items: result.items.map(mapAppointment)
  });
}

export async function getAppointmentController(req: Request, res: Response) {
  const appointment = await getAppointmentService(req.params.id);
  if (!appointment) {
    return res.status(404).json({ error: 'Appointment not found.' });
  }
  if (req.user?.role === 'CLIENT' && appointment.clientId !== req.user.clientId) {
    return res.status(403).json({ error: 'Forbidden.' });
  }
  return res.status(200).json(mapAppointment(appointment));
}

export async function createAppointmentController(req: Request, res: Response) {
  try {
    if (req.user?.role === 'CLIENT' && !req.user.clientId) {
      return res.status(403).json({ error: 'Client account is not linked to a client profile.' });
    }
    const clientId = req.user?.role === 'CLIENT' ? req.user.clientId || '' : req.body.clientId;
    const appointment = await createAppointmentService({
      clientId,
      professionalId: req.body.professionalId,
      serviceId: req.body.serviceId,
      scheduledAt: req.body.scheduledAt,
      status: req.body.status,
      notes: req.body.notes,
      createdBy: req.user?.id
    });
    await recordAudit({
      action: 'CREATE',
      entity: 'appointment',
      entityId: appointment.id,
      userId: req.user?.id,
      role: req.user?.role,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      payload: {
        clientId: appointment.clientId,
        professionalId: appointment.professionalId,
        serviceId: appointment.serviceId,
        scheduledAt: appointment.scheduledAt,
        status: appointment.status
      }
    });
    return res.status(201).json(mapAppointment(appointment));
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Could not create appointment.';
    const status = err instanceof AppointmentServiceError ? err.statusCode : 400;
    return res.status(status).json({ error: message });
  }
}

export async function updateAppointmentController(req: Request, res: Response) {
  try {
    const appointment = await updateAppointmentService(req.params.id, req.body);
    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found.' });
    }
    await recordAudit({
      action: 'UPDATE',
      entity: 'appointment',
      entityId: appointment.id,
      userId: req.user?.id,
      role: req.user?.role,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      payload: {
        clientId: appointment.clientId,
        professionalId: appointment.professionalId,
        serviceId: appointment.serviceId,
        scheduledAt: appointment.scheduledAt,
        status: appointment.status
      }
    });
    return res.status(200).json(mapAppointment(appointment));
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Could not update appointment.';
    const status = err instanceof AppointmentServiceError ? err.statusCode : 400;
    return res.status(status).json({ error: message });
  }
}

export async function updateAppointmentStatusController(req: Request, res: Response) {
  const appointment = await updateAppointmentStatusService(req.params.id, req.body.status);
  if (!appointment) {
    return res.status(404).json({ error: 'Appointment not found.' });
  }
  await recordAudit({
    action: 'UPDATE',
    entity: 'appointment',
    entityId: appointment.id,
    userId: req.user?.id,
    role: req.user?.role,
    ip: req.ip,
    userAgent: req.headers['user-agent'],
    payload: { status: appointment.status }
  });
  return res.status(200).json(mapAppointment(appointment));
}

export async function deleteAppointmentController(req: Request, res: Response) {
  try {
    const appointment = await deleteAppointmentService(req.params.id);
    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found.' });
    }
    await recordAudit({
      action: 'DELETE',
      entity: 'appointment',
      entityId: appointment.id,
      userId: req.user?.id,
      role: req.user?.role,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      payload: {
        clientId: appointment.clientId,
        scheduledAt: appointment.scheduledAt
      }
    });
    return res.status(204).send();
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Could not delete appointment.';
    const status = err instanceof AppointmentServiceError ? err.statusCode : 400;
    return res.status(status).json({ error: message });
  }
}
