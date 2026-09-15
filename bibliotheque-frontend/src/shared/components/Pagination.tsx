'use client';

import { useI18n } from '@/shared/i18n';

interface PaginationProps {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  onChange: (page: number) => void;
  infoKey?: string;
  prevKey?: string;
  nextKey?: string;
}

export default function Pagination({ page, totalPages, total, pageSize, onChange, infoKey, prevKey, nextKey }: PaginationProps) {
  const { t } = useI18n();

  if (totalPages <= 1) return null;

  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  const info = infoKey
    ? t(infoKey).replace('{start}', String(start)).replace('{end}', String(end)).replace('{total}', String(total))
    : `${start} - ${end} / ${total}`;

  const prevLabel = prevKey ? t(prevKey) : t('books.pagination.prev');
  const nextLabel = nextKey ? t(nextKey) : t('books.pagination.next');

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <div className="pagination">
      <span className="pagination-info">{info}</span>
      <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
        <button
          className="filter-tab"
          onClick={() => onChange(page - 1)}
          disabled={page <= 1}
          style={{ opacity: page <= 1 ? 0.4 : 1, cursor: page <= 1 ? 'not-allowed' : 'pointer', padding: '6px 10px', fontSize: '12px' }}
        >
          {prevLabel}
        </button>
        {pages.map((p) => (
          <button
            key={p}
            className={`filter-tab ${page === p ? 'active' : ''}`}
            onClick={() => onChange(p)}
            style={{ padding: '6px 10px', fontSize: '12px', minWidth: '32px' }}
          >
            {p}
          </button>
        ))}
        <button
          className="filter-tab"
          onClick={() => onChange(page + 1)}
          disabled={page >= totalPages}
          style={{ opacity: page >= totalPages ? 0.4 : 1, cursor: page >= totalPages ? 'not-allowed' : 'pointer', padding: '6px 10px', fontSize: '12px' }}
        >
          {nextLabel}
        </button>
      </div>
    </div>
  );
}