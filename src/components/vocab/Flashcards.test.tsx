import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { LocaleProvider } from '@/components/i18n/LocaleProvider';
import { Flashcards, type FlashcardItem } from './Flashcards';

vi.mock('next/link', () => ({
  default: ({ href, children }: { href: string; children: ReactNode }) => <a href={href}>{children}</a>,
}));

function renderAr(ui: ReactNode) {
  return render(<LocaleProvider locale="ar">{ui}</LocaleProvider>);
}

const card: FlashcardItem = {
  vocabId: 'v1',
  term: 'reliable',
  translation: 'موثوق',
  partOfSpeech: 'adjective',
  phonetic: '/rɪˈlaɪəbl/',
  example: 'This is a reliable connection.',
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('Flashcards', () => {
  it('shows an empty state when there are no cards', () => {
    renderAr(<Flashcards cards={[]} />);
    expect(screen.getByText('لا توجد بطاقات مستحقة الآن')).toBeInTheDocument();
  });

  it('reveals the translation on demand', () => {
    renderAr(<Flashcards cards={[card]} />);
    expect(screen.getByText('reliable')).toBeInTheDocument();
    expect(screen.queryByText('موثوق')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'اكشف المعنى' }));
    expect(screen.getByText('موثوق')).toBeInTheDocument();
  });

  it('posts the grade and advances to the summary', async () => {
    const fetchMock = vi.fn(() => Promise.resolve(new Response('{}', { status: 200 })));
    vi.stubGlobal('fetch', fetchMock);

    renderAr(<Flashcards cards={[card]} />);
    fireEvent.click(screen.getByRole('button', { name: 'اكشف المعنى' }));
    fireEvent.click(screen.getByRole('button', { name: 'جيد' }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/review',
        expect.objectContaining({ method: 'POST' }),
      );
    });
    expect(await screen.findByText('أكملت مراجعة 1 بطاقة')).toBeInTheDocument();
  });
});
