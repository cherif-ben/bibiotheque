'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { auth } from '@/features/auth/auth.service';
import { useI18n } from '@/shared/i18n';

interface Props {
  /** Classe CSS supplémentaire appliquée au conteneire racine. */
  className?: string;
  /** Séparateur de section en haut de la liste. */
  heading?: string;
}

/* ── Icônes SVG inline (stroke = currentColor) ─────────────────────────── */
const icon = (path: React.ReactNode) => (
  <svg
    viewBox="0 0 24 24"
    width="18"
    height="18"
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
  bookmark: icon(<><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" /></>),
  clock: icon(<><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></>),
  search: icon(<><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></>),
  grid: icon(<><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /></>),
  list: icon(<><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" /></>),
  fileText: icon(<><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><path d="M14 2v6h6" /><path d="M16 13H8M16 17H8M10 9H8" /></>),
  settings: icon(<><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" /></>),
  chevronDown: icon(<><path d="m6 9 6 6 6-6" /></>),
};

const LINKS = [
  { href: '/books', labelKey: 'nav.books', icon: ICONS.grid },
  { href: '/books/create', labelKey: 'nav.addBook', icon: ICONS.fileText },
  { href: '/reservations', labelKey: 'nav.reservations', icon: ICONS.clock },
  { href: '/borrows', labelKey: 'nav.allBorrows', icon: ICONS.list },
  { href: '/users', labelKey: 'nav.users', icon: ICONS.search },
];

export default function SidebarAlerte({ className = '', heading = '' }: Props) {
  const pathname = usePathname();
  const { t } = useI18n();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(href + '/');

  return (
    <nav
      className={`mini-sidebar ${className}`}
      aria-label="Accès rapide"
      data-open={open ? 'true' : undefined}
    >
      <button
        className="mini-sidebar-toggle"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="mini-sidebar-panel"
      >
        <span className="mini-sidebar-toggle-mark" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M4 7h16M4 12h16M4 17h10" />
          </svg>
        </span>
        <span className="mini-sidebar-toggle-label">{t('nav.section.library')}</span>
        <span className="mini-sidebar-toggle-chevron" aria-hidden="true">
          {ICONS.chevronDown}
        </span>
      </button>

      <div id="mini-sidebar-panel" className="mini-sidebar-panel" role="region">
        {heading && <p className="mini-sidebar-heading">{heading}</p>}
        <ul className="mini-sidebar-list">
          {LINKS.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className={`mini-sidebar-link ${isActive(link.href) ? 'active' : ''}`}
              >
                <span className="mini-sidebar-link-icon" aria-hidden="true">
                  {link.icon}
                </span>
                <span>{t(link.labelKey)}</span>
              </Link>
            </li>
          ))}
        </ul>

        <div className="mini-sidebar-foot">
          <span className="mini-sidebar-foot-note">
            {t('nav.section.brandTag')}
          </span>
        </div>
      </div>
    </nav>
  );
}
