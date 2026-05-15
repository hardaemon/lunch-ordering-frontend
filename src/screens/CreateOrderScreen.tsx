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
import DateTimePicker from '@react-native-community/datetimepicker';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ordersApi } from '../api/orders';
import { savedApi } from '../api/saved';
import { SavedAddress, SavedRestaurant } from '../types/saved';
import { PrimaryButton } from '../components/PrimaryButton';
import { toast } from '../utils/toast';
import { haptics } from '../utils/haptics';
import type { AppStackParamList } from '../navigation/RootNavigator';

type Props = NativeStackScreenProps<AppStackParamList, 'CreateOrder'>;

export function CreateOrderScreen({ navigation }: Props) {
  const [restaurantName, setRestaurantName] = useState('');
  const [restaurantUrl, setRestaurantUrl] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryCost, setDeliveryCost] = useState('0');
  const [freeThreshold, setFreeThreshold] = useState('');
  const [deadline, setDeadline] = useState(new Date(Date.now() + 30 * 60 * 1000));
  const [showPicker, setShowPicker] = useState(false);
  const [busy, setBusy] = useState(false);

  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [savedRestaurants, setSavedRestaurants] = useState<SavedRestaurant[]>([]);

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

  const onChangeDate = (event: any, selected?: Date) => {
    if (Platform.OS === 'android') setShowPicker(false);
    if (selected) setDeadline(selected);
  };

  return (
    <ScrollView
      style={styles.container}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
    >
      <View style={styles.form}>
        {savedRestaurants.length > 0 && (
          <View style={styles.chipsBlock}>
            <Text style={styles.chipsLabel}>Из сохранённых:</Text>
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

        <Text style={styles.label}>Ресторан *</Text>
        <TextInput
          style={styles.input}
          placeholder="Sushi Place"
          placeholderTextColor="#999"
          value={restaurantName}
          onChangeText={setRestaurantName}
          editable={!busy}
        />

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

        {savedAddresses.length > 0 && (
          <View style={styles.chipsBlock}>
            <Text style={styles.chipsLabel}>Из сохранённых:</Text>
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

        <Text style={styles.label}>Адрес доставки *</Text>
        <TextInput
          style={styles.input}
          placeholder="ул. Ленина, 1"
          placeholderTextColor="#999"
          value={deliveryAddress}
          onChangeText={setDeliveryAddress}
          editable={!busy}
        />

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
        <TouchableOpacity
          style={styles.input}
          onPress={() => setShowPicker(true)}
          disabled={busy}
        >
          <Text style={{ color: '#000' }}>
            {deadline.toLocaleString('ru-RU', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </TouchableOpacity>
        {showPicker && (
          <DateTimePicker
            value={deadline}
            mode="datetime"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={onChangeDate}
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
  form: { padding: 16 },
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