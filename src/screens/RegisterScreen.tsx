import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuth } from '../auth/AuthContext';
import { PrimaryButton } from '../components/PrimaryButton';
import { toast } from '../utils/toast';
import type { AuthStackParamList } from '../navigation/RootNavigator';

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

export function RegisterScreen({ navigation }: Props) {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  const handleRegister = async () => {
    if (!name || !email || !password) {
      toast.error('Заполните все поля');
      return;
    }
    if (password.length < 8) {
      toast.error('Пароль должен быть не менее 8 символов');
      return;
    }
    setBusy(true);
    try {
      await register(email.trim(), password, name.trim());
    } catch (e: any) {
      const msg =
        e?.response?.data?.message ||
        e?.message ||
        'Не удалось зарегистрироваться';
      toast.error('Ошибка регистрации', String(msg));
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.inner}>
        <Text style={styles.title}>Регистрация</Text>

        <TextInput
          style={styles.input}
          placeholder="Имя"
          value={name}
          onChangeText={setName}
          editable={!busy}
        />
        <TextInput
          style={styles.input}
          placeholder="Email"
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          editable={!busy}
        />
        <TextInput
          style={styles.input}
          placeholder="Пароль (мин. 8 символов)"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          editable={!busy}
        />

        <PrimaryButton
          title="Зарегистрироваться"
          onPress={handleRegister}
          busy={busy}
          style={{ marginTop: 8 }}
        />

        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
          <Text style={styles.link}>Уже есть аккаунт? Войти</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  inner: { flex: 1, padding: 24, justifyContent: 'center' },
  title: { fontSize: 28, fontWeight: '700', marginBottom: 24 },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 14,
    marginBottom: 12,
    fontSize: 16,
  },
  link: { textAlign: 'center', marginTop: 16, color: '#007AFF' },
});