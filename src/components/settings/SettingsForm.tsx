'use client';

import { useActionState } from 'react';
import type { SettingsState } from '@/app/(app)/settings/actions';
import type { Theme, UiLanguage } from '@/lib/types';
import { useI18n } from '@/components/i18n/LocaleProvider';

interface Props {
  action: (prev: SettingsState, formData: FormData) => Promise<SettingsState>;
  initial: { dailyGoalMinutes: number; theme: Theme; uiLanguage: UiLanguage };
}

export function SettingsForm({ action, initial }: Props) {
  const [state, formAction, pending] = useActionState(action, {});
  const { dict } = useI18n();
  const t = dict.settings;

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-semibold">{t.dailyGoalLabel}</span>
        <input
          type="number"
          name="dailyGoalMinutes"
          min={5}
          max={240}
          step={5}
          defaultValue={initial.dailyGoalMinutes}
          className="w-40 rounded-xl border border-line surface px-3.5 py-2.5 text-sm outline-none focus:border-brand-500"
        />
        <span className="text-xs text-muted">{t.dailyGoalHint}</span>
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-semibold">{t.uiLanguage}</span>
        <select
          name="uiLanguage"
          defaultValue={initial.uiLanguage}
          className="w-52 rounded-xl border border-line surface px-3.5 py-2.5 text-sm outline-none focus:border-brand-500"
        >
          <option value="ar">{dict.language.ar}</option>
          <option value="en">{dict.language.en}</option>
        </select>
      </label>

      {state.errorKey ? (
        <p role="alert" className="text-sm font-semibold text-rose-600">
          {t[state.errorKey]}
        </p>
      ) : null}
      {state.ok ? <p className="text-sm font-semibold text-emerald-600">{t.savedOk}</p> : null}

      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-brand-700 disabled:opacity-60"
      >
        {pending ? dict.common.saving : dict.common.save}
      </button>
    </form>
  );
}
