import React, { useState } from 'react';
import { ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useAuth } from '../auth/AuthContext';
import { profileApi } from '../api/profile';
import { NotificationPreferences } from '../types/notifications';
import { toast } from '../utils/toast';
import { haptics } from '../utils/haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SheetHeader } from '../components/SheetHeader';
import Toast from 'react-native-toast-message';
import { useResponsiveLayout } from '../hooks/useResponsiveLayout';

const ITEMS: Array<{
  key: keyof NotificationPreferences;
  title: string;
  description: string;
}> = [
  {
    key: 'statusChanges',
    title: 'Изменения статуса',
    description: 'Когда заказ переходит в новый статус (готовится, в пути, доставлен)',
  },
  {
    key: 'newItems',
    title: 'Новые позиции',
    description: 'Только организатору: кто-то из участников добавил позицию',
  },
  {
    key: 'payments',
    title: 'Оплаты',
    description: 'Отметки об оплате и подтверждения от организатора',
  },
  {
    key: 'deadline',
    title: 'Дедлайн',
    description: 'Напоминание за 5 минут и сообщение об истечении',
  },
];

const DEFAULTS: NotificationPreferences = {
  statusChanges: true,
  newItems: true,
  payments: true,
  deadline: true,
};

export function NotificationSettingsScreen() {
  const { user, setUserLocal } = useAuth();
  const initial = user?.notificationPreferences ?? DEFAULTS;
  const [prefs, setPrefs] = useState<NotificationPreferences>(initial);
  const [busyKey, setBusyKey] = useState<keyof NotificationPreferences | null>(null);
  const { contentMaxWidth } = useResponsiveLayout();

  const toggle = async (key: keyof NotificationPreferences) => {
    const newValue = !prefs[key];
    const prev = prefs[key];
    setPrefs((p) => ({ ...p, [key]: newValue }));
    haptics.light();
    setBusyKey(key);
    try {
      const updated = await profileApi.updateNotificationPrefs({ [key]: newValue });
      if (updated.notificationPreferences) {
        setPrefs((p) => ({ ...p, ...updated.notificationPreferences }));
      }
      if (user && updated.notificationPreferences) {
        setUserLocal({
          ...user,
          notificationPreferences: {
            ...(user.notificationPreferences ?? {}),
            ...updated.notificationPreferences,
          } as NotificationPreferences,
        });
      }
    } catch (e: any) {
      setPrefs((p) => ({ ...p, [key]: prev }));
      toast.error('Не удалось', e?.response?.data?.message);
    } finally {
      setBusyKey(null);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#f5f5f7' }}>
      <View style={styles.headerWrap}>
        <SheetHeader title="Уведомления" />
      </View>
      <ScrollView
        style={styles.scrollAbsolute}
        contentContainerStyle={styles.content}
      >
        <View style={{ maxWidth: contentMaxWidth, width: '100%', alignSelf: 'center' }}>
          <Text style={styles.hint}>
            Управляйте тем, какие push-уведомления хотите получать.
          </Text>
          <View style={styles.card}>
            {ITEMS.map((item, idx) => (
              <View
                key={item.key}
                style={[styles.row, idx < ITEMS.length - 1 && styles.rowDivider]}
              >
                <View style={{ flex: 1, marginRight: 12 }}>
                  <Text style={styles.title}>{item.title}</Text>
                  <Text style={styles.description}>{item.description}</Text>
                </View>
                <Switch
                  value={prefs[item.key]}
                  onValueChange={() => toggle(item.key)}
                  disabled={busyKey === item.key}
                />
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
      <Toast />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f7' },
  content: { padding: 16 },
  hint: { color: '#666', marginBottom: 16, lineHeight: 20 },
  card: { backgroundColor: '#fff', borderRadius: 12, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  rowDivider: { borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  title: { fontSize: 16, fontWeight: '500', marginBottom: 4 },
  description: { color: '#666', fontSize: 13, lineHeight: 18 },
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