import type { SaleDocument } from '../sales/model.js';
import type { FiscalPayload } from './issuer.js';
import { createFiscalRecord, updateFiscalRecord } from './repository.js';

export async function createPendingFiscalRecord(sale: SaleDocument) {
  const saleId = String((sale as SaleDocument & { _id?: { toString: () => string } })._id?.toString?.() || '');
  const payload: FiscalPayload = {
    saleId,
    total: sale.total,
    items: sale.items.map((item) => ({
      productId: item.productId,
      name: item.name,
      sku: item.sku,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      total: item.total
    }))
  };

  return createFiscalRecord({
    saleId,
    payload
  });
}

export async function setFiscalStatus(
  saleId: string,
  status: 'AUTHORIZED' | 'DENIED' | 'CANCELED' | 'ERROR',
  response?: Record<string, unknown>
) {
  return updateFiscalRecord(saleId, { status, response });
}
