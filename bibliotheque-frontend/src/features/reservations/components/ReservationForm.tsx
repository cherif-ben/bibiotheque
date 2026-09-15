'use client';

import { useEffect, useState, type FormEvent } from 'react';
import type { Book } from '@/features/books/books.types';
import type { User } from '@/features/users/users.types';
import { booksApi } from '@/features/books/books.api';
import { usersApi } from '@/features/users/users.api';
import { reservationErrorMessage, reservationsApi } from '../reservations.api';
import { useI18n } from '@/shared/i18n';
import { auth } from '@/features/auth/auth.service';

interface Props {
  isAdmin: boolean;
  onCreated: () => Promise<void> | void;
}

export const QUOTA_MAX = 3;

export default function ReservationForm({ isAdmin, onCreated }: Props) {
  const { t } = useI18n();
  const loadError = t('reservations.options.error');
  const [books, setBooks] = useState<Book[]>([]);
  const [adherents, setAdherents] = useState<User[]>([]);
  const [livreId, setLivreId] = useState<number>(0);
  const [adherentId, setAdherentId] = useState<number>(0);
  const [erreur, setErreur] = useState('');
  const [succes, setSucces] = useState(false);
  const [enCours, setEnCours] = useState(false);
  const [chargementOptions, setChargementOptions] = useState(true);
  const [livresEmpruntes, setLivresEmpruntes] = useState<Book[]>([]);
  const [compteurAdherent, setCompteurAdherent] = useState<number | null>(null);

  useEffect(() => {
    const usersRequest = isAdmin ? usersApi.listForReservation() : Promise.resolve([] as User[]);
    Promise.all([booksApi.list(), usersRequest])
      .then(([loadedBooks, loadedAdherents]) => {
        setBooks(loadedBooks);
        setAdherents(loadedAdherents);
        setLivresEmpruntes(loadedBooks.filter((b) => b.noOfCopies < 1));
      })
      .catch(() => setErreur(loadError))
      .finally(() => setChargementOptions(false));
  }, [isAdmin, loadError]);

  useEffect(() => {
    if (!isAdmin && auth.userId) setAdherentId(auth.userId);
  }, [isAdmin]);

  useEffect(() => {
    if (!adherentId) {
      setCompteurAdherent(null);
      return;
    }
    let cancelled = false;
    reservationsApi
      .byUser(adherentId)
      .then((all) => {
        if (cancelled) return;
        const actifs = all.filter((r) => r.statut === 'EN_ATTENTE' || r.statut === 'DISPONIBLE').length;
        setCompteurAdherent(actifs);
      })
      .catch(() => {
        if (!cancelled) setCompteurAdherent(null);
      });
    return () => {
      cancelled = true;
    };
  }, [adherentId]);

  const valider = async (e: FormEvent) => {
    e.preventDefault();
    setErreur('');
    setSucces(false);
    setEnCours(true);
    try {
      await reservationsApi.create(livreId, adherentId);
      setLivreId(0);
      setAdherentId(0);
      setCompteurAdherent(null);
      setSucces(true);
      await onCreated();
    } catch (err: unknown) {
      setErreur(reservationErrorMessage(err, 'creation'));
    } finally {
      setEnCours(false);
    }
  };

  const peutValider = livreId > 0 && adherentId > 0 && !enCours && !chargementOptions && livresEmpruntes.some((b) => b.bookId === livreId);
  const selectionHorsRegle = livreId > 0 && !livresEmpruntes.some((b) => b.bookId === livreId);

  const quota = compteurAdherent ?? 0;
  const quotaAlerte = quota >= 2 && quota < QUOTA_MAX;
  const quotaDanger = quota >= QUOTA_MAX;

  return (
    <section className="form-card reservation-create-panel animate-fade-in-up" aria-labelledby="reservation-form-title">
      <h2 id="reservation-form-title">{t('reservations.create.title')}</h2>
      <p className="form-hint">{t('reservations.create.hint')}</p>

      {erreur && <p className="error" role="alert">{erreur}</p>}
      {succes && !erreur && <p className="success-banner" role="status">✓ {t('reservations.create.success')}</p>}
      {selectionHorsRegle && (
        <p className="error" role="alert">
          {t('reservations.create.hint')}
        </p>
      )}

      {compteurAdherent !== null && (
        <div
          className={`quota-meter ${quotaDanger ? 'danger' : quotaAlerte ? 'alert' : ''}`}
          role="status"
          aria-label={t('reservations.quota.label').replace('{count}', String(quota)).replace('{max}', String(QUOTA_MAX))}
        >
          <div className="quota-segments" aria-hidden="true">
            {Array.from({ length: QUOTA_MAX }, (_, i) => (
              <div key={i} className={`quota-segment ${i < quota ? 'filled' : ''}`} />
            ))}
          </div>
          <span className="quota-meter-label">
            {quotaDanger
              ? t('reservations.quota.reached.short')
              : t('reservations.quota.label').replace('{count}', String(quota)).replace('{max}', String(QUOTA_MAX))}
          </span>
        </div>
      )}
      {quotaDanger && (
        <p className="error" role="alert">
          {t('reservations.quota.reached')}
        </p>
      )}

      <form onSubmit={valider} className="stagger">
        <div>
          <label htmlFor="livre">{t('reservations.create.book')}</label>
          <select id="livre" value={livreId} disabled={chargementOptions || enCours} onChange={(e) => { setLivreId(Number(e.target.value)); setSucces(false); }}>
            <option value={0}>{chargementOptions ? t('common.loading') : t('reservations.create.book.placeholder')}</option>
            {livresEmpruntes.map((b) => (
              <option key={b.bookId} value={b.bookId}>
                {b.bookName} — {b.bookAuthor}
              </option>
            ))}
          </select>
        </div>
        {isAdmin && (
          <div>
            <label htmlFor="adherent">{t('reservations.create.member')}</label>
            <select
              id="adherent"
              value={adherentId}
              disabled={chargementOptions || enCours}
              onChange={(e) => { setAdherentId(Number(e.target.value)); setSucces(false); }}
            >
              <option value={0}>{chargementOptions ? t('common.loading') : t('reservations.create.member.placeholder')}</option>
              {adherents.map((u) => (
                <option key={u.userId} value={u.userId}>
                  {u.name} ({u.username})
                </option>
              ))}
            </select>
          </div>
        )}
        <div className="actions">
          <button type="submit" disabled={!peutValider}>
            {enCours ? (
              <>
                <span className="spinner" />
                {t('reservations.create.loading')}
              </>
            ) : (
              <>＋ {t('reservations.create.submit')}</>
            )}
          </button>
        </div>
      </form>
    </section>
  );
}
