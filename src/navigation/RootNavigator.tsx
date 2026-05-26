import React from 'react';
import { ActivityIndicator, Platform, TouchableOpacity, View, Text } from 'react-native';
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
import { ChangePasswordScreen } from '../screens/ChangePasswordScreen';

function BackToProfile({ navigation }: any) {
  if (Platform.OS !== 'web') return null;
  return (
    <TouchableOpacity
      onPress={() => navigation.navigate('Profile')}
      style={{ paddingHorizontal: 12, paddingVertical: 4 }}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
    >
      <Text style={{ color: '#007AFF', fontSize: 17 }}>‹ Назад</Text>
    </TouchableOpacity>
  );
}

function BackToOrders({ navigation }: any) {
  if (Platform.OS !== 'web') return null;
  return (
    <TouchableOpacity
      onPress={() => navigation.navigate('OrdersList')}
      style={{ paddingHorizontal: 12, paddingVertical: 4 }}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
    >
      <Text style={{ color: '#007AFF', fontSize: 17 }}>‹ Назад</Text>
    </TouchableOpacity>
  );
}

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
  ChangePassword: undefined;
};

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const AppStack = createNativeStackNavigator<AppStackParamList>();

const linking = {
  prefixes: [Linking.createURL('/'), 'lunchordering://'],
  config: {
    screens: {
      OrdersList: 'orders',
      CreateOrder: 'orders/new',
      OrderRoom: 'order/:orderId',
      Profile: 'profile',
      SavedAddresses: 'profile/addresses',
      SavedRestaurants: 'profile/restaurants',
      NotificationSettings: 'profile/notifications',
      ChangePassword: 'profile/password',
      Login: 'login',
      Register: 'register',
    },
  },
};

const sheetScreenOptions = Platform.OS === 'web'
  ? {
      headerShown: true,
      headerTitleAlign: 'center' as const,
      headerBackVisible: false,
      headerLeft: () => null,
    }
  : {
      headerShown: false,
      presentation: 'formSheet' as const,
      sheetAllowedDetents: Platform.OS === 'ios' ? [1] : [0.95],
      sheetGrabberVisible: true,
      sheetCornerRadius: 16,
    };

function AuthenticatedApp() {
  usePushNotifications();

  return (
    <AppStack.Navigator
      screenOptions={{
        headerBackButtonDisplayMode: 'minimal',
        headerTitleAlign: 'center',
      }}
    >
      <AppStack.Screen
        name="OrdersList"
        component={OrdersListScreen}
        options={{ headerShown: false }}
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
        options={({ navigation }) => ({
          ...sheetScreenOptions,
          title: 'Профиль',
          headerLeft: () => <BackToOrders navigation={navigation} />,
        })}
      />
      <AppStack.Screen
        name="SavedAddresses"
        component={SavedAddressesScreen}
        options={({ navigation }) => ({
          ...sheetScreenOptions,
          title: 'Сохранённые адреса',
          headerLeft: () => <BackToProfile navigation={navigation} />,
        })}
      />
      <AppStack.Screen
        name="SavedRestaurants"
        component={SavedRestaurantsScreen}
        options={({ navigation }) => ({
          ...sheetScreenOptions,
          title: 'Сохранённые рестораны',
          headerLeft: () => <BackToProfile navigation={navigation} />,
        })}
      />
      <AppStack.Screen
        name="NotificationSettings"
        component={NotificationSettingsScreen}
        options={({ navigation }) => ({
          ...sheetScreenOptions,
          title: 'Уведомления',
          headerLeft: () => <BackToProfile navigation={navigation} />,
        })}
      />
      <AppStack.Screen
        name="ChangePassword"
        component={ChangePasswordScreen}
        options={({ navigation }) => ({
          ...sheetScreenOptions,
          title: 'Смена пароля',
          headerLeft: () => <BackToProfile navigation={navigation} />,
        })}
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