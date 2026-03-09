import { QuestionnaireResponse } from '../questionnaires/model.js';
import { deleteUserService, updateUserService } from '../users/service.js';
import { findUserByClientId } from '../users/repository.js';
import { createUserService } from '../users/service.js';
import { issueClientActivation } from '../auth/service.js';
import {
  createClient,
  deleteClient,
  findClientByEmail,
  findClientByPhone,
  getClientById,
  listClients,
  updateClient
} from './repository.js';

const DEFAULT_CLIENT_PASSWORD = 'Cliente123!';

type ClientInput = {
  fullName: string;
  email: string;
  phone: string;
  birthDate?: Date;
  notes?: string;
  active: boolean;
};

type UpdateClientInput = Partial<ClientInput>;

type ListClientsInput = {
  q?: string;
  active?: boolean;
  page: number;
  limit: number;
  sortBy: 'fullName' | 'createdAt' | 'updatedAt';
  sortOrder: 'asc' | 'desc';
};

export class ClientServiceError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
  }
}

function normalizePhone(value: string) {
  return value.replace(/[^\d+]/g, '');
}

function normalizeEmail(value?: string) {
  if (!value) return undefined;
  const normalized = value.trim().toLowerCase();
  return normalized || undefined;
}

export async function listClientsService(input: ListClientsInput) {
  return listClients(
    { q: input.q, active: input.active },
    {
      page: input.page,
      limit: input.limit,
      sortBy: input.sortBy,
      sortOrder: input.sortOrder
    }
  );
}

export async function getClientService(id: string) {
  return getClientById(id);
}

export async function createClientService(input: ClientInput) {
  const data: ClientInput = {
    ...input,
    fullName: input.fullName.trim(),
    phone: normalizePhone(input.phone),
    email: normalizeEmail(input.email) || '',
    notes: input.notes?.trim()
  };

  const existingPhone = await findClientByPhone(data.phone);
  if (existingPhone) {
    throw new ClientServiceError('Phone already in use.', 409);
  }
  if (data.email) {
    const existingEmail = await findClientByEmail(data.email);
    if (existingEmail) {
      throw new ClientServiceError('Email already in use.', 409);
    }
  }

  const client = await createClient(data);
  const user = await createUserService({
    name: data.fullName,
    email: data.email,
    password: DEFAULT_CLIENT_PASSWORD,
    role: 'CLIENT',
    active: data.active,
    clientId: client.id,
    isProfessional: false,
    emailConfirmed: false,
    passwordResetRequired: true
  });

  await issueClientActivation(user.id);

  return updateClient(client.id, { userId: user.id });
}

export async function updateClientService(id: string, input: UpdateClientInput) {
  const current = await getClientById(id);
  if (!current) {
    return null;
  }

  const data: UpdateClientInput = {
    ...input,
    fullName: input.fullName?.trim(),
    phone: input.phone ? normalizePhone(input.phone) : undefined,
    email: normalizeEmail(input.email),
    notes: input.notes?.trim()
  };

  if (data.phone && data.phone !== current.phone) {
    const existingPhone = await findClientByPhone(data.phone);
    if (existingPhone && String(existingPhone._id) !== id) {
      throw new ClientServiceError('Phone already in use.', 409);
    }
  }
  if (data.email && data.email !== current.email) {
    const existingEmail = await findClientByEmail(data.email);
    if (existingEmail && String(existingEmail._id) !== id) {
      throw new ClientServiceError('Email already in use.', 409);
    }
  }

  const updated = await updateClient(id, data);
  if (!updated) {
    return null;
  }

  const linkedUser = await findUserByClientId(id);
  if (linkedUser) {
    await updateUserService(linkedUser.id, {
      name: updated.fullName,
      email: updated.email,
      active: updated.active,
      role: 'CLIENT',
      clientId: id,
      isProfessional: false
    });
  }

  return getClientById(id);
}

export async function deleteClientService(id: string) {
  const hasResponses = await QuestionnaireResponse.exists({ clientId: id });
  if (hasResponses) {
    throw new ClientServiceError(
      'Client cannot be deleted because it has questionnaire history.',
      409
    );
  }
  const linkedUser = await findUserByClientId(id);
  if (linkedUser) {
    await deleteUserService(linkedUser.id);
  }
  return deleteClient(id);
}
