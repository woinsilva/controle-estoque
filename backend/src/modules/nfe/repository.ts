import { FiscalRecord } from './model.js';

export async function createFiscalRecord(data: {
  saleId: string;
  payload: Record<string, unknown>;
}) {
  return FiscalRecord.create({
    saleId: data.saleId,
    payload: data.payload,
    status: 'PENDING'
  });
}

export async function updateFiscalRecord(
  saleId: string,
  data: Partial<{ status: string; response: Record<string, unknown> }>
) {
  return FiscalRecord.findOneAndUpdate({ saleId }, data, { new: true }).exec();
}

export async function getFiscalRecordBySaleId(saleId: string) {
  return FiscalRecord.findOne({ saleId }).exec();
}
