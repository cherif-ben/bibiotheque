'use client';

import { useBooks } from '../useBooks';
import { borrowApi } from '@/features/borrows/borrows.api';
import { auth } from '@/features/auth/auth.service';
import { Shell, Notice } from '@/shared/ui';
import { useI18n } from '@/shared/i18n';

export default function BookBorrowList() {
  const { t } = useI18n();
  const { books, error, reload } = useBooks();

  const take = async (id: number) => {
    if (auth.userId) {
      try { await borrowApi.create(id, auth.userId); reload(); } catch { /* */ }
    }
  };

  return (
    <Shell allowed={['BIBLIOTHECAIRE', 'ADHERENT']} backHref="/books">
      <div className="page-title">
        <h1>{t('books.available')}</h1>
      </div>
      <Notice text={error} />
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>{t('books.id')}</th>
              <th>{t('books.title.col')}</th>
              <th>{t('books.author')}</th>
              <th>{t('books.genre')}</th>
              <th>{t('books.copies')}</th>
              <th>{t('books.actions')}</th>
            </tr>
          </thead>
          <tbody className="stagger">
            {books.map((b) => (
              <tr key={b.bookId}>
                <td data-label={t('books.id')} style={{ fontWeight: 600, color: 'var(--text-muted)' }}>#{b.bookId}</td>
                <td data-label={t('books.title.col')}><strong>{b.bookName}</strong></td>
                <td data-label={t('books.author')}>{b.bookAuthor}</td>
                <td data-label={t('books.genre')}><span className="badge">{b.bookGenre}</span></td>
                <td data-label={t('books.copies')}>
                  <span className={b.noOfCopies ? 'badge success' : 'badge danger'}>{b.noOfCopies}</span>
                </td>
                <td data-label={t('books.actions')}>
                  <button disabled={!b.noOfCopies} onClick={() => take(b.bookId)}>{t('books.borrow')}</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Shell>
  );
}
