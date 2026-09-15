'use client';

import { useMemo } from 'react';
import type { Borrow } from '../borrows.types';
import { fmt } from '@/shared/utils';
import { useI18n } from '@/shared/i18n';

interface Props {
  items: Borrow[];
  refresh?: () => void;
}

export default function BorrowTable({ items, refresh }: Props) {
  const { t, locale } = useI18n();

  const back = async (id: number) => {
    const { borrowApi } = await import('../borrows.api');
    await borrowApi.return(id);
    refresh?.();
  };

  const now = new Date();

  const getDueStatus = (dueDate: string, returnDate: string | null) => {
    if (returnDate) return { label: 'Retourné', class: 'returned', color: '#10b981' };
    const due = new Date(dueDate);
    const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return { label: `En retard (${Math.abs(diffDays)}j)`, class: 'overdue', color: '#ef4444' };
    if (diffDays <= 3) return { label: `Échéance dans ${diffDays}j`, class: 'soon', color: '#f59e0b' };
    return { label: `${diffDays}j restants`, class: 'active', color: '#3b82f6' };
  };

  return (
    <div className="borrows-grid">
      {items.map((b, idx) => {
        const dueStatus = getDueStatus(b.dueDate, b.returnDate);
        return (
          <div key={b.borrowId} className="borrow-card" style={{ animationDelay: `${idx * 40}ms` }}>
            <div className="borrow-card-accent" style={{ background: dueStatus.color }} />
            <div className="borrow-card-body">
              <div className="borrow-card-header">
                <div className="borrow-card-book">
                  <div className="borrow-card-cover" style={{ background: `linear-gradient(135deg, ${dueStatus.color}cc, ${dueStatus.color}66)` }}>
                    <span>#{b.bookId}</span>
                  </div>
                  <div>
                    <div className="borrow-card-book-id">Livre #{b.bookId}</div>
                    <div className="borrow-card-borrow-id">Emprunt #{b.borrowId}</div>
                  </div>
                </div>
                <span className="borrow-card-status" style={{ background: `${dueStatus.color}15`, color: dueStatus.color, borderColor: `${dueStatus.color}30` }}>
                  <span className="borrow-card-status-dot" style={{ background: dueStatus.color }} />
                  {dueStatus.label}
                </span>
              </div>

              <div className="borrow-card-dates">
                <div className="borrow-card-date">
                  <span className="borrow-card-date-label">Emprunt</span>
                  <span className="borrow-card-date-value">{fmt(b.issueDate, locale)}</span>
                </div>
                <div className="borrow-card-date">
                  <span className="borrow-card-date-label">Échéance</span>
                  <span className="borrow-card-date-value">{fmt(b.dueDate, locale)}</span>
                </div>
                <div className="borrow-card-date">
                  <span className="borrow-card-date-label">Retour</span>
                  <span className="borrow-card-date-value">
                    {b.returnDate ? fmt(b.returnDate, locale) : '—'}
                  </span>
                </div>
              </div>

              {refresh && !b.returnDate && (
                <button className="borrow-card-return-btn" onClick={() => back(b.borrowId)}>
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="m13 8-3 3 3 3" />
                    <path d="M10 11h9" />
                  </svg>
                  {t('borrows.return')}
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
