import { Order, OrderItem } from '../types/order';

export function parseMoney(s: string | null | undefined): number {
  if (!s) return 0;
  const n = parseFloat(s);
  return isNaN(n) ? 0 : n;
}

export function formatMoney(n: number): string {
  return n.toFixed(2);
}

export function itemSubtotal(item: OrderItem): number {
  return parseMoney(item.pricePerUnit) * item.quantity;
}

export function userSubtotal(order: Order, userId: string): number {
  return order.items
    .filter((i) => i.addedById === userId)
    .reduce((sum, i) => sum + itemSubtotal(i), 0);
}

export function ordersTotal(order: Order): number {
  return order.items.reduce((sum, i) => sum + itemSubtotal(i), 0);
}

// Доля доставки участника пропорционально его сумме.
// Если участник ничего не добавил — доставку не платит.
export function userDeliveryShare(order: Order, userId: string): number {
  const total = ordersTotal(order);
  if (total <= 0) return 0;
  const delivery = parseMoney(order.deliveryCost);
  // Бесплатная доставка при достижении порога
  const threshold = parseMoney(order.freeDeliveryThreshold);
  if (threshold > 0 && total >= threshold) return 0;
  const mine = userSubtotal(order, userId);
  return (mine / total) * delivery;
}

export function userGrandTotal(order: Order, userId: string): number {
  return userSubtotal(order, userId) + userDeliveryShare(order, userId);
}