import bcrypt from 'bcryptjs';
import { createUser, deleteUser, findUserByEmail, getUserById, listUsers, updateUser } from './repository.js';

type CreateUserInput = {
  name: string;
  email: string;
  password: string;
  role: 'OPERATOR' | 'MANAGER' | 'ADMIN';
  active: boolean;
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
  const passwordHash = await bcrypt.hash(input.password, 10);
  return createUser({
    name: input.name,
    email: input.email,
    passwordHash,
    role: input.role,
    active: input.active,
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
    role: 'OPERATOR' | 'MANAGER' | 'ADMIN';
    active: boolean;
    locale: string;
    theme: 'light' | 'dark';
  }> = {
    name: input.name,
    email: input.email,
    role: input.role,
    active: input.active,
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
