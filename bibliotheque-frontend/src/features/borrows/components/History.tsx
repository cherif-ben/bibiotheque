'use client';

import { useEffect, useState } from 'react';
import { booksApi } from '@/features/books/books.api';
import { usersApi } from '@/features/users/users.api';
import type { Book } from '@/features/books/books.types';
import type { User } from '@/features/users/users.types';
import { useBorrowsByBook, useBorrowsByUser } from '../useBorrows';
import { Shell } from '@/shared/ui';
import BorrowTable from './BorrowTable';
import { useI18n } from '@/shared/i18n';

interface Props {
  kind: 'book' | 'user';
  id: string;
  backHref?: string;
}

export default function History({ kind, id, backHref }: Props) {
  const { t } = useI18n();
  const [name, setName] = useState('');

  const bookBorrows = useBorrowsByBook(kind === 'book' ? id : undefined);
  const userBorrows = useBorrowsByUser(kind === 'user' ? Number(id) : null);

  const items = kind === 'book' ? bookBorrows.items : userBorrows.items;
  const loading = kind === 'book' ? bookBorrows.loading : userBorrows.loading;

  useEffect(() => {
    if (kind === 'book') {
      booksApi.get(id).then((x) => setName((x as Book).bookName));
    } else {
      usersApi.get(id).then((x) => setName((x as User).name));
    }
  }, [kind, id]);

  if (loading) {
    return (
      <Shell allowed={['BIBLIOTHECAIRE']} backHref={backHref}>
        <p className="loading">{t('common.loading')}</p>
      </Shell>
    );
  }

  return (
    <Shell allowed={['BIBLIOTHECAIRE']} backHref={backHref}>
      <h1>Historique — {name}</h1>
      <BorrowTable items={items} />
    </Shell>
  );
}
