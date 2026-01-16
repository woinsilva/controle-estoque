import {
  createProduct,
  deleteProduct,
  getProductById,
  listProducts,
  updateProduct
} from './repository.js';

type ProductInput = {
  name: string;
  sku: string;
  price: number;
  stockQty: number;
  active: boolean;
};

export async function listProductsService() {
  return listProducts();
}

export async function getProductService(id: string) {
  return getProductById(id);
}

export async function createProductService(input: ProductInput) {
  return createProduct(input);
}

export async function updateProductService(id: string, input: Partial<ProductInput>) {
  return updateProduct(id, input);
}

export async function deleteProductService(id: string) {
  return deleteProduct(id);
}
