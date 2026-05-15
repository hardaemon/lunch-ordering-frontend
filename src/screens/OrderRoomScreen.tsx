import React, { useState } from 'react';
import {
  Alert,
  FlatList,
  Keyboard,
  Modal,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Animated, { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated';
import * as Clipboard from 'expo-clipboard';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useOrderRoom } from '../hooks/useOrderRoom';
import { ordersApi } from '../api/orders';
import { useAuth } from '../auth/AuthContext';
import {
  ORDER_STATUS_LABELS,
  OrderItem as OrderItemType,
  OrderStatus,
  NEXT_STATUS,
} from '../types/order';
import {
  formatMoney,
  itemSubtotal,
  ordersTotal,
  parseMoney,
  userDeliveryShare,
  userGrandTotal,
  userSubtotal,
} from '../utils/orderMath';
import { OrderRoomSkeleton } from '../components/OrderRoomSkeleton';
import { PrimaryButton } from '../components/PrimaryButton';
import { toast } from '../utils/toast';
import { haptics } from '../utils/haptics';
import type { AppStackParamList } from '../navigation/RootNavigator';

type Props = NativeStackScreenProps<AppStackParamList, 'OrderRoom'>;

export function OrderRoomScreen({ route }: Props) {
  const { orderId } = route.params;
  const { user } = useAuth();
  const { order, isLoading, error, reload } = useOrderRoom(orderId);

  const [addModalVisible, setAddModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  if (isLoading) {
    return <OrderRoomSkeleton />;
  }

  if (error || !order) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error || 'Заказ не найден'}</Text>
        <PrimaryButton
          title="Повторить"
          onPress={reload}
          style={{ paddingHorizontal: 32 }}
        />
      </View>
    );
  }

  const isOwner = order.ownerId === user!.id;
  const me = order.participants.find((p) => p.userId === user!.id);
  const isParticipant = !!me;
  const canEdit =
    order.status === OrderStatus.COLLECTING &&
    new Date(order.deadlineAt).getTime() > Date.now();

  const myItems = order.items.filter((i) => i.addedById === user!.id);
  const visibleItems = isOwner ? order.items : myItems;

  const total = ordersTotal(order);
  const mySubtotal = userSubtotal(order, user!.id);
  const myDelivery = userDeliveryShare(order, user!.id);
  const myGrand = userGrandTotal(order, user!.id);

  const handleRefresh = async () => {
    setRefreshing(true);
    await reload();
    setRefreshing(false);
  };

  const handleCopyLink = async () => {
    const link = `grouporder://order/${order.id}`;
    await Clipboard.setStringAsync(link);
    haptics.light();
    toast.success('Ссылка скопирована');
  };

  const handleAdvanceStatus = async () => {
    const next = NEXT_STATUS[order.status];
    if (!next) return;
    try {
      await ordersApi.update(order.id, { status: next });
      haptics.success();
    } catch (e: any) {
      haptics.error();
      toast.error('Не удалось', e?.response?.data?.message);
    }
  };

  const handleToggleOrdered = async (item: OrderItemType) => {
    haptics.light();
    try {
      await ordersApi.updateItem(item.id, { isOrdered: !item.isOrdered });
    } catch (e: any) {
      toast.error('Не удалось', e?.response?.data?.message);
    }
  };

  const handleDeleteItem = async (item: OrderItemType) => {
    Alert.alert('Удалить позицию?', item.name, [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Удалить',
        style: 'destructive',
        onPress: async () => {
          try {
            await ordersApi.deleteItem(item.id);
            haptics.medium();
          } catch (e: any) {
            toast.error('Не удалось', e?.response?.data?.message);
          }
        },
      },
    ]);
  };

  const handleMarkPaid = async () => {
    try {
      await ordersApi.markPaid(order.id);
      haptics.success();
      toast.success('Оплата отмечена');
    } catch (e: any) {
      toast.error('Не удалось', e?.response?.data?.message);
    }
  };

  const handleConfirmPayment = async (participantUserId: string) => {
    try {
      await ordersApi.confirmPayment(order.id, participantUserId);
      haptics.success();
    } catch (e: any) {
      toast.error('Не удалось', e?.response?.data?.message);
    }
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={visibleItems}
        keyExtractor={(i) => i.id}
        renderItem={({ item }) => (
          <ItemRow
            item={item}
            isOwner={isOwner}
            isMine={item.addedById === user!.id}
            canEdit={canEdit}
            onToggleOrdered={() => handleToggleOrdered(item)}
            onDelete={() => handleDeleteItem(item)}
          />
        )}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        ListHeaderComponent={
          <View>
            <View style={styles.header}>
              <View style={styles.statusRow}>
                <Text style={styles.statusBadge}>
                  {ORDER_STATUS_LABELS[order.status]}
                </Text>
              </View>
              <Text style={styles.title}>{order.restaurantName}</Text>
              <Text style={styles.subtitle}>{order.deliveryAddress}</Text>
              <Text style={styles.meta}>
                Дедлайн: {new Date(order.deadlineAt).toLocaleString('ru-RU')}
              </Text>
              {parseMoney(order.deliveryCost) > 0 && (
                <Text style={styles.meta}>
                  Доставка: {formatMoney(parseMoney(order.deliveryCost))}
                  {order.freeDeliveryThreshold &&
                    ` (бесплатно от ${formatMoney(parseMoney(order.freeDeliveryThreshold))})`}
                </Text>
              )}
            </View>

            <View style={styles.actionsRow}>
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={handleCopyLink}
                activeOpacity={0.7}
              >
                <Text
                  style={styles.actionBtnText}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                >
                  Поделиться
                </Text>
              </TouchableOpacity>
              {isOwner && NEXT_STATUS[order.status] && (
                <TouchableOpacity
                  style={[styles.actionBtn, styles.primaryBtn]}
                  onPress={handleAdvanceStatus}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[styles.actionBtnText, styles.primaryBtnText]}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                  >
                    {ORDER_STATUS_LABELS[NEXT_STATUS[order.status]!]}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.summary}>
              <Text style={styles.summaryRow}>
                Моя сумма: {formatMoney(mySubtotal)}
              </Text>
              {myDelivery > 0 && (
                <Text style={styles.summaryRow}>
                  Моя доля доставки: {formatMoney(myDelivery)}
                </Text>
              )}
              <Text style={styles.summaryGrand}>
                Итого: {formatMoney(myGrand)}
              </Text>
              {isOwner && (
                <Text style={styles.summaryMeta}>
                  Общая сумма заказа: {formatMoney(total)}
                </Text>
              )}
            </View>

            {isParticipant && me && !me.hasPaid && mySubtotal > 0 && (
              <PrimaryButton
                title="Я перевёл деньги"
                onPress={handleMarkPaid}
                variant="success"
                style={{ marginBottom: 12 }}
              />
            )}
            {me?.hasPaid && (
              <View style={styles.paidBadge}>
                <Text style={styles.paidText}>
                  ✓ Оплата отмечена
                  {me.paymentConfirmedAt
                    ? ' · подтверждено организатором'
                    : ' · ожидает подтверждения'}
                </Text>
              </View>
            )}

            <Text style={styles.sectionTitle}>
              {isOwner ? 'Все позиции' : 'Мои позиции'} ({visibleItems.length})
            </Text>
          </View>
        }
        ListEmptyComponent={
          <Text style={styles.emptyText}>Позиций пока нет</Text>
        }
        ListFooterComponent={
          isOwner ? (
            <ParticipantsBlock
              order={order}
              currentUserId={user!.id}
              onConfirmPayment={handleConfirmPayment}
            />
          ) : null
        }
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
      />

      {canEdit && isParticipant && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => {
            haptics.light();
            setAddModalVisible(true);
          }}
          activeOpacity={0.8}
        >
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>
      )}

      <AddItemModal
        visible={addModalVisible}
        onClose={() => setAddModalVisible(false)}
        orderId={order.id}
      />
    </View>
  );
}

