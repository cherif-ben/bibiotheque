'use client';

import { useCallback, useEffect, useState } from 'react';
import { borrowApi } from './borrows.api';
import type { Borrow } from './borrows.types';
import { tr } from '@/shared/i18n';

export function useAllBorrows(enabled = true) {
  const [items, setItems] = useState<Borrow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!enabled) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const data = await borrowApi.list();
      setItems(data);
    } catch {
      setError(tr('borrows.load.error'));
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    load();
  }, [load]);

  return { items, loading, error, reload: load };
}

export function useBorrowsByUser(userId: number | null) {
  const [items, setItems] = useState<Borrow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!userId) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await borrowApi.byUser(userId);
      setItems(data);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  const returnBook = useCallback(
    async (borrowId: number) => {
      await borrowApi.return(borrowId);
      load();
    },
    [load],
  );

  return { items, loading, reload: load, returnBook };
}

export function useBorrowsByBook(bookId: string | undefined) {
  const [items, setItems] = useState<Borrow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!bookId) {
      setLoading(false);
      return;
    }
    borrowApi
      .byBook(bookId)
      .then(setItems)
      .finally(() => setLoading(false));
  }, [bookId]);

  return { items, loading };
}
