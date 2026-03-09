import type { Request, Response } from 'express';
import { activateClientAccount, login } from './service.js';

export async function loginController(req: Request, res: Response) {
  const { email, password } = req.body as { email?: string; password?: string };

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  try {
    const result = await login({ email, password });
    if (!result) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    return res.status(200).json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid credentials.';
    return res.status(401).json({ error: message });
  }
}

export async function activateClientController(req: Request, res: Response) {
  try {
    const result = await activateClientAccount({
      token: req.body.token,
      password: req.body.password
    });
    return res.status(200).json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not activate account.';
    return res.status(400).json({ error: message });
  }
}
