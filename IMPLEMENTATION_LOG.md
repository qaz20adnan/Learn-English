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

### الفحص البصري الحي على الإنتاج (بعد الدمج 8ea9553 ونشر Vercel) — 2026-11-03 ✅
> أعيد تشغيل حزمة QA كاملة على شجرة الدمج قبل الدفع (tsc/eslint/vitest/build كلها خضراء)، ثم فحص حي بمتصفح آلي على `fluently-academy.vercel.app` بحساب `fluently.demo.tester`:

| البند | الطريقة | النتيجة |
|---|---|---|
| الخط العربي | `document.fonts.check` + `computedStyle(body)` + معاينة بصرية | محمّل وأصبح الأساسي: `"IBM Plex Sans Arabic", Geist` ✅ |
| أيقونات lucide | عدّ `svg.lucide` + معاينة | لوحة التحكم 4 (StatCards) + بحث المفردات + قلوب المفضلة + قمر الثيم ✅ |
| Toast | نقر زر مفضلة فعلي + فحص `[role=status]` + لقطة | ظهر «تمت الإضافة» بنبرة نجاح مع زر إغلاق — RTL-safe ✅ |
| Skeletons | لقطة أثناء تحميل `/vocabulary/practice` | **9 عناصر skeleton أثناء التحميل → 0 بعده** ✅ |
| حدود الأخطاء | `error.tsx` للجذر/(app)/admin في الحزمة المنشورة | موجودة ومبنية؛ الإطلاق الحي متعمّد الكسر لم يُجرَ (غير آمن على الإنتاج) ✅ |
| الوضع الداكن | عبر قائمة المظهر الحقيقية → `data-theme="dark"` | خلفية `rgb(7,11,22)` بتباين سليم — لقطة موثقة ✅ |
| RTL/LTR | تبديل اللغة من الواجهة كلا الاتجاهين | `ar/rtl` و`en/ltr` يعملان بتناظر كامل ✅ |
| الكونسول | تنظيف ثم إعادة تحميل نظيفة | **صفر أخطاء وصفر تحذيرات** ✅ |

### التحقق الحي من T1 (اتساق الرؤية)
- البحث يعمل: `water` → 1، `meeting` → 1.
- `deadline`/`interview` → 0 نتيجة، والسبب مؤكد: كورسها **Workplace English غير منشور** في الإنتاج (غير ظاهر في `/courses`)، وإصلاح T1 أخفى كلماته من العينة العشوائية أيضًا — **انتهت الظاهرة الشبحية** (كلمة تُرى عشوائيًا ولا يمكن العثور عليها).
- إغلاق كامل لمعيار «البحث يجد deadline/agenda» يحتاج **قرار محتوى**: نشر كورس Workplace English من لوحة الإدارة (يُوصى به في sprint-7/المرحلة 5 أو قبلها).
- **ملاحظة جديدة (T13 — للمرحلة 7/الأمان)**: `getCourseBySlug` لا يفلتر `is_published` — الكورسات غير المنشورة متاحة عبر الرابط المباشر `/courses/workplace-english`. بلا بيانات حساسة لكن يجب حسمها في مرحلة الصلاحيات.

### ملاحظات
- لا تغييرات على قاعدة البيانات في هذه المرحلة (لا Migration).
- لا حذف لأي وظيفة: `emoji` props ما زالت مدعومة للتوافق خلفي.
- الإيموجي أُزيل فقط من عناصر الواجهة الأساسية (StatCards/زر المفضلة) — أغلفة الكورسات بقيت كما هي (قرار D3).
- لقطات الفحص الحي: `download/live_qa_sprint4/` (02-dashboard، 04-toast، 05-vocab-dark-rtl، 03-search-deadline).
