import mongoose, { Schema } from 'mongoose';

export type ServiceDocument = {
  name: string;
  description?: string;
  durationMinutes: number;
  price: number;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
};

const serviceSchema = new Schema<ServiceDocument>(
  {
    name: { type: String, required: true, trim: true, index: true },
    description: { type: String, trim: true },
    durationMinutes: { type: Number, required: true, min: 5 },
    price: { type: Number, required: true, min: 0 },
    active: { type: Boolean, default: true, index: true }
  },
  { timestamps: true }
);

export const BusinessService = mongoose.model<ServiceDocument>('Service', serviceSchema);
