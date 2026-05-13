import { useCallback, useEffect, useRef, useState } from 'react';
import { Socket } from 'socket.io-client';
import { ordersApi } from '../api/orders';
import { getSocket } from '../api/socket';
import { Order, OrderItem, OrderParticipant } from '../types/order';

const EVENTS = {
  PARTICIPANT_JOINED: 'participant.joined',
  ITEM_ADDED: 'item.added',
  ITEM_UPDATED: 'item.updated',
  ITEM_DELETED: 'item.deleted',
  ORDER_UPDATED: 'order.updated',
  PAYMENT_MARKED: 'payment.marked',
  PAYMENT_CONFIRMED: 'payment.confirmed',
} as const;

export type OrderRoomState = {
  order: Order | null;
  isLoading: boolean;
  error: string | null;
  isConnected: boolean;
};

export function useOrderRoom(orderId: string) {
  const [state, setState] = useState<OrderRoomState>({
    order: null,
    isLoading: true,
    error: null,
    isConnected: false,
  });
  const socketRef = useRef<Socket | null>(null);

  // Перезагрузка заказа полностью (после реконнекта или вручную)
  const reload = useCallback(async () => {
    try {
      const order = await ordersApi.getOne(orderId);
      setState((s) => ({ ...s, order, isLoading: false, error: null }));
    } catch (e: any) {
      setState((s) => ({
        ...s,
        isLoading: false,
        error: e?.response?.data?.message || e?.message || 'Failed to load order',
      }));
    }
  }, [orderId]);

  useEffect(() => {
    let cancelled = false;
    let socket: Socket | null = null;

    (async () => {
      await reload();
      if (cancelled) return;

      try {
        socket = await getSocket();
      } catch {
        return;
      }
      socketRef.current = socket;

      const subscribe = () => {
        socket?.emit('order:subscribe', { orderId });
      };

      const onConnect = () => {
        setState((s) => ({ ...s, isConnected: true }));
        subscribe();
        // На случай пропущенных событий — перезагружаем
        reload();
      };

      const onDisconnect = () => {
        setState((s) => ({ ...s, isConnected: false }));
      };

      const onParticipantJoined = ({ participant }: { participant: OrderParticipant }) => {
        setState((s) => {
          if (!s.order) return s;
          if (s.order.participants.some((p) => p.id === participant.id)) return s;
          return {
            ...s,
            order: { ...s.order, participants: [...s.order.participants, participant] },
          };
        });
      };

      const onItemAdded = ({ item }: { item: OrderItem }) => {
        setState((s) => {
          if (!s.order) return s;
          if (s.order.items.some((i) => i.id === item.id)) return s;
          return {
            ...s,
            order: { ...s.order, items: [...s.order.items, item] },
          };
        });
      };

      const onItemUpdated = ({ item }: { item: OrderItem }) => {
        setState((s) => {
          if (!s.order) return s;
          return {
            ...s,
            order: {
              ...s.order,
              items: s.order.items.map((i) => (i.id === item.id ? item : i)),
            },
          };
        });
      };

      const onItemDeleted = ({ itemId }: { itemId: string }) => {
        setState((s) => {
          if (!s.order) return s;
          return {
            ...s,
            order: {
              ...s.order,
              items: s.order.items.filter((i) => i.id !== itemId),
            },
          };
        });
      };

      const onOrderUpdated = ({ order }: { order: Order }) => {
        setState((s) => ({ ...s, order }));
      };

      const onPaymentChanged = ({ participant }: { participant: OrderParticipant }) => {
        setState((s) => {
          if (!s.order) return s;
          return {
            ...s,
            order: {
              ...s.order,
              participants: s.order.participants.map((p) =>
                p.id === participant.id ? participant : p,
              ),
            },
          };
        });
      };

      socket.on('connect', onConnect);
      socket.on('disconnect', onDisconnect);
      socket.on(EVENTS.PARTICIPANT_JOINED, onParticipantJoined);
      socket.on(EVENTS.ITEM_ADDED, onItemAdded);
      socket.on(EVENTS.ITEM_UPDATED, onItemUpdated);
      socket.on(EVENTS.ITEM_DELETED, onItemDeleted);
      socket.on(EVENTS.ORDER_UPDATED, onOrderUpdated);
      socket.on(EVENTS.PAYMENT_MARKED, onPaymentChanged);
      socket.on(EVENTS.PAYMENT_CONFIRMED, onPaymentChanged);

      // Если уже подключены — подписываемся сразу
      if (socket.connected) {
        setState((s) => ({ ...s, isConnected: true }));
        subscribe();
      }

      // Cleanup
      return () => {
        socket?.off('connect', onConnect);
        socket?.off('disconnect', onDisconnect);
        socket?.off(EVENTS.PARTICIPANT_JOINED, onParticipantJoined);
        socket?.off(EVENTS.ITEM_ADDED, onItemAdded);
        socket?.off(EVENTS.ITEM_UPDATED, onItemUpdated);
        socket?.off(EVENTS.ITEM_DELETED, onItemDeleted);
        socket?.off(EVENTS.ORDER_UPDATED, onOrderUpdated);
        socket?.off(EVENTS.PAYMENT_MARKED, onPaymentChanged);
        socket?.off(EVENTS.PAYMENT_CONFIRMED, onPaymentChanged);
        socket?.emit('order:unsubscribe', { orderId });
      };
    })();

    return () => {
      cancelled = true;
    };
  }, [orderId, reload]);

  return { ...state, reload };
}