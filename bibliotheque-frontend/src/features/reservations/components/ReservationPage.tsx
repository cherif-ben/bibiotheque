'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/features/auth/auth.service';
import { useReservations } from '../useReservations';
import type { ReservationFilter, Reservation } from '../reservations.types';
import ReservationForm from './ReservationForm';
import Shell from '@/shared/ui/Shell';
import { useI18n } from '@/shared/i18n';
import { fmt } from '@/shared/utils';

/* --- Mappage des onglets de statut --- */
type ReservationTab = 'EN_ATTENTE' | 'DISPONIBLE' | 'HONOREE' | 'ANNULEE';

const TAB_CONFIG: Record<ReservationTab, { key: string; labelKey: string; color: string }> = {
  EN_ATTENTE:  { key: 'EN_ATTENTE',  labelKey: 'status.pending',  color: '#f59e0b' },
  DISPONIBLE:  { key: 'DISPONIBLE',  labelKey: 'status.available', color: '#10b981' },
  HONOREE:     { key: 'HONOREE',     labelKey: 'status.fulfilled', color: '#3b82f6' },
  ANNULEE:     { key: 'ANNULEE',     labelKey: 'status.cancelled', color: '#ef4444' },
};

const TABS: ReservationTab[] = ['EN_ATTENTE', 'DISPONIBLE', 'HONOREE', 'ANNULEE'];

function filterToTab(f: ReservationFilter): ReservationTab | null {
  if (f === 'TOUS' || f === 'EXPIREE') return null;
  return f as ReservationTab;
}

export default function ReservationPage() {
  const { t } = useI18n();
  const router = useRouter();
  const [statutFiltre, setStatutFiltre] = useState<ReservationFilter>('TOUS');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!auth.token) router.replace('/login');
    else setReady(true);
  }, [router]);

  const { items, loading, error, statusCounts, reload, cancel, remove } = useReservations(statutFiltre);
  const isAdmin = auth.hasRole('BIBLIOTHECAIRE');
  const activeTab = filterToTab(statutFiltre);

  /* Compte pour chaque onglet */
  const tabCounts = useMemo(() => (
    TABS.reduce<Record<string, number>>((acc, tab) => {
      acc[tab] = statusCounts[tab];
      return acc;
    }, {})
  ), [statusCounts]);

  const totalActive = tabCounts['EN_ATTENTE'] + tabCounts['DISPONIBLE'];

  if (!ready) {
    return (
      <Shell>
        <div className="loading">{t('common.loading')}</div>
      </Shell>
    );
  }

  const handleTabChange = (tab: ReservationTab) => {
    setStatutFiltre(tab);
  };

  const handleFilterAll = () => {
    setStatutFiltre('TOUS');
  };

  return (
    <Shell allowed={['BIBLIOTHECAIRE', 'ADHERENT']} backHref="/">
      <section className="reservation-workspace-v3">
        {/* --- HEADER --- */}
        <div className="res-header">
          <div className="res-header-text">
            <h1>{t('reservations.title')}</h1>
            <p>{t('reservations.hero.subtitle')}</p>
          </div>
          <div className="res-header-stats">
            <div className="res-stat-card">
              <span className="res-stat-number">{totalActive}</span>
              <span className="res-stat-label">Actives</span>
            </div>
            <div className="res-stat-card">
              <span className="res-stat-number">{statusCounts['TOUS']}</span>
              <span className="res-stat-label">Total</span>
            </div>
          </div>
        </div>

        {/* --- BARRE DE STATS PAR STATUT --- */}
        <div className="res-status-bar">
          {TABS.map((tab) => (
            <button
              key={tab}
              className={`res-status-pill ${activeTab === tab ? 'active' : ''}`}
              onClick={() => handleTabChange(tab)}
              style={{ '--pill-color': TAB_CONFIG[tab].color } as React.CSSProperties}
            >
              <span className="res-status-dot" />
              <span>{t(TAB_CONFIG[tab].labelKey)}</span>
              <span className="res-status-count">{tabCounts[tab]}</span>
            </button>
          ))}
        </div>

        {/* --- PANNEAU DE CRÉATION --- */}
        <ReservationForm isAdmin={isAdmin} onCreated={reload} />

        {/* --- LISTE DES RÉSERVATIONS --- */}
        {error ? (
          <section className="error-state" aria-live="assertive">
            <div className="error-state-icon" aria-hidden="true">📡</div>
            <h2>{t('reservations.error.title')}</h2>
            <p>{error}</p>
            <button className="secondary" onClick={reload}>↻ {t('common.retry')}</button>
          </section>
        ) : items.length === 0 && !loading ? (
          <section className="empty-state">
            <div className="empty-state-icon" aria-hidden="true">🗓️</div>
            <h2>{t('reservations.empty.title')}</h2>
            <p>{statutFiltre === 'TOUS' ? t('reservations.empty.all') : t('reservations.empty.filtered')}</p>
          </section>
        ) : (
          <div className="res-list">
            {items.map((r, idx) => (
              <ReservationCardV3
                key={r.id}
                reservation={r}
                onAnnuler={cancel}
                onSupprimer={remove}
                isAdmin={isAdmin}
                index={idx}
              />
            ))}
          </div>
        )}
      </section>
    </Shell>
  );
}

