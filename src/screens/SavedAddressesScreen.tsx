import React, { useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { savedApi } from '../api/saved';
import { useSavedItems } from '../hooks/useSavedItems';
import { SavedAddress } from '../types/saved';
import { EmptyState } from '../components/EmptyState';
import { PrimaryButton } from '../components/PrimaryButton';
import { toast } from '../utils/toast';
import { haptics } from '../utils/haptics';

const addressApi = {
  list: savedApi.listAddresses,
  create: savedApi.createAddress,
  update: savedApi.updateAddress,
  remove: savedApi.deleteAddress,
};

export function SavedAddressesScreen() {
  const { items, create, update, remove } = useSavedItems<SavedAddress>(addressApi);
  const [editing, setEditing] = useState<SavedAddress | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const openCreate = () => {
    setEditing(null);
    setModalVisible(true);
  };
  const openEdit = (a: SavedAddress) => {
    setEditing(a);
    setModalVisible(true);
  };

  const handleDelete = (a: SavedAddress) => {
    Alert.alert('Удалить адрес?', a.label, [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Удалить',
        style: 'destructive',
        onPress: async () => {
          try {
            await remove(a.id);
            haptics.medium();
          } catch (e: any) {
            toast.error('Не удалось', e?.response?.data?.message);
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={items}
        keyExtractor={(i) => i.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.row}
            onPress={() => openEdit(item)}
            onLongPress={() => handleDelete(item)}
            activeOpacity={0.7}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>{item.label}</Text>
              <Text style={styles.value}>{item.address}</Text>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <EmptyState
            icon="📍"
            title="Адресов пока нет"
            subtitle="Добавьте часто используемые — они появятся при создании заказа"
            ctaTitle="Добавить адрес"
            onCtaPress={openCreate}
          />
        }
      />
      <TouchableOpacity
        style={styles.fab}
        onPress={() => {
          haptics.light();
          openCreate();
        }}
        activeOpacity={0.8}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      <EditAddressModal
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

function EditAddressModal({
  visible,
  initial,
  onClose,
  onSubmit,
}: {
  visible: boolean;
  initial: SavedAddress | null;
  onClose: () => void;
  onSubmit: (data: { label: string; address: string }) => Promise<void>;
}) {
  const [label, setLabel] = useState('');
  const [address, setAddress] = useState('');
  const [busy, setBusy] = useState(false);

  React.useEffect(() => {
    setLabel(initial?.label ?? '');
    setAddress(initial?.address ?? '');
  }, [initial, visible]);

  const submit = async () => {
    if (!label.trim() || !address.trim()) {
      toast.error('Заполните оба поля');
      return;
    }
    setBusy(true);
    try {
      await onSubmit({ label: label.trim(), address: address.trim() });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modal}>
          <Text style={styles.modalTitle}>
            {initial ? 'Изменить адрес' : 'Новый адрес'}
          </Text>
          <TextInput
            style={styles.input}
            placeholder="Название (Дом, Офис)"
            value={label}
            onChangeText={setLabel}
            editable={!busy}
          />
          <TextInput
            style={styles.input}
            placeholder="ул. Ленина, 1"
            value={address}
            onChangeText={setAddress}
            editable={!busy}
          />
          <View style={styles.modalActions}>
            <TouchableOpacity
              style={[styles.modalBtn, styles.cancelBtn]}
              onPress={onClose}
              disabled={busy}
            >
              <Text>Отмена</Text>
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <PrimaryButton title="Сохранить" onPress={submit} busy={busy} />
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f7' },
  list: { padding: 16, paddingBottom: 100, flexGrow: 1 },
  row: { backgroundColor: '#fff', padding: 14, borderRadius: 10, marginBottom: 8 },
  label: { fontSize: 16, fontWeight: '600' },
  value: { fontSize: 14, color: '#666', marginTop: 4 },
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
  modal: {
    backgroundColor: '#fff',
    padding: 20,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  modalTitle: { fontSize: 20, fontWeight: '700', marginBottom: 16 },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
  },
  modalActions: { flexDirection: 'row', gap: 8 },
  modalBtn: { flex: 1, padding: 14, borderRadius: 8, alignItems: 'center' },
  cancelBtn: { backgroundColor: '#f0f0f0' },
});