import mongoose, { Schema } from 'mongoose';

export type ProductDocument = {
  name: string;
  sku: string;
  price: number;
  stockQty: number;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
};

const productSchema = new Schema<ProductDocument>(
  {
    name: { type: String, required: true, trim: true },
    sku: { type: String, required: true, unique: true, uppercase: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    stockQty: { type: Number, required: true, min: 0 },
    active: { type: Boolean, default: true }
  },
  { timestamps: true }
);

export const Product = mongoose.model<ProductDocument>('Product', productSchema);
