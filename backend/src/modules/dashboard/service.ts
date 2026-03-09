import { Product } from '../products/model.js';
import { Sale } from '../sales/model.js';
import { Appointment } from '../appointments/model.js';

const LOW_STOCK_THRESHOLD = 5;
const RECENT_SALES_LIMIT = 5;
const LOW_STOCK_ITEMS_LIMIT = 5;

export type DashboardSummary = {
  lowStock: number;
  salesToday: number;
  pendingOrders: number;
  recentSales: Array<{
    id: string;
    detail: string;
    amount: number;
    createdAt: string;
  }>;
  lowStockItems: Array<{
    sku: string;
    name: string;
    qty: number;
  }>;
};

function getTodayRange() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start, end };
}

export async function getDashboardSummaryService(): Promise<DashboardSummary> {
  const { start, end } = getTodayRange();

  const [lowStock, salesToday, pendingOrders, recentSalesRaw, lowStockItemsRaw] = await Promise.all([
    Product.countDocuments({ active: true, stockQty: { $lte: LOW_STOCK_THRESHOLD } }).exec(),
    Sale.countDocuments({ createdAt: { $gte: start, $lt: end }, status: { $ne: 'CANCELED' } }).exec(),
    Appointment.countDocuments({ status: { $in: ['SCHEDULED', 'IN_PROGRESS'] } }).exec(),
    Sale.find({ status: { $ne: 'CANCELED' } })
      .sort({ createdAt: -1 })
      .limit(RECENT_SALES_LIMIT)
      .lean()
      .exec(),
    Product.find({ active: true, stockQty: { $lte: LOW_STOCK_THRESHOLD } })
      .sort({ stockQty: 1, updatedAt: -1 })
      .limit(LOW_STOCK_ITEMS_LIMIT)
      .lean()
      .exec()
  ]);

  const recentSales = recentSalesRaw.map((sale) => ({
    id: String(sale._id),
    detail: `${sale.items.length} item(ns) - ${sale.status}`,
    amount: sale.total,
    createdAt: sale.createdAt.toISOString()
  }));

  const lowStockItems = lowStockItemsRaw.map((product) => ({
    sku: product.sku,
    name: product.name,
    qty: product.stockQty
  }));

  return {
    lowStock,
    salesToday,
    pendingOrders,
    recentSales,
    lowStockItems
  };
}
