import { api } from './client';
import { NotificationPreferences } from '../types/notifications';

export type PublicUser = {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  notificationPreferences?: NotificationPreferences;
};

export const profileApi = {
  me: async (): Promise<PublicUser> => {
    const { data } = await api.get<PublicUser>('/users/me');
    return data;
  },
  updateMe: async (payload: { name?: string; avatarUrl?: string | null }) => {
    const { data } = await api.patch<PublicUser>('/users/me', payload);
    return data;
  },
  updateNotificationPrefs: async (
    patch: Partial<NotificationPreferences>,
  ): Promise<PublicUser> => {
    const { data } = await api.patch<PublicUser>(
      '/users/me/notification-preferences',
      patch,
    );
    return data;
  },
};