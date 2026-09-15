'use client';

import { useRouter } from 'next/navigation';

interface Props {
  backHref?: string;
  label?: string;
}

export default function BackArrow({ backHref, label = 'Retour' }: Props) {
  const router = useRouter();
  const handleClick = () => {
    if (backHref) {
      router.push(backHref);
    } else {
      router.back();
    }
  };

  return (
    <button className="back-arrow" onClick={handleClick} aria-label={label} type="button">
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M19 12H5" />
        <path d="M12 19l-7-7 7-7" />
      </svg>
      <span>{label}</span>
    </button>
  );
}
