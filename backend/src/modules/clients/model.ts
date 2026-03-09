import mongoose, { Schema } from 'mongoose';

export type ClientDocument = {
  fullName: string;
  email: string;
  phone: string;
  birthDate?: Date;
  notes?: string;
  active: boolean;
  userId?: string;
  createdAt: Date;
  updatedAt: Date;
};

const clientSchema = new Schema<ClientDocument>(
  {
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, required: true, trim: true },
    birthDate: { type: Date },
    notes: { type: String, trim: true },
    active: { type: Boolean, default: true },
    userId: { type: String, index: true }
  },
  { timestamps: true }
);

clientSchema.index({ phone: 1 }, { unique: true });
clientSchema.index({ email: 1 }, { unique: true, sparse: true });
clientSchema.index({ fullName: 1 });

export const Client = mongoose.model<ClientDocument>('Client', clientSchema);
