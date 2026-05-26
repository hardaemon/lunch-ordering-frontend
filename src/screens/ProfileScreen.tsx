import React, { useState } from 'react';
import {
  Platform,
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { AppStackParamList } from '../navigation/RootNavigator';
import { SheetHeader } from '../components/SheetHeader';

type Props = NativeStackScreenProps<AppStackParamList, 'Profile'>;

export function ProfileScreen({ navigation }: Props) {
  const { user, setUserLocal, logout } = useAuth();
  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [busy, setBusy] = useState(false);
  const insets = useSafeAreaInsets();

  const save = async () => {
    if (!name.trim()) {
      toast.error('Имя не может быть пустым');
      return;
    }
    if (!email.trim()) {
      toast.error('Email не может быть пустым');
      return;
    }
    setBusy(true);
    try {
      const payload: { name?: string; email?: string } = {};
      if (name.trim() !== user?.name) payload.name = name.trim();
      if (email.trim() !== user?.email) payload.email = email.trim();
      if (Object.keys(payload).length === 0) {
        toast.info('Нечего сохранять');
        return;
      }
      const updated = await profileApi.updateMe(payload);
      setUserLocal(updated);
      toast.success('Профиль обновлён');
    } catch (e: any) {
      toast.error('Не удалось', e?.response?.data?.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerWrap}>
        <SheetHeader title="Профиль" />
      </View>
      <ScrollView
        style={styles.scrollAbsolute}
        contentContainerStyle={{
          padding: 16,
          paddingTop: 22,
          paddingBottom: insets.bottom + 40,
        }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <Text style={styles.label}>Имя</Text>
          <TextInput
            style={styles.input}
            placeholderTextColor="#999"
            value={name}
            onChangeText={setName}
            editable={!busy}
          />
          <Text style={[styles.label, { marginTop: 16 }]}>Email</Text>
          <TextInput
            style={styles.input}
            placeholderTextColor="#999"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
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
          activeOpacity={0.6}
        >
          <Text style={styles.rowText}>Сохранённые адреса</Text>
          <Text style={styles.rowArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.row}
          onPress={() => navigation.navigate('SavedRestaurants')}
          activeOpacity={0.6}
        >
          <Text style={styles.rowText}>Сохранённые рестораны</Text>
          <Text style={styles.rowArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.row}
          onPress={() => navigation.navigate('ChangePassword')}
          activeOpacity={0.6}
        >
          <Text style={styles.rowText}>Сменить пароль</Text>
          <Text style={styles.rowArrow}>›</Text>
        </TouchableOpacity>

        {Platform.OS !== 'web' && (
          <TouchableOpacity
            style={styles.row}
            onPress={() => navigation.navigate('NotificationSettings')}
            activeOpacity={0.6}
          >
            <Text style={styles.rowText}>Уведомления</Text>
            <Text style={styles.rowArrow}>›</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.row, styles.logoutRow]}
          onPress={logout}
          activeOpacity={0.6}
        >
          <Text style={styles.logoutText}>Выйти</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
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
  scrollAbsolute: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    bottom: 0,
  },
  card: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  label: { fontSize: 13, color: '#666', marginBottom: 6 },
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