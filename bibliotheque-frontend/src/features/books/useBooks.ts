'use client';

import { useCallback, useEffect, useState } from 'react';
import { booksApi } from './books.api';
import type { Book } from './books.types';
import { tr } from '@/shared/i18n';

export function useBooks() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await booksApi.list();
      setBooks(data);
    } catch {
      setError(tr('books.load.error'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { books, loading, error, reload: load };
}

export function useBook(id: string | undefined) {
  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    booksApi
      .get(id)
      .then(setBook)
      .catch(() => setError(tr('books.notfound')))
      .finally(() => setLoading(false));
  }, [id]);

  return { book, loading, error };
}
