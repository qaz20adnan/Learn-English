/**
 * Server-only helpers to read zAmerican English playlists from YouTube.
 *
 * Preferred path: YouTube Data API v3 when `YOUTUBE_API_KEY` is configured.
 * That gives official titles, descriptions, durations and published dates.
 *
 * Fallback path: YouTube's public InnerTube `browse` endpoint (the same one the
 * website calls) plus the public playlist HTML page. This keeps the project
 * working without an API key.
 *
 * Every result is cached in `youtube_cache`, so a deploy never becomes unusable
 * because YouTube is temporarily unreachable. This module performs network I/O
 * and must only be imported from server code.
 */
import { nowIso, one, run } from './db/client';

export interface YouTubeItem {
  videoId: string;
  title: string;
  description?: string;
  publishedAt?: string | null;
  durationSeconds: number | null;
  position: number;
}

export interface YouTubePlaylist {
  playlistId: string;
  title: string;
  description: string;
  itemCount: number | null;
  publishedAt: string | null;
}

const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const REQUEST_TIMEOUT_MS = 20_000;
const RETRY_ATTEMPTS = 3;

const INNERTUBE_CONTEXT = {
  client: {
    clientName: 'WEB',
    clientVersion: '2.20240601.00.00',
    hl: 'en',
    gl: 'US',
  },
};

function apiKey(): string | null {
  const key = process.env.YOUTUBE_API_KEY?.trim();
  return key ? key : null;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function requestWithRetry(
  input: string,
  init: RequestInit = {},
  attempts = RETRY_ATTEMPTS,
): Promise<Response> {
  let lastError: unknown;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      const response = await fetch(input, {
        ...init,
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
      if (response.ok) return response;
      if (response.status < 500 && response.status !== 429) return response;
      lastError = new Error(`YouTube request failed (${response.status})`);
    } catch (error) {
      lastError = error;
    }
    if (attempt < attempts - 1) {
      await sleep(600 * (attempt + 1));
    }
  }
  throw lastError instanceof Error ? lastError : new Error('YouTube request failed');
}

async function fetchJson<T>(url: string | URL): Promise<T> {
  const response = await requestWithRetry(url.toString());
  if (!response.ok) throw new Error(`YouTube API failed (${response.status})`);
  return (await response.json()) as T;
}

function durationToSeconds(text: string | undefined): number | null {
  if (!text) return null;
  const parts = text.split(':').map((part) => Number.parseInt(part, 10));
  if (parts.some((part) => Number.isNaN(part))) return null;
  return parts.reduce((total, part) => total * 60 + part, 0);
}

/** Parses an ISO-8601 duration such as `PT1H2M3S` into seconds. */
function isoDurationToSeconds(value: string | undefined): number | null {
  if (!value) return null;
  const match = /^P(?:(\d+)D)?T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/.exec(value);
  if (!match) return null;
  const days = Number.parseInt(match[1] ?? '0', 10);
  const hours = Number.parseInt(match[2] ?? '0', 10);
  const minutes = Number.parseInt(match[3] ?? '0', 10);
  const seconds = Number.parseInt(match[4] ?? '0', 10);
  return days * 86_400 + hours * 3_600 + minutes * 60 + seconds;
}

type Json = Record<string, unknown>;

function walk(node: unknown, visit: (value: Json) => void): void {
  if (!node || typeof node !== 'object') return;
  if (Array.isArray(node)) {
    for (const child of node) walk(child, visit);
    return;
  }
  visit(node as Json);
  for (const value of Object.values(node as Json)) walk(value, visit);
}

function textOf(value: unknown): string {
  if (typeof value === 'string') return value;
  if (!value || typeof value !== 'object') return '';
  const obj = value as Json;
  if (typeof obj.simpleText === 'string') return obj.simpleText;
  const runs = obj.runs;
  if (Array.isArray(runs)) {
    return runs
      .map((run) => (run && typeof run === 'object' ? String((run as Json).text ?? '') : ''))
      .join('');
  }
  if (typeof obj.content === 'string') return obj.content;
  return '';
}

function findDurationText(node: unknown): string | null {
  let found: string | null = null;
  walk(node, (value) => {
    if (found) return;
    const badge = value.thumbnailBadgeViewModel as Json | undefined;
    const overlay = value.thumbnailOverlayTimeStatusRenderer as Json | undefined;
    const text = textOf(badge?.text) || textOf(overlay?.text);
    if (text && /^\d+(?::\d+)+$/.test(text.trim())) {
      found = text.trim();
    }
  });
  return found;
}

function extractItems(data: unknown, out: YouTubeItem[]): void {
  const seen = new Set(out.map((item) => item.videoId));
  walk(data, (node) => {
    const pvr = node.playlistVideoRenderer as Json | undefined;
    if (pvr && typeof pvr.videoId === 'string' && !seen.has(pvr.videoId)) {
      seen.add(pvr.videoId);
      out.push({
        videoId: pvr.videoId,
        title: textOf(pvr.title) || pvr.videoId,
        description: textOf(pvr.descriptionSnippet) || undefined,
        durationSeconds: durationToSeconds(textOf(pvr.lengthText)),
        position: out.length,
      });
      return;
    }

    const lockup = node.lockupViewModel as Json | undefined;
    if (lockup && typeof lockup.contentId === 'string' && /^[\w-]{11}$/.test(lockup.contentId)) {
      const videoId = lockup.contentId;
      if (seen.has(videoId)) return;
      const metadata = lockup.metadata as Json | undefined;
      const metaVm = metadata?.lockupMetadataViewModel as Json | undefined;
      seen.add(videoId);
      out.push({
        videoId,
        title: textOf(metaVm?.title) || videoId,
        durationSeconds: durationToSeconds(findDurationText(lockup) ?? undefined),
        position: out.length,
      });
    }
  });
}

function findContinuation(data: unknown): string | null {
  let token: string | null = null;
  walk(data, (node) => {
    const command = node.continuationCommand as Json | undefined;
    if (command && typeof command.token === 'string') token = command.token;
  });
  return token;
}

async function browse(body: Record<string, unknown>): Promise<unknown> {
  const response = await requestWithRetry(
    'https://www.youtube.com/youtubei/v1/browse?prettyPrint=false',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      body: JSON.stringify({ context: INNERTUBE_CONTEXT, ...body }),
    },
  );
  if (!response.ok) throw new Error(`YouTube browse failed (${response.status})`);
  return response.json();
}

