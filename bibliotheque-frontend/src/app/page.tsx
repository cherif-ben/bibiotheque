'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import AppShell from '@/shared/ui/AppShell';
import { useI18n } from '@/shared/i18n';
import { auth } from '@/features/auth/auth.service';
import { useAllBorrows, useBorrowsByUser } from '@/features/borrows';
import { useReservations } from '@/features/reservations';
import ActivityChart from '@/features/borrows/components/ActivityChart';

function OnboardingIcon({ type }: { type: 'search' | 'book' | 'calendar' | 'return' | 'arrow' | 'check' }) {
  const paths = {
    search: <><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4.5 4.5" /></>,
    book: <><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V4H6.5A2.5 2.5 0 0 0 4 6.5v13z" /><path d="M4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5" /></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 10h18" /><path d="m9.5 15 2 2 3.5-3.5" /></>,
    return: <><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V4H6.5A2.5 2.5 0 0 0 4 6.5v13z" /><path d="m13 8-3 3 3 3" /><path d="M10 11h9" /></>,
    arrow: <><path d="M5 12h13" /><path d="m13 6 6 6-6 6" /></>,
    check: <path d="m5 12 4 4L19 6" />,
  };

  return (
    <svg className="onboarding-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {paths[type]}
    </svg>
  );
}

