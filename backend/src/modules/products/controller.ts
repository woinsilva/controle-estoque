import type { Request, Response } from 'express';
import {
  createProductService,
  deleteProductService,
  getProductService,
  listProductsService,
  updateProductService
} from './service.js';
import { recordAudit } from '../audit/service.js';

function normalizeProductInput(body: Record<string, unknown>) {
  return {
    name: String(body.name || '').trim(),
    sku: String(body.sku || '').trim().toUpperCase(),
    price: Number(body.price),
    stockQty: Number(body.stockQty),
    active: body.active === undefined ? true : Boolean(body.active)
  };
}

function validateProductInput(input: {
  name: string;
  sku: string;
  price: number;
  stockQty: number;
}) {
  if (!input.name || !input.sku) {
    return 'Name and SKU are required.';
  }
  if (Number.isNaN(input.price) || input.price < 0) {
    return 'Price must be a non-negative number.';
  }
  if (Number.isNaN(input.stockQty) || input.stockQty < 0) {
    return 'Stock quantity must be a non-negative number.';
  }
  return null;
}

export async function listProductsController(_req: Request, res: Response) {
  const products = await listProductsService();
  return res.status(200).json(products);
}

export async function getProductController(req: Request, res: Response) {
  const product = await getProductService(req.params.id);
  if (!product) {
    return res.status(404).json({ error: 'Product not found.' });
  }
  return res.status(200).json(product);
}

export async function createProductController(req: Request, res: Response) {
  const input = normalizeProductInput(req.body as Record<string, unknown>);
  const error = validateProductInput(input);
  if (error) {
    return res.status(400).json({ error });
  }
  const product = await createProductService(input);
  await recordAudit({
    action: 'CREATE',
    entity: 'product',
    entityId: product.id,
    userId: req.user?.id,
    role: req.user?.role,
    ip: req.ip,
    userAgent: req.headers['user-agent'],
    payload: { name: product.name, sku: product.sku }
  });
  return res.status(201).json(product);
}

export async function updateProductController(req: Request, res: Response) {
  const input = normalizeProductInput(req.body as Record<string, unknown>);
  const error = validateProductInput(input);
  if (error) {
    return res.status(400).json({ error });
  }
  const product = await updateProductService(req.params.id, input);
  if (!product) {
    return res.status(404).json({ error: 'Product not found.' });
  }
  await recordAudit({
    action: 'UPDATE',
    entity: 'product',
    entityId: product.id,
    userId: req.user?.id,
    role: req.user?.role,
    ip: req.ip,
    userAgent: req.headers['user-agent'],
    payload: { name: product.name, sku: product.sku }
  });
  return res.status(200).json(product);
}

export async function deleteProductController(req: Request, res: Response) {
  const product = await deleteProductService(req.params.id);
  if (!product) {
    return res.status(404).json({ error: 'Product not found.' });
  }
  await recordAudit({
    action: 'DELETE',
    entity: 'product',
    entityId: product.id,
    userId: req.user?.id,
    role: req.user?.role,
    ip: req.ip,
    userAgent: req.headers['user-agent'],
    payload: { name: product.name, sku: product.sku }
  });
  return res.status(204).send();
}
