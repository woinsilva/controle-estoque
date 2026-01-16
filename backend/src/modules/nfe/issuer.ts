export type FiscalPayload = {
  saleId: string;
  total: number;
  items: Array<{
    productId: string;
    name: string;
    sku: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
};

export type FiscalResult = {
  key?: string;
  status: 'AUTHORIZED' | 'DENIED' | 'ERROR';
  raw?: unknown;
};

export interface NfeIssuer {
  emit(payload: FiscalPayload): Promise<FiscalResult>;
}
