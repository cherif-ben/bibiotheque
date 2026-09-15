import axios from 'axios';
import { auth } from '@/features/auth/auth.service';

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080',
});

api.interceptors.request.use((config) => {
  const token = auth.token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (typeof window !== 'undefined') {
      if (error.response?.status === 401) {
        auth.clear();
        window.location.assign('/login');
      }
      if (error.response?.status === 403) {
        window.location.assign('/forbidden');
      }
    }
    return Promise.reject(error);
  },
);
