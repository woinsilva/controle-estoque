import mongoose, { Schema } from 'mongoose';

export type SaleStatus = 'PENDING' | 'COMPLETED' | 'CANCELED';
export type FiscalStatus = 'PENDING' | 'AUTHORIZED' | 'DENIED' | 'CANCELED' | 'ERROR';

export type SaleItemDocument = {
  productId: string;
  name: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  total: number;
};

export type SaleDocument = {
  items: SaleItemDocument[];
  total: number;
  status: SaleStatus;
  fiscalStatus: FiscalStatus;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
};

const saleItemSchema = new Schema<SaleItemDocument>(
  {
    productId: { type: String, required: true },
    name: { type: String, required: true },
    sku: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 0 }
  },
  { _id: false }
);

const saleSchema = new Schema<SaleDocument>(
  {
    items: { type: [saleItemSchema], required: true },
    total: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ['PENDING', 'COMPLETED', 'CANCELED'],
      default: 'COMPLETED'
    },
    fiscalStatus: {
      type: String,
      enum: ['PENDING', 'AUTHORIZED', 'DENIED', 'CANCELED', 'ERROR'],
      default: 'PENDING'
    },
    createdBy: { type: String }
  },
  { timestamps: true }
);

export const Sale = mongoose.model<SaleDocument>('Sale', saleSchema);