/* --- Composant carte de réservation V3 --- */
interface ReservationCardV3Props {
  reservation: Reservation;
  onAnnuler: (id: number) => Promise<void>;
  onSupprimer: (id: number) => Promise<void>;
  isAdmin: boolean;
  index: number;
}

function ReservationCardV3({ reservation, onAnnuler, onSupprimer, isAdmin, index }: ReservationCardV3Props) {
  const { t, locale } = useI18n();

  const userInitials = reservation.adherentNom
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0]!.toUpperCase())
    .join('');

  const userColor = useMemo(() => {
    const colors: Record<string, string> = {
      'YN': '#14b8a6', 'NH': '#0ea5e9', 'AB': '#f59e0b', 'default': '#64748b',
    };
    return colors[userInitials] || colors['default'];
  }, [userInitials]);

  const statusClass = useMemo(() => {
    const map: Record<string, string> = {
      EN_ATTENTE: 'pending', DISPONIBLE: 'available', HONOREE: 'fulfilled',
      ANNULEE: 'cancelled', EXPIREE: 'expired',
    };
    return map[reservation.statut] || '';
  }, [reservation.statut]);

  const statusConfig = TAB_CONFIG[reservation.statut as ReservationTab];
  const statusColor = statusConfig?.color || '#64748b';

  const statusLabel = useMemo(() => {
    const tab = TAB_CONFIG[reservation.statut as ReservationTab];
    return tab ? t(tab.labelKey) : t('status.all');
  }, [reservation.statut, t]);

  const handleAnnuler = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!confirm(t('reservations.cancel.confirm'))) return;
    await onAnnuler(reservation.id);
  };

  const handleSupprimer = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!confirm(t('reservations.delete.confirm'))) return;
    await onSupprimer(reservation.id);
  };

  const isPending = reservation.statut === 'EN_ATTENTE' || reservation.statut === 'DISPONIBLE';
  const formattedDate = fmt(reservation.dateReservation, locale);

  return (
    <div className="res-card" style={{ animationDelay: `${index * 50}ms` }}>
      {/* Accent bar left */}
      <div className="res-card-accent" style={{ background: statusColor }} />

      {/* Main content */}
      <div className="res-card-body">
        {/* Left: book info */}
        <div className="res-card-book">
          <div className="res-card-cover" style={{ background: 'linear-gradient(135deg, #1e3a5f, #2c5282)' }}>
            <span className="res-card-cover-text">{reservation.livreTitre.charAt(0)}</span>
          </div>
          <div className="res-card-book-info">
            <div className="res-card-book-title">{reservation.livreTitre}</div>
            <div className="res-card-book-meta">Livre #{reservation.livreId}</div>
          </div>
        </div>

        {/* Center: user + date */}
        <div className="res-card-user">
          <div className="res-card-avatar" style={{ background: userColor }}>
            {userInitials}
          </div>
          <div>
            <div className="res-card-user-name">{reservation.adherentNom}</div>
            <div className="res-card-date">{formattedDate}</div>
          </div>
        </div>

        {/* Right: status + actions */}
        <div className="res-card-right">
          <span className="res-card-status" style={{
            background: `${statusColor}15`,
            color: statusColor,
            borderColor: `${statusColor}30`,
          }}>
            <span className="res-card-status-dot" style={{ background: statusColor }} />
            {statusLabel}
          </span>

          <div className="res-card-actions">
            {isPending && (
              <button className="res-btn-danger" onClick={handleAnnuler}>
                {t('reservations.cancel')}
              </button>
            )}
            <button className="res-btn-ghost" onClick={handleSupprimer}>
              {t('reservations.delete')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
