'use client';

import { ErrorPanel } from '@/components/ui/ErrorPanel';

/** Error boundary inside the admin shell — keeps the admin layout mounted. */
export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErrorPanel error={error} reset={reset} withNavHint />;
}
