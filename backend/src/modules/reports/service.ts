import { Product } from '../products/model.js';
import { Sale } from '../sales/model.js';
import { Client } from '../clients/model.js';
import { Appointment } from '../appointments/model.js';

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

type DateRange = {
  dateFrom?: Date;
  dateTo?: Date;
};

type NumericRange = {
  from?: number;
  to?: number;
};

export type ReportsFilters = {
  products: {
    name?: string;
    stock?: NumericRange;
    price?: NumericRange;
  };
  sales: {
    date?: DateRange;
    value?: NumericRange;
    clientId?: string;
  };
  clients: {
    active?: boolean;
    name?: string;
    email?: string;
    phone?: string;
  };
  appointments: {
    date?: DateRange;
    status?: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELED';
    clientId?: string;
  };
};

function applyDateRange(field: string, range?: DateRange) {
  const value: { $gte?: Date; $lte?: Date } = {};
  if (range?.dateFrom) value.$gte = range.dateFrom;
  if (range?.dateTo) value.$lte = range.dateTo;
  return Object.keys(value).length ? { [field]: value } : {};
}

function applyNumberRange(field: string, range?: NumericRange) {
  const value: { $gte?: number; $lte?: number } = {};
  if (typeof range?.from === 'number') value.$gte = range.from;
  if (typeof range?.to === 'number') value.$lte = range.to;
  return Object.keys(value).length ? { [field]: value } : {};
}

export type ReportsSummary = {
  products: {
    total: number;
    active: number;
    inactive: number;
    lowStock: number;
    inventoryValue: number;
    lowStockItems: Array<{ id: string; name: string; sku: string; stockQty: number; price: number }>;
  };
  sales: {
    total: number;
    totalRevenue: number;
    averageTicket: number;
    byStatus: Array<{ status: string; count: number }>;
    recent: Array<{ id: string; total: number; status: string; createdAt: string; itemsCount: number }>;
  };
  clients: {
    total: number;
    active: number;
    inactive: number;
    createdInPeriod: number;
    recent: Array<{ id: string; fullName: string; phone: string; email?: string; createdAt: string; active: boolean }>;
  };
  appointments: {
    total: number;
    upcoming: number;
    byStatus: Array<{ status: string; count: number }>;
    recent: Array<{
      id: string;
      scheduledAt: string;
      status: string;
      clientId: string;
      clientName: string;
      createdAt: string;
    }>;
  };
};

function buildProductQuery(filters: ReportsFilters['products']) {
  const query: Record<string, unknown> = {
    ...applyNumberRange('stockQty', filters.stock),
    ...applyNumberRange('price', filters.price)
  };
  const name = (filters.name || '').trim();
  if (name) {
    query.name = { $regex: escapeRegex(name), $options: 'i' };
  }
  return query;
}

function buildSalesQuery(filters: ReportsFilters['sales']) {
  const query: Record<string, unknown> = {
    ...applyDateRange('createdAt', filters.date),
    ...applyNumberRange('total', filters.value)
  };
  if (filters.clientId) query.clientId = filters.clientId;
  return query;
}

function buildClientsQuery(filters: ReportsFilters['clients']) {
  const query: Record<string, unknown> = {};
  if (typeof filters.active === 'boolean') {
    query.active = filters.active;
  }
  const name = (filters.name || '').trim();
  const email = (filters.email || '').trim();
  const phone = (filters.phone || '').trim();
  if (name) query.fullName = { $regex: escapeRegex(name), $options: 'i' };
  if (email) query.email = { $regex: escapeRegex(email), $options: 'i' };
  if (phone) query.phone = { $regex: escapeRegex(phone), $options: 'i' };
  return query;
}

function buildAppointmentsQuery(filters: ReportsFilters['appointments']) {
  const query: Record<string, unknown> = {
    ...applyDateRange('scheduledAt', filters.date)
  };
  if (filters.status) query.status = filters.status;
  if (filters.clientId) query.clientId = filters.clientId;
  return query;
}

