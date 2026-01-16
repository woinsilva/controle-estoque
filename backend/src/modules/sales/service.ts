import { Product } from '../products/model.js';
import { createPendingFiscalRecord } from '../nfe/service.js';
import { createSale, getSaleById, listSales } from './repository.js';

type SaleItemInput = {
  productId: string;
  quantity: number;
};

export async function listSalesService() {
  return listSales();
}

export async function getSaleService(id: string) {
  return getSaleById(id);
}

export async function createSaleService(
  items: SaleItemInput[],
  createdBy?: string
) {
  if (!items.length) {
    throw new Error('Sale items are required.');
  }

  const productIds = items.map((item) => item.productId);
  const products = await Product.find({ _id: { $in: productIds } }).exec();
  const productMap = new Map(products.map((product) => [product.id, product]));

  const saleItems = items.map((item) => {
    const product = productMap.get(item.productId);
    if (!product) {
      throw new Error('Product not found.');
    }
    if (!product.active) {
      throw new Error('Product is inactive.');
    }
    if (item.quantity <= 0) {
      throw new Error('Quantity must be greater than zero.');
    }
    if (product.stockQty < item.quantity) {
      throw new Error(`Insufficient stock for SKU ${product.sku}.`);
    }
    return {
      productId: product.id,
      name: product.name,
      sku: product.sku,
      quantity: item.quantity,
      unitPrice: product.price,
      total: product.price * item.quantity
    };
  });

  const total = saleItems.reduce((sum, item) => sum + item.total, 0);

  for (const item of saleItems) {
    await Product.updateOne(
      { _id: item.productId, stockQty: { $gte: item.quantity } },
      { $inc: { stockQty: -item.quantity } }
    ).exec();
  }

  const sale = await createSale({
    items: saleItems,
    total,
    status: 'COMPLETED',
    createdBy
  });

  await createPendingFiscalRecord(sale);

  return sale;
}
