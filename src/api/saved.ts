import { api } from './client';
import { SavedAddress, SavedRestaurant } from '../types/saved';

export const savedApi = {
  // Addresses
  listAddresses: async (): Promise<SavedAddress[]> => {
    const { data } = await api.get<SavedAddress[]>('/saved/addresses');
    return data;
  },
  createAddress: async (payload: { label: string; address: string }) => {
    const { data } = await api.post<SavedAddress>('/saved/addresses', payload);
    return data;
  },
  updateAddress: async (
    id: string,
    payload: Partial<{ label: string; address: string }>,
  ) => {
    const { data } = await api.patch<SavedAddress>(`/saved/addresses/${id}`, payload);
    return data;
  },
  deleteAddress: async (id: string) => {
    await api.delete(`/saved/addresses/${id}`);
  },

  // Restaurants
  listRestaurants: async (): Promise<SavedRestaurant[]> => {
    const { data } = await api.get<SavedRestaurant[]>('/saved/restaurants');
    return data;
  },
  createRestaurant: async (payload: { name: string; url?: string }) => {
    const { data } = await api.post<SavedRestaurant>('/saved/restaurants', payload);
    return data;
  },
  updateRestaurant: async (
    id: string,
    payload: Partial<{ name: string; url: string }>,
  ) => {
    const { data } = await api.patch<SavedRestaurant>(`/saved/restaurants/${id}`, payload);
    return data;
  },
  deleteRestaurant: async (id: string) => {
    await api.delete(`/saved/restaurants/${id}`);
  },
};