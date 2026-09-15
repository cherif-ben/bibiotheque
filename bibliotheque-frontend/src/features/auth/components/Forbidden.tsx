'use client';

import Link from 'next/link';
import AppShell from '@/shared/ui/AppShell';
import { useI18n } from '@/shared/i18n';

export default function Forbidden() {
  const { t } = useI18n();

  return (
    <AppShell>
      <section className="form-card animate-fade-in-up" style={{ textAlign: 'center' }}>
        <div className="empty-state-icon" aria-hidden="true">🔒</div>
        <h1 style={{ justifyContent: 'center' }}>{t('forbidden.title')}</h1>
        <p style={{ color: 'var(--text-secondary)', margin: '10px 0 22px' }}>
          {t('forbidden.message')}
        </p>
        <Link className="button" href="/">
          {t('forbidden.back')}
        </Link>
      </section>
    </AppShell>
  );
}
