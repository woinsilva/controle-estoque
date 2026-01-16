import { AuditLog } from './model.js';

type AuditInput = {
  action: string;
  entity: string;
  entityId?: string;
  userId?: string;
  role?: string;
  ip?: string;
  userAgent?: string;
  payload?: Record<string, unknown>;
};

export async function recordAudit(input: AuditInput) {
  return AuditLog.create(input);
}
