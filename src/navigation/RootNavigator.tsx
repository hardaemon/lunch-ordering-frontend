import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as Linking from 'expo-linking';
import { useAuth } from '../auth/AuthContext';
import { usePushNotifications } from '../hooks/usePushNotifications';
import { LoginScreen } from '../screens/LoginScreen';
import { RegisterScreen } from '../screens/RegisterScreen';
import { OrdersListScreen } from '../screens/OrdersListScreen';
import { CreateOrderScreen } from '../screens/CreateOrderScreen';
import { OrderRoomScreen } from '../screens/OrderRoomScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { SavedAddressesScreen } from '../screens/SavedAddressesScreen';
import { SavedRestaurantsScreen } from '../screens/SavedRestaurantsScreen';
import { NotificationSettingsScreen } from '../screens/NotificationSettingsScreen';

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type AppStackParamList = {
  OrdersList: undefined;
  CreateOrder: undefined;
  OrderRoom: { orderId: string };
  Profile: undefined;
  SavedAddresses: undefined;
  SavedRestaurants: undefined;
  NotificationSettings: undefined;
};

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const AppStack = createNativeStackNavigator<AppStackParamList>();

const linking = {
  prefixes: [Linking.createURL('/'), 'grouporder://'],
  config: {
    screens: {
      OrdersList: 'orders',
      CreateOrder: 'orders/new',
      OrderRoom: 'order/:orderId',
      Profile: 'profile',
      SavedAddresses: 'profile/addresses',
      SavedRestaurants: 'profile/restaurants',
      Login: 'login',
      Register: 'register',
      NotificationSettings: 'profile/notifications',
    },
  },
};

function AuthenticatedApp() {
  usePushNotifications();

  return (
    <AppStack.Navigator>
      <AppStack.Screen
        name="OrdersList"
        component={OrdersListScreen}
        options={{ title: 'Мои заказы' }}
      />
      <AppStack.Screen
        name="CreateOrder"
        component={CreateOrderScreen}
        options={{ title: 'Новый заказ' }}
      />
      <AppStack.Screen
        name="OrderRoom"
        component={OrderRoomScreen}
        options={{ title: 'Заказ' }}
      />
      <AppStack.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: 'Профиль' }}
      />
      <AppStack.Screen
        name="SavedAddresses"
        component={SavedAddressesScreen}
        options={{ title: 'Адреса' }}
      />
      <AppStack.Screen
        name="SavedRestaurants"
        component={SavedRestaurantsScreen}
        options={{ title: 'Рестораны' }}
      />
      <AppStack.Screen
        name="NotificationSettings"
        component={NotificationSettingsScreen}
        options={{ title: 'Уведомления' }}
      />
    </AppStack.Navigator>
  );
}

function UnauthenticatedApp() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
    </AuthStack.Navigator>
  );
}

export function RootNavigator() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer linking={linking}>
      {user ? <AuthenticatedApp /> : <UnauthenticatedApp />}
    </NavigationContainer>
  );
}