import { Order, OrderStatus, Product } from "@/types/commerce";

export function isLowStock(product: Product):boolean{
    return product.inventory> 0 && product.inventory <=5;

}

export function isOutOfStock(product:Product):boolean{
    return product.inventory === 0
}

export function getNextOrderStatus(status:OrderStatus):OrderStatus{
    const flow: OrderStatus[] = [
        "pending",
        "paid",
        "packed",
        "shipped",
        "delivered",
    ];

    const currentIndex = flow.indexOf(status);

    if( currentIndex === -1 || currentIndex  === flow.length -1){
        return status
    }

    return flow[currentIndex + 1];
}