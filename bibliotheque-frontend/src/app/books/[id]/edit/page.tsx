'use client';

import { useParams } from 'next/navigation';
import { BookForm } from '@/features/books';

export default function EditBookPage() {
  const params = useParams<{ id: string }>();
  return <BookForm id={params.id} backHref={`/books/${params.id}`} />;
}
