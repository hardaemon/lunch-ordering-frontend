import React, { useCallback, useState } from 'react';
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ordersApi } from '../api/orders';
import { Order, ORDER_STATUS_LABELS, OrderStatus } from '../types/order';
import { useAuth } from '../auth/AuthContext';
import { OrderListSkeleton } from '../components/OrderListSkeleton';
import { EmptyState } from '../components/EmptyState';
import { toast } from '../utils/toast';
import { haptics } from '../utils/haptics';
import type { AppStackParamList } from '../navigation/RootNavigator';

type Props = NativeStackScreenProps<AppStackParamList, 'OrdersList'>;

const STATUS_COLORS: Record<OrderStatus, string> = {
  [OrderStatus.COLLECTING]: '#007AFF',
  [OrderStatus.PREPARING]: '#FF9500',
  [OrderStatus.ON_THE_WAY]: '#5856D6',
  [OrderStatus.DELIVERED]: '#34C759',
  [OrderStatus.CLOSED]: '#8E8E93',
};

export function OrdersListScreen({ navigation }: Props) {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [tab, setTab] = useState<'active' | 'history'>('active');

  const load = useCallback(async () => {
    try {
      const data = await ordersApi.list();
      setOrders(data);
    } catch (e: any) {
      toast.error('Не удалось загрузить заказы');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const filtered = orders.filter((o) =>
    tab === 'active'
      ? o.status !== OrderStatus.CLOSED
      : o.status === OrderStatus.CLOSED,
  );

  const renderItem = ({ item }: { item: Order }) => {
    const isOwner = item.ownerId === user?.id;
    const date = new Date(item.createdAt).toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('OrderRoom', { orderId: item.id })}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>{item.restaurantName}</Text>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: STATUS_COLORS[item.status] },
            ]}
          >
            <Text style={styles.statusText}>
              {ORDER_STATUS_LABELS[item.status]}
            </Text>
          </View>
        </View>
        <Text style={styles.cardSubtitle}>{item.deliveryAddress}</Text>
        <View style={styles.cardFooter}>
          <Text style={styles.cardMeta}>{date}</Text>
          <Text style={styles.cardMeta}>
            {isOwner ? 'Вы организатор' : 'Участник'} ·{' '}
            {item.participants.length}{' '}
            {item.participants.length === 1 ? 'участник' : 'участников'}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <OrderListSkeleton />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <EmptyState
            icon="🛒"
            title={tab === 'active' ? 'Активных заказов нет' : 'История пуста'}
            subtitle={
              tab === 'active'
                ? 'Создайте новый или присоединитесь по ссылке'
                : 'Завершённые заказы появятся здесь'
            }
            ctaTitle={tab === 'active' ? 'Создать заказ' : undefined}
            onCtaPress={
              tab === 'active'
                ? () => navigation.navigate('CreateOrder')
                : undefined
            }
          />
        }
        ListHeaderComponent={
          <View>
            <View style={styles.header}>
              <Text style={styles.greeting}>Привет, {user?.name}</Text>
              <TouchableOpacity
                style={styles.profileBtn}
                onPress={() => navigation.navigate('Profile')}
              >
                <Text style={styles.profileBtnText}>Профиль</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.tabs}>
              <TouchableOpacity
                style={[styles.tab, tab === 'active' && styles.tabActive]}
                onPress={() => setTab('active')}
              >
                <Text
                  style={[
                    styles.tabText,
                    tab === 'active' && styles.tabTextActive,
                  ]}
                >
                  Активные
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, tab === 'history' && styles.tabActive]}
                onPress={() => setTab('history')}
              >
                <Text
                  style={[
                    styles.tabText,
                    tab === 'history' && styles.tabTextActive,
                  ]}
                >
                  История
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        }
      />
      <TouchableOpacity
        style={styles.fab}
        onPress={() => {
          haptics.light();
          navigation.navigate('CreateOrder');
        }}
        activeOpacity={0.8}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f7' },
  list: { padding: 16, paddingBottom: 100 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  greeting: { fontSize: 22, fontWeight: '700' },
  profileBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#E8F0FE',
  },
  profileBtnText: { color: '#007AFF', fontWeight: '600' },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 4,
    marginBottom: 12,
  },
  tab: { flex: 1, padding: 10, borderRadius: 8, alignItems: 'center' },
  tabActive: { backgroundColor: '#007AFF' },
  tabText: { color: '#666', fontWeight: '500' },
  tabTextActive: { color: '#fff' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  cardTitle: { fontSize: 17, fontWeight: '600', flex: 1, marginRight: 8 },
  cardSubtitle: { color: '#666', marginBottom: 8 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between' },
  cardMeta: { color: '#999', fontSize: 12 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 30,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  fabText: { color: '#fff', fontSize: 32, lineHeight: 36, marginTop: -2 },
});