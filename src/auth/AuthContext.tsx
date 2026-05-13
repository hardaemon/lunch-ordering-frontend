import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import { api } from '../api/client';
import { tokenStorage } from './storage';
import { NotificationPreferences } from '../types/notifications';

type User = {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  notificationPreferences?: NotificationPreferences;
};

type AuthContextValue = {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  setUserLocal: (user: User) => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // При старте приложения: если есть сохранённый токен — пробуем получить юзера
  useEffect(() => {
    (async () => {
      try {
        const token = await tokenStorage.get();
        if (!token) return;
        const { data } = await api.get<User>('/auth/me');
        setUser(data);
      } catch {
        // Токен невалидный/протух — чистим
        await tokenStorage.clear();
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { data } = await api.post<{ token: string; user: User }>(
      '/auth/login',
      { email, password },
    );
    await tokenStorage.set(data.token);
    setUser(data.user);
  }, []);

  const register = useCallback(
    async (email: string, password: string, name: string) => {
      const { data } = await api.post<{ token: string; user: User }>(
        '/auth/register',
        { email, password, name },
      );
      await tokenStorage.set(data.token);
      setUser(data.user);
    },
    [],
  );

  const logout = useCallback(async () => {
    await tokenStorage.clear();
    setUser(null);
  }, []);

  const setUserLocal = useCallback((u: User) => {
    setUser(u);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout, setUserLocal }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return ctx;
}