interface PlayerResponse {
  videoDetails?: {
    shortDescription?: string;
  };
}

async function fetchVideoDescription(videoId: string): Promise<string | null> {
  const response = await requestWithRetry(
    'https://www.youtube.com/youtubei/v1/player?prettyPrint=false',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      body: JSON.stringify({ context: INNERTUBE_CONTEXT, videoId }),
    },
  );
  if (!response.ok) return null;
  const data = (await response.json()) as PlayerResponse;
  return data.videoDetails?.shortDescription?.trim() || null;
}

/**
 * InnerTube playlists expose titles and durations but not descriptions. The
 * player endpoint does, so when no Data API key is configured we enrich the
 * playlist in small parallel batches. Failures are non-fatal: the lesson still
 * gets a title, video id and generated study content.
 */
async function enrichDescriptions(items: YouTubeItem[]): Promise<void> {
  const missing = items.filter((item) => !item.description);
  if (missing.length === 0) return;

  let cursor = 0;
  let failures = 0;
  const workers = Array.from({ length: Math.min(4, missing.length) }, async () => {
    while (cursor < missing.length) {
      const item = missing[cursor];
      cursor += 1;
      try {
        const description = await fetchVideoDescription(item.videoId);
        if (description) item.description = description.slice(0, 4_000);
      } catch {
        failures += 1;
      }
    }
  });
  await Promise.all(workers);
  if (failures > 0) {
    console.warn(`YouTube descriptions unavailable for ${failures} video(s).`);
  }
}

/* ------------------------------------------------------------------ */
/* Official Data API v3                                                */
/* ------------------------------------------------------------------ */

interface ApiPlaylistItem {
  snippet?: {
    title?: string;
    description?: string;
    publishedAt?: string;
    position?: number;
    resourceId?: { videoId?: string };
  };
  contentDetails?: { videoId?: string; videoPublishedAt?: string };
}

interface ApiVideoItem {
  id?: string;
  snippet?: { title?: string; description?: string; publishedAt?: string };
  contentDetails?: { duration?: string };
}

async function enrichVideoDetails(items: YouTubeItem[]): Promise<void> {
  const key = apiKey();
  if (!key || items.length === 0) return;
  const byId = new Map(items.map((item) => [item.videoId, item]));

  for (let index = 0; index < items.length; index += 50) {
    const ids = items.slice(index, index + 50).map((item) => item.videoId);
    const url = new URL('https://www.googleapis.com/youtube/v3/videos');
    url.searchParams.set('part', 'snippet,contentDetails');
    url.searchParams.set('id', ids.join(','));
    url.searchParams.set('key', key);

    try {
      const data = await fetchJson<{ items?: ApiVideoItem[] }>(url);
      for (const item of data.items ?? []) {
        if (!item.id) continue;
        const target = byId.get(item.id);
        if (!target) continue;
        if (item.snippet?.title) target.title = item.snippet.title;
        if (item.snippet?.description) target.description = item.snippet.description;
        target.publishedAt = item.snippet?.publishedAt ?? target.publishedAt ?? null;
        target.durationSeconds =
          isoDurationToSeconds(item.contentDetails?.duration) ?? target.durationSeconds;
      }
    } catch (error) {
      // Details are an enhancement: keep the playlist titles/ids on failure.
      console.warn('YouTube video details unavailable:', error instanceof Error ? error.message : error);
    }
  }
}

