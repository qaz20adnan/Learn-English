import { Badge } from '@/components/ui';
import { VERIFICATION_LABELS } from '@/lib/media';
import type { VerificationStatus } from '@/lib/types';

const tones: Record<VerificationStatus, 'neutral' | 'success' | 'danger' | 'warning'> = {
  UNVERIFIED: 'neutral',
  AVAILABLE: 'success',
  UNAVAILABLE: 'danger',
  NEEDS_REVIEW: 'warning',
};

export function MediaStatusBadge({
  status,
  note,
  label,
}: {
  status: VerificationStatus;
  note?: string | null;
  label?: string;
}) {
  return (
    <span title={note ?? undefined}>
      <Badge tone={tones[status]}>{label ?? VERIFICATION_LABELS[status]}</Badge>
    </span>
  );
}
