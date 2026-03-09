import type { Request, Response } from 'express';
import { getReportsSummaryService } from './service.js';

function parseDateParam(value: unknown, mode: 'start' | 'end') {
  if (typeof value !== 'string' || !value.trim()) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value.trim())) {
    if (mode === 'start') date.setHours(0, 0, 0, 0);
    else date.setHours(23, 59, 59, 999);
  }
  return date;
}

function parseNumberParam(value: unknown) {
  if (value === undefined || value === null || value === '') return undefined;
  const parsed = Number(value);
  if (Number.isNaN(parsed)) return null;
  return parsed;
}

function parseBooleanParam(value: unknown) {
  if (value === undefined || value === null || value === '') return undefined;
  const normalized = String(value).trim().toLowerCase();
  if (normalized === 'true' || normalized === '1') return true;
  if (normalized === 'false' || normalized === '0') return false;
  return null;
}

function parseTextParam(value: unknown) {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : undefined;
}

export async function getReportsSummaryController(req: Request, res: Response) {
  const productStockFrom = parseNumberParam(req.query.productsStockFrom);
  const productStockTo = parseNumberParam(req.query.productsStockTo);
  const productPriceFrom = parseNumberParam(req.query.productsPriceFrom);
  const productPriceTo = parseNumberParam(req.query.productsPriceTo);
  const salesValueFrom = parseNumberParam(req.query.salesValueFrom);
  const salesValueTo = parseNumberParam(req.query.salesValueTo);
  const clientsActive = parseBooleanParam(req.query.clientsActive);
  const salesDateFrom = parseDateParam(req.query.salesDateFrom, 'start');
  const salesDateTo = parseDateParam(req.query.salesDateTo, 'end');
  const appointmentsDateFrom = parseDateParam(req.query.appointmentsDateFrom, 'start');
  const appointmentsDateTo = parseDateParam(req.query.appointmentsDateTo, 'end');
  const appointmentsStatus = parseTextParam(req.query.appointmentsStatus) as
    | 'SCHEDULED'
    | 'IN_PROGRESS'
    | 'COMPLETED'
    | 'CANCELED'
    | undefined;
  const validAppointmentStatuses = new Set(['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELED']);

  const hasInvalidNumber =
    [productStockFrom, productStockTo, productPriceFrom, productPriceTo, salesValueFrom, salesValueTo].some(
      (item) => item === null
    );
  const hasInvalidDate = [salesDateFrom, salesDateTo, appointmentsDateFrom, appointmentsDateTo].some(
    (item) => item === null
  );
  if (hasInvalidNumber || hasInvalidDate || clientsActive === null) {
    return res.status(400).json({ error: 'Invalid query params.' });
  }
  if (appointmentsStatus && !validAppointmentStatuses.has(appointmentsStatus)) {
    return res.status(400).json({ error: 'Invalid appointments status.' });
  }
  if (salesDateFrom && salesDateTo && salesDateFrom > salesDateTo) {
    return res.status(400).json({ error: 'Invalid sales date range.' });
  }
  if (appointmentsDateFrom && appointmentsDateTo && appointmentsDateFrom > appointmentsDateTo) {
    return res.status(400).json({ error: 'Invalid appointments date range.' });
  }

  const summary = await getReportsSummaryService({
    products: {
      name: parseTextParam(req.query.productsName),
      stock: { from: productStockFrom ?? undefined, to: productStockTo ?? undefined },
      price: { from: productPriceFrom ?? undefined, to: productPriceTo ?? undefined }
    },
    sales: {
      date: { dateFrom: salesDateFrom ?? undefined, dateTo: salesDateTo ?? undefined },
      value: { from: salesValueFrom ?? undefined, to: salesValueTo ?? undefined },
      clientId: parseTextParam(req.query.salesClientId)
    },
    clients: {
      active: clientsActive ?? undefined,
      name: parseTextParam(req.query.clientsName),
      email: parseTextParam(req.query.clientsEmail),
      phone: parseTextParam(req.query.clientsPhone)
    },
    appointments: {
      date: { dateFrom: appointmentsDateFrom ?? undefined, dateTo: appointmentsDateTo ?? undefined },
      status: appointmentsStatus,
      clientId: parseTextParam(req.query.appointmentsClientId)
    }
  });
  return res.status(200).json(summary);
}
