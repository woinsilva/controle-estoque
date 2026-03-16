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
    totalValue: number;
    byStatus: Array<{ status: string; count: number }>;
    recent: Array<{
      id: string;
      scheduledAt: string;
      status: string;
      clientId: string;
      clientName: string;
      createdAt: string;
      totalValue: number;
    }>;
  };
};
