import { Sale } from './model.js';

export async function listSales() {
  return Sale.find().sort({ createdAt: -1 }).exec();
}

export async function getSaleById(id: string) {
  return Sale.findById(id).exec();
}

export async function createSale(data: {
  items: {
    productId: string;
    name: string;
    sku: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }[];
  total: number;
  status: 'PENDING' | 'COMPLETED' | 'CANCELED';
  createdBy?: string;
}) {
  return Sale.create(data);
}
