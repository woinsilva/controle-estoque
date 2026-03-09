import type { Request, Response } from 'express';
import { recordAudit } from '../audit/service.js';
import {
  ClientServiceError,
  createClientService,
  deleteClientService,
  getClientService,
  listClientsService,
  updateClientService
} from './service.js';

function mapClient(client: {
  id?: string;
  _id?: { toString: () => string };
  fullName: string;
  email?: string;
  phone: string;
  birthDate?: Date;
  notes?: string;
  active: boolean;
  userId?: string;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: client.id || client._id?.toString() || '',
    fullName: client.fullName,
    email: client.email,
    phone: client.phone,
    birthDate: client.birthDate,
    notes: client.notes,
    active: client.active,
    userId: client.userId,
    createdAt: client.createdAt,
    updatedAt: client.updatedAt
  };
}

export async function listClientsController(req: Request, res: Response) {
  const query = req.query as unknown as {
    q?: string;
    active?: boolean;
    page: number;
    limit: number;
    sortBy: 'fullName' | 'createdAt' | 'updatedAt';
    sortOrder: 'asc' | 'desc';
  };
  const result = await listClientsService(query);
  return res.status(200).json({
    ...result,
    items: result.items.map(mapClient)
  });
}

export async function getClientController(req: Request, res: Response) {
  const client = await getClientService(req.params.id);
  if (!client) {
    return res.status(404).json({ error: 'Client not found.' });
  }
  return res.status(200).json(mapClient(client));
}

export async function createClientController(req: Request, res: Response) {
  try {
    const client = await createClientService(req.body);
    if (!client) {
      return res.status(400).json({ error: 'Could not create client.' });
    }
    await recordAudit({
      action: 'CREATE',
      entity: 'client',
      entityId: client.id,
      userId: req.user?.id,
      role: req.user?.role,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      payload: { phone: client.phone, email: client.email, active: client.active }
    });
    return res.status(201).json(mapClient(client));
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Could not create client.';
    const status = err instanceof ClientServiceError ? err.statusCode : 400;
    return res.status(status).json({ error: message });
  }
}

export async function updateClientController(req: Request, res: Response) {
  try {
    const client = await updateClientService(req.params.id, req.body);
    if (!client) {
      return res.status(404).json({ error: 'Client not found.' });
    }
    await recordAudit({
      action: 'UPDATE',
      entity: 'client',
      entityId: client.id,
      userId: req.user?.id,
      role: req.user?.role,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      payload: { phone: client.phone, email: client.email, active: client.active }
    });
    return res.status(200).json(mapClient(client));
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Could not update client.';
    const status = err instanceof ClientServiceError ? err.statusCode : 400;
    return res.status(status).json({ error: message });
  }
}

export async function deleteClientController(req: Request, res: Response) {
  try {
    const client = await deleteClientService(req.params.id);
    if (!client) {
      return res.status(404).json({ error: 'Client not found.' });
    }
    await recordAudit({
      action: 'DELETE',
      entity: 'client',
      entityId: client.id,
      userId: req.user?.id,
      role: req.user?.role,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      payload: { phone: client.phone, email: client.email }
    });
    return res.status(204).send();
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Could not delete client.';
    const status = err instanceof ClientServiceError ? err.statusCode : 400;
    return res.status(status).json({ error: message });
  }
}
