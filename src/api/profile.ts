import { api } from './client';
import { NotificationPreferences } from '../types/notifications';

export type PublicUser = {
  id: string;
  email: string;
  name: string;
  notificationPreferences?: NotificationPreferences;
};

export const profileApi = {
  me: async (): Promise<PublicUser> => {
    const { data } = await api.get<PublicUser>('/users/me');
    return data;
  },
  updateMe: async (payload: { name?: string; email?: string }) => {
    const { data } = await api.patch<PublicUser>('/users/me', payload);
    return data;
  },
  changePassword: async (currentPassword: string, newPassword: string) => {
    await api.patch('/users/me/password', { currentPassword, newPassword });
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