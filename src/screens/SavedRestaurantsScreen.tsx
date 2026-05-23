import React, { useState } from 'react';
import {
  Alert,
  FlatList,
  Keyboard,
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

  const openCreate = () => {
    setEditing(null);
    setModalVisible(true);
  };
  const openEdit = (r: SavedRestaurant) => {
    setEditing(r);
    setModalVisible(true);
  };

  const handleDelete = (r: SavedRestaurant) => {
    Alert.alert('Удалить ресторан?', r.name, [
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
      <FlatList
        style={styles.listAbsolute}
        data={items}
        keyExtractor={(i) => i.id}
        contentContainerStyle={isEmpty ? styles.listEmpty : styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.row}
            onPress={() => openEdit(item)}
            onLongPress={() => handleDelete(item)}
            activeOpacity={0.7}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{item.name}</Text>
              {item.url && (
                <Text style={styles.url} numberOfLines={1}>
                  {item.url}
                </Text>
              )}
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          isLoading ? null : (
            <EmptyState
              icon="🍽️"
              title="Ресторанов пока нет"
              subtitle="Добавьте любимые — они появятся при создании заказа"
              ctaTitle="Добавить ресторан"
              onCtaPress={openCreate}
            />
          )
        }
      />
      <TouchableOpacity
        style={[styles.fab, { bottom: insets.bottom + 20 }]}
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
      />
    </View>
  );
}

function EditRestaurantModal({
  visible,
  initial,
  onClose,
  onSubmit,
}: {
  visible: boolean;
  initial: SavedRestaurant | null;
  onClose: () => void;
  onSubmit: (data: { name: string; url?: string }) => Promise<void>;
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

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.modalOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Pressable style={styles.modalBackdrop} onPress={onClose} />
        <Pressable style={styles.modal} onPress={Keyboard.dismiss}>
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
        </Pressable>
      </KeyboardAvoidingView>
      <Toast />
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f7' },
  headerWrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  listAbsolute: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    bottom: 0,
  },
  list: {
    padding: 16,
    paddingTop: 22,
    paddingBottom: 100,
  },
  listEmpty: {
    flexGrow: 1,
    alignItems: 'center',
    padding: 16,
    paddingTop: 86,
    paddingBottom: 100,
  },
  row: { backgroundColor: '#fff', padding: 14, borderRadius: 10, marginBottom: 8 },
  name: { fontSize: 16, fontWeight: '600', color: '#000' },
  url: { fontSize: 13, color: '#007AFF', marginTop: 4 },
  fab: {
    position: 'absolute',
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
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
});