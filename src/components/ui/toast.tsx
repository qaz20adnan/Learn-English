'use client';

/**
 * Minimal CSS-only toast notifications (Stage 2 — D6).
 *
 * - `showToast()` can be called from any client component (module-level
 *   pub-sub, no provider/context plumbing).
 * - `<ToastHost />` is mounted once in the (app) layout and renders the queue.
 * - RTL/LTR agnostic: anchored with logical `inset-inline` properties.
 * - Decorative motion is killed globally by the reduced-motion media query.
 */
import { useEffect, useState, type ReactNode } from 'react';
import { CheckCircle2, Info, TriangleAlert, X } from 'lucide-react';
import { cn } from '@/lib/cn';

export type ToastTone = 'success' | 'info' | 'warning';

export interface ToastInput {
  message: string;
  tone?: ToastTone;
  /** Auto-dismiss delay in ms (default 3500). */
  duration?: number;
}

interface ToastEntry extends Required<Omit<ToastInput, 'duration'>> {
  id: number;
  duration: number;
}

type Listener = (toasts: ToastEntry[]) => void;

let queue: ToastEntry[] = [];
let nextId = 1;
const listeners = new Set<Listener>();

function emit() {
  for (const listener of listeners) listener(queue);
}

export function showToast({ message, tone = 'info', duration = 3500 }: ToastInput): void {
  const entry: ToastEntry = { id: nextId++, message, tone, duration };
  queue = [...queue, entry];
  emit();
  window.setTimeout(() => dismiss(entry.id), duration);
}

export function dismiss(id: number): void {
  queue = queue.filter((toast) => toast.id !== id);
  emit();
}

const toneStyles: Record<ToastTone, { ring: string; icon: ReactNode }> = {
  success: {
    ring: 'border-success-500/40',
    icon: <CheckCircle2 className="size-5 text-success-600 dark:text-success-500" aria-hidden />,
  },
  info: {
    ring: 'border-brand-500/40',
    icon: <Info className="size-5 text-brand-600 dark:text-brand-300" aria-hidden />,
  },
  warning: {
    ring: 'border-warning-500/40',
    icon: <TriangleAlert className="size-5 text-warning-600 dark:text-warning-500" aria-hidden />,
  },
};

export function ToastHost() {
  const [toasts, setToasts] = useState<ToastEntry[]>([]);

  useEffect(() => {
    listeners.add(setToasts);
    return () => {
      listeners.delete(setToasts);
    };
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      aria-atomic="false"
      className="pointer-events-none fixed bottom-4 start-4 z-50 flex max-w-sm flex-col gap-2"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          role="status"
          className={cn(
            'animate-toast-in pointer-events-auto flex items-start gap-2.5 rounded-xl border bg-surface-raised/95 p-3 pe-2 shadow-lg shadow-ink-900/10 backdrop-blur',
            toneStyles[toast.tone].ring,
          )}
        >
          {toneStyles[toast.tone].icon}
          <p className="flex-1 pt-0.5 text-sm font-semibold leading-6">{toast.message}</p>
          <button
            type="button"
            onClick={() => dismiss(toast.id)}
            aria-label="×"
            className="rounded-lg p-1 text-muted transition hover:bg-ink-100 hover:text-text dark:hover:bg-ink-800"
          >
            <X className="size-4" aria-hidden />
          </button>
        </div>
      ))}
    </div>
  );
}
