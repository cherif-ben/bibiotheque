'use client';

import { useMemo, useState } from 'react';
import type { Borrow } from '../borrows.types';
import type { Reservation } from '@/features/reservations/reservations.types';
import { useI18n } from '@/shared/i18n';

interface ActivityChartProps {
  borrows: Borrow[];
  reservations: Reservation[];
  loading: boolean;
}

interface ActivityDay {
  key: string;
  date: Date;
  borrows: number;
  reservations: number;
}

const CHART_WIDTH = 720;
const CHART_HEIGHT = 246;
const PADDING = { top: 22, right: 24, bottom: 42, left: 36 };

function dateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function startOfDay(date: Date) {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

function toDayKey(raw: string) {
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return raw.slice(0, 10);
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? null : dateKey(parsed);
}

function buildDays(borrows: Borrow[], reservations: Reservation[]): ActivityDay[] {
  const today = startOfDay(new Date());
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (6 - index));
    return { key: dateKey(date), date, borrows: 0, reservations: 0 };
  });
  const bCounts = new Map(days.map((day) => [day.key, 0]));
  const rCounts = new Map(days.map((day) => [day.key, 0]));

  borrows.forEach(({ issueDate }) => {
    const key = toDayKey(issueDate);
    if (key && bCounts.has(key)) bCounts.set(key, (bCounts.get(key) ?? 0) + 1);
  });

  reservations.forEach(({ dateReservation }) => {
    const key = toDayKey(dateReservation);
    if (key && rCounts.has(key)) rCounts.set(key, (rCounts.get(key) ?? 0) + 1);
  });

  return days.map((day) => ({
    ...day,
    borrows: bCounts.get(day.key) ?? 0,
    reservations: rCounts.get(day.key) ?? 0,
  }));
}

