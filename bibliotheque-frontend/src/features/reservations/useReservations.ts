'use client';

import { useCallback, useEffect, useState } from 'react';
import { reservationErrorMessage, reservationsApi } from './reservations.api';
import type { Reservation, ReservationFilter, ReservationStatus } from './reservations.types';
import { tr } from '@/shared/i18n';

export type ReservationStatusCounts = Record<ReservationFilter, number>;

const emptyCounts = (): ReservationStatusCounts => ({
  TOUS: 0,
  EN_ATTENTE: 0,
  DISPONIBLE: 0,
  ANNULEE: 0,
  EXPIREE: 0,
  HONOREE: 0,
});

function toCounts(reservations: Reservation[]): ReservationStatusCounts {
  const counts = emptyCounts();
  counts.TOUS = reservations.length;
  reservations.forEach((reservation) => {
    counts[reservation.statut as ReservationStatus] += 1;
  });
  return counts;
}

export function useReservations(statutFiltre: ReservationFilter = 'TOUS') {
  const [allItems, setAllItems] = useState<Reservation[]>([]);
  const [items, setItems] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusCounts, setStatusCounts] = useState<ReservationStatusCounts>(emptyCounts);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [sortBy, setSortBy] = useState<'dateExpiration' | 'dateReservation'>('dateExpiration');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  /** Slice allItems for the current page and update `items`. */
  const slicePage = useCallback(
    (all: Reservation[], p: number, size: number) => {
      const start = (p - 1) * size;
      return all.slice(start, start + size);
    },
    [],
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    setPage(1);
    try {
      const param = statutFiltre === 'TOUS' ? undefined : statutFiltre;
      // Fetch all reservations (unfiltered) for accurate status counts
      const allReservations = await reservationsApi.list();
      // If a filter is active, use the filtered result for the list; otherwise use all
      const data = param ? await reservationsApi.list(param) : allReservations;

      const sorted = [...data].sort((a, b) => {
        const aVal = sortBy === 'dateExpiration' ? a.dateExpiration : a.dateReservation;
        const bVal = sortBy === 'dateExpiration' ? b.dateExpiration : b.dateReservation;
        const cmp = aVal.localeCompare(bVal);
        return sortOrder === 'asc' ? cmp : -cmp;
      });

      setAllItems(sorted);
      setTotalItems(sorted.length);
      setItems(slicePage(sorted, 1, pageSize));
      setStatusCounts(toCounts(allReservations));
    } catch (requestError) {
      setError(reservationErrorMessage(requestError, 'creation'));
    } finally {
      setLoading(false);
    }
  }, [statutFiltre, pageSize, sortBy, sortOrder, slicePage]);

  useEffect(() => {
    load();
  }, [load]);

  const changePage = useCallback(
    (nextPage: number) => {
      setPage(nextPage);
      setItems(slicePage(allItems, nextPage, pageSize));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [allItems, pageSize, slicePage],
  );

  const cancel = useCallback(async (id: number) => {
    await reservationsApi.cancel(id);
    await load();
  }, [load]);

  const remove = useCallback(
    async (id: number) => {
      await reservationsApi.remove(id);
      await load();
    },
    [load],
  );

  return { items, loading, error, statusCounts, totalItems, totalPages, page, pageSize, setPageSize, sortBy, setSortBy, sortOrder, setSortOrder, reload: load, changePage, cancel, remove };
}

export function useReservation(id: number | null) {
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    reservationsApi
      .get(id)
      .then(setReservation)
      .catch(() => setError(tr('reservations.notfound')))
      .finally(() => setLoading(false));
  }, [id]);

  return { reservation, loading, error };
}
