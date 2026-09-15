'use client';

import { useCallback, useEffect, useState } from 'react';
import { usersApi } from './users.api';
import type { User } from './users.types';
import { tr } from '@/shared/i18n';

export function useUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await usersApi.list();
      setUsers(data);
    } catch {
      setError(tr('users.load.error'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { users, loading, error, reload: load };
}

export function useUser(id: string | undefined) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    usersApi
      .get(id)
      .then(setUser)
      .catch(() => setError(tr('users.notfound')))
      .finally(() => setLoading(false));
  }, [id]);

  return { user, loading, error };
}
