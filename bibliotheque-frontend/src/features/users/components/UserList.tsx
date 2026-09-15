'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useUsers } from '../useUsers';
import { getRole } from '@/shared/utils';
import { Shell, Notice } from '@/shared/ui';
import { useI18n } from '@/shared/i18n';
import Pagination from '@/shared/components/Pagination';

const PAGE_SIZE = 5;

export default function UserList() {
  const { t } = useI18n();
  const router = useRouter();
  const { users, error } = useUsers();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const filteredUsers = useMemo(() => {
    const q = search.toLowerCase();
    return users.filter((u) =>
      u.name.toLowerCase().includes(q) ||
      u.username.toLowerCase().includes(q) ||
      getRole(u).toLowerCase().includes(q),
    );
  }, [users, search]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE));
  const pageUsers = filteredUsers.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const admins = users.filter((u) => getRole(u) === 'BIBLIOTHECAIRE');
  const adherents = users.filter((u) => getRole(u) === 'ADHERENT');

  const roleColors: Record<string, { bg: string; color: string; label: string }> = {
    BIBLIOTHECAIRE: { bg: '#f59e0b15', color: '#f59e0b', label: 'Administrateur' },
    ADHERENT: { bg: '#3b82f615', color: '#3b82f6', label: 'Adhérent' },
  };

  const handlePageChange = (p: number) => setPage(p);

  return (
    <Shell allowed={['BIBLIOTHECAIRE']} backHref="/">
      {/* Header */}
      <div className="users-header">
        <div className="users-header-text">
          <h1>{t('users.title')}</h1>
          <p className="users-subtitle">Gérez les comptes et les rôles</p>
        </div>
        <div className="users-header-stats">
          <div className="users-stat">
            <span className="users-stat-num">{users.length}</span>
            <span className="users-stat-label">Total</span>
          </div>
          <div className="users-stat">
            <span className="users-stat-num" style={{ color: '#f59e0b' }}>{admins.length}</span>
            <span className="users-stat-label">Admins</span>
          </div>
          <div className="users-stat">
            <span className="users-stat-num" style={{ color: '#3b82f6' }}>{adherents.length}</span>
            <span className="users-stat-label">Adhérents</span>
          </div>
        </div>
        <Link className="users-add-btn" href="/users/register">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
          {t('users.add')}
        </Link>
      </div>

      {/* Search */}
      <div className="users-search">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="users-search-icon">
          <circle cx="11" cy="11" r="7" />
          <path d="m21 21-4.35-4.35" />
        </svg>
        <input
          type="text"
          placeholder="Rechercher par nom, identifiant ou rôle…"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="users-search-input"
        />
        {search && (
          <button className="users-search-clear" onClick={() => setSearch('')} aria-label="Effacer">
            ✕
          </button>
        )}
      </div>

      <Notice text={error} />

      {/* User list */}
      {pageUsers.length === 0 ? (
        <section className="empty-state">
          <div className="empty-state-icon" aria-hidden="true">👤</div>
          <h2>Aucun utilisateur trouvé</h2>
          <p>{search ? 'Aucun résultat pour votre recherche.' : 'Aucun utilisateur enregistré.'}</p>
        </section>
      ) : (
        <>
          <div className="users-list">
            <div className="users-list-header">
              <span className="users-list-th users-list-th-name">{t('users.name')}</span>
              <span className="users-list-th users-list-th-username">{t('users.username')}</span>
              <span className="users-list-th users-list-th-role">{t('users.role')}</span>
              <span className="users-list-th users-list-th-id">{t('users.id')}</span>
              <span className="users-list-th users-list-th-actions">{t('users.actions')}</span>
            </div>
            {pageUsers.map((user, idx) => {
              const role = getRole(user);
              const roleConfig = roleColors[role] || roleColors['ADHERENT'];
              const initials = user.name
                .split(' ')
                .filter(Boolean)
                .slice(0, 2)
                .map((w) => w[0]!.toUpperCase())
                .join('');

              return (
                <div key={user.userId} className="users-list-row" style={{ animationDelay: `${idx * 30}ms` }}>
                  <div className="users-list-cell users-list-cell-name">
                    <div className="users-list-avatar" style={{ background: roleConfig.color }}>
                      {initials}
                    </div>
                    <span className="users-list-name">{user.name}</span>
                  </div>
                  <span className="users-list-cell users-list-cell-username">{user.username}</span>
                  <span className="users-list-cell users-list-cell-role">
                    <span className="users-list-role-badge" style={{ background: roleConfig.bg, color: roleConfig.color, borderColor: `${roleConfig.color}30` }}>
                      <span className="users-list-role-dot" style={{ background: roleConfig.color }} />
                      {roleConfig.label}
                    </span>
                  </span>
                  <span className="users-list-cell users-list-cell-id">#{user.userId}</span>
                  <div className="users-list-cell users-list-cell-actions">
                    {role === 'ADHERENT' && (
                      <button
                        className="user-btn-primary"
                        onClick={() => router.push(`/users/${user.userId}`)}
                      >
                        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M8 6h13M8 12h13M8 18h13" />
                          <circle cx="4" cy="6" r="1" /><circle cx="4" cy="12" r="1" /><circle cx="4" cy="18" r="1" />
                        </svg>
                        {t('books.history')}
                      </button>
                    )}
                    <button
                      className="user-btn-secondary"
                      onClick={() => router.push(`/users/${user.userId}/edit`)}
                    >
                      {t('books.edit')}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          <Pagination
            page={page}
            totalPages={totalPages}
            total={filteredUsers.length}
            pageSize={PAGE_SIZE}
            onChange={handlePageChange}
            infoKey="users.pagination.info"
            prevKey="users.pagination.prev"
            nextKey="users.pagination.next"
          />
        </>
      )}
    </Shell>
  );
}
