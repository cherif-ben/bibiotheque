'use client';

import { FormEvent, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import Notice from './Notice';
import { useI18n } from '@/shared/i18n';

interface Props {
  title: string;
  error: string;
  children: ReactNode;
  onSubmit: (e: FormEvent) => void;
}

export default function Form({ title, error, children, onSubmit }: Props) {
  const router = useRouter();
  const { t } = useI18n();

  return (
    <section className="form-card animate-fade-in-up">
      <h1>{title}</h1>
      <Notice text={error} />
      <form onSubmit={onSubmit} className="stagger">
        {children}
        <div className="actions">
          <button type="button" className="secondary" onClick={() => router.back()}>
            {t('common.cancel')}
          </button>
          <button type="submit">{t('common.save')}</button>
        </div>
      </form>
    </section>
  );
}
