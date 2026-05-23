import { useEffect, useState, useCallback } from 'react';

type ItemApi<T> = {
  list: () => Promise<T[]>;
  create: (data: any) => Promise<T>;
  update: (id: string, data: any) => Promise<T>;
  remove: (id: string) => Promise<void>;
};

export function useSavedItems<T extends { id: string }>(api: ItemApi<T>) {
  const [items, setItems] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    api
      .list()
      .then((data) => {
        if (active) setItems(data);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const create = useCallback(
    async (data: any) => {
      const created = await api.create(data);
      setItems((prev) => [...prev, created]);
      return created;
    },
    [api],
  );

  const update = useCallback(
    async (id: string, data: any) => {
      const updated = await api.update(id, data);
      setItems((prev) => prev.map((i) => (i.id === id ? updated : i)));
      return updated;
    },
    [api],
  );

  const remove = useCallback(
    async (id: string) => {
      await api.remove(id);
      setItems((prev) => prev.filter((i) => i.id !== id));
    },
    [api],
  );

  return { items, isLoading, create, update, remove };
}