async function fetchFromDataApi(playlistId: string): Promise<YouTubeItem[] | null> {
  const key = apiKey();
  if (!key) return null;

  const items: YouTubeItem[] = [];
  let pageToken: string | undefined;
  do {
    const url = new URL('https://www.googleapis.com/youtube/v3/playlistItems');
    url.searchParams.set('part', 'snippet,contentDetails');
    url.searchParams.set('playlistId', playlistId);
    url.searchParams.set('maxResults', '50');
    url.searchParams.set('key', key);
    if (pageToken) url.searchParams.set('pageToken', pageToken);

    const data = await fetchJson<{
      items?: ApiPlaylistItem[];
      nextPageToken?: string;
    }>(url);

    for (const item of data.items ?? []) {
      const videoId = item.contentDetails?.videoId ?? item.snippet?.resourceId?.videoId;
      if (!videoId || items.some((existing) => existing.videoId === videoId)) continue;
      items.push({
        videoId,
        title: item.snippet?.title?.trim() || videoId,
        description: item.snippet?.description?.trim() || undefined,
        publishedAt:
          item.contentDetails?.videoPublishedAt ?? item.snippet?.publishedAt ?? null,
        durationSeconds: null,
        position: items.length,
      });
    }
    pageToken = data.nextPageToken;
  } while (pageToken);

  await enrichVideoDetails(items);
  return items;
}

/**
 * Lists all public playlists belonging to a channel. Used by the optional
 * ingestion path when a Data API key is present; the checked-in catalog remains
 * the authoritative structured mapping when no key is configured.
 */
export async function fetchChannelPlaylists(
  handle = process.env.YOUTUBE_CHANNEL_HANDLE ?? '@zamericanenglish',
): Promise<YouTubePlaylist[]> {
  const key = apiKey();
  if (!key) return [];

  const handleValue = handle.startsWith('@') ? handle : `@${handle}`;
  const channelUrl = new URL('https://www.googleapis.com/youtube/v3/channels');
  channelUrl.searchParams.set('part', 'contentDetails');
  channelUrl.searchParams.set('forHandle', handleValue);
  channelUrl.searchParams.set('key', key);
  const channelData = await fetchJson<{ items?: { id?: string }[] }>(channelUrl);
  const channelId = channelData.items?.[0]?.id;
  if (!channelId) return [];

  const playlists: YouTubePlaylist[] = [];
  let pageToken: string | undefined;
  do {
    const url = new URL('https://www.googleapis.com/youtube/v3/playlists');
    url.searchParams.set('part', 'snippet,contentDetails');
    url.searchParams.set('channelId', channelId);
    url.searchParams.set('maxResults', '50');
    url.searchParams.set('key', key);
    if (pageToken) url.searchParams.set('pageToken', pageToken);

    const data = await fetchJson<{
      items?: {
        id?: string;
        snippet?: { title?: string; description?: string; publishedAt?: string };
        contentDetails?: { itemCount?: number };
      }[];
      nextPageToken?: string;
    }>(url);

    for (const item of data.items ?? []) {
      if (!item.id) continue;
      playlists.push({
        playlistId: item.id,
        title: item.snippet?.title?.trim() || item.id,
        description: item.snippet?.description?.trim() || '',
        itemCount: item.contentDetails?.itemCount ?? null,
        publishedAt: item.snippet?.publishedAt ?? null,
      });
    }
    pageToken = data.nextPageToken;
  } while (pageToken);

  return playlists;
}

/* ------------------------------------------------------------------ */
/* Public HTML fallback                                                */
/* ------------------------------------------------------------------ */