// ============== Компоненты-помощники ==============

function ItemRow({
  item,
  isOwner,
  isMine,
  canEdit,
  onToggleOrdered,
  onDelete,
}: {
  item: OrderItemType;
  isOwner: boolean;
  isMine: boolean;
  canEdit: boolean;
  onToggleOrdered: () => void;
  onDelete: () => void;
}) {
  const subtotal = itemSubtotal(item);
  return (
    <Animated.View
      entering={FadeIn.duration(250)}
      exiting={FadeOut.duration(200)}
      layout={LinearTransition.springify()}
      style={styles.itemCard}
    >
      <View style={styles.itemRow}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.itemName, item.isOrdered && styles.itemOrdered]}>
            {item.name}
          </Text>
          <Text style={styles.itemMeta}>
            {formatMoney(parseMoney(item.pricePerUnit))} × {item.quantity} ={' '}
            {formatMoney(subtotal)}
          </Text>
          {isOwner && item.addedBy && (
            <Text style={styles.itemAuthor}>добавил: {item.addedBy.name}</Text>
          )}
        </View>
        <View style={styles.itemActions}>
          {isOwner && (
            <TouchableOpacity
              style={[styles.tickBtn, item.isOrdered && styles.tickBtnActive]}
              onPress={onToggleOrdered}
            >
              <Text
                style={[
                  styles.tickText,
                  item.isOrdered && styles.tickTextActive,
                ]}
              >
                ✓
              </Text>
            </TouchableOpacity>
          )}
          {(isMine || isOwner) && canEdit && (
            <TouchableOpacity onPress={onDelete} style={styles.deleteBtn}>
              <Text style={styles.deleteText}>×</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Animated.View>
  );
}

