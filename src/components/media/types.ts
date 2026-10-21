import type { MediaProvider, VerificationStatus } from '@/lib/types';

export interface ClientMedia {
  id: string;
  provider: MediaProvider;
  externalId: string | null;
  url: string | null;
  title: string | null;
  verificationStatus: VerificationStatus;
  verificationNote: string | null;
  embedUrl: string | null;
  watchUrl: string | null;
}

export interface PlayerProps {
  media: ClientMedia;
  startSeconds: number;
  onProgress: (positionSeconds: number, durationSeconds: number) => void;
  onEnded: () => void;
}
