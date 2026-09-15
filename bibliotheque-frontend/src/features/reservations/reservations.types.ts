export const RESERVATION_STATUSES = [
  'TOUS',
  'EN_ATTENTE',
  'DISPONIBLE',
  'ANNULEE',
  'EXPIREE',
  'HONOREE',
] as const;

export type ReservationStatus = Exclude<(typeof RESERVATION_STATUSES)[number], 'TOUS'>;
export type ReservationFilter = (typeof RESERVATION_STATUSES)[number];

export interface Reservation {
  id: number;
  livreId: number;
  livreTitre: string;
  adherentId: number;
  adherentNom: string;
  dateReservation: string;
  dateExpiration: string;
  statut: ReservationStatus;
}
