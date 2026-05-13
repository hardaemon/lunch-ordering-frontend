import { api } from './client';
import { Order, OrderItem, OrderStatus } from '../types/order';

export const ordersApi = {
  list: async (): Promise<Order[]> => {
    const { data } = await api.get<Order[]>('/orders');
    return data;
  },

  getOne: async (id: string): Promise<Order> => {
    const { data } = await api.get<Order>(`/orders/${id}`);
    return data;
  },

  create: async (payload: {
    restaurantName: string;
    restaurantUrl?: string;
    deliveryAddress: string;
    deliveryCost: number;
    freeDeliveryThreshold?: number;
    deadlineAt: string; // ISO
  }): Promise<Order> => {
    const { data } = await api.post<Order>('/orders', payload);
    return data;
  },

  update: async (
    id: string,
    payload: Partial<{
      restaurantName: string;
      restaurantUrl: string;
      deliveryAddress: string;
      deliveryCost: number;
      freeDeliveryThreshold: number;
      deadlineAt: string;
      status: OrderStatus;
    }>,
  ): Promise<Order> => {
    const { data } = await api.patch<Order>(`/orders/${id}`, payload);
    return data;
  },

  remove: async (id: string): Promise<void> => {
    await api.delete(`/orders/${id}`);
  },

  join: async (id: string): Promise<Order> => {
    const { data } = await api.post<Order>(`/orders/${id}/join`);
    return data;
  },

  addItem: async (
    orderId: string,
    payload: { name: string; pricePerUnit: number; quantity: number },
  ): Promise<OrderItem> => {
    const { data } = await api.post<OrderItem>(
      `/orders/${orderId}/items`,
      payload,
    );
    return data;
  },

  updateItem: async (
    itemId: string,
    payload: Partial<{
      name: string;
      pricePerUnit: number;
      quantity: number;
      isOrdered: boolean;
    }>,
  ): Promise<OrderItem> => {
    const { data } = await api.patch<OrderItem>(
      `/orders/items/${itemId}`,
      payload,
    );
    return data;
  },

  deleteItem: async (itemId: string): Promise<void> => {
    await api.delete(`/orders/items/${itemId}`);
  },

  markPaid: async (orderId: string) => {
    await api.post(`/orders/${orderId}/pay`);
  },

  confirmPayment: async (orderId: string, participantUserId: string) => {
    await api.post(
      `/orders/${orderId}/participants/${participantUserId}/confirm-payment`,
    );
  },
};