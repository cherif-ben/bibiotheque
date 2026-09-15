'use client';

import { useParams, useRouter } from 'next/navigation';
import { useReservation } from '../useReservations';
import { Shell, Notice } from '@/shared/ui';
import { fmt } from '@/shared/utils';
import { useI18n } from '@/shared/i18n';

const STATUT_KEY: Record<string, string> = {
  EN_ATTENTE: 'status.pending',
  DISPONIBLE: 'status.available',
  ANNULEE: 'status.cancelled',
  EXPIREE: 'status.expired',
  HONOREE: 'status.fulfilled',
};

export default function ReservationDetail() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { t } = useI18n();
  const { reservation, loading, error } = useReservation(Number(params.id));
  const { locale } = useI18n();

  return (
    <Shell allowed={['BIBLIOTHECAIRE', 'ADHERENT']} backHref="/reservations">
      <section className="form-card">
        <h1>{t('reservations.detail.title')}</h1>
        <Notice text={error} />
        {loading ? (
          <p className="loading">{t('common.loading')}</p>
        ) : reservation ? (
          <table>
            <tbody>
              <tr>
                <td><strong>ID</strong></td>
                <td>{reservation.id}</td>
              </tr>
              <tr>
                <td><strong>{t('reservations.book')}</strong></td>
                <td>{reservation.livreTitre}</td>
              </tr>
              <tr>
                <td><strong>{t('reservations.member')}</strong></td>
                <td>{reservation.adherentNom}</td>
              </tr>
              <tr>
                <td><strong>{t('reservations.status')}</strong></td>
                <td><span className="badge">{t(STATUT_KEY[reservation.statut] || 'status.all')}</span></td>
              </tr>
              <tr>
                <td><strong>{t('reservations.date')}</strong></td>
                <td>{fmt(reservation.dateReservation, locale)}</td>
              </tr>
              <tr>
                <td><strong>{t('reservations.expiry')}</strong></td>
                <td>{fmt(reservation.dateExpiration, locale)}</td>
              </tr>
            </tbody>
          </table>
        ) : null}
        <div className="actions" style={{ marginTop: 16 }}>
          <button className="secondary" onClick={() => router.back()}>
            {t('common.back')}
          </button>
        </div>
      </section>
    </Shell>
  );
}
