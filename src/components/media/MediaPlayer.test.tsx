import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { LocaleProvider } from '@/components/i18n/LocaleProvider';
import { MediaPlayer } from './MediaPlayer';
import type { ClientMedia } from './types';

vi.mock('next/link', () => ({
  default: ({ href, children }: { href: string; children: ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

function renderAr(ui: ReactNode) {
  return render(<LocaleProvider locale="ar">{ui}</LocaleProvider>);
}

const baseMedia: ClientMedia = {
  id: 'md_test_1',
  provider: 'YOUTUBE',
  externalId: 'dQw4w9WgXcQ',
  url: 'https://youtu.be/dQw4w9WgXcQ',
  title: 'Sample lesson video',
  verificationStatus: 'AVAILABLE',
  verificationNote: null,
  embedUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ?enablejsapi=1',
  watchUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
};

afterEach(() => {
  vi.unstubAllGlobals();
});

/** Simulates the YouTube JSAPI posting an event from the embed frame. */
function postFromFrame(container: HTMLElement, payload: unknown) {
  const frame = container.querySelector('iframe');
  expect(frame).not.toBeNull();
  window.dispatchEvent(
    new MessageEvent('message', {
      origin: 'https://www.youtube.com',
      source: frame?.contentWindow ?? null,
      data: typeof payload === 'string' ? payload : JSON.stringify(payload),
    }),
  );
}

describe('MediaPlayer runtime embed failure (T10)', () => {
  it('renders the player normally before any error', () => {
    const { container } = renderAr(
      <MediaPlayer media={baseMedia} startSeconds={0} onProgress={vi.fn()} onEnded={vi.fn()} />,
    );
    expect(container.querySelector('iframe')).not.toBeNull();
    expect(screen.queryByText(/تعذّر تشغيل الفيديو المضمّن/)).not.toBeInTheDocument();
  });

  it('shows the fallback panel with the original source link when the embed errors', async () => {
    const fetchMock = vi.fn(
      (_input: RequestInfo | URL, _init?: RequestInit) => {
        void _input;
        void _init;
        return Promise.resolve(new Response('{"ok":true}', { status: 200 }));
      },
    );
    vi.stubGlobal('fetch', fetchMock);

    const { container } = renderAr(
      <MediaPlayer media={baseMedia} startSeconds={0} onProgress={vi.fn()} onEnded={vi.fn()} />,
    );

    postFromFrame(container, { event: 'onError', info: 101 });

    await waitFor(() => {
      expect(screen.getByText('⚠️ تعذّر تشغيل الفيديو المضمّن')).toBeInTheDocument();
    });
    expect(
      screen.getByText('مالك الفيديو يمنع تشغيله مضمّنًا داخل المواقع الأخرى.'),
    ).toBeInTheDocument();
    expect(screen.getByText('إعادة محاولة التضمين')).toBeInTheDocument();

    const watchLink = screen.getByRole('link', { name: /فتح المصدر الأصلي/ });
    expect(watchLink).toHaveAttribute('href', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    expect(watchLink).toHaveAttribute('rel', 'noopener noreferrer');

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/media/failures',
        expect.objectContaining({ method: 'POST' }),
      );
    });
    const [, init] = fetchMock.mock.calls[0];
    expect(JSON.parse(String(init?.body))).toEqual({
      mediaId: 'md_test_1',
      provider: 'YOUTUBE',
      errorCode: 101,
    });
  });

  it('reports a deleted video (code 100) with its specific message', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve(new Response('{}', { status: 200 }))));

    const { container } = renderAr(
      <MediaPlayer media={baseMedia} startSeconds={0} onProgress={vi.fn()} onEnded={vi.fn()} />,
    );
    postFromFrame(container, { event: 'onError', info: 100 });

    await waitFor(() => {
      expect(
        screen.getByText('الفيديو غير متاح: يبدو أنه حُذف أو أصبح خاصًا على المصدر.'),
      ).toBeInTheDocument();
    });
  });

  it('retries the embedded player from the fallback panel', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve(new Response('{}', { status: 200 }))));

    const { container } = renderAr(
      <MediaPlayer media={baseMedia} startSeconds={0} onProgress={vi.fn()} onEnded={vi.fn()} />,
    );
    postFromFrame(container, { event: 'onError', info: 150 });
    expect(await screen.findByText('⚠️ تعذّر تشغيل الفيديو المضمّن')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'إعادة محاولة التضمين' }));
    expect(screen.queryByText(/تعذّر تشغيل الفيديو المضمّن/)).not.toBeInTheDocument();
    expect(container.querySelector('iframe')).not.toBeNull();
  });
});
