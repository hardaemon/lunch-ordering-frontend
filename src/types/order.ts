export enum OrderStatus {
  COLLECTING = 'collecting',
  CONFIRMING = 'confirming',
  PREPARING = 'preparing',
  ON_THE_WAY = 'on_the_way',
  DELIVERED = 'delivered',
  CLOSED = 'closed',
  CANCELLED = 'cancelled',
  COMPLAINT = 'complaint',
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
  pricePerUnit: string;
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
  [OrderStatus.CONFIRMING]: 'Подтверждение',
  [OrderStatus.PREPARING]: 'Готовится',
  [OrderStatus.ON_THE_WAY]: 'В пути',
  [OrderStatus.DELIVERED]: 'Доставлено',
  [OrderStatus.CLOSED]: 'Закрыт',
  [OrderStatus.CANCELLED]: 'Отменён',
  [OrderStatus.COMPLAINT]: 'Претензии',
};

export const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
  [OrderStatus.COLLECTING]: OrderStatus.CONFIRMING,
  [OrderStatus.CONFIRMING]: OrderStatus.PREPARING,
  [OrderStatus.PREPARING]: OrderStatus.ON_THE_WAY,
  [OrderStatus.ON_THE_WAY]: OrderStatus.DELIVERED,
  [OrderStatus.DELIVERED]: OrderStatus.CLOSED,
};

export const CANCELLABLE_FROM: OrderStatus[] = [
  OrderStatus.COLLECTING,
  OrderStatus.CONFIRMING,
  OrderStatus.PREPARING,
  OrderStatus.ON_THE_WAY,
  OrderStatus.DELIVERED,
  OrderStatus.COMPLAINT,
];

export const COMPLAINT_FROM: OrderStatus[] = [
  OrderStatus.CONFIRMING,
  OrderStatus.PREPARING,
  OrderStatus.ON_THE_WAY,
  OrderStatus.DELIVERED,
];

export const COMPLAINT_RESOLUTIONS: OrderStatus[] = [
  OrderStatus.CONFIRMING,
  OrderStatus.PREPARING,
  OrderStatus.ON_THE_WAY,
  OrderStatus.DELIVERED,
  OrderStatus.CLOSED,
];