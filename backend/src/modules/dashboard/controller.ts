import type { Request, Response } from 'express';
import { getDashboardSummaryService } from './service.js';

export async function getDashboardSummaryController(_req: Request, res: Response) {
  const summary = await getDashboardSummaryService();
  return res.status(200).json(summary);
}
