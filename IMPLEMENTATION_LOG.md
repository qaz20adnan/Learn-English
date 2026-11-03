# IMPLEMENTATION_LOG.md — سجل تنفيذ تطوير منصة Fluently

> يُحدَّث بعد كل مرحلة: التعديلات، الملفات المتأثرة، القرارات التقنية، نتائج الفحص.

---

## [المرحلة 1] التحليل وإنشاء الخطة — 2026-11-03 · مكتملة ✅

- فحص شامل: 21 صفحة، 8 API، 21 جدولًا، 68 ملف lib/components.
- QA أساس: tsc نظيف، eslint نظيف، **123 اختبارًا تمر**، next build ناجح (PPR).
- 12 مشكلة تقنية (T1–T12) + 6 تعليمية + 5 بصرية، أولويات P0–P3.
- المخرجات: تقرير التحليل + IMPROVEMENT_PLAN.md (مراحل 2–9 بمعايير قبول).

## [ما بين المرحلتين] مراجعة ودمج sprint-3 — 2026-11-03 · مكتملة ✅

**التوجيه**: لا كود قبل فحص sprint-3؛ الدمج الآمن أولًا مع نقطة استعادة.

### نتائج المراجعة
- `sprint-3 = 5d6f381` ابن مباشر لـ main (`fc44bab`) → دمج بلا تعارض ممكن.
- الدلتا: 7 ملفات، **+786/−0** (إضافي خالص): صفحة /roadmap، lib/roadmap.ts + اختباراته، استعلامات getRoadmapData (+اختبارات)، +65 سطر قواميس، +1 رابط تنقل.
- **لا تغيير في package.json، لا تغيير في schema**.
- جودة الاستعلامات: كلها تطبّق `is_published = 1` باتساق.
- QA على حالة الدمج: build ✅ (PPR، 32 صفحة)، **vitest 123/123** ✅.

### عملية الدمج (موثقة)
1. إصلاح بنية تحتية للجسر: `git_ssh.py` كان يعلق في fetch (BufferedReader.read يحجب حتى 64KB؛ استُبدل بـ os.read) — أصلح clone/fetch/push.
2. نقطة استعادة: **tag `restore/pre-sprint3-merge` = fc44bab** (مدفوع للمستودع).
3. دمج `--no-ff` برسالة توثيق كاملة → main = **`2089dac`** → دفع ناجح.
4. تحقق حي: `/roadmap` = 200 على الإنتاج مع محتوى «خارطة التعلم» بعد نشر Vercel.

## [المرحلة 2] Design System والهوية العامة — 2026-11-03 · مكتملة ✅

### قرارات معتمدة من المالك
D1 خط IBM Plex Sans Arabic · D2 توكنز دلالية · D3 lucide-react وحيدة · D4 Skeletons + loading.tsx · D5 error.tsx موحد · D6 أنيميشن CSS + reduced-motion · D7 إصلاح T1 بأقل تغيير · D8 Web Speech API لاحقًا (المرحلة 5) بمعمارية قابلة للاستبدال (Azure/Speechace) · D9 الشهادات: بنية + إصدار + تحقق بمعرف فريد، PDF مؤجل.

### التعديلات (الملفات المتأثرة)
| الملف | التغيير |
|---|---|
| `src/app/layout.tsx` | IBM Plex Sans Arabic (300–700، swap) في سلسلة الخطوط |
| `src/app/globals.css` | توكنز success/warning/danger · `.skeleton` shimmer · `animate-fade-up` · `animate-toast-in` · قاعدة `prefers-reduced-motion` عامة |
| `src/components/ui.tsx` | `StatCard.icon` · `EmptyState.icon` · `Skeleton` جديد |
| `src/components/ui/toast.tsx` **جديد** | `showToast()` + `<ToastHost/>` (pub-sub، RTL، aria-live) |
| `src/components/ui/ErrorPanel.tsx` **جديد** | لوحة خطأ موحدة ثنائية اللغة + retry + digest |
| `src/app/error.tsx` + `(app)/error.tsx` + `admin/error.tsx` **جديد** | حدود أخطاء الثلاثة فوق ErrorPanel |
| `src/app/(app)/loading.tsx` + `admin/loading.tsx` **جديد** | Skeletons على شكل الصفحة |
| `src/app/(app)/layout.tsx` | تركيب `<ToastHost/>` |
| `src/lib/db/queries.ts` | **T1**: `listVocabulary` يطبق الآن `(course_id IS NULL OR is_published=1)` — اتساق كامل مع البحث |
| `src/lib/db/queries.test.ts` | اختبار انحدار T1 (كلمة كورس مسودة تبقى مخفية في العينة العشوائية) |
| `src/lib/i18n/dictionaries.ts` | `toasts.favoriteAdded/favoriteRemoved/actionFailed` (عربي+إنجليزي) |
| `src/components/vocab/FavoriteButton.tsx` | أيقونة Heart + Toast نجاح/فشل + توكنز warning الجديدة |
| `src/app/(app)/dashboard/page.tsx` | StatCards بأيقونات lucide (BookCheck/Clock3/LibraryBig/Repeat2) |
| `src/app/(app)/vocabulary/page.tsx` | أيقونة Search داخل حقل البحث |
| `DESIGN_SYSTEM.md` **جديد** | توثيق النظام كاملًا |
| `IMPROVEMENT_PLAN.md` + `IMPLEMENTATION_LOG.md` | داخل المستودع ومحدّثان |

### نتائج الفحص (بعد التعديل)
- `vitest`: **123/123** (يشمل انحدار T1) ✅
- `tsc --noEmit`: نظيف ✅ · `eslint`: نظيف ✅
- `next build`: ناجح — الخط العربي يُحمّل بلا مشاكل، 32 صفحة ✅
- الفحص البصري الحي (خط/أيقونات/Toast/Skeleton/dark/RTL): **بعد دمج PR المرحلة 2 على Vercel** — قيد الجدولة.

### ملاحظات
- لا تغييرات على قاعدة البيانات في هذه المرحلة (لا Migration).
- لا حذف لأي وظيفة: `emoji` props ما زالت مدعومة للتوافق خلفي.
- الإيموجي أُزيل فقط من عناصر الواجهة الأساسية (StatCards/زر المفضلة) — أغلفة الكورسات بقيت كما هي (قرار D3).
