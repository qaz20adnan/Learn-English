'use client';

import { useActionState, useEffect, useRef } from 'react';
import type { AddWordState } from '@/app/(app)/favorites/actions';
import { useI18n } from '@/components/i18n/LocaleProvider';

const PARTS = ['noun', 'verb', 'adjective', 'adverb', 'phrase', 'interjection'] as const;

export function AddWordForm({
  action,
}: {
  action: (prev: AddWordState, formData: FormData) => Promise<AddWordState>;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  const { dict } = useI18n();
  const t = dict.favorites.addWord;
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state.ok]);

  return (
    <form ref={formRef} action={formAction} className="card flex flex-col gap-4 p-5">
      <div>
        <h3 className="font-bold">{t.title}</h3>
        <p className="mt-1 text-sm text-muted">{t.description}</p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-semibold">{t.term}</span>
          <input
            name="term"
            required
            maxLength={60}
            dir="ltr"
            placeholder={t.termPlaceholder}
            className="force-ltr rounded-xl border border-line surface px-3.5 py-2.5 text-sm outline-none focus:border-brand-500"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-semibold">{t.translation}</span>
          <input
            name="translation"
            required
            maxLength={120}
            placeholder={t.translationPlaceholder}
            className="rounded-xl border border-line surface px-3.5 py-2.5 text-sm outline-none focus:border-brand-500"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-semibold">{t.partOfSpeech}</span>
          <select
            name="partOfSpeech"
            defaultValue="noun"
            className="rounded-xl border border-line surface px-3.5 py-2.5 text-sm outline-none focus:border-brand-500"
          >
            {PARTS.map((part) => (
              <option key={part} value={part}>
                {dict.favorites.parts[part]}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-semibold">{t.phonetic}</span>
          <input
            name="phonetic"
            maxLength={60}
            dir="ltr"
            placeholder={t.phoneticPlaceholder}
            className="force-ltr rounded-xl border border-line surface px-3.5 py-2.5 text-sm outline-none focus:border-brand-500"
          />
        </label>

        <label className="flex flex-col gap-1.5 sm:col-span-2">
          <span className="text-sm font-semibold">{t.example}</span>
          <input
            name="example"
            maxLength={300}
            dir="ltr"
            placeholder={t.examplePlaceholder}
            className="force-ltr rounded-xl border border-line surface px-3.5 py-2.5 text-sm outline-none focus:border-brand-500"
          />
        </label>
      </div>

      {state.errorKey ? (
        <p role="alert" className="text-sm font-semibold text-rose-600">
          {t.error}
        </p>
      ) : null}
      {state.ok ? <p className="text-sm font-semibold text-emerald-600">{t.success}</p> : null}

      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-brand-700 disabled:opacity-60"
      >
        {pending ? t.submitting : t.submit}
      </button>
    </form>
  );
}