async function fetchFromHtml(playlistId: string): Promise<YouTubeItem[]> {
  const response = await requestWithRetry(
    `https://www.youtube.com/playlist?list=${playlistId}&hl=en&gl=US`,
    { headers: { 'Accept-Language': 'en-US,en;q=0.9' } },
  );
  if (!response.ok) return [];
  const html = await response.text();

  const seen = new Set<string>();
  const videoIds: string[] = [];
  const matches = html.matchAll(/"videoId":"([\w-]{11})"/g);
  for (const match of matches) {
    if (!seen.has(match[1])) {
      seen.add(match[1]);
      videoIds.push(match[1]);
    }
  }

  const items = await Promise.all(
    videoIds.map(async (videoId, index) => {
      let title = videoId;
      try {
        const response = await requestWithRetry(
          `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`,
        );
        if (response.ok) {
          const data = (await response.json()) as { title?: string };
          if (data.title) title = data.title;
        }
      } catch {
        // Keep the video id as a fallback title.
      }
      return { videoId, title, durationSeconds: null, position: index };
    }),
  );
  await enrichDescriptions(items);
  return items;
}

/* ------------------------------------------------------------------ */
/* InnerTube fallback                                                  */
/* ------------------------------------------------------------------ */

async function fetchFromInnerTube(playlistId: string): Promise<YouTubeItem[]> {
  const items: YouTubeItem[] = [];
  const first = await browse({ browseId: `VL${playlistId}` });
  extractItems(first, items);

  let continuation = findContinuation(first);
  let guard = 0;
  while (continuation && guard < 100) {
    guard += 1;
    const page = await browse({ continuation });
    extractItems(page, items);
    continuation = findContinuation(page);
  }
  await enrichDescriptions(items);
  return items;
}

async function fetchRemote(playlistId: string): Promise<YouTubeItem[]> {
  const fromApi = await fetchFromDataApi(playlistId).catch((error) => {
    console.warn(
      `YouTube Data API unavailable for ${playlistId}:`,
      error instanceof Error ? error.message : error,
    );
    return null;
  });
  if (fromApi && fromApi.length > 0) {
    return fromApi.map((item, index) => ({ ...item, position: index }));
  }

  try {
    const items = await fetchFromInnerTube(playlistId);
    if (items.length > 0) {
      return items.map((item, index) => ({ ...item, position: index }));
    }
  } catch (error) {
    console.warn(
      `InnerTube unavailable for ${playlistId}:`,
      error instanceof Error ? error.message : error,
    );
  }

  const fallback = await fetchFromHtml(playlistId);
  return fallback.map((item, index) => ({ ...item, position: index }));
}

async function readCache(
  playlistId: string,
): Promise<{ items: YouTubeItem[]; fetchedAt: string } | null> {
  const row = await one<{ items: string; fetched_at: string }>(
    'SELECT items, fetched_at FROM youtube_cache WHERE playlist_id = ?',
    playlistId,
  );
  if (!row) return null;
  try {
    return { items: JSON.parse(row.items) as YouTubeItem[], fetchedAt: row.fetched_at };
  } catch {
    return null;
  }
}

async function writeCache(playlistId: string, items: YouTubeItem[]): Promise<void> {
  await run(
    `INSERT INTO youtube_cache (playlist_id, items, fetched_at)
     VALUES (?, ?, ?)
     ON CONFLICT(playlist_id) DO UPDATE SET items = excluded.items, fetched_at = excluded.fetched_at`,
    playlistId,
    JSON.stringify(items),
    nowIso(),
  );
}

/**
 * Returns a playlist's videos, using the database cache when it is fresh.
 * On a network failure a stale cache is returned rather than throwing, so
 * deploys and page rendering keep working while YouTube is unreachable.
 * @param maxAgeMs override the default 7 day cache window
 * @param force    bypass the cache and re-fetch from YouTube
 */
export async function fetchPlaylistItems(
  playlistId: string,
  options: { maxAgeMs?: number; force?: boolean } = {},
): Promise<YouTubeItem[]> {
  const maxAge = options.maxAgeMs ?? CACHE_TTL_MS;
  const cached = await readCache(playlistId);
  if (!options.force && cached && Date.now() - new Date(cached.fetchedAt).getTime() < maxAge) {
    return cached.items;
  }

  try {
    const items = await fetchRemote(playlistId);
    if (items.length === 0) {
      throw new Error(`YouTube returned no videos for playlist ${playlistId}`);
    }
    await writeCache(playlistId, items);
    return items;
  } catch (error) {
    if (cached && cached.items.length > 0) {
      console.warn(
        `Using stale YouTube cache for ${playlistId}:`,
        error instanceof Error ? error.message : error,
      );
      return cached.items;
    }
    throw error;
  }
}

/** Returns cached items without any network access (used while serving pages). */
export async function readCachedPlaylist(playlistId: string): Promise<YouTubeItem[]> {
  return (await readCache(playlistId))?.items ?? [];
}
