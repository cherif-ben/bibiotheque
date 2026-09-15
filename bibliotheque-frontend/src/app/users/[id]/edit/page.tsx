'use client';

import { useParams } from 'next/navigation';
import { UserForm } from '@/features/users';

export default function EditUserPage() {
  const params = useParams<{ id: string }>();
  return <UserForm id={params.id} backHref={`/users/${params.id}`} />;
}
