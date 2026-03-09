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

export async function createUser(data: {
  name: string;
  email: string;
  passwordHash: string;
  role: 'OPERATOR' | 'MANAGER' | 'ADMIN';
  active: boolean;
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
    role: 'OPERATOR' | 'MANAGER' | 'ADMIN';
    active: boolean;
    locale: string;
    theme: 'light' | 'dark';
  }>
) {
  return User.findByIdAndUpdate(id, data, { new: true }).exec();
}

export async function deleteUser(id: string) {
  return User.findByIdAndDelete(id).exec();
}
