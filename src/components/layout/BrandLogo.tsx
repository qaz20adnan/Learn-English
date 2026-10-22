import { cn } from '@/lib/cn';

type LogoSize = 'xs' | 'sm' | 'md' | 'lg';

const boxSizes: Record<LogoSize, string> = {
  xs: 'h-7 w-7 rounded-lg',
  sm: 'h-9 w-9 rounded-xl',
  md: 'h-10 w-10 rounded-2xl',
  lg: 'h-14 w-14 rounded-2xl',
};

const iconSizes: Record<LogoSize, string> = {
  xs: 'h-4 w-4',
  sm: 'h-5 w-5',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
};

/**
 * A compact, vector-only brand mark: a compass rose with a sparkle. It uses
 * the active theme's brand tokens, so it changes with every palette.
 */
export function BrandLogo({
  size = 'md',
  className,
}: {
  size?: LogoSize;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={cn(
        'relative inline-flex shrink-0 items-center justify-center overflow-hidden bg-gradient-to-br from-brand-400 via-brand-500 to-brand-700 text-white shadow-lg shadow-brand-600/25 ring-1 ring-white/25',
        boxSizes[size],
        className,
      )}
    >
      <span className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgb(255_255_255/0.35),transparent_45%)]" />
      <svg
        viewBox="0 0 48 48"
        className={cn('relative', iconSizes[size])}
        fill="none"
        aria-hidden
      >
        <circle cx="24" cy="24" r="17" stroke="currentColor" strokeOpacity="0.22" strokeWidth="1.5" />
        <path
          d="M24 9.5l3.6 10.9L38.5 24l-10.9 3.6L24 38.5l-3.6-10.9L9.5 24l10.9-3.6Z"
          fill="currentColor"
        />
        <path
          d="M24 18l1.7 4.3L30 24l-4.3 1.7L24 30l-1.7-4.3L18 24l4.3-1.7Z"
          fill="white"
          fillOpacity="0.62"
        />
        <path
          d="M37.2 8.2l.8 2.3 2.3.8-2.3.8-.8 2.3-.8-2.3-2.3-.8 2.3-.8Z"
          fill="white"
          fillOpacity="0.92"
        />
      </svg>
    </span>
  );
}
