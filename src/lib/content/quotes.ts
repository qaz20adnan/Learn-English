export interface DailyQuote {
  ar: string;
  en: string;
}

/**
 * Bilingual motivation for the dashboard. Quotes are intentionally short so
 * they remain readable on mobile and can rotate without pushing the layout.
 */
export const DAILY_QUOTES: DailyQuote[] = [
  {
    ar: 'كل يوم هو خطوة جديدة نحو إتقان اللغة — التزاماتك الصغيرة تصنع فرقاً كبيراً!',
    en: 'Every day is a new step toward fluency — your small commitments make a big difference!',
  },
  {
    ar: 'لا تنتظر الإلهام؛ ابدأ بجملة واحدة، وستأتي الثقة مع التكرار.',
    en: "Don't wait for inspiration; start with one sentence, and confidence will follow repetition.",
  },
  {
    ar: 'الطريقة الوحيدة لتعلّم لغة هي أن تسمح لنفسك بأن تخطئ.',
    en: 'The only way to learn a language is to allow yourself to make mistakes.',
  },
  {
    ar: 'عشر دقائق كل يوم تهزم عشر ساعات مرة واحدة في الشهر.',
    en: 'Ten minutes every day beats ten hours once a month.',
  },
  {
    ar: 'اللغة مهارة، والمهارة تُبنى بالاستخدام لا بالمشاهدة وحدها.',
    en: 'Language is a skill; skills are built by using it, not by watching alone.',
  },
  {
    ar: 'ابدأ من حيث أنت، واستخدم ما لديك، وافعل ما تستطيع اليوم.',
    en: 'Start where you are, use what you have, and do what you can today.',
  },
  {
    ar: 'كل كلمة جديدة تفتح باباً لفكرة جديدة، وكل جملة تفتح باباً لحوار.',
    en: 'Every new word opens a door to a new idea, and every sentence opens a conversation.',
  },
  {
    ar: 'الثقة لا تسبق المحاولة؛ الثقة هي ما يتركه التكرار خلفه.',
    en: 'Confidence does not come before trying; it is what repetition leaves behind.',
  },
];