export default function ActivityChart({ borrows, reservations, loading }: ActivityChartProps) {
  const { locale, t } = useI18n();
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const days = useMemo(() => buildDays(borrows, reservations), [borrows, reservations]);
  const totalBorrows = useMemo(() => days.reduce((sum, day) => sum + day.borrows, 0), [days]);
  const totalReservations = useMemo(() => days.reduce((sum, day) => sum + day.reservations, 0), [days]);
  const total = totalBorrows + totalReservations;
  const maxCount = Math.max(...days.map((day) => Math.max(day.borrows, day.reservations)), 1);
  const innerWidth = CHART_WIDTH - PADDING.left - PADDING.right;
  const innerHeight = CHART_HEIGHT - PADDING.top - PADDING.bottom;
  const xFor = (index: number) => PADDING.left + (innerWidth / (days.length - 1)) * index;
  const yFor = (count: number) => PADDING.top + innerHeight - (count / maxCount) * innerHeight;

  const borrowPoints = days.map((day, index) => ({ x: xFor(index), y: yFor(day.borrows) }));
  const reservationPoints = days.map((day, index) => ({ x: xFor(index), y: yFor(day.reservations) }));

  const borrowLinePath = borrowPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const borrowAreaPath = `${borrowLinePath} L ${borrowPoints.at(-1)?.x ?? 0} ${PADDING.top + innerHeight} L ${borrowPoints[0]?.x ?? 0} ${PADDING.top + innerHeight} Z`;

  const reservationLinePath = reservationPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const reservationAreaPath = `${reservationLinePath} L ${reservationPoints.at(-1)?.x ?? 0} ${PADDING.top + innerHeight} L ${reservationPoints[0]?.x ?? 0} ${PADDING.top + innerHeight} Z`;

  const dayFormatter = useMemo(
    () => new Intl.DateTimeFormat(locale === 'fr' ? 'fr-FR' : 'en-US', { weekday: 'short', day: 'numeric' }),
    [locale],
  );
  const fullDateFormatter = useMemo(
    () => new Intl.DateTimeFormat(locale === 'fr' ? 'fr-FR' : 'en-US', { weekday: 'long', day: 'numeric', month: 'long' }),
    [locale],
  );

  const currentDay = activeIndex === null ? days.at(-1) : days[activeIndex];
  const valueDescription = currentDay
    ? `${fullDateFormatter.format(currentDay.date)} · ${currentDay.borrows} ${t('dashboard.activity.borrowCount')} · ${currentDay.reservations} ${t('dashboard.activity.reservationCount')}`
    : '';

  return (
    <section className="activity-chart dashboard-panel" aria-labelledby="activity-chart-title">
      <header className="activity-chart-header">
        <div>
          <p className="panel-kicker">{t('dashboard.activity.kicker')}</p>
          <h2 id="activity-chart-title">{t('dashboard.activity.title')}</h2>
          <p>{t('dashboard.activity.subtitle')}</p>
        </div>
        <div className="activity-chart-total" aria-label={`${t('dashboard.activity.total')}: ${total}`}>
          <span>{t('dashboard.activity.total')}</span>
          <strong>{total}</strong>
        </div>
      </header>

      {loading ? (
        <div className="activity-chart-state activity-chart-loading" role="status" aria-live="polite">
          <span aria-hidden="true" />
          {t('dashboard.activity.loading')}
        </div>
      ) : total === 0 ? (
        <div className="activity-chart-state" role="status">
          <span className="activity-chart-empty-mark" aria-hidden="true">—</span>
          <p>{t('dashboard.activity.empty')}</p>
        </div>
      ) : (
        <div className="activity-chart-body">
          <div className="activity-chart-legend">
            <span className="activity-chart-legend-item">
              <span className="activity-chart-legend-dot" style={{ background: '#facc15' }} aria-hidden="true" />
              {t('dashboard.activity.legendBorrows')} ({totalBorrows})
            </span>
            <span className="activity-chart-legend-item">
              <span className="activity-chart-legend-dot" style={{ background: '#3b82f6' }} aria-hidden="true" />
              {t('dashboard.activity.legendReservations')} ({totalReservations})
            </span>
            <output aria-live="polite">{valueDescription}</output>
          </div>
          <svg
            className="activity-chart-svg"
            viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
            role="img"
            aria-label={t('dashboard.activity.aria')}
          >
            <title>{t('dashboard.activity.title')}</title>
            <desc>{t('dashboard.activity.description')}</desc>
            {[0, 0.5, 1].map((ratio) => {
              const y = PADDING.top + innerHeight - innerHeight * ratio;
              return <line className="activity-chart-gridline" key={ratio} x1={PADDING.left} x2={CHART_WIDTH - PADDING.right} y1={y} y2={y} />;
            })}

            {/* Borrow area & line (gold) */}
            <path className="activity-chart-area activity-chart-area-borrows" d={borrowAreaPath} />
            <path className="activity-chart-line activity-chart-line-borrows" d={borrowLinePath} />

            {/* Reservation area & line (blue) */}
            <path className="activity-chart-area activity-chart-area-reservations" d={reservationAreaPath} />
            <path className="activity-chart-line activity-chart-line-reservations" d={reservationLinePath} />

            {days.map((day, index) => {
              const isLast = index === days.length - 1;
              const label = `${fullDateFormatter.format(day.date)}: ${day.borrows} ${t('dashboard.activity.borrowCount')}, ${day.reservations} ${t('dashboard.activity.reservationCount')}`;
              return (
                <g className="activity-chart-point" key={day.key}>
                  <circle className="activity-chart-hit-area" cx={xFor(index)} cy={yFor(Math.max(day.borrows, day.reservations))} r="18" tabIndex={0} role="button" aria-label={label} onFocus={() => setActiveIndex(index)} onBlur={() => setActiveIndex(null)} onMouseEnter={() => setActiveIndex(index)} onMouseLeave={() => setActiveIndex(null)} />
                  <title>{label}</title>
                  {day.borrows > 0 && (
                    <>
                      <circle className={isLast ? 'activity-chart-dot activity-chart-dot-last' : 'activity-chart-dot'} cx={borrowPoints[index].x} cy={borrowPoints[index].y} r={isLast ? 5.5 : 3.5} fill="#facc15" stroke="#facc15" />
                      <text className="activity-chart-label" x={borrowPoints[index].x} y={yFor(day.borrows) - 10} textAnchor="middle" fill="#a58020" fontWeight="700" fontSize="11">{day.borrows}</text>
                    </>
                  )}
                  {day.reservations > 0 && (
                    <>
                      <circle className={isLast ? 'activity-chart-dot activity-chart-dot-last' : 'activity-chart-dot'} cx={reservationPoints[index].x} cy={reservationPoints[index].y} r={isLast ? 5.5 : 3.5} fill="#3b82f6" stroke="#3b82f6" />
                      <text className="activity-chart-label" x={reservationPoints[index].x} y={yFor(day.reservations) - 10} textAnchor="middle" fill="#2a5da8" fontWeight="700" fontSize="11">{day.reservations}</text>
                    </>
                  )}
                  <text className="activity-chart-label" x={xFor(index)} y={CHART_HEIGHT - 14} textAnchor="middle">{dayFormatter.format(day.date)}</text>
                </g>
              );
            })}
          </svg>
        </div>
      )}
    </section>
  );
}