function ParticipantsBlock({
  order,
  currentUserId,
  onConfirmPayment,
}: {
  order: any;
  currentUserId: string;
  onConfirmPayment: (userId: string) => void;
}) {
  return (
    <View style={styles.participantsBlock}>
      <Text style={styles.sectionTitle}>
        Участники ({order.participants.length})
      </Text>
      {order.participants.map((p: any) => {
        const isMe = p.userId === currentUserId;
        const sub = userSubtotal(order, p.userId);
        const delivery = userDeliveryShare(order, p.userId);
        const grand = userGrandTotal(order, p.userId);
        return (
          <View key={p.id} style={styles.participantRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.participantName}>
                {p.user?.name || '...'} {isMe && '(вы)'}
              </Text>
              <Text style={styles.participantSub}>
                {formatMoney(sub)} + {formatMoney(delivery)} ={' '}
                <Text style={{ fontWeight: '600' }}>{formatMoney(grand)}</Text>
              </Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              {p.hasPaid ? (
                p.paymentConfirmedAt ? (
                  <Text style={styles.confirmedText}>✓ подтверждено</Text>
                ) : (
                  <TouchableOpacity
                    style={styles.confirmBtn}
                    onPress={() => onConfirmPayment(p.userId)}
                  >
                    <Text style={styles.confirmBtnText}>Подтвердить</Text>
                  </TouchableOpacity>
                )
              ) : (
                <Text style={styles.unpaidText}>не оплачено</Text>
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
}

function AddItemModal({
  visible,
  onClose,
  orderId,
}: {
  visible: boolean;
  onClose: () => void;
  orderId: string;
}) {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [busy, setBusy] = useState(false);

  const reset = () => {
    setName('');
    setPrice('');
    setQuantity('1');
  };

  const submit = async () => {
    const priceNum = parseFloat(price.replace(',', '.'));
    const qtyNum = parseInt(quantity, 10);
    if (
      !name.trim() ||
      isNaN(priceNum) ||
      priceNum < 0 ||
      isNaN(qtyNum) ||
      qtyNum < 1
    ) {
      toast.error('Заполните все поля корректно');
      return;
    }
    setBusy(true);
    try {
      await ordersApi.addItem(orderId, {
        name: name.trim(),
        pricePerUnit: priceNum,
        quantity: qtyNum,
      });
      haptics.light();
      reset();
      onClose();
    } catch (e: any) {
      toast.error('Не удалось', e?.response?.data?.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.modalOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Pressable style={styles.modalBackdrop} onPress={onClose} />
        <Pressable style={styles.modal} onPress={Keyboard.dismiss}>
          <Text style={styles.modalTitle}>Добавить позицию</Text>
          <TextInput
            style={styles.input}
            placeholder="Название"
            placeholderTextColor="#999"
            value={name}
            onChangeText={setName}
            editable={!busy}
          />
          <TextInput
            style={styles.input}
            placeholder="Цена за единицу"
            placeholderTextColor="#999"
            keyboardType="decimal-pad"
            value={price}
            onChangeText={setPrice}
            editable={!busy}
          />
          <TextInput
            style={styles.input}
            placeholder="Количество"
            placeholderTextColor="#999"
            keyboardType="number-pad"
            value={quantity}
            onChangeText={setQuantity}
            editable={!busy}
          />
          <View style={styles.modalActions}>
            <TouchableOpacity
              style={[styles.modalBtn, styles.cancelBtn]}
              onPress={() => {
                reset();
                onClose();
              }}
              disabled={busy}
            >
              <Text style={styles.cancelBtnText}>Отмена</Text>
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <PrimaryButton title="Добавить" onPress={submit} busy={busy} />
            </View>
          </View>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f7' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  errorText: { color: '#FF3B30', marginBottom: 16, textAlign: 'center' },
  header: { backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 12 },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statusBadge: {
    backgroundColor: '#007AFF',
    color: '#fff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 12,
    fontWeight: '600',
    overflow: 'hidden',
  },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 4, color: '#000' },
  subtitle: { color: '#666', marginBottom: 4 },
  meta: { fontSize: 13, color: '#999', marginTop: 2 },
  actionsRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  actionBtn: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  actionBtnText: { color: '#007AFF', fontWeight: '600' },
  primaryBtn: { backgroundColor: '#007AFF' },
  primaryBtnText: { color: '#fff' },
  summary: { backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 12 },
  summaryRow: { fontSize: 15, marginBottom: 4, color: '#000' },
  summaryGrand: { fontSize: 18, fontWeight: '700', marginTop: 8, color: '#000' },
  summaryMeta: { fontSize: 13, color: '#999', marginTop: 8 },
  paidBadge: { backgroundColor: '#E8F5E9', padding: 12, borderRadius: 8, marginBottom: 12 },
  paidText: { color: '#2E7D32', textAlign: 'center' },
  sectionTitle: { fontSize: 17, fontWeight: '600', marginTop: 8, marginBottom: 8, color: '#000' },
  emptyText: { textAlign: 'center', color: '#999', padding: 24 },
  itemCard: { backgroundColor: '#fff', padding: 14, borderRadius: 10, marginBottom: 8 },
  itemRow: { flexDirection: 'row', alignItems: 'center' },
  itemName: { fontSize: 16, fontWeight: '500', color: '#000' },
  itemOrdered: { textDecorationLine: 'line-through', color: '#999' },
  itemMeta: { color: '#666', marginTop: 2 },
  itemAuthor: { fontSize: 12, color: '#999', marginTop: 2 },
  itemActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  tickBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#ddd',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tickBtnActive: { backgroundColor: '#34C759', borderColor: '#34C759' },
  tickText: { color: '#ddd', fontWeight: '700' },
  tickTextActive: { color: '#fff' },
  deleteBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  deleteText: { fontSize: 24, color: '#FF3B30', lineHeight: 24 },
  participantsBlock: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginTop: 16 },
  participantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  participantName: { fontSize: 15, fontWeight: '500', color: '#000' },
  participantSub: { color: '#666', fontSize: 13, marginTop: 2 },
  confirmBtn: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  confirmBtnText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  confirmedText: { color: '#34C759', fontSize: 13 },
  unpaidText: { color: '#999', fontSize: 13 },
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
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  fabText: { color: '#fff', fontSize: 32, lineHeight: 36, marginTop: -2 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalBackdrop: { ...StyleSheet.absoluteFillObject },
  modal: {
    backgroundColor: '#fff',
    padding: 20,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  modalTitle: { fontSize: 20, fontWeight: '700', marginBottom: 16, color: '#000' },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 14,
    fontSize: 16,
    marginBottom: 12,
    color: '#000',
    backgroundColor: '#fff',
  },
  modalActions: { flexDirection: 'row', gap: 8, marginTop: 8 },
  modalBtn: { flex: 1, padding: 14, borderRadius: 8, alignItems: 'center' },
  cancelBtn: { backgroundColor: '#f0f0f0' },
  cancelBtnText: { color: '#333', fontWeight: '600' },
});