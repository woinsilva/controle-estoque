import type { SaleDocument } from '../sales/model.js';
import type { FiscalPayload } from './issuer.js';
import { createFiscalRecord, updateFiscalRecord } from './repository.js';

export async function createPendingFiscalRecord(sale: SaleDocument) {
  const payload: FiscalPayload = {
    saleId: sale.id,
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
    saleId: sale.id,
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
