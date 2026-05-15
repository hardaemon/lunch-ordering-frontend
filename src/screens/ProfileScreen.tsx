import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuth } from '../auth/AuthContext';
import { profileApi } from '../api/profile';
import { PrimaryButton } from '../components/PrimaryButton';
import { toast } from '../utils/toast';
import type { AppStackParamList } from '../navigation/RootNavigator';

type Props = NativeStackScreenProps<AppStackParamList, 'Profile'>;

export function ProfileScreen({ navigation }: Props) {
  const { user, setUserLocal, logout } = useAuth();
  const [name, setName] = useState(user?.name ?? '');
  const [busy, setBusy] = useState(false);

  const save = async () => {
    if (!name.trim()) {
      toast.error('Имя не может быть пустым');
      return;
    }
    setBusy(true);
    try {
      const updated = await profileApi.updateMe({ name: name.trim() });
      setUserLocal(updated);
      toast.success('Профиль обновлён');
    } catch (e: any) {
      toast.error('Не удалось', e?.response?.data?.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
    >
      <View style={styles.card}>
        <Text style={styles.label}>Email</Text>
        <Text style={styles.email}>{user?.email}</Text>

        <Text style={[styles.label, { marginTop: 16 }]}>Имя</Text>
        <TextInput
          style={styles.input}
          placeholderTextColor="#999"
          value={name}
          onChangeText={setName}
          editable={!busy}
        />

        <PrimaryButton
          title="Сохранить"
          onPress={save}
          busy={busy}
          style={{ marginTop: 20 }}
        />
      </View>

      <TouchableOpacity
        style={styles.row}
        onPress={() => navigation.navigate('SavedAddresses')}
      >
        <Text style={styles.rowText}>Сохранённые адреса</Text>
        <Text style={styles.rowArrow}>›</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.row}
        onPress={() => navigation.navigate('SavedRestaurants')}
      >
        <Text style={styles.rowText}>Сохранённые рестораны</Text>
        <Text style={styles.rowArrow}>›</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.row}
        onPress={() => navigation.navigate('NotificationSettings')}
      >
        <Text style={styles.rowText}>Уведомления</Text>
        <Text style={styles.rowArrow}>›</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.row, styles.logoutRow]} onPress={logout}>
        <Text style={styles.logoutText}>Выйти</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f7' },
  content: { padding: 16 },
  card: { backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 16 },
  label: { fontSize: 13, color: '#666', marginBottom: 6 },
  email: { fontSize: 16, color: '#000' },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#000',
    backgroundColor: '#fff',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  rowText: { fontSize: 16, color: '#000' },
  rowArrow: { fontSize: 24, color: '#999' },
  logoutRow: { marginTop: 24, justifyContent: 'center' },
  logoutText: { color: '#FF3B30', fontSize: 16, fontWeight: '600' },
});