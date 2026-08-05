import { supabaseRestRequest } from "../lib/supabaseRest";
import { Order, OrderItem, OrderStatus } from "../types/commerce";

type OrderRow = {
  id: string;
  merchant_id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  total: number | string;
  status: OrderStatus;
  created_at: string;
  updated_at: string;
};

type OrderItemRow = {
  id: string;
  order_id: string;
  product_title: string;
  quantity: number;
  unit_price: number | string;
  created_at: string;
};

function toOrderItem(row: OrderItemRow): OrderItem {
  return {
    id: row.id,
    productTitle: row.product_title,
    quantity: row.quantity,
    unitPrice: Number(row.unit_price),
  };
}

function toOrder(row: OrderRow, items: OrderItem[] = []): Order {
  return {
    id: row.id,
    orderNumber: row.order_number,
    customerName: row.customer_name,
    customerEmail: row.customer_email,
    total: Number(row.total),
    status: row.status,
    itemCount: items.reduce((total, item) => total + item.quantity, 0),
    items,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getOrders(accessToken: string): Promise<Order[]> {
  const [rows, itemRows] = await Promise.all([
    supabaseRestRequest<OrderRow[]>(
      "/orders?select=*&order=created_at.desc",
      accessToken
    ),
    supabaseRestRequest<OrderItemRow[]>(
      "/order_items?select=*&order=created_at.asc",
      accessToken
    ),
  ]);

  const itemsByOrder = new Map<string, OrderItem[]>();

  itemRows.forEach((row) => {
    const items = itemsByOrder.get(row.order_id) ?? [];
    items.push(toOrderItem(row));
    itemsByOrder.set(row.order_id, items);
  });

  return rows.map((row) => toOrder(row, itemsByOrder.get(row.id) ?? []));
}

export async function getOrderById(
  id: string,
  accessToken: string
): Promise<Order> {
  const [rows, itemRows] = await Promise.all([
    supabaseRestRequest<OrderRow[]>(
      `/orders?id=eq.${encodeURIComponent(id)}&select=*&limit=1`,
      accessToken
    ),
    supabaseRestRequest<OrderItemRow[]>(
      `/order_items?order_id=eq.${encodeURIComponent(id)}&select=*&order=created_at.asc`,
      accessToken
    ),
  ]);

  const order = rows[0];

  if (!order) {
    throw new Error("Order not found.");
  }

  return toOrder(order, itemRows.map(toOrderItem));
}

export async function updateOrderStatus(
  id: string,
  status: OrderStatus,
  accessToken: string
): Promise<Order> {
  const rows = await supabaseRestRequest<OrderRow[]>(
    `/orders?id=eq.${encodeURIComponent(id)}&select=*`,
    accessToken,
    {
      method: "PATCH",
      headers: {
        Prefer: "return=representation",
      },
      body: JSON.stringify({ status }),
    }
  );

  const order = rows[0];

  if (!order) {
    throw new Error("Order status could not be updated.");
  }

  const itemRows = await supabaseRestRequest<OrderItemRow[]>(
    `/order_items?order_id=eq.${encodeURIComponent(id)}&select=*&order=created_at.asc`,
    accessToken
  );

  return toOrder(order, itemRows.map(toOrderItem));
}
