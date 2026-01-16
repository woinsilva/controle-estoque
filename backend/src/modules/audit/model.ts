import mongoose, { Schema } from 'mongoose';

export type AuditDocument = {
  action: string;
  entity: string;
  entityId?: string;
  userId?: string;
  role?: string;
  ip?: string;
  userAgent?: string;
  payload?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
};

const auditSchema = new Schema<AuditDocument>(
  {
    action: { type: String, required: true },
    entity: { type: String, required: true },
    entityId: { type: String },
    userId: { type: String },
    role: { type: String },
    ip: { type: String },
    userAgent: { type: String },
    payload: { type: Schema.Types.Mixed }
  },
  { timestamps: true }
);

export const AuditLog = mongoose.model<AuditDocument>('AuditLog', auditSchema);
