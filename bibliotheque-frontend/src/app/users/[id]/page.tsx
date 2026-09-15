'use client';

import { useParams } from 'next/navigation';
import { History } from '@/features/borrows';

export default function UserDetailsPage() {
  const params = useParams<{ id: string }>();
  return <History kind="user" id={params.id} backHref="/users" />;
}
