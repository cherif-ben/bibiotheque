import type { User } from '@/features/users/users.types';
import type { Book } from '@/features/books/books.types';
import type { Locale } from '@/shared/i18n/translations';

/** Formate une date selon la locale courante (fr-FR / en-US). */
export const fmt = (d?: string | null, locale: Locale = 'fr'): string => {
  if (!d) return '—';

  const frenchDate = /^(\d{2})-(\d{2})-(\d{4})$/.exec(d);
  const parsed = frenchDate
    ? new Date(Number(frenchDate[3]), Number(frenchDate[2]) - 1, Number(frenchDate[1]))
    : new Date(d);

  if (Number.isNaN(parsed.getTime())) return '—';

  return new Intl.DateTimeFormat(locale === 'fr' ? 'fr-FR' : 'en-US', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(parsed);
};

export const getRole = (u: User) => u.role?.[0]?.roleName || 'ADHERENT';

export const blankBook = (): Book => ({
  bookId: 0,
  bookName: '',
  bookAuthor: '',
  bookGenre: '',
  noOfCopies: 0,
});

export const blankUser = (): User => ({
  userId: 0,
  name: '',
  username: '',
  password: '',
  role: [{ roleName: 'ADHERENT' as const }],
});
