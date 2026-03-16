import { FilterQuery } from 'mongoose';
import { BusinessService, type ServiceDocument } from './model.js';

type ServiceFilters = {
  q?: string;
  active?: boolean;
};

export async function listServices(filters: ServiceFilters) {
  const query: FilterQuery<ServiceDocument> = {};
  if (typeof filters.active === 'boolean') {
    query.active = filters.active;
  }
  if (filters.q) {
    const escaped = filters.q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern = new RegExp(escaped, 'i');
    query.$or = [{ name: pattern }, { description: pattern }];
  }

  return BusinessService.find(query).sort({ name: 1 }).exec();
}

export async function getServiceById(id: string) {
  return BusinessService.findById(id).exec();
}

export async function createService(data: {
  name: string;
  description?: string;
  durationMinutes: number;
  price: number;
  active: boolean;
  requiresQuestionnaire: boolean;
}) {
  return BusinessService.create(data);
}

export async function updateService(
  id: string,
  data: Partial<{
    name: string;
    description?: string;
    durationMinutes: number;
    price: number;
    active: boolean;
    requiresQuestionnaire: boolean;
  }>
) {
  return BusinessService.findByIdAndUpdate(id, data, { new: true }).exec();
}

export async function deleteService(id: string) {
  return BusinessService.findByIdAndDelete(id).exec();
}
