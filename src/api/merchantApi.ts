import {
  dashboardMetrics,
  orders,
  revenuePoints,
} from "../data/mockData";
import {
  DashboardMetrics,
  Order,
  OrderStatus,
  RevenuePoint,
} from "../types/commerce";

function delay(ms = 450): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  await delay();
  return dashboardMetrics;
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
