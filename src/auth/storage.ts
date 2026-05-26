import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'auth_token';

const isWeb = Platform.OS === 'web';

export const tokenStorage = {
  async get(): Promise<string | null> {
    if (isWeb) {
      return typeof window !== 'undefined'
        ? window.localStorage.getItem(TOKEN_KEY)
        : null;
    }
    return SecureStore.getItemAsync(TOKEN_KEY);
  },
  async set(token: string): Promise<void> {
    if (isWeb) {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(TOKEN_KEY, token);
      }
      return;
    }
    await SecureStore.setItemAsync(TOKEN_KEY, token);
  },
  async clear(): Promise<void> {
    if (isWeb) {
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(TOKEN_KEY);
      }
      return;
    }
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  },
};