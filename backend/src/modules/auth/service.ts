import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env.js';
import { findUserByEmail } from './repository.js';
import { findUserByActivationTokenHash, getUserById, updateUser } from '../users/repository.js';
import { sendClientActivationEmail } from './mail.js';

type LoginInput = {
  email: string;
  password: string;
};

export async function login({ email, password }: LoginInput) {
  const user = await findUserByEmail(email);
  if (!user || !user.active) {
    return null;
  }
  if (user.role === 'CLIENT' && (!user.emailConfirmed || user.passwordResetRequired)) {
    throw new Error('Account activation pending. Check your email to confirm your account and set your password.');
  }

  const passwordMatches = await bcrypt.compare(password, user.passwordHash);
  if (!passwordMatches) {
    return null;
  }

  const token = jwt.sign(
    { sub: user.id, role: user.role, clientId: user.clientId || null, isProfessional: user.isProfessional },
    env.jwtSecret,
    { expiresIn: env.jwtExpiresIn as jwt.SignOptions['expiresIn'] }
  );

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      clientId: user.clientId,
      isProfessional: user.isProfessional,
      emailConfirmed: user.emailConfirmed,
      passwordResetRequired: user.passwordResetRequired,
      locale: user.locale || 'pt',
      theme: user.theme || 'light'
    }
  };
}

function hashToken(token: string) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export async function issueClientActivation(userId: string) {
  const user = await getUserById(userId);
  if (!user) {
    throw new Error('User not found.');
  }

  const token = crypto.randomBytes(32).toString('hex');
  const activationTokenHash = hashToken(token);
  const activationTokenExpiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24);

  await updateUser(userId, {
    activationTokenHash,
    activationTokenExpiresAt,
    emailConfirmed: false,
    passwordResetRequired: true
  });

  const activationUrl = `${env.frontendAppUrl.replace(/\/$/, '')}/activate-account?token=${token}`;
  await sendClientActivationEmail({
    to: user.email,
    name: user.name,
    activationUrl
  });
}

export async function activateClientAccount(input: { token: string; password: string }) {
  const user = await findUserByActivationTokenHash(hashToken(input.token));
  if (!user || user.role !== 'CLIENT') {
    throw new Error('Invalid or expired activation token.');
  }

  const passwordHash = await bcrypt.hash(input.password, 10);
  await updateUser(user.id, {
    passwordHash,
    emailConfirmed: true,
    passwordResetRequired: false,
    activationTokenHash: undefined,
    activationTokenExpiresAt: undefined,
    active: true
  });

  return {
    message: 'Account activated successfully.'
  };
}