export async function getReportsSummaryService(filters: ReportsFilters): Promise<ReportsSummary> {
  const productsQuery = buildProductQuery(filters.products);
  const salesQuery = buildSalesQuery(filters.sales);
  const clientsQuery = buildClientsQuery(filters.clients);
  const appointmentsQuery = buildAppointmentsQuery(filters.appointments);

  const [
    totalProducts,
    activeProducts,
    inactiveProducts,
    lowStockProducts,
    inventoryValueAgg,
    filteredProductsRaw,
    totalSales,
    revenueAgg,
    salesByStatusRaw,
    recentSalesRaw,
    totalClients,
    activeClients,
    inactiveClients,
    createdClientsInPeriod,
    recentClientsRaw,
    totalAppointments,
    upcomingAppointments,
    appointmentsByStatusRaw,
    recentAppointmentsRaw
  ] = await Promise.all([
    Product.countDocuments(productsQuery).exec(),
    Product.countDocuments({ ...productsQuery, active: true }).exec(),
    Product.countDocuments({ ...productsQuery, active: false }).exec(),
    Product.countDocuments({ ...productsQuery, stockQty: { $lte: 5 } }).exec(),
    Product.aggregate([
      { $match: productsQuery },
      { $group: { _id: null, value: { $sum: { $multiply: ['$price', '$stockQty'] } } } }
    ]).exec(),
    Product.find(productsQuery).sort({ createdAt: -1 }).limit(50).lean().exec(),
    Sale.countDocuments(salesQuery).exec(),
    Sale.aggregate([{ $match: salesQuery }, { $group: { _id: null, value: { $sum: '$total' } } }]).exec(),
    Sale.aggregate([{ $match: salesQuery }, { $group: { _id: '$status', count: { $sum: 1 } } }]).exec(),
    Sale.find(salesQuery).sort({ createdAt: -1 }).limit(50).lean().exec(),
    Client.countDocuments(clientsQuery).exec(),
    Client.countDocuments({ ...clientsQuery, active: true }).exec(),
    Client.countDocuments({ ...clientsQuery, active: false }).exec(),
    Client.countDocuments(clientsQuery).exec(),
    Client.find(clientsQuery).sort({ createdAt: -1 }).limit(50).lean().exec(),
    Appointment.countDocuments(appointmentsQuery).exec(),
    Appointment.countDocuments({
      ...appointmentsQuery,
      scheduledAt: {
        ...((appointmentsQuery as { scheduledAt?: { $gte?: Date; $lte?: Date } }).scheduledAt || {}),
        $gte: new Date()
      },
      status: { $in: ['SCHEDULED', 'IN_PROGRESS'] }
    }).exec(),
    Appointment.aggregate([{ $match: appointmentsQuery }, { $group: { _id: '$status', count: { $sum: 1 } } }]).exec(),
    Appointment.find(appointmentsQuery).sort({ scheduledAt: -1 }).limit(50).lean().exec()
  ]);

  const clientIds = Array.from(new Set(recentAppointmentsRaw.map((item) => item.clientId))).filter(Boolean);
  const clientsForAppointments = clientIds.length
    ? await Client.find({ _id: { $in: clientIds } }).select('_id fullName').lean().exec()
    : [];
  const clientNameById = new Map(clientsForAppointments.map((client) => [String(client._id), client.fullName]));

  return {
    products: {
      total: totalProducts,
      active: activeProducts,
      inactive: inactiveProducts,
      lowStock: lowStockProducts,
      inventoryValue: Number(inventoryValueAgg[0]?.value || 0),
      lowStockItems: filteredProductsRaw.map((item) => ({
        id: String(item._id),
        name: item.name,
        sku: item.sku,
        stockQty: item.stockQty,
        price: item.price
      }))
    },
    sales: {
      total: totalSales,
      totalRevenue: Number(revenueAgg[0]?.value || 0),
      averageTicket: totalSales > 0 ? Number(revenueAgg[0]?.value || 0) / totalSales : 0,
      byStatus: salesByStatusRaw.map((item) => ({ status: String(item._id), count: Number(item.count) })),
      recent: recentSalesRaw.map((item) => ({
        id: String(item._id),
        total: item.total,
        status: item.status,
        createdAt: item.createdAt.toISOString(),
        itemsCount: Array.isArray(item.items) ? item.items.length : 0
      }))
    },
    clients: {
      total: totalClients,
      active: activeClients,
      inactive: inactiveClients,
      createdInPeriod: createdClientsInPeriod,
      recent: recentClientsRaw.map((item) => ({
        id: String(item._id),
        fullName: item.fullName,
        phone: item.phone,
        email: item.email,
        createdAt: item.createdAt.toISOString(),
        active: item.active
      }))
    },
    appointments: {
      total: totalAppointments,
      upcoming: upcomingAppointments,
      byStatus: appointmentsByStatusRaw.map((item) => ({ status: String(item._id), count: Number(item.count) })),
      recent: recentAppointmentsRaw.map((item) => ({
        id: String(item._id),
        scheduledAt: item.scheduledAt.toISOString(),
        status: item.status,
        clientId: item.clientId,
        clientName: clientNameById.get(item.clientId) || item.clientId,
        createdAt: item.createdAt.toISOString()
      }))
    }
  };
}
