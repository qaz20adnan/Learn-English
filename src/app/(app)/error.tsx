'use client';

import { ErrorPanel } from '@/components/ui/ErrorPanel';

/** Error boundary inside the learner shell — keeps the nav/footer mounted. */
export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErrorPanel error={error} reset={reset} withNavHint />;
}
