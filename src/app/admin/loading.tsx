import { Skeleton } from '@/components/ui';

/** Route-level loading skeleton for the admin panel (Stage 2 — D4). */
export default function AdminLoading() {
  return (
    <div className="flex flex-col gap-6" aria-busy="true" aria-label="جارٍ التحميل…">
      <Skeleton className="h-8 w-52" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        {Array.from({ length: 3 }, (_, index) => (
          <Skeleton key={index} className="h-28" />
        ))}
      </div>
      <Skeleton className="h-64" label="جدول البيانات" />
    </div>
  );
}
