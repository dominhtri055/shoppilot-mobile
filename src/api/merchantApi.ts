import {
  dashboardMetrics,
  orders,
  products,
  revenuePoints,
} from "../data/mockData";
import {
  DashboardMetrics,
  Order,
  OrderStatus,
  Product,
  ProductStatus,
  RevenuePoint,
} from "../types/commerce";

function delay(ms = 450): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function login(email: string, password: string): Promise<boolean> {
  await delay();

  return email.trim().toLowerCase() === "tri.do@example.com" && password === "demo1234";
}

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  await delay();
  return dashboardMetrics;
}

export async function getProducts(): Promise<Product[]> {
  await delay();
  return [...products];
}

export async function getProductById(id: string): Promise<Product> {
  await delay();

  const product = products.find((item) => item.id === id);

  if (!product) {
    throw new Error("Product not found");
  }

  return product;
}

export async function updateProductInventory(
  id: string,
  inventory: number
): Promise<Product> {
  await delay();

  const product = products.find((item) => item.id === id);

  if (!product) {
    throw new Error("Product not found");
  }

  product.inventory = Math.max(0, inventory);
  product.updatedAt = new Date().toISOString();

  return product;
}

export async function updateProductStatus(
  id: string,
  status: ProductStatus
): Promise<Product> {
  await delay();

  const product = products.find((item) => item.id === id);

  if (!product) {
    throw new Error("Product not found");
  }

  product.status = status;
  product.updatedAt = new Date().toISOString();

  return product;
}

export async function getOrders(): Promise<Order[]> {
  await delay();
  return [...orders];
}

export async function getOrderById(id: string): Promise<Order> {
  await delay();

  const order = orders.find((item) => item.id === id);

  if (!order) {
    throw new Error("Order not found");
  }

  return order;
}

export async function updateOrderStatus(
  id: string,
  status: OrderStatus
): Promise<Order> {
  await delay();

  const order = orders.find((item) => item.id === id);

  if (!order) {
    throw new Error("Order not found");
  }

  order.status = status;

  return order;
}

export async function getRevenuePoints(): Promise<RevenuePoint[]> {
  await delay();
  return revenuePoints;
}