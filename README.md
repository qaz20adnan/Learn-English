# English Journey Academy — أكاديمية تعلّم الإنجليزية

منصة تعليمية متكاملة (Full-Stack) لتعلّم اللغة الإنجليزية للناطقين بالعربية، مبنية بـ **Next.js 16 + React 19 + TypeScript + Tailwind v4**، مع مصادقة حقيقية على الخادم، قاعدة بيانات **PostgreSQL**، مشغّل وسائط يدعم YouTube/Vimeo/الملفات المباشرة، ونظام مفردات بالمراجعة المتباعدة (SM-2)، وقصص واختبارات، ولوحة إدارة.

> الواجهة تدعم **العربية (RTL)** و**الإنجليزية (LTR)** بالكامل مع تبديل فوري، وتدعم المظهر الفاتح/الداكن/النظام.

## المزايا

- **مصادقة حقيقية**: تجزئة كلمات المرور بـ bcryptjs، جلسات معتمة مخزنة في قاعدة البيانات (توكن مُجزّأ بـ sha256) داخل كوكي `httpOnly`. التحقق من الصلاحيات على الخادم في طبقة `dal.ts` فقط.
- **أدوار**: طالب/مشرف. أول حساب مسجَّل يصبح مشرفًا (Bootstrap) — أو أنشئ مشرفًا عبر متغيرات البيئة.
- **كورسات ودروس**: منهج **zAmerican English** الكامل (33 قائمة تشغيل حقيقية عبر معرّفات Playlist) + محتوى تجريبي احتياطي، صفحات تفاصيل الكورس والدرس، تسجيل تقدّم حقيقي.
- **مزامنة المنهج**: أمر واحد يجلب كل قوائم تشغيل قناة zAmerican English ويدرّج الدروس والوسائط، **ويولّد تلقائيًا** مفردات واختبارًا قصيرًا لكل درس.
- **مشغّل وسائط**: YouTube IFrame API، Vimeo Player، HTML5 Audio/Video، مع حفظ موضع المشاهدة واستئنافه، ومعالجة الأخطاء وفتح المصدر البديل.
- **مفردات + مراجعة متباعدة**: 28 مفردة، خوارزمية SM-2 قابلة للاختبار، بطاقات تفاعلية (Again/Hard/Good/Easy).
- **قصص واختبارات**: 3 قصص مع أسئلة فهم، وتصحيح تلقائي، وحفظ أفضل نتيجة.
- **لوحة إدارة**: إدارة المستخدمين والأدوار، فحص روابط الوسائط، سجل تدقيق (audit log).
- **تحقق من الوسائط**: فحص آلي عبر واجهات oEmbed الرسمية (YouTube/Vimeo) وطلب Range للملفات المباشرة، مع حالات صريحة: `UNVERIFIED / AVAILABLE / UNAVAILABLE / NEEDS_REVIEW`.
- **مستويات CEFR**: تصنيف المحتوى على مسار `foundation → a1 → a2 → b1 → b2 → c1` (مع إمكانية إضافة `c2` لاحقًا) عبر نوع `Level` وفهرس `LEVELS`.
- **واجهة ثنائية اللغة (AR/EN)**: قاموس مركزي (`src/lib/i18n`) بالعربية كمصدر للحقيقة، مفاتيح مقيَّدة النوع بحيث لا يُترجم البناء إن نقص مفتاح في الإنجليزية. تبديل اللغة فوري عبر Server Action يكتب كوكي `eja_locale`، ويضبط `<html lang/dir>` قبل الرسم، ويحفظ التفضيل في قاعدة البيانات.
- **تصميم متجاوب** + إمكانية الوصول (تباين، تركيز لوحة المفاتيح، احترام تقليل الحركة).

## التقنيات

| الطبقة | التقنية |
| --- | --- |
| الإطار | Next.js 16 (App Router, Turbopack, Cache Components / PPR) |
| الواجهة | React 19، TypeScript، Tailwind CSS v4 |
| قاعدة البيانات | PostgreSQL عبر `pg` (Neon / Supabase / Railway / أي خادم PostgreSQL) |
| المصادقة | bcryptjs + جلسات مخزنة في DB + كوكي httpOnly |
| التحقق | Zod v4 |
| الاختبارات | Vitest + Testing Library (jsdom) + PGlite |

## المتطلبات

