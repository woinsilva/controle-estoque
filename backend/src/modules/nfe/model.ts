import mongoose, { Schema } from 'mongoose';

export type FiscalRecordStatus = 'PENDING' | 'AUTHORIZED' | 'DENIED' | 'CANCELED' | 'ERROR';

export type FiscalRecordDocument = {
  saleId: string;
  status: FiscalRecordStatus;
  payload: Record<string, unknown>;
  response?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
};

const fiscalRecordSchema = new Schema<FiscalRecordDocument>(
  {
    saleId: { type: String, required: true, index: true },
    status: {
      type: String,
      enum: ['PENDING', 'AUTHORIZED', 'DENIED', 'CANCELED', 'ERROR'],
      default: 'PENDING'
    },
    payload: { type: Schema.Types.Mixed, required: true },
    response: { type: Schema.Types.Mixed }
  },
  { timestamps: true }
);

export const FiscalRecord = mongoose.model<FiscalRecordDocument>('FiscalRecord', fiscalRecordSchema);
