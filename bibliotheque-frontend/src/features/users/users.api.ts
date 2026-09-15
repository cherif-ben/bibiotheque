import { api } from '@/shared/api/client';
import type { User } from './users.types';

export const usersApi = {
  login: (credentials: { username: string; password: string }) =>
    api.post('/authenticate', credentials).then((r) => r.data),
  list: () => api.get<User[]>('/admin/users').then((r) => r.data),
  /** Endpoint public utilisé par les formulaires de réservation. */
  listForReservation: () => api.get<User[]>('/api/users').then((r) => r.data),
  get: (id: string) => api.get<User>(`/admin/users/${id}`).then((r) => r.data),
  create: (user: Omit<User, 'userId'>) => api.post('/admin/users', user),
  update: (id: string, user: User) => api.put(`/admin/users/${id}`, user),
};
