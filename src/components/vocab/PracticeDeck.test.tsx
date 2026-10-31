import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { LocaleProvider } from '@/components/i18n/LocaleProvider';
import { PracticeDeck } from './PracticeDeck';
import type { FlashcardItem } from './Flashcards';

vi.mock('next/link', () => ({
  default: ({ href, children }: { href: string; children: ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

function renderAr(ui: ReactNode) {
  return render(<LocaleProvider locale="ar">{ui}</LocaleProvider>);
}

const card = (id: string, term: string): FlashcardItem => ({
  vocabId: id,
  term,
  translation: `ترجمة ${term}`,
  partOfSpeech: 'noun',
  phonetic: null,
  example: `Example with ${term}.`,
});

describe('PracticeDeck', () => {
  it('shows the empty state when there are no cards', () => {
    renderAr(<PracticeDeck cards={[]} />);
    expect(screen.getByText('لا توجد كلمات مطابقة')).toBeInTheDocument();
  });

  it('reveals the meaning and self-assesses through the whole deck', () => {
    const cards = [card('v1', 'reliable'), card('v2', 'honest')];
    renderAr(<PracticeDeck cards={cards} />);

    // First card: flip then mark as known.
    expect(screen.getByText('reliable')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'اكشف المعنى' }));
    expect(screen.getByText('ترجمة reliable')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'أعرفها ✓' }));

    // Second card: flip then mark for another look.
    expect(screen.getByText('honest')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'اكشف المعنى' }));
    fireEvent.click(screen.getByRole('button', { name: 'راجعها لاحقًا 🔄' }));

    // Completion screen summarises the session.
    expect(screen.getByText('أكملت التدريب! عرفت 1 كلمة وتبقى 1 للمراجعة.')).toBeInTheDocument();

    // Bonus round over the "study again" pile only.
    fireEvent.click(screen.getByRole('button', { name: '🎯 درّب على الكلمات التي تحتاج مراجعة' }));
    expect(screen.getByText('honest')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'اكشف المعنى' }));
    fireEvent.click(screen.getByRole('button', { name: 'أعرفها ✓' }));

    expect(screen.getByText('أكملت التدريب! عرفت كل الكلمات (2).')).toBeInTheDocument();
  });

  it('never posts to the review API (practice is write-free)', () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    renderAr(<PracticeDeck cards={[card('v1', 'reliable')]} />);
    fireEvent.click(screen.getByRole('button', { name: 'اكشف المعنى' }));
    fireEvent.click(screen.getByRole('button', { name: 'أعرفها ✓' }));

    expect(fetchMock).not.toHaveBeenCalled();
    expect(screen.getByText('أكملت التدريب! عرفت كل الكلمات (1).')).toBeInTheDocument();
  });
});
