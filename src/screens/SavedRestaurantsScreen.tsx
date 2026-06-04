import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { savedApi } from '../api/saved';
import { useSavedItems } from '../hooks/useSavedItems';
import { SavedRestaurant } from '../types/saved';
import { EmptyState } from '../components/EmptyState';
import { PrimaryButton } from '../components/PrimaryButton';
import { toast } from '../utils/toast';
import { haptics } from '../utils/haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SheetHeader } from '../components/SheetHeader';
import Toast from 'react-native-toast-message';
import { ModalContent } from '../components/ModalContent';
import { confirm } from '../utils/confirm';
import { useResponsiveLayout } from '../hooks/useResponsiveLayout';

const restaurantApi = {
  list: savedApi.listRestaurants,
  create: savedApi.createRestaurant,
  update: savedApi.updateRestaurant,
  remove: savedApi.deleteRestaurant,
};

export function SavedRestaurantsScreen() {
  const { items, isLoading, create, update, remove } =
    useSavedItems<SavedRestaurant>(restaurantApi);
  const [editing, setEditing] = useState<SavedRestaurant | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const insets = useSafeAreaInsets();
  const { contentMaxWidth, isWide } = useResponsiveLayout();

  const openCreate = () => {
    setEditing(null);
    setModalVisible(true);
  };
  const openEdit = (r: SavedRestaurant) => {
    setEditing(r);
    setModalVisible(true);
  };

  const handleDelete = (r: SavedRestaurant) => {
    confirm('Удалить ресторан?', r.name, [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Удалить',
        style: 'destructive',
        onPress: async () => {
          try {
            await remove(r.id);
            haptics.medium();
          } catch (e: any) {
            toast.error('Не удалось', e?.response?.data?.message);
          }
        },
      },
    ]);
  };

  const isEmpty = items.length === 0;

  return (
    <View style={styles.container}>
      <View style={styles.headerWrap}>
        <SheetHeader title="Сохранённые рестораны" />
      </View>

      <View style={styles.contentArea}>
        {isLoading ? null : isEmpty ? (
          <View style={styles.emptyWrap}>
            <EmptyState
              icon="🍽️"
              title="Ресторанов пока нет"
              subtitle="Добавьте любимые — они появятся при создании заказа"
              ctaTitle="Добавить ресторан"
              onCtaPress={openCreate}
            />
          </View>
        ) : (
          <View style={[styles.list, { maxWidth: contentMaxWidth, alignSelf: 'center' }]}>
            {items.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.row}
                onPress={() => openEdit(item)}
                onLongPress={() => handleDelete(item)}
                activeOpacity={0.7}
              >
                <Text style={styles.name}>{item.name}</Text>
                {item.url && (
                  <Text style={styles.url} numberOfLines={1}>
                    {item.url}
                  </Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      <TouchableOpacity
        style={[
          styles.fab,
          {
            bottom: insets.bottom + 20,
            right: isWide ? (`calc(50% - ${contentMaxWidth! / 2}px + 20px)` as any) : 20,
          },
        ]}
        onPress={() => {
          haptics.light();
          openCreate();
        }}
        activeOpacity={0.8}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      <EditRestaurantModal
        visible={modalVisible}
        initial={editing}
        onClose={() => setModalVisible(false)}
        onSubmit={async (data) => {
          try {
            if (editing) await update(editing.id, data);
            else await create(data);
            haptics.light();
            setModalVisible(false);
          } catch (e: any) {
            toast.error('Не удалось', e?.response?.data?.message);
          }
        }}
        onDelete={
          editing
            ? async () => {
                try {
                  await remove(editing.id);
                  haptics.medium();
                  setModalVisible(false);
                } catch (e: any) {
                  toast.error('Не удалось', e?.response?.data?.message);
                }
              }
            : undefined
        }
      />
      <Toast />
    </View>
  );
}

function EditRestaurantModal({
  visible,
  initial,
  onClose,
  onSubmit,
  onDelete,
}: {
  visible: boolean;
  initial: SavedRestaurant | null;
  onClose: () => void;
  onSubmit: (data: { name: string; url?: string }) => Promise<void>;
  onDelete?: () => void;
}) {
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [busy, setBusy] = useState(false);

  React.useEffect(() => {
    setName(initial?.name ?? '');
    setUrl(initial?.url ?? '');
  }, [initial, visible]);

  const submit = async () => {
    if (!name.trim()) {
      toast.error('Введите название');
      return;
    }
    setBusy(true);
    try {
      await onSubmit({ name: name.trim(), url: url.trim() || undefined });
    } finally {
      setBusy(false);
    }
  };

  const handleDeletePress = () => {
    if (!onDelete) return;
    confirm('Удалить ресторан?', name, [
      { text: 'Отмена', style: 'cancel' },
      { text: 'Удалить', style: 'destructive', onPress: onDelete },
    ]);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.modalOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Pressable style={styles.modalBackdrop} onPress={onClose} />
        <ModalContent style={styles.modal}>
          <Text style={styles.modalTitle}>
            {initial ? 'Изменить ресторан' : 'Новый ресторан'}
          </Text>
          <TextInput
            style={styles.input}
            placeholder="Sushi Place"
            placeholderTextColor="#999"
            value={name}
            onChangeText={setName}
            editable={!busy}
          />
          <TextInput
            style={styles.input}
            placeholder="https://..."
            placeholderTextColor="#999"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            value={url}
            onChangeText={setUrl}
            editable={!busy}
          />
          <View style={styles.modalActions}>
            <TouchableOpacity
              style={[styles.modalBtn, styles.cancelBtn]}
              onPress={onClose}
              disabled={busy}
            >
              <Text style={styles.cancelBtnText}>Отмена</Text>
            </TouchableOpacity>
            <PrimaryButton
              title="Сохранить"
              onPress={submit}
              busy={busy}
              style={{ flex: 1 }}
            />
          </View>
          {initial && onDelete && (
            <TouchableOpacity
              style={styles.deleteBtn}
              onPress={handleDeletePress}
              disabled={busy}
            >
              <Text style={styles.deleteBtnText}>Удалить ресторан</Text>
            </TouchableOpacity>
          )}
        </ModalContent>
        <Toast />
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f7',
    minHeight: '100%',
  },
  headerWrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  contentArea: {
    flex: 1,
    paddingTop: 50,
    minHeight: '100%',
  },
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 80,
  },
  list: {
    padding: 16,
    paddingTop: 22,
    paddingBottom: 120,
    width: '100%',
  },
  row: {
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 10,
    marginBottom: 8,
    width: '100%',
  },
  name: { fontSize: 16, fontWeight: '600', color: '#000' },
  url: { fontSize: 13, color: '#007AFF', marginTop: 4 },
  fab: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  fabText: { color: '#fff', fontSize: 32, lineHeight: 36, marginTop: -2 },
  modalOverlay: {
    flex: 1,
    width: '100%',
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalBackdrop: { ...StyleSheet.absoluteFillObject },
  modal: {
    backgroundColor: '#fff',
    padding: 20,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
  },
  modalTitle: { fontSize: 20, fontWeight: '700', marginBottom: 16, color: '#000' },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
    color: '#000',
    backgroundColor: '#fff',
  },
  modalActions: { flexDirection: 'row', gap: 8 },
  modalBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  cancelBtn: { backgroundColor: '#f0f0f0' },
  cancelBtnText: { color: '#000', fontSize: 16, fontWeight: '600' },
  deleteBtn: {
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#FF3B30',
  },
  deleteBtnText: { color: '#FF3B30', fontSize: 16, fontWeight: '600' },
});