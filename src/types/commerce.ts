export type ProductStatus = "active" | "draft" | "archived";

export type Product = {
  id: string;
  title: string;
  vendor: string;
  price: number;
  inventory: number;
  status: ProductStatus;
  tags: string[];
  imagePath: string | null;
  updatedAt: string;
};

export type OrderStatus =
  | "pending"
  | "paid"
  | "packed"
  | "shipped"
  | "delivered"
  | "refunded";

export type OrderItem = {
  id: string;
  productTitle: string;
  quantity: number;
  unitPrice: number;
};

export type Order = {
  id: string;
  orderNumber?: string;
  customerName: string;
  customerEmail?: string;
  total: number;
  status: OrderStatus;
  itemCount: number;
  items?: OrderItem[];
  createdAt: string;
  updatedAt?: string;
};

export type DashboardMetrics = {
  revenueToday: number;
  openOrders: number;
  lowStockProducts: number;
  conversionRate: number;
};

export type RevenuePoint = {
  label: string;
  value: number;
};
