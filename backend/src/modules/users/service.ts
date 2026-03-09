import bcrypt from 'bcryptjs';
import {
  createUser,
  deleteUser,
  findUserByClientId,
  findUserByEmail,
  getUserById,
  listProfessionals,
  listUsers,
  updateUser
} from './repository.js';

type CreateUserInput = {
  name: string;
  email: string;
  password: string;
  role: 'OPERATOR' | 'MANAGER' | 'ADMIN' | 'CLIENT';
  active: boolean;
  clientId?: string;
  isProfessional?: boolean;
  emailConfirmed?: boolean;
  passwordResetRequired?: boolean;
};

export async function listUsersService() {
  return listUsers();
}

export async function getUserService(id: string) {
  return getUserById(id);
}

export async function createUserService(input: CreateUserInput & { locale?: string; theme?: 'light' | 'dark' }) {
  const existing = await findUserByEmail(input.email);
  if (existing) {
    throw new Error('Email already in use.');
  }
  if (input.clientId) {
    const existingClientUser = await findUserByClientId(input.clientId);
    if (existingClientUser) {
      throw new Error('Client already linked to another user.');
    }
  }
  const passwordHash = await bcrypt.hash(input.password, 10);
  return createUser({
    name: input.name,
    email: input.email,
    passwordHash,
    role: input.role,
    active: input.active,
    clientId: input.clientId,
    isProfessional: input.role === 'CLIENT' ? false : Boolean(input.isProfessional),
    emailConfirmed: Boolean(input.emailConfirmed),
    passwordResetRequired: Boolean(input.passwordResetRequired),
    locale: input.locale || 'pt',
    theme: input.theme || 'light'
  });
}

export async function updateUserService(
  id: string,
  input: Partial<Omit<CreateUserInput, 'password'>> & {
    password?: string;
    locale?: string;
    theme?: 'light' | 'dark';
  }
) {
  const data: Partial<{
    name: string;
    email: string;
    passwordHash: string;
    role: 'OPERATOR' | 'MANAGER' | 'ADMIN' | 'CLIENT';
    active: boolean;
    clientId?: string;
    isProfessional: boolean;
    emailConfirmed: boolean;
    passwordResetRequired: boolean;
    locale: string;
    theme: 'light' | 'dark';
  }> = {
    name: input.name,
    email: input.email,
    role: input.role,
    active: input.active,
    clientId: input.clientId,
    isProfessional: input.role === 'CLIENT' ? false : input.isProfessional,
    emailConfirmed: input.emailConfirmed,
    passwordResetRequired: input.passwordResetRequired,
    locale: input.locale,
    theme: input.theme
  };

  if (input.password) {
    data.passwordHash = await bcrypt.hash(input.password, 10);
  }

  return updateUser(id, data);
}

export async function updateUserPreferencesService(
  id: string,
  preferences: { locale: string; theme: 'light' | 'dark' }
) {
  return updateUser(id, {
    locale: preferences.locale,
    theme: preferences.theme
  });
}

export async function deleteUserService(id: string) {
  return deleteUser(id);
}

export async function listProfessionalsService() {
  return listProfessionals();
}
