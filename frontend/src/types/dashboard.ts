export type DashboardRecentSale = {
  id: string;
  detail: string;
  amount: number;
  createdAt: string;
};

export type DashboardLowStockItem = {
  sku: string;
  name: string;
  qty: number;
};

export type DashboardSummary = {
  lowStock: number;
  salesToday: number;
  pendingOrders: number;
  recentSales: DashboardRecentSale[];
  lowStockItems: DashboardLowStockItem[];
};