- **Node.js 24 أو أحدث**.
- **قاعدة بيانات PostgreSQL** (يُنصح بـ [Neon](https://neon.tech) للاستضافة المجانية على Netlify).
- npm.

## التثبيت

```bash
npm install
```

> إن ظهرت رسالة عن سكربتات البناء (esbuild/unrs-resolver)، اسمح بها:
> `npm install-scripts approve esbuild unrs-resolver`

## متغيرات البيئة

انسخ `.env.example` إلى `.env.local` وعدّل القيم:

| المتغير | الوصف |
| --- | --- |
| `DATABASE_URL` | رابط اتصال PostgreSQL (مطلوب). على Neon استخدم رابط **Pooled**. |
| `DATABASE_SSL` | اضبطه على `disable` لقاعدة محلية بدون TLS. |
| `DATABASE_POOL_MAX` | أقصى عدد اتصالات في التجمع (افتراضي: 3). |
| `NEXT_PUBLIC_PROGRESS_HEARTBEAT_SECONDS` | دورية نبضة حفظ التقدّم من المشغّل. |
| `NEXT_PUBLIC_SITE_URL` | رابط الموقع (اختياري). |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` / `ADMIN_NAME` | تُستخدم وقت التغذية لإنشاء حساب مشرف. |

لا تضع أي أسرار حقيقية في المستودع.

## إعداد قاعدة البيانات

```bash
npm run db:setup        # إنشاء الجداول (idempotent)
npm run db:seed         # تغذية المحتوى التجريبي (لا يمسّ المستخدمين)
npm run db:sync         # مزامنة منهج zAmerican English كاملًا (يتطلب إنترنت)
npm run db:verify-media # فحص روابط الوسائط عبر الشبكة
```

> السكربتات تقرأ `.env.local` تلقائيًا. ضع فيه `DATABASE_URL` قبل تشغيلها.

### مزامنة منهج zAmerican English

يقرأ `npm run db:sync` قوائم التشغيل المعرَّفة في `src/lib/content/catalog.ts` (معرّفات Playlist حقيقية)، ويجلب فيديوهاتها من يوتيوب (مع تخزين مؤقت في `youtube_cache`)، ثم ينشئ الكورسات والدروس والوسائط، **ويولّد لكل درس مفردات واختبارًا** اعتمادًا على المستوى. الأمر **idempotent** (تكراره لا يضاعف البيانات ولا يمسّ تقدّم المتعلّمين).

```bash
npm run db:sync                          # يستخدم الكاش إن وُجد
npm run db:sync -- --refresh             # يعيد جلب قوائم التشغيل من يوتيوب
npm run db:sync -- --refresh --refresh-content  # يعيد توليد المفردات والاختبارات
```

### حساب المشرف

- **الطريقة 1 (Bootstrap):** أول حساب يُسجِّل عبر `/register` يصبح `ADMIN` تلقائيًا.
- **الطريقة 2 (بيئة):** اضبط `ADMIN_EMAIL` و`ADMIN_PASSWORD` (٨ أحرف على الأقل) ثم `npm run db:seed`.

## التشغيل

```bash
npm run dev      # تطوير على http://localhost:3000
npm run build    # بناء إنتاجي
npm run start    # تشغيل الإنتاج
```

## الفحص والاختبار

```bash
npm run lint       # ESLint
npm run typecheck  # tsc --noEmit
npm run test       # Vitest (74 اختبارًا، يعمل دون قاعدة بيانات عبر PGlite)
```

## بنية المشروع

```
src/
  app/
    (auth)/            صفحات الدخول والتسجيل + Server Actions
    (app)/             لوحة التعلّم، الكورسات، الدروس، المفردات، المراجعة، القصص، التقدم، الإعدادات
    admin/             لوحة الإدارة (users, media)
    api/               progress, review, stories/attempt, health
    layout.tsx         الاتجاه RTL، الخطوط، تهيئة المظهر
  components/
    layout/            الهيدر، التنقل، مبدّل المظهر، قائمة المستخدم
    i18n/              LocaleProvider، مبدّل اللغة، خطاف كوكي اللغة
    media/             مشغّلات YouTube/Vimeo/HTML5 + شارة الحالة + تجربة الدرس
    vocab/ stories/    البطاقات التفاعلية واختبارات القصص
  lib/
    db/                schema.ts, client.ts, queries.ts
    auth/              password.ts, session.ts, dal.ts
    i18n/              config.ts, dictionaries.ts, server.ts, actions.ts
    srs.ts media.ts markdown.tsx validation.ts youtube.ts
    content/             catalog.ts (منهج zAmerican), generate.ts (توليد المفردات/الأسئلة), seed-data.ts
scripts/               setup-db, seed, sync-catalog, verify-media
```

## التحقق من الوسائط — حدود مهمة

- الفحص **تقديري وليس ضمانًا**: يعتمد على استجابة المصادر الخارجية وقت الفحص، وقد يفشل مؤقتًا بسبب الشبكة (يُسجَّل `NEEDS_REVIEW`).
- لا يجري تجاوز أي قيود تضمين أو خصوصية؛ الروابط غير القابلة للتضمين تُعرض مع زر «فتح المصدر».
- المحتوى التجريبي يستخدم روابط عيّنات عامة (YouTube/Vimeo/SoundHelix/MDN/SampleLib) لأغراض العرض، وبعضها مجرد تجهيزات اختبار متوقّع أن تفشل (`fixture-invalid-url`, `fixture-unavailable`).

## النشر على Netlify

التطبيق يستخدم PostgreSQL، لذا لا يعتمد على قرص دائم ويعمل على Netlify Functions. ملف `netlify.toml` يضبط Node 24 ويشغّل `db:setup` قبل كل بناء (العملية idempotent).

1. **أنشئ قاعدة بيانات Neon** (مجانية): <https://neon.tech> → New Project → انسخ **Pooled connection string**
   (المضيف يحتوي `-pooler`).
2. **جهّز القاعدة محليًا** بوضع الرابط في `.env.local`:

   ```bash
   DATABASE_URL=postgresql://...-pooler.../neondb?sslmode=require
   ```

   ثم:

   ```bash
   npm run db:setup
   npm run db:seed          # المحتوى التجريبي + مشرف اختياري عبر ADMIN_EMAIL/ADMIN_PASSWORD
   ```

3. **ارفع المشروع إلى GitHub** (إن لم يكن مرفوعًا):

   ```bash
   git init
   git add .
   git commit -m "Migrate database to PostgreSQL and prepare Netlify deployment"
   git branch -M main
   git remote add origin https://github.com/<user>/<repo>.git
   git push -u origin main
   ```

4. **اربط Netlify بالمستودع**: Netlify Dashboard → *Add new site* → *Import an existing project* → GitHub → اختر المستودع.
   - Build command: `npm run db:setup && npm run build` (مضبوط في `netlify.toml`).
   - Publish directory: يكتشفه Netlify تلقائيًا لـ Next.js.
5. **أضف متغيرات البيئة** في Netlify → *Site configuration* → *Environment variables*:
   - `DATABASE_URL` = رابط Neon Pooled.
   - `ADMIN_EMAIL` و`ADMIN_PASSWORD` (اختياري، لإنشاء مشرف).
   - `NEXT_PUBLIC_SITE_URL` = `https://<site-name>.netlify.app` (اختياري).
6. **Deploy**. ستحصل على رابط دائم بصيغة `https://<site-name>.netlify.app` يمكنك تغييره من
   *Domain management* → *Options* → *Edit site name*، أو ربط نطاق مخصص.

> **ملاحظات مهمة**
> - استخدم رابط Neon **Pooled** مع `pg`، فعدد اتصالات Netlify Functions غير ثابت.
> - لا تشغّل `db:seed` على كل نشر لأنه يعيد ضبط محتوى الكورسات (لا يمسّ المستخدمين).
> - كوكي الجلسة يصبح `Secure` تلقائيًا عند الوصول عبر HTTPS، وNetlify توفّره افتراضيًا.
> - الأسرار تُضبط في Netlify فقط، ولا تُرفع إلى GitHub.

## القيود الحالية (مقارنة بالمواصفة الكاملة)

- نصوص *المحتوى* في قاعدة البيانات (عناوين الدروس والقصص والمفردات) عربية فقط؛ الواجهة نفسها ثنائية اللغة. إضافة ترجمة للمحتوى تتطلب أعمدة إنجليزية في المخطط.
- استعادة كلمة المرور والتحقق من البريد عبر رابط لم تُنفَّذا بعد.
- الرسوم البيانية في صفحة التقدم مبنية بعناصر CSS/SVG خفيفة، لا بمكتبة مخططات خارجية.
