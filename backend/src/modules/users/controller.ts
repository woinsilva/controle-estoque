import type { Request, Response } from 'express';
import {
  createUserService,
  deleteUserService,
  getUserService,
  listProfessionalsService,
  listUsersService,
  updateUserPreferencesService,
  updateUserService
} from './service.js';
import { recordAudit } from '../audit/service.js';

function normalizeUserInput(body: Record<string, unknown>) {
  return {
    name: String(body.name || '').trim(),
    email: String(body.email || '').trim().toLowerCase(),
    password: String(body.password || '').trim(),
    role: String(body.role || 'OPERATOR') as 'OPERATOR' | 'MANAGER' | 'ADMIN' | 'CLIENT',
    active: body.active === undefined ? true : Boolean(body.active),
    clientId: body.clientId ? String(body.clientId).trim() : undefined,
    isProfessional: Boolean(body.isProfessional),
    emailConfirmed: Boolean(body.emailConfirmed),
    passwordResetRequired: Boolean(body.passwordResetRequired),
    locale: String(body.locale || 'pt') as 'pt' | 'en' | 'es',
    theme: String(body.theme || 'light') as 'light' | 'dark'
  };
}

function validateUserInput(input: {
  name: string;
  email: string;
  password?: string;
  role: string;
}) {
  if (!input.name || !input.email) {
    return 'Name and email are required.';
  }
  if (!input.role) {
    return 'Role is required.';
  }
  return null;
}

export async function listUsersController(_req: Request, res: Response) {
  const users = await listUsersService();
  return res.status(200).json(
    users.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      active: user.active,
      clientId: user.clientId,
      isProfessional: user.isProfessional,
      emailConfirmed: user.emailConfirmed,
      passwordResetRequired: user.passwordResetRequired,
      locale: user.locale,
      theme: user.theme
    }))
  );
}

export async function listProfessionalsController(_req: Request, res: Response) {
  const users = await listProfessionalsService();
  return res.status(200).json(
    users.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    }))
  );
}

export async function getUserController(req: Request, res: Response) {
  const user = await getUserService(req.params.id);
  if (!user) {
    return res.status(404).json({ error: 'User not found.' });
  }
  return res.status(200).json({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    active: user.active,
    clientId: user.clientId,
    isProfessional: user.isProfessional,
    emailConfirmed: user.emailConfirmed,
    passwordResetRequired: user.passwordResetRequired,
    locale: user.locale,
    theme: user.theme
  });
}

export async function createUserController(req: Request, res: Response) {
  const input = normalizeUserInput(req.body as Record<string, unknown>);
  const error = validateUserInput(input);
  if (error) {
    return res.status(400).json({ error });
  }
  if (!input.password) {
    return res.status(400).json({ error: 'Password is required.' });
  }
  try {
    const user = await createUserService(input);
    await recordAudit({
      action: 'CREATE',
      entity: 'user',
      entityId: user.id,
      userId: req.user?.id,
      role: req.user?.role,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      payload: { email: user.email, role: user.role }
    });
    return res.status(201).json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      active: user.active,
      clientId: user.clientId,
      isProfessional: user.isProfessional,
      emailConfirmed: user.emailConfirmed,
      passwordResetRequired: user.passwordResetRequired,
      locale: user.locale,
      theme: user.theme
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Could not create user.';
    return res.status(400).json({ error: message });
  }
}

export async function updateUserController(req: Request, res: Response) {
  const input = normalizeUserInput(req.body as Record<string, unknown>);
  const error = validateUserInput({ ...input, password: undefined });
  if (error) {
    return res.status(400).json({ error });
  }
  const user = await updateUserService(req.params.id, {
    name: input.name,
    email: input.email,
    role: input.role,
    active: input.active,
    clientId: input.clientId,
    isProfessional: input.isProfessional,
    emailConfirmed: input.emailConfirmed,
    passwordResetRequired: input.passwordResetRequired,
    password: input.password || undefined,
    locale: input.locale,
    theme: input.theme
  });
  if (!user) {
    return res.status(404).json({ error: 'User not found.' });
  }
  await recordAudit({
    action: 'UPDATE',
    entity: 'user',
    entityId: user.id,
    userId: req.user?.id,
    role: req.user?.role,
    ip: req.ip,
    userAgent: req.headers['user-agent'],
    payload: { email: user.email, role: user.role, active: user.active }
  });
  return res.status(200).json({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    active: user.active,
    clientId: user.clientId,
    isProfessional: user.isProfessional,
    emailConfirmed: user.emailConfirmed,
    passwordResetRequired: user.passwordResetRequired,
    locale: user.locale,
    theme: user.theme
  });
}

export async function updatePreferencesController(req: Request, res: Response) {
  const { locale, theme } = req.body as { locale?: string; theme?: 'light' | 'dark' };

  if (!locale || !theme) {
    return res.status(400).json({ error: 'Locale and theme are required.' });
  }

  const user = await updateUserPreferencesService(req.user!.id, { locale, theme });
  if (!user) {
    return res.status(404).json({ error: 'User not found.' });
  }

  return res.status(200).json({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    active: user.active,
    clientId: user.clientId,
    isProfessional: user.isProfessional,
    emailConfirmed: user.emailConfirmed,
    passwordResetRequired: user.passwordResetRequired,
    locale: user.locale,
    theme: user.theme
  });
}

export async function deleteUserController(req: Request, res: Response) {
  if (req.user?.id === req.params.id) {
    return res.status(400).json({ error: 'Cannot delete own user.' });
  }
  const user = await deleteUserService(req.params.id);
  if (!user) {
    return res.status(404).json({ error: 'User not found.' });
  }
  await recordAudit({
    action: 'DELETE',
    entity: 'user',
    entityId: user.id,
    userId: req.user?.id,
    role: req.user?.role,
    ip: req.ip,
    userAgent: req.headers['user-agent'],
    payload: { email: user.email, role: user.role }
  });
  return res.status(204).send();
}
