import { Skeleton } from '@/components/ui';

/**
 * Route-level loading skeleton for the learner shell (Stage 2 — D4).
 * Shown while the segment's server components stream in; mirrors the typical
 * page shape (title + stat grid + two content cards).
 */
export default function AppLoading() {
  return (
    <div className="flex flex-col gap-8" aria-busy="true" aria-label="جارٍ التحميل…">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className="h-24" />
        ))}
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        {Array.from({ length: 3 }, (_, index) => (
          <Skeleton key={index} className="h-40" />
        ))}
      </div>
    </div>
  );
}
