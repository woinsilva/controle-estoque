import { User } from '../users/model.js';

export async function findUserByEmail(email: string) {
  return User.findOne({ email: email.toLowerCase() }).exec();
}
