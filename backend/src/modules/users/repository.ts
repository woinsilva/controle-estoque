import { User } from './model.js';

export async function listUsers() {
  return User.find().sort({ createdAt: -1 }).exec();
}

export async function getUserById(id: string) {
  return User.findById(id).exec();
}

export async function findUserByEmail(email: string) {
  return User.findOne({ email: email.toLowerCase() }).exec();
}

export async function findUserByClientId(clientId: string) {
  return User.findOne({ clientId }).exec();
}

export async function listProfessionals() {
  return User.find({ active: true, isProfessional: true, role: { $ne: 'CLIENT' } })
    .sort({ name: 1 })
    .exec();
}

export async function createUser(data: {
  name: string;
  email: string;
  passwordHash: string;
  role: 'OPERATOR' | 'MANAGER' | 'ADMIN' | 'CLIENT';
  active: boolean;
  clientId?: string;
  isProfessional?: boolean;
  emailConfirmed?: boolean;
  passwordResetRequired?: boolean;
  activationTokenHash?: string;
  activationTokenExpiresAt?: Date;
  locale?: string;
  theme?: 'light' | 'dark';
}) {
  return User.create(data);
}

export async function updateUser(
  id: string,
  data: Partial<{
    name: string;
    email: string;
    passwordHash: string;
    role: 'OPERATOR' | 'MANAGER' | 'ADMIN' | 'CLIENT';
    active: boolean;
    clientId?: string;
    isProfessional: boolean;
    emailConfirmed: boolean;
    passwordResetRequired: boolean;
    activationTokenHash?: string;
    activationTokenExpiresAt?: Date;
    locale: string;
    theme: 'light' | 'dark';
  }>
) {
  return User.findByIdAndUpdate(id, data, { new: true }).exec();
}

export async function findUserByActivationTokenHash(tokenHash: string) {
  return User.findOne({
    activationTokenHash: tokenHash,
    activationTokenExpiresAt: { $gt: new Date() }
  }).exec();
}

export async function deleteUser(id: string) {
  return User.findByIdAndDelete(id).exec();
}
