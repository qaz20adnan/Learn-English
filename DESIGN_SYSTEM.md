# DESIGN_SYSTEM.md — نظام تصميم Fluently | فلوينتلي

> النسخة: 1.0 (المرحلة 2) · المصدر الوحيد للحقيقة: `src/app/globals.css` + `src/components/ui.tsx`

## 1) الخطوط (Typography)

| الاستخدام | الخط | ملاحظات |
|---|---|---|
| الأساسي (عربي + لاتيني) | **IBM Plex Sans Arabic** (`--font-plex-arabic`) | أوزان 300–700، `display: swap`، subset عربي |
| احتياطي لاتيني | Geist (`--font-geist-sans`) | يكمل الحروف الغائبة فقط |
| الأرقام البرمجية | Geist Mono | |

سلسلة `--font-sans`: `var(--font-plex-arabic), var(--font-geist-sans), "Segoe UI", Tahoma, …`
قاعدة: العناوين `font-extrabold tracking-tight`، المتن 14–16px، التسميات `text-xs font-medium text-muted`.

## 2) الألوان (Design Tokens)

### العلامة (brand — Indigo)
مقياس كامل `--color-brand-50…900` في `@theme` (Tailwind 4). اللون الأساسي `brand-600 #4f46e5`.

### حالة دلالية (مرحلة 2 — D2)
| الرمز | الدلالة | الاستخدام |
|---|---|---|
| `success-500/600` (#10b981) | إنجاز وتقدم | نجاح الاختبار، إتمام درس، Toast نجاح |
| `warning-500/600` (#f97316) | تنبيه هادئ | مراجعة مستحقة، فشل إجراء غير حرج |
| `danger-500/600` (#ef4444) | خطأ واضح دون مبالغة | حدود الأخطاء، رسائل فشل |

### أسطح وثيمات
متغيرات لكل ثيم: `--surface, --surface-raised, --text, --muted, --border, --ambient, --ambient-2`.
الثيمات: `light, dark, emerald, sepia, midnight` عبر `data-theme` + next-themes.
قاعدة: **لا ألوان صلبة في المكونات** — استخدم التوكنز (`text-muted`, `border-line`, `bg-brand-*`، حالة `success/warning/danger`).

## 3) الأيقونات

- المكتبة الوحيدة: **lucide-react** (قرار D3).
- الحجم القياسي `size-4` (أيقونات الحالة/الأزرار)، `size-5` (Toast/فواصل)؛ `strokeWidth` الافتراضي.
- كل أيقونة معلوماتية بلا نص تحتاج `aria-hidden` إن كانت زخرفية أو `aria-label` إن كانت مستقلة.
- الإيموجي مسموح فقط كأغلفة ودودة للمحتوى (`cover_emoji`) — **لا إيموجي في عناصر الواجهة الأساسية**.

## 4) المكوّنات المشتركة (`components/ui.tsx` + `ui/`)

| المكوّن | الغرض | ملاحظات |
|---|---|---|
| `Card` | حاوية سطح | `.card` = سطح مرتفع + حدود + ظل ناعم |
| `Badge` / `LevelBadge` | شرائح الحالة والمستوى | نغمات: neutral/brand/success/warning/danger/info |
| `StatCard` | بطاقة إحصاء | `icon` (lucide) أو `emoji` قديم — الجديد يفضّل icon |
| `ProgressBar` | تقدم متحرك | `role=progressbar` + قيم ARIA، انتقال width ناعم |
| `EmptyState` | حالة فراغ | `icon` يفضّل على `emoji` |
| `SectionTitle` | عنوان قسم + وصف + إجراء | |
| `Skeleton` | هيكل تحميل | `.skeleton` مع لمعان؛ `label` للمناطق المهمة |
| `ToastHost` / `showToast()` | إشعارات | نغمات success/info/warning، RTL تلقائي، aria-live |
| `ErrorPanel` | لوحة خطأ موحدة | تُستخدم في 3 حدود أخطاء (root/(app)/admin) — ثنائية اللغة |

## 5) حالات الواجهة الإلزامية

- **التحميل**: `loading.tsx` لكل مجموعة مسارات + Skeletons مركّبة على شكل الصفحة.
- **الخطأ**: `error.tsx` (root + (app) + admin) بزر إعادة محاولة + `ref: digest` للدعم.
- **الفراغ**: `EmptyState` بديل واضح + إجراء مقترح.
- **الانشغال**: `aria-busy` + تعطيل الأزرار أثناء الحفظ.

## 6) الحركة (Motion)

| الأداة | الاستخدام |
|---|---|
| `animate-fade-up` | ظهور تدريجي للبطاقات |
| `animate-toast-in` | دخول الإشعارات |
| `.skeleton` shimmer | أثناء التحميل |
| `transition` + hover | خفيف على الكروت والأزرار (`hover:-translate-y-0.5`) |

قواعد صارمة: CSS فقط (لا مكتبات)، ≤ 450ms، **`prefers-reduced-motion: reduce` يوقف كل الحركات** (قاعدة عامة في globals.css).

## 7) الوصول (Accessibility)

- `:focus-visible` حلقة brand واضحة عالميًا.
- أزرار الأيقونات دائمًا بـ `aria-label`.
- لا معنى بلون وحده — الحالة تُقترن بنص أو أيقونة.
- RTL/LTR عبر `dir` على `<html>` + خصائص منطقية (`start/end`) حصريًا في CSS.
- تباين: نص `--muted` على الأسطح يحقق ≥ 4.5:1 في الثيمات الفاتحة والداكنة.

## 8) قواعد إضافة مكون جديد

1. ابحث أولًا في `ui.tsx` — لا تكرّر ما هو موجود (قاعدة المشروع).
2. استخدم التوكنز فقط، لا قيمًا سحرية.
3. أضف حالات الثلاث (عادي/فراغ/خطأ) قبل اعتماده في صفحة.
4. اختبره في RTL وLTR وdark قبل الدمج.
