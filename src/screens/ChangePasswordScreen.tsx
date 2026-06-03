import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { profileApi } from '../api/profile';
import { PrimaryButton } from '../components/PrimaryButton';
import { toast } from '../utils/toast';
import { haptics } from '../utils/haptics';
import type { AppStackParamList } from '../navigation/RootNavigator';
import { SheetHeader } from '../components/SheetHeader';
import Toast from 'react-native-toast-message';

type Props = NativeStackScreenProps<AppStackParamList, 'ChangePassword'>;

export function ChangePasswordScreen({ navigation }: Props) {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!current || !next || !confirm) {
      toast.error('Заполните все поля');
      return;
    }
    if (next.length < 8) {
      toast.error('Новый пароль должен быть не менее 8 символов');
      return;
    }
    if (next !== confirm) {
      toast.error('Пароли не совпадают');
      return;
    }
    if (next === current) {
      toast.error('Новый пароль совпадает со старым');
      return;
    }

    setBusy(true);
    try {
      await profileApi.changePassword(current, next);
      haptics.success();
      toast.success('Пароль обновлён');
      navigation.goBack();
    } catch (e: any) {
      toast.error(
        'Не удалось',
        e?.response?.data?.message || 'Попробуйте ещё раз',
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#f5f5f7' }}>
      <View style={styles.headerWrap}>
        <SheetHeader title="Смена пароля" />
      </View>
      <ScrollView
        style={styles.scrollAbsolute}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        <View style={styles.card}>
          <Text style={styles.label}>Текущий пароль</Text>
          <TextInput
            style={styles.input}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            value={current}
            onChangeText={setCurrent}
            editable={!busy}
            placeholderTextColor="#999"
          />

          <Text style={[styles.label, { marginTop: 16 }]}>Новый пароль</Text>
          <TextInput
            style={styles.input}
            placeholder="Минимум 8 символов"
            placeholderTextColor="#999"
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            value={next}
            onChangeText={setNext}
            editable={!busy}
          />

          <Text style={[styles.label, { marginTop: 16 }]}>Подтвердите новый</Text>
          <TextInput
            style={styles.input}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            value={confirm}
            onChangeText={setConfirm}
            editable={!busy}
            placeholderTextColor="#999"
          />

          <PrimaryButton
            title="Сменить пароль"
            onPress={submit}
            busy={busy}
            style={{ marginTop: 20 }}
          />
        </View>
      </ScrollView>
      <Toast />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f7' },
  content: { padding: 16 },
  card: { backgroundColor: '#fff', padding: 16, borderRadius: 12 },
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
});