'use client';

import AppShell from './AppShell';
import BackArrow from './BackArrow';

interface Props {
  children: React.ReactNode;
  allowed?: ('BIBLIOTHECAIRE' | 'ADHERENT')[];
  backHref?: string;
}

/** Enveloppe standard des pages : sidebar + décor + animations. */
export default function Shell({ children, allowed, backHref }: Props) {
  return (
    <AppShell allowed={allowed}>
      {backHref && <BackArrow backHref={backHref} />}
      {children}
    </AppShell>
  );
}
