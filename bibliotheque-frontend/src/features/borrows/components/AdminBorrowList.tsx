'use client';

import { useState } from 'react';
import { useAllBorrows } from '../useBorrows';
import { Shell, Notice } from '@/shared/ui';
import BorrowTable from './BorrowTable';
import { useI18n } from '@/shared/i18n';

export default function AdminBorrowList() {
  const { t } = useI18n();
  const { items, loading, error, reload } = useAllBorrows();
  const [search, setSearch] = useState('');

  const now = new Date();

  const activeBorrows = items.filter((b) => !b.returnDate);
  const overdueBorrows = items.filter((b) => {
    if (b.returnDate) return false;
    return new Date(b.dueDate) < now;
  });

  const filteredItems = items.filter((b) => {
    const q = search.toLowerCase();
    return (
      String(b.bookId).includes(q) ||
      String(b.borrowId).includes(q)
    );
  });

  return (
    <Shell allowed={['BIBLIOTHECAIRE']} backHref="/">
      {/* Header */}
      <div className="borrows-header">
        <div className="borrows-header-text">
          <h1>{t('borrows.title')}</h1>
          <p className="borrows-subtitle">Suivez tous les emprunts et retours</p>
        </div>
        <div className="borrows-header-stats">
          <div className="borrows-stat">
            <span className="borrows-stat-num">{items.length}</span>
            <span className="borrows-stat-label">Total</span>
          </div>
          <div className="borrows-stat">
            <span className="borrows-stat-num" style={{ color: '#3b82f6' }}>{activeBorrows.length}</span>
            <span className="borrows-stat-label">En cours</span>
          </div>
          <div className="borrows-stat">
            <span className="borrows-stat-num" style={{ color: '#ef4444' }}>{overdueBorrows.length}</span>
            <span className="borrows-stat-label">En retard</span>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="borrows-search">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="borrows-search-icon">
          <circle cx="11" cy="11" r="7" />
          <path d="m21 21-4.35-4.35" />
        </svg>
        <input
          type="text"
          placeholder="Rechercher par ID livre ou emprunt…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="borrows-search-input"
        />
        {search && (
          <button className="borrows-search-clear" onClick={() => setSearch('')} aria-label="Effacer">
            ✕
          </button>
        )}
      </div>

      <Notice text={error} />

      {loading ? (
        <div className="loading">{t('common.loading.borrows')}</div>
      ) : (
        <BorrowTable items={filteredItems} refresh={reload} />
      )}
    </Shell>
  );
}
