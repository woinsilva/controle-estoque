import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env.js';
import { findUserByEmail } from './repository.js';

type LoginInput = {
  email: string;
  password: string;
};

export async function login({ email, password }: LoginInput) {
  const user = await findUserByEmail(email);
  if (!user || !user.active) {
    return null;
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
