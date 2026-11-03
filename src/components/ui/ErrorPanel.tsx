'use client';

/**
 * Shared error panel used by every `error.tsx` boundary (Stage 2 — D5).
 *
 * One implementation, three mount points (root, (app), admin) — no duplicated
 * error UI. Bilingual by design: client error boundaries render outside the
 * locale context, so the panel carries both languages without dictionary
 * lookups. The retry button re-runs the failed segment render in place.
 */
import { useEffect } from 'react';
import { RotateCcw, TriangleAlert } from 'lucide-react';

export function ErrorPanel({
  error,
  reset,
  withNavHint = false,
}: {
  error: Error & { digest?: string };
  reset: () => void;
  withNavHint?: boolean;
}) {
  useEffect(() => {
    // Keep the signal in the console for support; never log secrets here —
    // Next.js only passes the message + digest to the client boundary.
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 py-12">
      <div className="card w-full max-w-lg p-8 text-center">
        <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-danger-50 text-danger-600 dark:bg-danger-500/10 dark:text-danger-500">
          <TriangleAlert className="size-7" aria-hidden />
        </span>
        <h1 className="mt-4 text-xl font-extrabold">حدث خطأ غير متوقع</h1>
        <p className="mt-2 text-sm text-muted">
          لم نتمكن من إكمال العملية. أعد المحاولة، وإن تكرر الخطأ فجرّب تحديث الصفحة.
        </p>
        <p dir="ltr" className="mt-1 text-xs text-muted">
          Something went wrong. Please try again.
        </p>
        {withNavHint ? (
          <p className="mt-3 text-xs text-muted">
            إذا استمرت المشكلة، عد إلى{' '}
            <a href="/dashboard" className="font-bold text-brand-600 underline-offset-4 hover:underline dark:text-brand-300">
              لوحة التعلم
            </a>
            .
          </p>
        ) : null}
        {error.digest ? (
          <p dir="ltr" className="mt-3 font-mono text-[11px] text-muted">
            ref: {error.digest}
          </p>
        ) : null}
        <button
          type="button"
          onClick={reset}
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-brand-500"
        >
          <RotateCcw className="size-4" aria-hidden />
          إعادة المحاولة
        </button>
      </div>
    </div>
  );
}
