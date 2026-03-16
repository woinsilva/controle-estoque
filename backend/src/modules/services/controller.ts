import type { Request, Response } from 'express';
import {
  createServiceService,
  deleteServiceService,
  getServiceService,
  listServicesService,
  updateServiceService
} from './service.js';

function mapService(service: {
  id?: string;
  _id?: { toString: () => string };
  name: string;
  description?: string;
  durationMinutes: number;
  price: number;
  active: boolean;
  requiresQuestionnaire: boolean;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: service.id || service._id?.toString() || '',
    name: service.name,
    description: service.description,
    durationMinutes: service.durationMinutes,
    price: service.price,
    active: service.active,
    requiresQuestionnaire: service.requiresQuestionnaire,
    createdAt: service.createdAt,
    updatedAt: service.updatedAt
  };
}

export async function listServicesController(req: Request, res: Response) {
  const active =
    typeof req.query.active === 'string' ? req.query.active === 'true' : undefined;
  const services = await listServicesService({
    q: typeof req.query.q === 'string' ? req.query.q : undefined,
    active
  });
  return res.status(200).json(services.map(mapService));
}

export async function getServiceController(req: Request, res: Response) {
  const service = await getServiceService(req.params.id);
  if (!service) {
    return res.status(404).json({ error: 'Service not found.' });
  }
  return res.status(200).json(mapService(service));
}

export async function createServiceController(req: Request, res: Response) {
  const service = await createServiceService(req.body);
  return res.status(201).json(mapService(service));
}

export async function updateServiceController(req: Request, res: Response) {
  const service = await updateServiceService(req.params.id, req.body);
  if (!service) {
    return res.status(404).json({ error: 'Service not found.' });
  }
  return res.status(200).json(mapService(service));
}

export async function deleteServiceController(req: Request, res: Response) {
  const service = await deleteServiceService(req.params.id);
  if (!service) {
    return res.status(404).json({ error: 'Service not found.' });
  }
  return res.status(204).send();
}
