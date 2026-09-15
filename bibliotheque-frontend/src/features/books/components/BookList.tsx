'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useBooks } from '../useBooks';
import Pagination from '@/shared/components/Pagination';
import { Shell, Notice } from '@/shared/ui';
import { useI18n } from '@/shared/i18n';

type BookFilter = 'TOUS' | 'DISPONIBLE' | 'EMPRUNTE';

const FILTER_LABELS: Record<BookFilter, string> = {
  'TOUS': 'Tous',
  'DISPONIBLE': 'Disponible',
  'EMPRUNTE': 'Emprunté',
};

const PAGE_SIZE = 5;

export default function BookList() {
  const { t } = useI18n();
  const router = useRouter();
  const { books, error, reload } = useBooks();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<BookFilter>('TOUS');
  const [page, setPage] = useState(1);

  const filteredBooks = useMemo(() => {
    return books.filter((b) => {
      const matchesSearch =
        b.bookName.toLowerCase().includes(search.toLowerCase()) ||
        b.bookAuthor.toLowerCase().includes(search.toLowerCase()) ||
        b.bookGenre.toLowerCase().includes(search.toLowerCase());
      const matchesFilter =
        filter === 'TOUS' ||
        (filter === 'DISPONIBLE' && b.noOfCopies > 0) ||
        (filter === 'EMPRUNTE' && b.noOfCopies === 0);
      return matchesSearch && matchesFilter;
    });
  }, [books, search, filter]);

  const totalPages = Math.max(1, Math.ceil(filteredBooks.length / PAGE_SIZE));
  const pageBooks = filteredBooks.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const counts = {
    TOUS: books.length,
    DISPONIBLE: books.filter((b) => b.noOfCopies > 0).length,
    EMPRUNTE: books.filter((b) => b.noOfCopies === 0).length,
  };

  const handlePageChange = (p: number) => {
    setPage(p);
  };

  return (
    <Shell allowed={['BIBLIOTHECAIRE']} backHref="/">
      {/* Header */}
      <div className="books-header">
        <div className="books-header-text">
          <h1>{t('books.title')}</h1>
          <p className="books-subtitle">Gérez le catalogue et suivez les exemplaires</p>
        </div>
        <div className="books-header-stats">
          <div className="books-stat">
            <span className="books-stat-num">{counts.TOUS}</span>
            <span className="books-stat-label">Total</span>
          </div>
          <div className="books-stat">
            <span className="books-stat-num" style={{ color: '#10b981' }}>{counts.DISPONIBLE}</span>
            <span className="books-stat-label">Disponible</span>
          </div>
          <div className="books-stat">
            <span className="books-stat-num" style={{ color: '#ef4444' }}>{counts.EMPRUNTE}</span>
            <span className="books-stat-label">Emprunté</span>
          </div>
        </div>
        <Link className="books-add-btn" href="/books/create">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
          {t('books.add')}
        </Link>
      </div>

      {/* Search */}
      <div className="books-search">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="books-search-icon">
          <circle cx="11" cy="11" r="7" />
          <path d="m21 21-4.35-4.35" />
        </svg>
        <input
          type="text"
          placeholder="Rechercher par titre, auteur ou genre…"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="books-search-input"
        />
        {search && (
          <button className="books-search-clear" onClick={() => setSearch('')} aria-label="Effacer">
            ✕
          </button>
        )}
      </div>

      {/* Filter tabs */}
      <div className="filter-tabs">
        {(Object.keys(FILTER_LABELS) as BookFilter[]).map((f) => (
          <button
            key={f}
            className={`filter-tab ${filter === f ? 'active' : ''}`}
            onClick={() => { setFilter(f); setPage(1); }}
          >
            {FILTER_LABELS[f]}
            <span className="filter-count">{counts[f]}</span>
          </button>
        ))}
      </div>

      <Notice text={error} />

      {/* Book list */}
      {pageBooks.length === 0 ? (
        <section className="empty-state">
          <div className="empty-state-icon" aria-hidden="true">📚</div>
          <h2>Aucun livre trouvé</h2>
          <p>{search || filter !== 'TOUS' ? 'Aucun résultat pour votre recherche.' : 'Aucun livre dans le catalogue.'}</p>
        </section>
      ) : (
        <>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>{t('books.title.col')}</th>
                  <th>{t('books.author')}</th>
                  <th>{t('books.genre')}</th>
                  <th>{t('books.status')}</th>
                  <th>{t('books.copies')}</th>
                  <th>{t('books.id')}</th>
                  <th>{t('books.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {pageBooks.map((book) => (
                  <tr key={book.bookId}>
                    <td>
                      <strong style={{ fontSize: '15px' }}>{book.bookName}</strong>
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>{book.bookAuthor}</td>
                    <td><span className="badge">{book.bookGenre}</span></td>
                    <td>
                      <span className={`badge ${book.noOfCopies ? 'success' : 'danger'}`}>
                        {t(book.noOfCopies ? 'status.available' : 'status.borrowed')}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${book.noOfCopies ? 'success' : 'danger'}`}>
                        {book.noOfCopies}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontWeight: 600 }}>#{book.bookId}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          className="user-btn-secondary"
                          onClick={() => router.push(`/books/${book.bookId}`)}
                        >
                          {t('books.history')}
                        </button>
                        <button
                          className="user-btn-secondary"
                          onClick={() => router.push(`/books/${book.bookId}/edit`)}
                        >
                          {t('books.edit')}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination
            page={page}
            totalPages={totalPages}
            total={filteredBooks.length}
            pageSize={PAGE_SIZE}
            onChange={handlePageChange}
            infoKey="books.pagination.info"
            prevKey="books.pagination.prev"
            nextKey="books.pagination.next"
          />
        </>
      )}
    </Shell>
  );
}