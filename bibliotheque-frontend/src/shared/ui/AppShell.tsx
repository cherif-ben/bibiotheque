'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { auth } from '@/features/auth/auth.service';
import { useTheme } from '@/shared/theme';
import { useI18n } from '@/shared/i18n';

interface Props {
  children: React.ReactNode;
  allowed?: ('BIBLIOTHECAIRE' | 'ADHERENT')[];
  hideSidebar?: boolean;
}

/* ── Icônes SVG inline (stroke = currentColor) ─────────────────────────── */
const icon = (path: React.ReactNode) => (
  <svg
    viewBox="0 0 24 24"
    width="19"
    height="19"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {path}
  </svg>
);

const ICONS = {
  home: icon(<><path d="M3 10.5 12 3l9 7.5" /><path d="M5 9.5V21h14V9.5" /><path d="M9.5 21v-6h5v6" /></>),
  books: icon(<><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V4H6.5A2.5 2.5 0 0 0 4 6.5v13z" /><path d="M4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5" /></>),
  bookPlus: icon(<><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V4H6.5A2.5 2.5 0 0 0 4 6.5v13z" /><path d="M12 7.5v6M9 10.5h6" /></>),
  borrow: icon(<><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V4H6.5A2.5 2.5 0 0 0 4 6.5v13z" /><path d="m10 8 3 3-3 3" /></>),
  returnArrow: icon(<><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V4H6.5A2.5 2.5 0 0 0 4 6.5v13z" /><path d="m13 8-3 3 3 3" /></>),
  calendar: icon(<><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 10h18" /><path d="m9.5 15 2 2 3.5-3.5" /></>),
  borrows: icon(<><path d="M8 6h13M8 12h13M8 18h13" /><circle cx="4" cy="6" r="1" /><circle cx="4" cy="12" r="1" /><circle cx="4" cy="18" r="1" /></>),
  users: icon(<><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6" /><path d="M16.5 4.6a3.5 3.5 0 0 1 0 6.8" /><path d="M18.5 14.4c1.8.9 3 2.5 3 4.6" /></>),
  userPlus: icon(<><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6" /><path d="M19 7v6M16 10h6" /></>),
};

/* ── Icône hamburger réutilisable ── */
const hamburgerIcon = (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M4 7h16M4 12h16M4 17h10" />
  </svg>
);

interface NavItem {
  href: string;
  labelKey: string;
  icon: React.ReactNode;
}

interface NavSection {
  titleKey: string;
  items: NavItem[];
}

export default function AppShell({ children, allowed, hideSidebar = false }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const { theme, toggle } = useTheme();
  const { t, locale, setLocale } = useI18n();
  const [menuOpen, setMenuOpen] = useState(false);
  const [authState, setAuthState] = useState({ logged: false, admin: false, user: false, name: '' });

  useEffect(() => {
    setAuthState({
      logged: !!auth.token,
      admin: auth.hasRole('BIBLIOTHECAIRE'),
      user: auth.hasRole('ADHERENT'),
      name: auth.name,
    });
  }, []);

  // Ferme le drawer à chaque navigation
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  const { logged, admin, user, name } = authState;

  const sections: NavSection[] = [
    {
      titleKey: 'nav.section.library',
      items: [
        ...(logged ? [{ href: '/', labelKey: 'nav.home', icon: ICONS.home }] : []),
        ...(admin || user ? [{ href: '/reservations', labelKey: 'nav.reservations', icon: ICONS.calendar }] : []),
        ...(user ? [{ href: '/books/borrow', labelKey: 'nav.borrowBooks', icon: ICONS.borrow }] : []),
        ...(user ? [{ href: '/return-book', labelKey: 'nav.returnBook', icon: ICONS.returnArrow }] : []),
      ],
    },
    {
      titleKey: 'nav.section.manage',
      items: [
        ...(admin ? [{ href: '/books', labelKey: 'nav.books', icon: ICONS.books }] : []),
        ...(admin ? [{ href: '/books/create', labelKey: 'nav.addBook', icon: ICONS.bookPlus }] : []),
        ...(admin ? [{ href: '/borrows', labelKey: 'nav.allBorrows', icon: ICONS.borrows }] : []),
      ],
    },
    {
      titleKey: 'nav.section.admin',
      items: [
        ...(admin ? [{ href: '/users', labelKey: 'nav.users', icon: ICONS.users }] : []),
        ...(admin ? [{ href: '/users/register', labelKey: 'nav.register', icon: ICONS.userPlus }] : []),
      ],
    },
  ].filter((section) => section.items.length > 0);

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(href + '/');

  const handleLogout = () => {
    auth.clear();
    setMenuOpen(false);
    router.push('/login');
    router.refresh();
  };

  return (
    <div className={`app-layout ${hideSidebar ? 'public-layout' : ''}`}>
      {/* Voile mobile */}
      {!hideSidebar && (
        <div
          className={`sidebar-backdrop ${menuOpen ? 'visible' : ''}`}
          onClick={() => setMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ── SIDEBAR ── */}
      {!hideSidebar && <aside className={`sidebar ${menuOpen ? 'open' : ''}`} aria-label="Navigation principale">
        {/* En-tête avec logo */}
        <div className="sidebar-topbar">
          <Link href="/" className="sidebar-brand" onClick={() => setMenuOpen(false)}>
            <span className="sidebar-brand-mark" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 11 12 4l9 7" />
                <path d="M5.5 9.8V20h13V9.8" />
                <path d="M9.5 20v-5.5h5V20" />
                <path d="M12 4V2.5" />
              </svg>
            </span>
            <span className="sidebar-brand-text">
              Bibliothèque
              <small>{t('nav.section.brandTag')}</small>
            </span>
          </Link>
          <button
            className="sidebar-close"
            onClick={() => setMenuOpen(false)}
            aria-label="Fermer le menu"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        </div>

        <nav className="sidebar-nav">
          {logged ? (
            sections.map((section, sIndex) => (
              <div className="sidebar-section" key={section.titleKey} style={{ '--section-delay': `${sIndex * 60}ms` } as React.CSSProperties}>
                <p className="sidebar-section-title">{t(section.titleKey)}</p>
                {section.items.map((item, iIndex) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`sidebar-link ${isActive(item.href) ? 'active' : ''}`}
                    style={{ '--item-delay': `${sIndex * 60 + iIndex * 40}ms` } as React.CSSProperties}
                    onClick={() => setMenuOpen(false)}
                  >
                    <span className="sidebar-link-icon">{item.icon}</span>
                    <span>{t(item.labelKey)}</span>
                  </Link>
                ))}
              </div>
            ))
          ) : (
            <div className="sidebar-section">
              <p className="sidebar-section-title">{t('nav.section.library')}</p>
              <Link href="/login" className="sidebar-link active" onClick={() => setMenuOpen(false)}>
                <span className="sidebar-link-icon">{ICONS.borrow}</span>
                <span>{t('nav.login')}</span>
              </Link>
            </div>
          )}
        </nav>

        {/* ── FOOTER SIDEBAR : action de session ── */}
        <div className="sidebar-footer">
          {logged && (
            <button className="sidebar-chip sidebar-logout" onClick={handleLogout}>
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M10 17l5-5-5-5" />
                <path d="M15 12H3" />
                <path d="M21 3v18" />
              </svg>
              <span>{t('nav.logout')}</span>
            </button>
          )}
        </div>
      </aside>}

      {/* ── COLONNE PRINCIPALE ── */}
      <div className="app-column" data-allowed={allowed ? allowed.join('-') : undefined}>
        <header className="topbar">
          {!hideSidebar && (
            <button
              className="sidebar-hamburger"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Ouvrir le menu"
              aria-expanded={menuOpen}
            >
              {hamburgerIcon}
            </button>
          )}
          <div className="topbar-spacer" />
          <div className="topbar-actions">
            <button
              className="topbar-chip"
              onClick={() => setLocale(locale === 'fr' ? 'en' : 'fr')}
              aria-label={locale === 'fr' ? 'Switch to English' : 'Passer en français'}
            >
              {locale === 'fr' ? 'EN' : 'FR'}
            </button>
            <button
              className="topbar-chip topbar-theme"
              onClick={toggle}
              aria-label={theme === 'dark' ? t('theme.light') : t('theme.dark')}
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
            {logged && (
              <div className="topbar-user" aria-label={name}>
                <span className="topbar-user-avatar" aria-hidden="true">
                  {name ? name.charAt(0).toUpperCase() : '?'}
                </span>
                <span className="topbar-user-meta">
                  <strong>{name}</strong>
                  <small>{admin ? t('users.role.admin') : t('users.role.user')}</small>
                </span>
              </div>
            )}
          </div>
        </header>
        <div className="app-backdrop" aria-hidden="true">
          <span className="orb orb-a" />
          <span className="orb orb-b" />
          <span className="orb orb-c" />
          <span className="orb orb-d" />
        </div>
        <main className="app-main" key={pathname}>
          {children}
        </main>
        <footer className="app-footer">
          <span>Bibliothèque — {t('nav.section.brandTag')}</span>
        </footer>
      </div>
    </div>
  );
}
