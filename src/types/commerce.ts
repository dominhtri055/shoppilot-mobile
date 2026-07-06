export type ProductStatus = "active" | "draft" | "archived";

export type Product = {
    id: string;
    title: string;
    vendor: string;
    price: number;
    inventory: number;
    status: ProductStatus;
    tag: string[];
    updateAt: string;
}

export type OrderStatus = 
| "pending"
| "paid"
| "packed"
| "shipped"
| "delivered"
| "refunded";

export type Order = {
    id: string;
    customerName: string;
    total: number;
    status: OrderStatus;
    itemCount: number;
    createAt: string;
}

export type DashboardMetrics ={
    revenueToday: number;
    openOrders: number;
    lowStockProducts: number;
    conversionRate: number;
}

export type RevenuePoint ={
    label: string;
    value: string;
}