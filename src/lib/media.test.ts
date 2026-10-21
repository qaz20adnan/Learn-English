import { describe, expect, it, vi } from 'vitest';
import {
  buildEmbedUrl,
  buildWatchUrl,
  parseMediaUrl,
  verifyMediaUrl,
} from './media';

describe('parseMediaUrl', () => {
  it('recognises a standard YouTube watch URL', () => {
    const parsed = parseMediaUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    expect(parsed).toEqual({
      provider: 'YOUTUBE',
      externalId: 'dQw4w9WgXcQ',
      canonicalUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    });
  });

  it('recognises short youtu.be and shorts URLs', () => {
    expect(parseMediaUrl('https://youtu.be/dQw4w9WgXcQ').externalId).toBe('dQw4w9WgXcQ');
    expect(parseMediaUrl('https://www.youtube.com/shorts/dQw4w9WgXcQ').externalId).toBe('dQw4w9WgXcQ');
    expect(parseMediaUrl('https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ').externalId).toBe(
      'dQw4w9WgXcQ',
    );
  });

  it('flags a YouTube URL whose id is not valid', () => {
    const parsed = parseMediaUrl('https://www.youtube.com/watch?v=short');
    expect(parsed.provider).toBe('YOUTUBE');
    expect(parsed.externalId).toBeNull();
  });

  it('recognises Vimeo URLs', () => {
    expect(parseMediaUrl('https://vimeo.com/76979871')).toEqual({
      provider: 'VIMEO',
      externalId: '76979871',
      canonicalUrl: 'https://vimeo.com/76979871',
    });
    expect(parseMediaUrl('https://player.vimeo.com/video/76979871').externalId).toBe('76979871');
  });

  it('detects direct audio and video files', () => {
    expect(parseMediaUrl('https://cdn.example.com/lesson.mp3').provider).toBe('AUDIO_FILE');
    expect(parseMediaUrl('https://cdn.example.com/lesson.mp4').provider).toBe('VIDEO_FILE');
  });

  it('returns NONE for unknown or malformed input', () => {
    expect(parseMediaUrl('not a url').provider).toBe('NONE');
    expect(parseMediaUrl('https://example.com/page').provider).toBe('NONE');
    expect(parseMediaUrl('   ').provider).toBe('NONE');
  });
});

describe('buildEmbedUrl', () => {
  it('builds a direct YouTube embed URL with the JS API enabled', () => {
    const url = buildEmbedUrl('YOUTUBE', 'abc', null);
    expect(url).toContain('https://www.youtube.com/embed/abc');
    expect(url).toContain('enablejsapi=1');
  });

  it('builds a Vimeo player URL', () => {
    expect(buildEmbedUrl('VIMEO', '76979871', null)).toContain('player.vimeo.com/video/76979871');
  });

  it('returns the raw URL for direct files and null when unusable', () => {
    expect(buildEmbedUrl('AUDIO_FILE', null, 'https://x/y.mp3')).toBe('https://x/y.mp3');
    expect(buildEmbedUrl('YOUTUBE', null, null)).toBeNull();
    expect(buildEmbedUrl('NONE', null, null)).toBeNull();
  });
});

describe('buildWatchUrl', () => {
  it('builds canonical watch links', () => {
    expect(buildWatchUrl('YOUTUBE', 'abc', null)).toBe('https://www.youtube.com/watch?v=abc');
    expect(buildWatchUrl('VIMEO', '123456', null)).toBe('https://vimeo.com/123456');
  });
});

const ok = () => Promise.resolve(new Response(null, { status: 200 }));
const no = (status: number) => Promise.resolve(new Response(null, { status }));

describe('verifyMediaUrl', () => {
  it('marks a YouTube video AVAILABLE when oEmbed succeeds', async () => {
    const fetchMock = vi.fn(ok);
    const result = await verifyMediaUrl('YOUTUBE', 'dQw4w9WgXcQ', null, fetchMock);
    expect(result.status).toBe('AVAILABLE');
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it('maps YouTube 404 and 403 to UNAVAILABLE', async () => {
    expect((await verifyMediaUrl('YOUTUBE', 'x', null, () => no(404))).status).toBe('UNAVAILABLE');
    expect((await verifyMediaUrl('YOUTUBE', 'x', null, () => no(403))).status).toBe('UNAVAILABLE');
  });

  it('maps unexpected YouTube codes to NEEDS_REVIEW', async () => {
    expect((await verifyMediaUrl('YOUTUBE', 'x', null, () => no(500))).status).toBe('NEEDS_REVIEW');
  });

  it('reports NEEDS_REVIEW when the id is missing', async () => {
    expect((await verifyMediaUrl('YOUTUBE', null, null, () => no(200))).status).toBe('NEEDS_REVIEW');
  });

  it('verifies Vimeo through oEmbed', async () => {
    expect((await verifyMediaUrl('VIMEO', '76979871', null, ok)).status).toBe('AVAILABLE');
    expect((await verifyMediaUrl('VIMEO', '76979871', null, () => no(404))).status).toBe(
      'UNAVAILABLE',
    );
  });

  it('accepts a partial-content response for direct files', async () => {
    const result = await verifyMediaUrl('VIDEO_FILE', null, 'https://x/y.mp4', () => no(206));
    expect(result.status).toBe('AVAILABLE');
  });

  it('marks an unreachable file UNAVAILABLE', async () => {
    const result = await verifyMediaUrl('AUDIO_FILE', null, 'https://x/y.mp3', () => no(404));
    expect(result.status).toBe('UNAVAILABLE');
  });

  it('never throws: a rejected fetch becomes NEEDS_REVIEW', async () => {
    const boom = () => Promise.reject(new Error('network down'));
    const result = await verifyMediaUrl('YOUTUBE', 'x', null, boom);
    expect(result.status).toBe('NEEDS_REVIEW');
    expect(result.note).toContain('network down');
  });
});
