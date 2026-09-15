'use client';

import { useParams } from 'next/navigation';
import { History } from '@/features/borrows';

export default function BookDetailsPage() {
  const params = useParams<{ id: string }>();
  return <History kind="book" id={params.id} backHref="/books" />;
}
