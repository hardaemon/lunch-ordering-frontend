export type SavedAddress = {
  id: string;
  userId: string;
  label: string;
  address: string;
  createdAt: string;
  updatedAt: string;
};

export type SavedRestaurant = {
  id: string;
  userId: string;
  name: string;
  url: string | null;
  createdAt: string;
  updatedAt: string;
};