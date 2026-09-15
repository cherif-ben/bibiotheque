import { api } from '@/shared/api/client';
import type { LoginRequest, LoginResponse } from './auth.types';

export const authApi = {
  login: (credentials: LoginRequest) =>
    api.post<LoginResponse>('/authenticate', credentials).then((r) => r.data),
};
