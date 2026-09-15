import { api } from '@/shared/api/client';
import type { Book } from './books.types';

export const booksApi = {
  list: () => api.get<Book[]>('/admin/books').then((r) => r.data),
  get: (id: string) => api.get<Book>(`/admin/books/${id}`).then((r) => r.data),
  create: (book: Omit<Book, 'bookId'>) => api.post('/admin/books', book),
  update: (id: string, book: Book) => api.put(`/admin/books/${id}`, book),
  remove: (id: number) => api.delete(`/admin/books/${id}`),
};
