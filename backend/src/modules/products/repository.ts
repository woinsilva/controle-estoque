import { Product } from './model.js';

export async function listProducts() {
  return Product.find().sort({ createdAt: -1 }).exec();
}

export async function getProductById(id: string) {
  return Product.findById(id).exec();
}

export async function createProduct(data: {
  name: string;
  sku: string;
  price: number;
  stockQty: number;
  active: boolean;
}) {
  return Product.create(data);
}

export async function updateProduct(
  id: string,
  data: Partial<{
    name: string;
    sku: string;
    price: number;
    stockQty: number;
    active: boolean;
  }>
) {
  return Product.findByIdAndUpdate(id, data, { new: true }).exec();
}

export async function deleteProduct(id: string) {
  return Product.findByIdAndDelete(id).exec();
}
