import type { MediaProvider, VerificationStatus } from './types';

export interface ParsedMedia {
  provider: MediaProvider;
  externalId: string | null;
  canonicalUrl: string | null;
}

export interface VerifyResult {
  status: VerificationStatus;
  note: string;
}

const AUDIO_EXT = /\.(mp3|wav|ogg|oga|m4a|aac|flac)$/i;
const VIDEO_EXT = /\.(mp4|webm|ogv|mov|m4v|m3u8)$/i;
const YT_ID = /^[A-Za-z0-9_-]{11}$/;
const VIMEO_ID = /^\d{6,12}$/;

const YT_HOSTS = new Set([
  'youtube.com',
  'www.youtube.com',
  'm.youtube.com',
  'music.youtube.com',
  'youtube-nocookie.com',
  'www.youtube-nocookie.com',
  'youtu.be',
]);

const VIMEO_HOSTS = new Set(['vimeo.com', 'www.vimeo.com', 'player.vimeo.com']);

/**
 * Detects the provider and stable identifier for a media URL.
 * Only official, documented URL shapes are recognised; anything else is
 * reported as `NONE` so the admin sees it needs a manual review.
 */
export function parseMediaUrl(input: string): ParsedMedia {
  const raw = input.trim();
  if (!raw) return { provider: 'NONE', externalId: null, canonicalUrl: null };

  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return { provider: 'NONE', externalId: null, canonicalUrl: null };
  }

  const host = url.hostname.replace(/^www\./, '');
  const path = url.pathname;

  if (YT_HOSTS.has(host) || host.endsWith('.youtube.com') || host.endsWith('.youtu.be')) {
    let id: string | null = null;
    if (host === 'youtu.be') {
      id = path.slice(1).split('/')[0] || null;
    } else if (path === '/watch') {
      id = url.searchParams.get('v');
    } else if (path.startsWith('/embed/')) {
      id = path.split('/')[2] ?? null;
    } else if (path.startsWith('/shorts/')) {
      id = path.split('/')[2] ?? null;
    } else if (path.startsWith('/live/')) {
      id = path.split('/')[2] ?? null;
    }
    if (id && YT_ID.test(id)) {
      return { provider: 'YOUTUBE', externalId: id, canonicalUrl: `https://www.youtube.com/watch?v=${id}` };
    }
    return { provider: 'YOUTUBE', externalId: null, canonicalUrl: null };
  }

  if (VIMEO_HOSTS.has(host) || host.endsWith('.vimeo.com')) {
    let id: string | null = null;
    if (path.startsWith('/video/')) {
      id = path.split('/')[2] ?? null;
    } else if (host === 'player.vimeo.com') {
      id = path.split('/')[2] ?? null;
    } else {
      id = path.split('/')[1] ?? null;
    }
    if (id && VIMEO_ID.test(id)) {
      return { provider: 'VIMEO', externalId: id, canonicalUrl: `https://vimeo.com/${id}` };
    }
    return { provider: 'VIMEO', externalId: null, canonicalUrl: null };
  }

  if (AUDIO_EXT.test(path)) {
    return { provider: 'AUDIO_FILE', externalId: null, canonicalUrl: url.toString() };
  }
  if (VIDEO_EXT.test(path)) {
    return { provider: 'VIDEO_FILE', externalId: null, canonicalUrl: url.toString() };
  }

  return { provider: 'NONE', externalId: null, canonicalUrl: null };
}

export function buildEmbedUrl(provider: MediaProvider, externalId: string | null, url: string | null): string | null {
  if (provider === 'YOUTUBE' && externalId) {
    return `https://www.youtube.com/embed/${externalId}?enablejsapi=1&rel=0&modestbranding=1&playsinline=1`;
  }
  if (provider === 'VIMEO' && externalId) {
    return `https://player.vimeo.com/video/${externalId}?api=1&byline=0&portrait=0`;
  }
  if (provider === 'AUDIO_FILE' || provider === 'VIDEO_FILE') {
    return url;
  }
  return null;
}

