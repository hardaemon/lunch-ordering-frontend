import React, { useEffect, useState } from 'react';
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import DateTimePicker, {
  DateTimePickerAndroid,
} from '@react-native-community/datetimepicker';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ordersApi } from '../api/orders';
import { savedApi } from '../api/saved';
import { SavedAddress, SavedRestaurant } from '../types/saved';
import { PrimaryButton } from '../components/PrimaryButton';
import { toast } from '../utils/toast';
import { haptics } from '../utils/haptics';
import type { AppStackParamList } from '../navigation/RootNavigator';
import { formatDateTime } from '../utils/formatters';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useResponsiveLayout } from '../hooks/useResponsiveLayout';

type Props = NativeStackScreenProps<AppStackParamList, 'CreateOrder'>;

function toDatetimeLocalString(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function CreateOrderScreen({ navigation }: Props) {
  const [restaurantName, setRestaurantName] = useState('');
  const [restaurantUrl, setRestaurantUrl] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryCost, setDeliveryCost] = useState('0');
  const [freeThreshold, setFreeThreshold] = useState('');
  const [deadline, setDeadline] = useState(() => {
    const d = new Date(Date.now() + 30 * 60 * 1000);
    d.setSeconds(0, 0);
    return d;
  });
  const [showIosPicker, setShowIosPicker] = useState(false);
  const [busy, setBusy] = useState(false);
  const insets = useSafeAreaInsets();
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [savedRestaurants, setSavedRestaurants] = useState<SavedRestaurant[]>([]);
  const { contentMaxWidth, horizontalPadding } = useResponsiveLayout();

  useEffect(() => {
    savedApi.listAddresses().then(setSavedAddresses).catch(() => {});
    savedApi.listRestaurants().then(setSavedRestaurants).catch(() => {});
  }, []);

  const submit = async () => {
    if (!restaurantName.trim() || !deliveryAddress.trim()) {
      toast.error('Заполните название ресторана и адрес доставки');
      return;
    }
    const deliveryCostNum = parseFloat(deliveryCost.replace(',', '.')) || 0;
    if (deliveryCostNum < 0) {
      toast.error('Стоимость доставки не может быть отрицательной');
      return;
    }
    let freeThresholdNum: number | undefined;
    if (freeThreshold.trim()) {
      const parsed = parseFloat(freeThreshold.replace(',', '.'));
      if (isNaN(parsed) || parsed < 0) {
        toast.error('Неверный порог бесплатной доставки');
        return;
      }
      freeThresholdNum = parsed;
    }
    if (deadline.getTime() <= Date.now()) {
      toast.error('Дедлайн должен быть в будущем');
      return;
    }

    setBusy(true);
    try {
      const order = await ordersApi.create({
        restaurantName: restaurantName.trim(),
        restaurantUrl: restaurantUrl.trim() || undefined,
        deliveryAddress: deliveryAddress.trim(),
        deliveryCost: deliveryCostNum,
        freeDeliveryThreshold: freeThresholdNum,
        deadlineAt: deadline.toISOString(),
      });
      haptics.success();
      navigation.replace('OrderRoom', { orderId: order.id });
    } catch (e: any) {
      const msg =
        e?.response?.data?.message || e?.message || 'Не удалось создать заказ';
      toast.error('Ошибка', String(msg));
    } finally {
      setBusy(false);
    }
  };

  const openDeadlinePicker = () => {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: deadline,
        mode: 'date',
        minimumDate: new Date(),
        onChange: (_, selectedDate) => {
          if (!selectedDate) return;
          DateTimePickerAndroid.open({
            value: selectedDate,
            mode: 'time',
            is24Hour: true,
            onChange: (_, selectedTime) => {
              if (!selectedTime) return;
              const combined = new Date(selectedDate);
              combined.setHours(selectedTime.getHours());
              combined.setMinutes(selectedTime.getMinutes());
              combined.setSeconds(0, 0);
              setDeadline(combined);
            },
          });
        },
      });
    } else {
      setShowIosPicker(true);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{
        paddingBottom: insets.bottom + 40,
        paddingHorizontal: horizontalPadding,
        alignItems: 'center',
      }}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
    >
      <View style={[styles.form, { maxWidth: contentMaxWidth, width: '100%' }]}>
        <Text style={styles.label}>Ресторан *</Text>
        <TextInput
          style={styles.input}
          placeholder="Sushi Place"
          placeholderTextColor="#999"
          value={restaurantName}
          onChangeText={setRestaurantName}
          editable={!busy}
        />

        {savedRestaurants.length > 0 && (
          <View style={styles.chipsBlock}>
            <Text style={styles.chipsLabel}>Сохранённые:</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chips}
            >
              {savedRestaurants.map((r) => (
                <TouchableOpacity
                  key={r.id}
                  style={styles.chip}
                  onPress={() => {
                    setRestaurantName(r.name);
                    setRestaurantUrl(r.url ?? '');
                  }}
                >
                  <Text style={styles.chipText}>{r.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        <Text style={styles.label}>Ссылка на меню</Text>
        <TextInput
          style={styles.input}
          placeholder="https://..."
          placeholderTextColor="#999"
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
          value={restaurantUrl}
          onChangeText={setRestaurantUrl}
          editable={!busy}
        />

        <Text style={styles.label}>Адрес доставки *</Text>
        <TextInput
          style={styles.input}
          placeholder="ул. Ленина, 1"
          placeholderTextColor="#999"
          value={deliveryAddress}
          onChangeText={setDeliveryAddress}
          editable={!busy}
        />

        {savedAddresses.length > 0 && (
          <View style={styles.chipsBlock}>
            <Text style={styles.chipsLabel}>Сохранённые:</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chips}
            >
              {savedAddresses.map((a) => (
                <TouchableOpacity
                  key={a.id}
                  style={styles.chip}
                  onPress={() => setDeliveryAddress(a.address)}
                >
                  <Text style={styles.chipText}>{a.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        <Text style={styles.label}>Стоимость доставки</Text>
        <TextInput
          style={styles.input}
          placeholder="0.00"
          placeholderTextColor="#999"
          keyboardType="decimal-pad"
          value={deliveryCost}
          onChangeText={setDeliveryCost}
          editable={!busy}
        />

        <Text style={styles.label}>Сумма для бесплатной доставки (если есть)</Text>
        <TextInput
          style={styles.input}
          placeholder="например, 50.00"
          placeholderTextColor="#999"
          keyboardType="decimal-pad"
          value={freeThreshold}
          onChangeText={setFreeThreshold}
          editable={!busy}
        />

        <Text style={styles.label}>Дедлайн сбора позиций</Text>
        {Platform.OS === 'web' ? (
          <input
            type="datetime-local"
            value={toDatetimeLocalString(deadline)}
            onChange={(e) => {
              const v = (e.target as HTMLInputElement).value;
              if (!v) return;
              const d = new Date(v);
              d.setSeconds(0, 0);
              setDeadline(d);
            }}
            min={toDatetimeLocalString(new Date())}
            style={{
              borderWidth: 1,
              borderStyle: 'solid',
              borderColor: '#ddd',
              borderRadius: 8,
              padding: 14,
              fontSize: 16,
              backgroundColor: '#fff',
              fontFamily: 'inherit',
              width: '100%',
              boxSizing: 'border-box',
            } as any}
          />
        ) : (
          <TouchableOpacity
            style={styles.input}
            onPress={openDeadlinePicker}
            disabled={busy}
          >
            <Text style={{ color: '#000' }}>{formatDateTime(deadline)}</Text>
          </TouchableOpacity>
        )}

        {showIosPicker && Platform.OS === 'ios' && (
          <DateTimePicker
            value={deadline}
            mode="datetime"
            display="spinner"
            onChange={(_, selected) => {
              if (selected) {
                const cleaned = new Date(selected);
                cleaned.setSeconds(0, 0);
                setDeadline(cleaned);
              }
            }}
            minimumDate={new Date()}
          />
        )}

        <PrimaryButton
          title="Создать заказ"
          onPress={submit}
          busy={busy}
          style={{ marginTop: 24 }}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  form: { paddingVertical: 16 },
  label: { fontSize: 14, fontWeight: '500', marginTop: 12, marginBottom: 6, color: '#000' },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 14,
    fontSize: 16,
    color: '#000',
    backgroundColor: '#fff',
  },
  chipsBlock: { marginTop: 12 },
  chipsLabel: { fontSize: 12, color: '#666', marginBottom: 6 },
  chips: { gap: 8, paddingRight: 8 },
  chip: {
    backgroundColor: '#E8F0FE',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 8,
  },
  chipText: { color: '#007AFF', fontWeight: '500' },
});