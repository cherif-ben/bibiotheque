'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { usersApi } from '../users.api';
import { useUser } from '../useUsers';
import type { User } from '../users.types';
import { blankUser, getRole } from '@/shared/utils';
import { Shell, Form } from '@/shared/ui';
import { useI18n } from '@/shared/i18n';

interface Props {
  id?: string;
  backHref?: string;
}

export default function UserForm({ id, backHref }: Props) {
  const { t } = useI18n();
  const { user: loadedUser } = useUser(id);
  const [user, setUser] = useState<User>(blankUser());
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    if (loadedUser) setUser(loadedUser);
  }, [loadedUser]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (id) {
        await usersApi.update(id, user);
      } else {
        await usersApi.create(user);
      }
      router.push('/users');
    } catch {
      setError(t('users.save.error'));
    }
  };

  return (
    <Shell allowed={['BIBLIOTHECAIRE']} backHref={backHref}>
      <Form title={id ? t('users.update') : t('users.register')} error={error} onSubmit={submit}>
        <input
          required
          value={user.name}
          placeholder={t('users.fullName')}
          onChange={(e) => setUser({ ...user, name: e.target.value })}
        />
        <input
          required
          value={user.username}
          placeholder={t('auth.username.placeholder')}
          onChange={(e) => setUser({ ...user, username: e.target.value })}
        />
        {!id && (
          <input
            required
            type="password"
            value={user.password}
            placeholder={t('auth.password')}
            onChange={(e) => setUser({ ...user, password: e.target.value })}
          />
        )}
        <select
          value={getRole(user)}
          onChange={(e) =>
            setUser({ ...user, role: [{ roleName: e.target.value as 'BIBLIOTHECAIRE' | 'ADHERENT' }] })
          }
        >
          <option value="ADHERENT">{t('users.role.user')}</option>
          <option value="BIBLIOTHECAIRE">{t('users.role.admin')}</option>
        </select>
      </Form>
    </Shell>
  );
}
