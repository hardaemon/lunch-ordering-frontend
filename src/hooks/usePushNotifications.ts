import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { useNavigation } from '@react-navigation/native';
import { notificationsApi } from '../api/notifications';
import { useAuth } from '../auth/AuthContext';

// Поведение, когда уведомление приходит, а приложение открыто
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export function usePushNotifications() {
  const { user } = useAuth();
  const navigation = useNavigation<any>();
  const registeredTokenRef = useRef<string | null>(null);

  // Регистрация токена при логине
  useEffect(() => {
    if (!user) return;

    (async () => {
      const token = await registerForPushNotificationsAsync();
      if (!token) return;
      try {
        await notificationsApi.registerToken(
          token,
          Platform.OS === 'ios' ? 'ios' : 'android',
        );
        registeredTokenRef.current = token;
      } catch (e) {
        // ignore
      }
    })();
  }, [user]);

  // Обработка нажатия на уведомление
  useEffect(() => {
    const responseSub = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const data = response.notification.request.content.data as any;
        if (data?.orderId) {
          navigation.navigate('OrderRoom', { orderId: data.orderId });
        }
      },
    );
    return () => {
      responseSub.remove();
    };
  }, [navigation]);
}

async function registerForPushNotificationsAsync(): Promise<string | null> {
  if (!Device.isDevice) {
    console.warn('Push notifications work only on physical devices');
    return null;
  }

  // Android: канал нужно создать заранее
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('orders', {
      name: 'Заказы',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#007AFF',
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') {
    console.warn('Push permission not granted');
    return null;
  }

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId;

  try {
    const tokenResp = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined,
    );
    return tokenResp.data;
  } catch (e) {
    console.error('Failed to get push token', e);
    return null;
  }
}