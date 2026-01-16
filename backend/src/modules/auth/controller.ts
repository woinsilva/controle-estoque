import type { Request, Response } from 'express';
import { login } from './service.js';

export async function loginController(req: Request, res: Response) {
  const { email, password } = req.body as { email?: string; password?: string };

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const result = await login({ email, password });
  if (!result) {
    return res.status(401).json({ error: 'Invalid credentials.' });
  }

  return res.status(200).json(result);
}
