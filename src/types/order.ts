export enum OrderStatus {
  COLLECTING = 'collecting',
  PREPARING = 'preparing',
  ON_THE_WAY = 'on_the_way',
  DELIVERED = 'delivered',
  CLOSED = 'closed',
}

export type PublicUser = {
  id: string;
  email: string;
  name: string;
};

export type OrderParticipant = {
  id: string;
  orderId: string;
  userId: string;
  user?: PublicUser;
  hasPaid: boolean;
  paymentConfirmedAt: string | null;
  joinedAt: string;
};

export type OrderItem = {
  id: string;
  orderId: string;
  addedById: string;
  addedBy?: PublicUser;
  name: string;
  pricePerUnit: string; // decimal приходит строкой
  quantity: number;
  isOrdered: boolean;
  createdAt: string;
  updatedAt: string;
};

export type Order = {
  id: string;
  ownerId: string;
  owner?: PublicUser;
  restaurantName: string;
  restaurantUrl: string | null;
  deliveryAddress: string;
  deliveryCost: string;
  freeDeliveryThreshold: string | null;
  deadlineAt: string;
  status: OrderStatus;
  participants: OrderParticipant[];
  items: OrderItem[];
  createdAt: string;
  updatedAt: string;
};

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  [OrderStatus.COLLECTING]: 'Сбор позиций',
  [OrderStatus.PREPARING]: 'Готовится',
  [OrderStatus.ON_THE_WAY]: 'В пути',
  [OrderStatus.DELIVERED]: 'Доставлено',
  [OrderStatus.CLOSED]: 'Закрыт',
};

// Порядок переходов статусов — следующий статус для кнопки "Дальше"
export const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
  [OrderStatus.COLLECTING]: OrderStatus.PREPARING,
  [OrderStatus.PREPARING]: OrderStatus.ON_THE_WAY,
  [OrderStatus.ON_THE_WAY]: OrderStatus.DELIVERED,
  [OrderStatus.DELIVERED]: OrderStatus.CLOSED,
};