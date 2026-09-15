'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { auth } from '@/features/auth/auth.service';

interface Props {
  children: React.ReactNode;
  allowed?: ('BIBLIOTHECAIRE' | 'ADHERENT')[];
}

export default function Guard({ children, allowed }: Props) {
  const router = useRouter();
  const [ok, setOk] = useState(false);

  useEffect(() => {
    if (!auth.token) {
      router.replace('/login');
    } else if (allowed && allowed.length > 0 && !allowed.some((r) => auth.hasRole(r))) {
      router.replace('/forbidden');
    } else {
      setOk(true);
    }
  }, [allowed, router]);

  if (!ok) {
    return (
      <div className="loading" style={{ padding: '80px 20px' }}>
        Chargement…
      </div>
    );
  }

  return <>{children}</>;
}
