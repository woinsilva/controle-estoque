export type SaleItemInput = {
  productId: string;
  quantity: number;
};

export type SaleInput = {
  clientId: string;
  items: SaleItemInput[];
};

export type SaleItem = {
  productId: string;
  name: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  total: number;
};

export type Sale = {
  _id: string;
  clientId?: string;
  items: SaleItem[];
  total: number;
  status: string;
  fiscalStatus?: string;
  createdAt: string;
};
