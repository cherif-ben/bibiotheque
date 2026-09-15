'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useBooks } from '../useBooks';
import { booksApi } from '../books.api';
import { Shell, Notice } from '@/shared/ui';
import { useI18n } from '@/shared/i18n';

export default function BookList() {
  const { t } = useI18n();
  const router = useRouter();
  const { books, error, reload } = useBooks();
  const [search, setSearch] = useState('');

  const filteredBooks = books.filter((b) => {
    const q = search.toLowerCase();
    return (
      b.bookName.toLowerCase().includes(q) ||
      b.bookAuthor.toLowerCase().includes(q) ||
      b.bookGenre.toLowerCase().includes(q)
    );
  });

  const genreColors: Record<string, string> = {
    'Roman': '#3b82f6',
    'Science-Fiction': '#8b5cf6',
    'Fantaisie': '#10b981',
    'Policier': '#ef4444',
    'Histoire': '#f59e0b',
    'Philosophie': '#06b6d4',
    'Poésie': '#ec4899',
    'Essai': '#6366f1',
    'Biographie': '#14b8a6',
    'default': '#64748b',
  };

  const getGenreColor = (genre: string) => genreColors[genre] || genreColors['default'];

  const totalCopies = books.reduce((sum, b) => sum + b.noOfCopies, 0);
  const availableCopies = books.filter((b) => b.noOfCopies > 0).reduce((sum, b) => sum + b.noOfCopies, 0);

  return (
    <Shell allowed={['BIBLIOTHECAIRE']} backHref="/">
      {/* Header */}
      <div className="books-header">
        <div className="books-header-text">
          <h1>{t('books.title')}</h1>
          <p className="books-subtitle">Gérez votre catalogue et suivez les exemplaires</p>
        </div>
        <div className="books-header-stats">
          <div className="books-stat">
            <span className="books-stat-num">{books.length}</span>
            <span className="books-stat-label">Titres</span>
          </div>
          <div className="books-stat">
            <span className="books-stat-num">{totalCopies}</span>
            <span className="books-stat-label">Exemplaires</span>
          </div>
        </div>
        <Link className="books-add-btn" href="/books/create">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
          {t('books.add')}
        </Link>
      </div>

      {/* Search bar */}
      <div className="books-search">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="books-search-icon">
          <circle cx="11" cy="11" r="7" />
          <path d="m21 21-4.35-4.35" />
        </svg>
        <input
          type="text"
          placeholder="Rechercher un livre par titre, auteur ou genre…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="books-search-input"
        />
        {search && (
          <button className="books-search-clear" onClick={() => setSearch('')} aria-label="Effacer">
            ✕
          </button>
        )}
      </div>

      <Notice text={error} />

      {/* Book grid */}
      {filteredBooks.length === 0 ? (
        <section className="empty-state">
          <div className="empty-state-icon" aria-hidden="true">📚</div>
          <h2>Aucun livre trouvé</h2>
          <p>{search ? 'Aucun résultat pour votre recherche.' : 'Commencez par ajouter des livres au catalogue.'}</p>
        </section>
      ) : (
        <div className="books-grid">
          {filteredBooks.map((book, idx) => (
            <div
              key={book.bookId}
              className="book-card"
              style={{ animationDelay: `${idx * 40}ms` }}
            >
              {/* Cover */}
              <div
                className="book-card-cover"
                style={{ background: `linear-gradient(135deg, ${getGenreColor(book.bookGenre)}dd, ${getGenreColor(book.bookGenre)}88)` }}
              >
                <span className="book-card-cover-letter">{book.bookName.charAt(0)}</span>
                <div className="book-card-cover-shine" />
              </div>

              {/* Info */}
              <div className="book-card-body">
                <div className="book-card-genre" style={{ color: getGenreColor(book.bookGenre), background: `${getGenreColor(book.bookGenre)}15` }}>
                  {book.bookGenre}
                </div>
                <h3 className="book-card-title">{book.bookName}</h3>
                <p className="book-card-author">{book.bookAuthor}</p>

                <div className="book-card-meta">
                  <span className="book-card-copies">
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V4H6.5A2.5 2.5 0 0 0 4 6.5v13z" />
                    </svg>
                    {book.noOfCopies} exemplaire{book.noOfCopies > 1 ? 's' : ''}
                  </span>
                  <span className="book-card-id">#{book.bookId}</span>
                </div>

                {/* Actions */}
                <div className="book-card-actions">
                  <button
                    className="book-btn-primary"
                    onClick={() => router.push(`/books/${book.bookId}`)}
                  >
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M8 6h13M8 12h13M8 18h13" />
                      <circle cx="4" cy="6" r="1" /><circle cx="4" cy="12" r="1" /><circle cx="4" cy="18" r="1" />
                    </svg>
                    {t('books.history')}
                  </button>
                  <button
                    className="book-btn-secondary"
                    onClick={() => router.push(`/books/${book.bookId}/edit`)}
                  >
                    {t('books.edit')}
                  </button>
                  <button
                    className="book-btn-danger"
                    onClick={async () => {
                      if (confirm(t('books.delete.confirm'))) {
                        await booksApi.remove(book.bookId);
                        reload();
                      }
                    }}
                  >
                    {t('books.delete')}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Shell>
  );
}
