'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '../auth.service';
import { authApi } from '../auth.api';
import { useI18n } from '@/shared/i18n';

export default function Login() {
  const { t } = useI18n();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const d = await authApi.login({ username, password });
      auth.save(d);
      router.push('/');
    } catch {
      setError(t('auth.login.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-screen">
      {/* ── Panneau visuel : grande bibliothèque ── */}
      <div className="auth-visual" aria-hidden="true">
        <div className="auth-quote">
          <span className="auth-quote-mark">“</span>
          <p>{t('auth.quote.text')}</p>
          <small>{t('auth.quote.author')}</small>
        </div>
      </div>

      {/* ── Panneau formulaire ── */}
      <div className="auth-panel">
        <section className="auth-panel-card">
          <h1>{t('auth.login')}</h1>
          {error && <p className="error">{error}</p>}
          <form onSubmit={handleSubmit} className="stagger">
            <div>
              <label htmlFor="username">{t('auth.username')}</label>
              <input
                id="username"
                required
                value={username}
                placeholder={t('auth.username.placeholder')}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
              />
            </div>
            <div>
              <label htmlFor="password">{t('auth.password')}</label>
              <input
                id="password"
                required
                type="password"
                value={password}
                placeholder={t('auth.password.placeholder')}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
            </div>
            <div className="actions">
              <button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <span className="spinner" />
                    {t('auth.login.loading')}
                  </>
                ) : (
                  t('auth.login.submit')
                )}
              </button>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}