export function buildWatchUrl(provider: MediaProvider, externalId: string | null, url: string | null): string | null {
  if (provider === 'YOUTUBE' && externalId) return `https://www.youtube.com/watch?v=${externalId}`;
  if (provider === 'VIMEO' && externalId) return `https://vimeo.com/${externalId}`;
  return url;
}

export const PROVIDER_LABELS: Record<MediaProvider, string> = {
  YOUTUBE: 'يوتيوب',
  VIMEO: 'فيميو',
  AUDIO_FILE: 'ملف صوتي',
  VIDEO_FILE: 'ملف فيديو',
  NONE: 'غير محدد',
};

export const VERIFICATION_LABELS: Record<VerificationStatus, string> = {
  UNVERIFIED: 'غير مفحوص',
  AVAILABLE: 'متاح',
  UNAVAILABLE: 'متعذر',
  NEEDS_REVIEW: 'يحتاج مراجعة',
};

type Fetcher = (input: string, init?: RequestInit) => Promise<Response>;

/**
 * Verifies a media URL against the provider's official oEmbed endpoint (or a
 * ranged GET for direct files). This is a heuristic, not a guarantee: an
 * `AVAILABLE` result means the provider's own API responded successfully, while
 * `NEEDS_REVIEW` means the check could not complete (for example, no network).
 */
export async function verifyMediaUrl(
  provider: MediaProvider,
  externalId: string | null,
  url: string | null,
  fetcher: Fetcher = fetch,
): Promise<VerifyResult> {
  try {
    if (provider === 'YOUTUBE') {
      if (!externalId) return { status: 'NEEDS_REVIEW', note: 'لم يتم التعرف على معرّف الفيديو' };
      const target = `https://www.youtube.com/oembed?url=${encodeURIComponent(
        `https://www.youtube.com/watch?v=${externalId}`,
      )}&format=json`;
      const res = await fetcher(target, { method: 'GET' });
      if (res.ok) return { status: 'AVAILABLE', note: 'أكدت واجهة oEmbed الرسمية وجود الفيديو' };
      if (res.status === 401 || res.status === 403) {
        return { status: 'UNAVAILABLE', note: 'الفيديو يمنع التضمين أو أنه خاص (oEmbed رفض الطلب)' };
      }
      if (res.status === 404) return { status: 'UNAVAILABLE', note: 'الفيديو غير موجود (oEmbed)' };
      return { status: 'NEEDS_REVIEW', note: `استجابة غير متوقعة من oEmbed: ${res.status}` };
    }

    if (provider === 'VIMEO') {
      if (!externalId) return { status: 'NEEDS_REVIEW', note: 'لم يتم التعرف على معرّف الفيديو' };
      const target = `https://vimeo.com/api/oembed.json?url=${encodeURIComponent(
        `https://vimeo.com/${externalId}`,
      )}`;
      const res = await fetcher(target, { method: 'GET' });
      if (res.ok) return { status: 'AVAILABLE', note: 'أكدت واجهة oEmbed الرسمية إمكانية التضمين' };
      if (res.status === 403 || res.status === 401) {
        return { status: 'UNAVAILABLE', note: 'الفيديو خاص أو يمنع التضمين' };
      }
      if (res.status === 404) return { status: 'UNAVAILABLE', note: 'الفيديو غير موجود' };
      return { status: 'NEEDS_REVIEW', note: `استجابة غير متوقعة من oEmbed: ${res.status}` };
    }

    if (provider === 'AUDIO_FILE' || provider === 'VIDEO_FILE') {
      if (!url) return { status: 'NEEDS_REVIEW', note: 'لا يوجد رابط للملف' };
      const res = await fetcher(url, { method: 'GET', headers: { Range: 'bytes=0-0' } });
      if (res.ok || res.status === 206) {
        return { status: 'AVAILABLE', note: 'الملف قابل للوصول' };
      }
      return { status: 'UNAVAILABLE', note: `تعذّر الوصول إلى الملف (${res.status})` };
    }

    return { status: 'NEEDS_REVIEW', note: 'لا يوجد مصدر وسائط قابل للفحص' };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'خطأ غير معروف';
    return { status: 'NEEDS_REVIEW', note: `تعذّر إجراء الفحص: ${message}` };
  }
}
