import { api } from './client';

export const notificationsApi = {
  registerToken: async (token: string, platform?: 'ios' | 'android') => {
    await api.post('/notifications/tokens', { token, platform });
  },
  removeToken: async (token: string) => {
    await api.delete(`/notifications/tokens/${encodeURIComponent(token)}`);
  },
};