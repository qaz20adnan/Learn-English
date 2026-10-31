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
  /**
   * Provider-reported embed error (YouTube JSAPI `onError`: 2, 5, 100, 101,
   * 150). Optional; currently emitted by YouTubePlayer so MediaPlayer can show
   * a fallback UI with the original source link and report the failure.
   */
  onEmbedError?: (errorCode: number | null) => void;
}
