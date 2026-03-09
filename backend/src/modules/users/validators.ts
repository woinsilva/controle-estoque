import { z } from 'zod';

export const createUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(['OPERATOR', 'MANAGER', 'ADMIN']),
  active: z.boolean().optional().default(true),
  locale: z.enum(['pt', 'en', 'es']).optional().default('pt'),
  theme: z.enum(['light', 'dark']).optional().default('light')
});

export const updateUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6).optional(),
  role: z.enum(['OPERATOR', 'MANAGER', 'ADMIN']),
  active: z.boolean().optional().default(true),
  locale: z.enum(['pt', 'en', 'es']).optional().default('pt'),
  theme: z.enum(['light', 'dark']).optional().default('light')
});

export const preferencesSchema = z.object({
  locale: z.enum(['pt', 'en', 'es']),
  theme: z.enum(['light', 'dark'])
});
