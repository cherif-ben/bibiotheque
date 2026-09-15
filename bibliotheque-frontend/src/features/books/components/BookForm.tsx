'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { booksApi } from '../books.api';
import { useBook } from '../useBooks';
import type { Book } from '../books.types';
import { Shell, Form } from '@/shared/ui';
import { blankBook } from '@/shared/utils';
import { useI18n } from '@/shared/i18n';

interface Props {
  id?: string;
  backHref?: string;
}

export default function BookForm({ id, backHref }: Props) {
  const { t } = useI18n();
  const { book: loadedBook } = useBook(id);
  const [book, setBook] = useState<Book>(blankBook());
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    if (loadedBook) setBook(loadedBook);
  }, [loadedBook]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (id) {
        await booksApi.update(id, book);
      } else {
        await booksApi.create(book);
      }
      router.push('/books');
    } catch {
      setError(t('books.save.error'));
    }
  };

  return (
    <Shell allowed={['BIBLIOTHECAIRE']} backHref={backHref}>
      <Form title={id ? t('books.update') : t('books.create')} error={error} onSubmit={submit}>
        <input
          required
          value={book.bookName}
          placeholder={t('books.name')}
          onChange={(e) => setBook({ ...book, bookName: e.target.value })}
        />
        <input
          required
          value={book.bookAuthor}
          placeholder={t('books.author.placeholder')}
          onChange={(e) => setBook({ ...book, bookAuthor: e.target.value })}
        />
        <input
          required
          value={book.bookGenre}
          placeholder={t('books.genre.placeholder')}
          onChange={(e) => setBook({ ...book, bookGenre: e.target.value })}
        />
        <input
          required
          min="0"
          type="number"
          value={book.noOfCopies}
          placeholder={t('books.copies.placeholder')}
          onChange={(e) => setBook({ ...book, noOfCopies: Number(e.target.value) })}
        />
      </Form>
    </Shell>
  );
}
