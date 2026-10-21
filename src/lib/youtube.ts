/**
 * Server-only helpers to read zAmerican English playlists from YouTube.
 *
 * Uses YouTube's public InnerTube `browse` endpoint (the same one the website
 * calls) to page through a playlist's videos. Results are cached in the
 * `youtube_cache` table so the app keeps working offline and does not hammer
 * YouTube on every request.
 *
 * This module performs network I/O and must only be imported from server code.
 */
import { nowIso, one, run } from './db/client';

export interface YouTubeItem {
  videoId: string;
  title: string;
  durationSeconds: number | null;
  position: number;
}

const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

const INNERTUBE_CONTEXT = {
  client: {
    clientName: 'WEB',
    clientVersion: '2.20240601.00.00',
    hl: 'en',
    gl: 'US',
  },
};

async function browse(body: Record<string, unknown>): Promise<unknown> {
  const res = await fetch('https://www.youtube.com/youtubei/v1/browse?prettyPrint=false', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept-Language': 'en-US,en;q=0.9',
    },
    body: JSON.stringify({ context: INNERTUBE_CONTEXT, ...body }),
  });
  if (!res.ok) throw new Error(`YouTube browse failed (${res.status})`);
  return res.json();
}

function durationToSeconds(text: string | undefined): number | null {
  if (!text) return null;
  const parts = text.split(':').map((part) => Number.parseInt(part, 10));
  if (parts.some((part) => Number.isNaN(part))) return null;
  return parts.reduce((total, part) => total * 60 + part, 0);
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

function extractItems(data: unknown, out: YouTubeItem[]): void {
  const seen = new Set(out.map((item) => item.videoId));
  walk(data, (node) => {
    const pvr = node.playlistVideoRenderer as Json | undefined;
    if (pvr && typeof pvr.videoId === 'string' && !seen.has(pvr.videoId)) {
      seen.add(pvr.videoId);
      out.push({
        videoId: pvr.videoId,
        title: textOf(pvr.title) || pvr.videoId,
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
        durationSeconds: null,
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

/**
 * Fallback for playlists the InnerTube `browse` endpoint refuses to return
 * (a few channel "course" playlists answer with an empty body). The public
 * playlist page still embeds the video ids, so we read them from the HTML and
 * resolve titles through the official oEmbed endpoint.
 */
async function fetchFromHtml(playlistId: string): Promise<YouTubeItem[]> {
  const res = await fetch(`https://www.youtube.com/playlist?list=${playlistId}&hl=en&gl=US`, {
    headers: { 'Accept-Language': 'en-US,en;q=0.9' },
  });
  if (!res.ok) return [];
  const html = await res.text();

  const seen = new Set<string>();
  const videoIds: string[] = [];
  const matches = html.matchAll(/"videoId":"([\w-]{11})"/g);
  for (const match of matches) {
    if (!seen.has(match[1])) {
      seen.add(match[1]);
      videoIds.push(match[1]);
    }
  }

  return Promise.all(
    videoIds.map(async (videoId, index) => {
      let title = videoId;
      try {
        const oembed = await fetch(
          `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`,
        );
        if (oembed.ok) {
          const data = (await oembed.json()) as { title?: string };
          if (data.title) title = data.title;
        }
      } catch {
        // Keep the video id as a fallback title.
      }
      return { videoId, title, durationSeconds: null, position: index };
    }),
  );
}

async function fetchRemote(playlistId: string): Promise<YouTubeItem[]> {
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

  if (items.length === 0) {
    const fallback = await fetchFromHtml(playlistId);
    if (fallback.length > 0) return fallback;
  }

  return items.map((item, index) => ({ ...item, position: index }));
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
 * @param maxAgeMs override the default 7 day cache window
 * @param force    bypass the cache and re-fetch from YouTube
 */
export async function fetchPlaylistItems(
  playlistId: string,
  options: { maxAgeMs?: number; force?: boolean } = {},
): Promise<YouTubeItem[]> {
  const maxAge = options.maxAgeMs ?? CACHE_TTL_MS;
  if (!options.force) {
    const cached = await readCache(playlistId);
    if (cached && Date.now() - new Date(cached.fetchedAt).getTime() < maxAge) {
      return cached.items;
    }
  }

  const items = await fetchRemote(playlistId);
  await writeCache(playlistId, items);
  return items;
}

/** Returns cached items without any network access (used while serving pages). */
export async function readCachedPlaylist(playlistId: string): Promise<YouTubeItem[]> {
  return (await readCache(playlistId))?.items ?? [];
}
