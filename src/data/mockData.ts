import { DashboardMetrics, Order, Product, RevenuePoint } from "../types/commerce";

export const products: Product[] = [
  {
    id: "prod-001",
    title: "Minimal Cotton Hoodie",
    vendor: "Northline Apparel",
    price: 79.99,
    inventory: 14,
    status: "active",
    tags: ["hoodie", "cotton", "winter"],
    updatedAt: "2026-07-03T10:30:00Z",
  },
  {
    id: "prod-002",
    title: "Everyday Backpack",
    vendor: "Urban Carry",
    price: 119.99,
    inventory: 3,
    status: "active",
    tags: ["bag", "travel", "school"],
    updatedAt: "2026-07-02T15:10:00Z",
  },
  {
    id: "prod-003",
    title: "Ceramic Coffee Set",
    vendor: "Studio Home",
    price: 49.99,
    inventory: 0,
    status: "draft",
    tags: ["home", "coffee", "ceramic"],
    updatedAt: "2026-07-01T09:00:00Z",
  },
  {
    id: "prod-004",
    title: "Performance Running Tee",
    vendor: "Motion Lab",
    price: 34.99,
    inventory: 27,
    status: "active",
    tags: ["fitness", "shirt", "summer"],
    updatedAt: "2026-07-04T12:45:00Z",
  },
];

export const orders: Order[] = [
  {
    id: "ord-1001",
    customerName: "Mia Chen",
    total: 154.98,
    status: "paid",
    itemCount: 2,
    createdAt: "2026-07-05T11:30:00Z",
  },
  {
    id: "ord-1002",
    customerName: "Lucas Martin",
    total: 79.99,
    status: "packed",
    itemCount: 1,
    createdAt: "2026-07-05T09:15:00Z",
  },
  {
    id: "ord-1003",
    customerName: "Ava Nguyen",
    total: 249.97,
    status: "pending",
    itemCount: 4,
    createdAt: "2026-07-04T18:20:00Z",
  },
];

export const dashboardMetrics: DashboardMetrics = {
  revenueToday: 1284.62,
  openOrders: 9,
  lowStockProducts: 2,
  conversionRate: 3.8,
};

export const revenuePoints: RevenuePoint[] = [
  { label: "Mon", value: 720 },
  { label: "Tue", value: 940 },
  { label: "Wed", value: 640 },
  { label: "Thu", value: 1280 },
  { label: "Fri", value: 1560 },
  { label: "Sat", value: 1810 },
  { label: "Sun", value: 1284 },
];