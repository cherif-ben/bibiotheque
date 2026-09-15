import type { Role } from '@/features/users/users.types';
import type { LoginResponse } from './auth.types';

const keys = { token: 'jwtToken', roles: 'roles', userId: 'userId', name: 'name' };

const normalizeRole = (roleName: string): Role['roleName'] =>
  roleName === 'Admin' ? 'BIBLIOTHECAIRE' : roleName === 'User' ? 'ADHERENT' : roleName as Role['roleName'];

export const auth = {
  get token() {
    return typeof window === 'undefined' ? null : localStorage.getItem(keys.token);
  },

  get roles(): Role[] {
    try {
      return JSON.parse(localStorage.getItem(keys.roles) || '[]').map((role: { roleName: string }) => ({
        roleName: normalizeRole(role.roleName),
      }));
    } catch {
      return [];
    }
  },

  get userId(): number | null {
    const value = localStorage.getItem(keys.userId);
    return value ? Number(value) : null;
  },

  get name(): string {
    return localStorage.getItem(keys.name) || '';
  },

  hasRole(role: Role['roleName']) {
    return this.roles.some((item) => item.roleName === role);
  },

  save(response: LoginResponse) {
    localStorage.setItem(keys.token, response.jwtToken);
    const roles = response.user.role.map((role) => ({
      roleName: normalizeRole(role.roleName),
    }));
    localStorage.setItem(keys.roles, JSON.stringify(roles));
    localStorage.setItem(keys.userId, String(response.user.userId));
    localStorage.setItem(keys.name, response.user.name);
  },

  clear() {
    Object.values(keys).forEach((key) => localStorage.removeItem(key));
  },
};
