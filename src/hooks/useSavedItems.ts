import { useCallback, useEffect, useState } from 'react';

export function useSavedItems<T extends { id: string }>(api: {
  list: () => Promise<T[]>;
  create: (payload: any) => Promise<T>;
  update: (id: string, payload: any) => Promise<T>;
  remove: (id: string) => Promise<void>;
}) {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const data = await api.list();
      setItems(data);
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    load();
  }, [load]);

  const create = useCallback(
    async (payload: any) => {
      const created = await api.create(payload);
      setItems((arr) => [created, ...arr]);
      return created;
    },
    [api],
  );

  const update = useCallback(
    async (id: string, payload: any) => {
      const updated = await api.update(id, payload);
      setItems((arr) => arr.map((i) => (i.id === id ? updated : i)));
      return updated;
    },
    [api],
  );

  const remove = useCallback(
    async (id: string) => {
      await api.remove(id);
      setItems((arr) => arr.filter((i) => i.id !== id));
    },
    [api],
  );

  return { items, loading, reload: load, create, update, remove };
}