export default function Home() {
  const { t } = useI18n();
  const [mounted, setMounted] = useState(false);
  const isAuthenticated = mounted && !!auth.token;
  const isLibrarian = mounted && auth.hasRole('BIBLIOTHECAIRE');
  // Keep both hooks at the top level. The selected data set changes with the
  // role, while React's hook order remains stable across every render.
  const allBorrows = useAllBorrows(isAuthenticated && isLibrarian);
  const userBorrows = useBorrowsByUser(isAuthenticated && !isLibrarian ? auth.userId : null);
  const allReservations = useReservations('TOUS');

  useEffect(() => {
    setMounted(true);
  }, []);

  const logged = isAuthenticated;
  const activityBorrows = isLibrarian ? allBorrows.items : userBorrows.items;
  const activityReservations = allReservations.items;
  const activityLoading = !mounted || (isLibrarian ? allBorrows.loading : userBorrows.loading) || allReservations.loading;

  if (!logged) {
    return (
      <AppShell hideSidebar>
        <div className="onboarding-page">
          <div className="onboarding-brand" aria-label={t('onboarding.brand')}>
            <span className="onboarding-brand-mark" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 11 12 4l9 7" />
                <path d="M5.5 9.8V20h13V9.8" />
                <path d="M9.5 20v-5.5h5V20" />
                <path d="M12 4V2.5" />
              </svg>
            </span>
            <span className="onboarding-brand-copy"><strong>{t('onboarding.brand')}</strong><small>{t('onboarding.brandTag')}</small></span>
          </div>
          <section className="onboarding-hero" aria-labelledby="onboarding-title">
            <div className="onboarding-hero-copy">
              <p className="onboarding-overline"><span className="onboarding-status-dot" aria-hidden="true" /> {t('onboarding.overline')}</p>
              <h1 id="onboarding-title">{t('onboarding.hero.title')}<br /><em>{t('onboarding.hero.titleAccent')}</em></h1>
              <p className="onboarding-lead">{t('onboarding.hero.lead')}</p>
              <div className="onboarding-actions">
                <Link className="onboarding-cta" href="/login">{t('onboarding.cta.login')} <OnboardingIcon type="arrow" /></Link>
                <a className="onboarding-text-link" href="#fonctionnement">{t('onboarding.cta.discover')}</a>
              </div>
            </div>
            <div className="onboarding-hero-aside" aria-label={t('onboarding.aria.essentials')}>
              <div className="onboarding-aside-top"><span>{t('onboarding.essentials')}</span><span className="onboarding-aside-mark">01 / 04</span></div>
              <div className="onboarding-book-stack" aria-hidden="true">
                <span className="book-spine book-spine-olive" />
                <span className="book-spine book-spine-gold" />
                <span className="book-spine book-spine-cream" />
              </div>
              <div className="onboarding-preview" aria-label={t('onboarding.preview.aria')}>
                <div className="onboarding-preview-header"><span>{t('onboarding.preview.title')}</span><span className="onboarding-preview-dot" /></div>
                <div className="onboarding-preview-row"><span className="onboarding-preview-icon"><OnboardingIcon type="book" /></span><span><strong>{t('onboarding.preview.borrows')}</strong><small>{t('onboarding.preview.borrowsCount')}</small></span><b>›</b></div>
                <div className="onboarding-preview-row"><span className="onboarding-preview-icon"><OnboardingIcon type="calendar" /></span><span><strong>{t('onboarding.preview.reservations')}</strong><small>{t('onboarding.preview.reservationsCount')}</small></span><b>›</b></div>
              </div>
              <p>{t('onboarding.essential.tagline')}</p>
              <div className="onboarding-aside-footer"><span>{t('onboarding.essential.open')}</span><OnboardingIcon type="check" /></div>
            </div>
          </section>

          <section className="onboarding-intro" id="fonctionnement" aria-labelledby="steps-title">
            <div><p className="eyebrow">{t('onboarding.steps.eyebrow')}</p><h2 id="steps-title">{t('onboarding.steps.title')}</h2></div>
            <p>{t('onboarding.steps.description')}</p>
          </section>
          <section className="onboarding-steps" aria-label={t('onboarding.steps.aria')}>
            <article className="onboarding-step"><span className="onboarding-step-number">01</span><div className="onboarding-step-icon"><OnboardingIcon type="search" /></div><h3>{t('onboarding.step.search.title')}</h3><p>{t('onboarding.step.search.text')}</p></article>
            <article className="onboarding-step"><span className="onboarding-step-number">02</span><div className="onboarding-step-icon"><OnboardingIcon type="calendar" /></div><h3>{t('onboarding.step.reserve.title')}</h3><p>{t('onboarding.step.reserve.text')}</p></article>
            <article className="onboarding-step"><span className="onboarding-step-number">03</span><div className="onboarding-step-icon"><OnboardingIcon type="book" /></div><h3>{t('onboarding.step.borrow.title')}</h3><p>{t('onboarding.step.borrow.text')}</p></article>
          </section>

          <section className="onboarding-modules" aria-labelledby="modules-title">
            <div className="onboarding-modules-heading"><div><p className="eyebrow">{t('onboarding.modules.eyebrow')}</p><h2 id="modules-title">{t('onboarding.modules.title')}</h2></div><span className="onboarding-rule" aria-hidden="true" /></div>
            <div className="onboarding-module-grid">
              <article className="onboarding-module onboarding-module-featured"><div className="onboarding-module-icon"><OnboardingIcon type="book" /></div><div><p className="module-label">{t('onboarding.module.catalogue.label')}</p><h3>{t('onboarding.module.catalogue.title')}</h3><p>{t('onboarding.module.catalogue.text')}</p><Link href="/login">{t('onboarding.module.catalogue.link')} <OnboardingIcon type="arrow" /></Link></div></article>
              <article className="onboarding-module"><div className="onboarding-module-icon"><OnboardingIcon type="calendar" /></div><p className="module-label">{t('onboarding.module.borrows.label')}</p><h3>{t('onboarding.module.borrows.title')}</h3><p>{t('onboarding.module.borrows.text')}</p></article>
              <article className="onboarding-module"><div className="onboarding-module-icon"><OnboardingIcon type="search" /></div><p className="module-label">{t('onboarding.module.reservations.label')}</p><h3>{t('onboarding.module.reservations.title')}</h3><p>{t('onboarding.module.reservations.text')}</p></article>
              <article className="onboarding-module onboarding-module-return"><div className="onboarding-module-icon"><OnboardingIcon type="return" /></div><p className="module-label">{t('onboarding.module.returns.label')}</p><h3>{t('onboarding.module.returns.title')}</h3><p>{t('onboarding.module.returns.text')}</p></article>
            </div>
          </section>
          <section className="onboarding-audience" aria-labelledby="audience-title">
            <div className="onboarding-audience-heading">
              <p className="eyebrow">{t('onboarding.audience.eyebrow')}</p>
              <h2 id="audience-title">{t('onboarding.audience.title')}</h2>
              <p>{t('onboarding.audience.description')}</p>
            </div>
            <div className="onboarding-audience-grid">
              <article className="onboarding-audience-card">
                <div className="onboarding-audience-icon"><OnboardingIcon type="search" /></div>
                <div><p className="module-label">{t('onboarding.audience.readers.label')}</p><h3>{t('onboarding.audience.readers.title')}</h3><p>{t('onboarding.audience.readers.text')}</p></div>
                <span className="onboarding-audience-note"><OnboardingIcon type="check" /> {t('onboarding.audience.readers.note')}</span>
              </article>
              <article className="onboarding-audience-card">
                <div className="onboarding-audience-icon"><OnboardingIcon type="calendar" /></div>
                <div><p className="module-label">{t('onboarding.audience.members.label')}</p><h3>{t('onboarding.audience.members.title')}</h3><p>{t('onboarding.audience.members.text')}</p></div>
                <span className="onboarding-audience-note"><OnboardingIcon type="check" /> {t('onboarding.audience.members.note')}</span>
              </article>
              <article className="onboarding-audience-card">
                <div className="onboarding-audience-icon"><OnboardingIcon type="book" /></div>
                <div><p className="module-label">{t('onboarding.audience.staff.label')}</p><h3>{t('onboarding.audience.staff.title')}</h3><p>{t('onboarding.audience.staff.text')}</p></div>
                <span className="onboarding-audience-note"><OnboardingIcon type="check" /> {t('onboarding.audience.staff.note')}</span>
              </article>
            </div>
          </section>
          <section className="onboarding-bottom-cta" aria-label={t('onboarding.bottom.aria')}><div><p className="eyebrow">{t('onboarding.bottom.eyebrow')}</p><h2>{t('onboarding.bottom.title')}</h2></div><Link className="onboarding-cta onboarding-cta-light" href="/login">{t('onboarding.bottom.cta')} <OnboardingIcon type="arrow" /></Link></section>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <section className="dashboard-heading">
        <div>
          <p className="eyebrow">{t('home.quickAccess')}</p>
          <h1>{t('home.title')}</h1>
          <p>{t('home.subtitle')}</p>
        </div>
        {logged ? (
          <Link className="dashboard-primary-action" href="/books/borrow">
            {t('nav.borrowBooks')} <span aria-hidden="true">→</span>
          </Link>
        ) : (
          <Link className="dashboard-primary-action" href="/login">
            {t('home.cta')} <span aria-hidden="true">→</span>
          </Link>
        )}
      </section>

      {logged && (
        <>
        <section className="dashboard-grid" aria-label={t('home.quickAccess')}>
          <article className="dashboard-panel dashboard-tasks">
            <div className="panel-heading">
              <div>
                <h2>{t('home.quickAccess')}</h2>
                <p>{t('home.subtitle')}</p>
              </div>
              <span className="panel-count">3 actions</span>
            </div>
            <Link className="dashboard-task" href="/reservations">
              <span className="task-icon task-blue">▤</span>
              <span className="task-copy"><strong>{t('nav.reservations')}</strong><small>Suivre les demandes et disponibilités</small></span>
              <span className="task-link">Voir →</span>
            </Link>
            <Link className="dashboard-task" href="/books/borrow">
              <span className="task-icon task-orange">▥</span>
              <span className="task-copy"><strong>{t('nav.borrowBooks')}</strong><small>Consulter les ouvrages disponibles</small></span>
              <span className="task-link">Ouvrir →</span>
            </Link>
            <Link className="dashboard-task task-alert" href="/return-book">
              <span className="task-icon task-red">!</span>
              <span className="task-copy"><strong>{t('nav.returnBook')}</strong><small>Gérer les retours en cours</small></span>
              <span className="task-link">Gérer →</span>
            </Link>
          </article>

          <div className="dashboard-side-stack">
            <article className="dashboard-panel metrics-panel">
              <p className="panel-kicker">Chiffres clés</p>
              <div className="metric-row"><span>Ouvrages au catalogue</span><strong>8</strong><small>25 exemplaires</small></div>
              <div className="metric-row"><span>Adhérents</span><strong>4</strong><small>1 suspendu(s)</small></div>
              <div className="metric-row"><span>Emprunts en cours</span><strong>3</strong><small>1 en retard</small></div>
              <div className="metric-row"><span>Réservations ouvertes</span><strong>2</strong><small>1 prête à retirer</small></div>
            </article>
            <article className="dashboard-panel deadline-panel">
              <p className="panel-kicker">◷ Échéances sous 5 jours</p>
              <Link className="deadline-row" href="/borrows"><span className="avatar-soft">SE</span><span><strong>Structure et interprétation</strong><small>Salma El Fassi</small></span><b>J+5</b></Link>
              <Link className="panel-footer-link" href="/borrows">▣ Voir tous les emprunts</Link>
            </article>
          </div>
        </section>
        <ActivityChart borrows={activityBorrows} reservations={activityReservations} loading={activityLoading} />
        </>
      )}
    </AppShell>
  );
}
