import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

export const activateClientSchema = z.object({
  token: z.string().min(32),
  password: z.string().min(6)
});
