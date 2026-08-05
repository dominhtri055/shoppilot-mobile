import {
  Order,
  OrderStatus,
  RevenuePoint,
} from "../types/commerce";

const REVENUE_STATUSES = new Set<OrderStatus>([
  "paid",
  "packed",
  "shipped",
  "delivered",
]);

export type RevenueSummary = {
  weeklyRevenue: number;
  averageOrderValue: number;
  revenueOrderCount: number;
  deliveredOrderCount: number;
};

function startOfDay(value: Date) {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
}

function isRevenueOrder(order: Order) {
  return REVENUE_STATUSES.has(order.status);
}

export function buildWeeklyRevenue(
  orders: Order[],
  today = new Date()
): RevenuePoint[] {
  const currentDay = startOfDay(today);

  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(currentDay);
    date.setDate(currentDay.getDate() - (6 - index));

    return {
      date,
      label: date.toLocaleDateString(undefined, {
        weekday: "short",
      }),
      value: 0,
    };
  });

  const pointsByDate = new Map(
    days.map((day) => [day.date.getTime(), day])
  );

  orders
    .filter(isRevenueOrder)
    .forEach((order) => {
      const createdAt = new Date(order.createdAt);

      if (Number.isNaN(createdAt.getTime())) {
        return;
      }

      const orderDate = startOfDay(createdAt).getTime();
      const point = pointsByDate.get(orderDate);

      if (point) {
        point.value += order.total;
      }
    });

  return days.map(({ label, value }) => ({
    label,
    value: Number(value.toFixed(2)),
  }));
}

export function getWeeklyRevenueSummary(
  orders: Order[],
  today = new Date()
): RevenueSummary {
  const startDate = startOfDay(today);
  startDate.setDate(startDate.getDate() - 6);

  const endDate = startOfDay(today);
  endDate.setDate(endDate.getDate() + 1);

  const revenueOrders = orders.filter((order) => {
    if (!isRevenueOrder(order)) {
      return false;
    }

    const createdAt = new Date(order.createdAt);

    return (
      !Number.isNaN(createdAt.getTime()) &&
      createdAt >= startDate &&
      createdAt < endDate
    );
  });

  const weeklyRevenue = revenueOrders.reduce(
    (total, order) => total + order.total,
    0
  );

  return {
    weeklyRevenue,
    averageOrderValue:
      revenueOrders.length > 0
        ? weeklyRevenue / revenueOrders.length
        : 0,
    revenueOrderCount: revenueOrders.length,
    deliveredOrderCount: revenueOrders.filter(
      (order) => order.status === "delivered"
    ).length,
  };
}