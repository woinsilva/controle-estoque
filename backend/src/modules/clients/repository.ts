import { FilterQuery } from 'mongoose';
import { Client, type ClientDocument } from './model.js';

type ClientFilters = {
  q?: string;
  active?: boolean;
};

type PaginationInput = {
  page: number;
  limit: number;
  sortBy: 'fullName' | 'createdAt' | 'updatedAt';
  sortOrder: 'asc' | 'desc';
};

export async function listClients(filters: ClientFilters, pagination: PaginationInput) {
  const query: FilterQuery<ClientDocument> = {};
  if (typeof filters.active === 'boolean') {
    query.active = filters.active;
  }
  if (filters.q) {
    const escaped = filters.q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern = new RegExp(escaped, 'i');
    query.$or = [{ fullName: pattern }, { email: pattern }, { phone: pattern }];
  }

  const skip = (pagination.page - 1) * pagination.limit;
  const sortDirection = pagination.sortOrder === 'asc' ? 1 : -1;
  const [items, total] = await Promise.all([
    Client.find(query)
      .sort({ [pagination.sortBy]: sortDirection })
      .skip(skip)
      .limit(pagination.limit)
      .exec(),
    Client.countDocuments(query).exec()
  ]);

  return {
    items,
    total,
    page: pagination.page,
    limit: pagination.limit,
    totalPages: Math.ceil(total / pagination.limit) || 1
  };
}

export async function getClientById(id: string) {
  return Client.findById(id).exec();
}

export async function createClient(data: {
  fullName: string;
  email?: string;
  phone: string;
  birthDate?: Date;
  notes?: string;
  active: boolean;
}) {
  return Client.create(data);
}

export async function updateClient(
  id: string,
  data: Partial<{
    fullName: string;
    email?: string;
    phone: string;
    birthDate?: Date;
    notes?: string;
    active: boolean;
  }>
) {
  return Client.findByIdAndUpdate(id, data, { new: true }).exec();
}

export async function deleteClient(id: string) {
  return Client.findByIdAndDelete(id).exec();
}

export async function findClientByPhone(phone: string) {
  return Client.findOne({ phone }).exec();
}

export async function findClientByEmail(email: string) {
  return Client.findOne({ email }).exec();
}
