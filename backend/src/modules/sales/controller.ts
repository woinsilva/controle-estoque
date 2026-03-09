import type { Request, Response } from 'express';
import { createSaleService, getSaleService, listSalesService } from './service.js';
import { recordAudit } from '../audit/service.js';

type SaleItemInput = {
  productId?: string;
  quantity?: number;
};

export async function listSalesController(_req: Request, res: Response) {
  const sales = await listSalesService();
  return res.status(200).json(sales);
}

export async function getSaleController(req: Request, res: Response) {
  const sale = await getSaleService(req.params.id);
  if (!sale) {
    return res.status(404).json({ error: 'Sale not found.' });
  }
  return res.status(200).json(sale);
}

export async function createSaleController(req: Request, res: Response) {
  const rawItems = (req.body?.items || []) as SaleItemInput[];
  const items = rawItems.map((item) => ({
    productId: String(item.productId || ''),
    quantity: Number(item.quantity || 0)
  }));

  try {
    const sale = await createSaleService(items, req.body.clientId, req.user?.id);
    await recordAudit({
      action: 'CREATE',
      entity: 'sale',
      entityId: sale.id,
      userId: req.user?.id,
      role: req.user?.role,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      payload: { total: sale.total, items: sale.items.length, clientId: sale.clientId }
    });
    return res.status(201).json(sale);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not create sale.';
    return res.status(400).json({ error: message });
  }
}
