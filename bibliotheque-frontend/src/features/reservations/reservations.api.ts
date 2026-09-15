import { api } from '@/shared/api/client';
import type { Reservation, ReservationStatus } from './reservations.types';

interface ApiErrorBody {
  message?: string;
  error?: string;
}

interface ApiError {
  response?: {
    status?: number;
    data?: ApiErrorBody;
  };
}

function isApiError(error: unknown): error is ApiError {
  return typeof error === 'object' && error !== null && 'response' in error;
}

/** Traduit les réponses métier du backend en un retour utilisable dans l'interface. */
export function reservationErrorMessage(error: unknown, action: 'creation' | 'annulation'): string {
  const apiError = isApiError(error) ? error : undefined;
  const status = apiError?.response?.status;
  const serverMessage = apiError?.response?.data?.message || apiError?.response?.data?.error;

  if (status === 400) return serverMessage || 'Les informations envoyées ne sont pas valides.';
  if (status === 404) return 'Le livre ou l’adhérent sélectionné n’existe plus.';
  if (status === 409) return serverMessage || 'Cette opération est refusée par les règles de réservation.';
  if (!status) return 'Le serveur est injoignable. Vérifiez votre connexion puis réessayez.';
  return action === 'creation'
    ? 'La réservation n’a pas pu être créée. Réessayez dans un instant.'
    : 'La réservation n’a pas pu être annulée. Réessayez dans un instant.';
}

export const reservationsApi = {
  list: (statut?: ReservationStatus) =>
    api.get<Reservation[]>('/api/reservations', { params: statut ? { statut } : {} }).then((r) => r.data),
  get: (id: number) =>
    api.get<Reservation>(`/api/reservations/${id}`).then((r) => r.data),
  byUser: (id: number) =>
    api.get<Reservation[]>('/api/reservations', { params: { adherentId: id } }).then((r) => r.data),
  create: (livreId: number, adherentId: number) =>
    api.post<Reservation>('/api/reservations', { livreId, adherentId }).then((r) => r.data),
  cancel: (id: number) =>
    api.patch<Reservation>(`/api/reservations/${id}/annuler`, {}).then((r) => r.data),
  remove: (id: number) => api.delete(`/api/reservations/${id}`),
};
