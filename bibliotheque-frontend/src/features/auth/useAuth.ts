'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from './auth.service';
import { authApi } from './auth.api';

export function useAuth() {
  const router = useRouter();
  const [state, setState] = useState({
    logged: false,
    admin: false,
    user: false,
    name: '',
  });

  useEffect(() => {
    setState({
      logged: !!auth.token,
      admin: auth.hasRole('BIBLIOTHECAIRE'),
      user: auth.hasRole('ADHERENT'),
      name: auth.name,
    });
  }, []);

  const login = useCallback(
    async (username: string, password: string) => {
      const data = await authApi.login({ username, password });
      auth.save(data);
      const isBibliothecaire = data.user.role?.[0]?.roleName === 'BIBLIOTHECAIRE';
      router.push(isBibliothecaire ? '/books' : '/books/borrow');
    },
    [router],
  );

  const logout = useCallback(() => {
    auth.clear();
    router.push('/login');
    router.refresh();
  }, [router]);

  return { ...state, login, logout };
}
