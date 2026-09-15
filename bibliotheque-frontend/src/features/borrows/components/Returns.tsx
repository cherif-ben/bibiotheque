'use client';

import { useState, useEffect } from 'react';
import { auth } from '@/features/auth/auth.service';
import { useBorrowsByUser } from '../useBorrows';
import { Shell } from '@/shared/ui';
import BorrowTable from './BorrowTable';
import { useI18n } from '@/shared/i18n';

export default function Returns() {
  const { t } = useI18n();
  const [userId, setUserId] = useState<number | null>(null);

  useEffect(() => {
    setUserId(auth.userId);
  }, []);

  const { items, reload } = useBorrowsByUser(userId);

  return (
    <Shell allowed={['BIBLIOTHECAIRE', 'ADHERENT']} backHref="/">
      <h1>{t('borrows.returns.title')}</h1>
      <BorrowTable items={items} refresh={reload} />
    </Shell>
  );
}
