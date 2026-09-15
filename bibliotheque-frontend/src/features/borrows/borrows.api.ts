import { api } from '@/shared/api/client';
import type { Borrow } from './borrows.types';

export const borrowApi = {
  list: () => api.get<Borrow[]>('/borrow').then((r) => r.data),
  byUser: (id: number) => api.get<Borrow[]>(`/borrow/user/${id}`).then((r) => r.data),
  byBook: (id: string) => api.get<Borrow[]>(`/borrow/book/${id}`).then((r) => r.data),
  create: (bookId: number, userId: number) => api.post('/borrow', { bookId, userId }),
  return: (borrowId: number) => api.put('/borrow', { borrowId }),
};
