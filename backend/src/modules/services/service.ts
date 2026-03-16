import {
  createService,
  deleteService,
  getServiceById,
  listServices,
  updateService
} from './repository.js';

type ServiceInput = {
  name: string;
  description?: string;
  durationMinutes: number;
  price: number;
  active: boolean;
  requiresQuestionnaire: boolean;
};

export async function listServicesService(input: { q?: string; active?: boolean }) {
  return listServices(input);
}

export async function getServiceService(id: string) {
  return getServiceById(id);
}

export async function createServiceService(input: ServiceInput) {
  return createService({
    name: input.name.trim(),
    description: input.description?.trim() || undefined,
    durationMinutes: input.durationMinutes,
    price: input.price,
    active: input.active,
    requiresQuestionnaire: input.requiresQuestionnaire
  });
}

export async function updateServiceService(id: string, input: Partial<ServiceInput>) {
  return updateService(id, {
    name: input.name?.trim(),
    description: input.description?.trim() || undefined,
    durationMinutes: input.durationMinutes,
    price: input.price,
    active: input.active,
    requiresQuestionnaire: input.requiresQuestionnaire
  });
}

export async function deleteServiceService(id: string) {
  return deleteService(id);
}
