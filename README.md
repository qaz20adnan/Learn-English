# Fluently | فلوينتلي — أكاديمية التحدث بالإنجليزية

منصة تعليمية متكاملة (Full-Stack) لتعلّم اللغة الإنجليزية للناطقين بالعربية، مبنية بـ **Next.js 16 + React 19 + TypeScript + Tailwind v4**، مع مصادقة حقيقية على الخادم، قاعدة بيانات **PostgreSQL**، مشغّل وسائط يدعم YouTube/Vimeo/الملفات المباشرة، ونظام مفردات بالمراجعة المتباعدة (SM-2)، وقصص واختبارات، ولوحة إدارة.

> الواجهة تدعم **العربية (RTL)** و**الإنجليزية (LTR)** بالكامل مع تبديل فوري، وخمسة مظاهر قراءة: الفاتح، الداكن، الزمردي النوردي، العنبري الدافئ، ومنتصف الليل — إضافة إلى وضع النظام.

## المزايا

- **مصادقة حقيقية**: تجزئة كلمات المرور بـ bcryptjs، جلسات معتمة مخزنة في قاعدة البيانات (توكن مُجزّأ بـ sha256) داخل كوكي `httpOnly`. التحقق من الصلاحيات على الخادم في طبقة `dal.ts` فقط.
- **أدوار**: طالب/مشرف. أول حساب مسجَّل يصبح مشرفًا (Bootstrap) — أو أنشئ مشرفًا عبر متغيرات البيئة.
- **كورسات ودروس**: منهج **zAmerican English** الكامل (33 قائمة تشغيل حقيقية عبر معرّفات Playlist) + محتوى تجريبي محفوظ للمطوّرين، صفحات تفاصيل الكورس والدرس، تسجيل تقدّم حقيقي.
- **دورة تعلّم متسلسلة**: مراجعة إلزامية للدرس السابق، قفل الدرس التالي حتى اجتياز اختبار الدرس الحالي (70% افتراضيًا)، وروابط واضحة للمراجعة والاختبار.
- **مزامنة المنهج**: أمر واحد يجلب كل قوائم تشغيل قناة zAmerican English (عبر YouTube Data API v3 عند توفر مفتاح، أو InnerTube/الكتالوج المهيكل بدون مفتاح)، ويدرّج العناوين والأوصاف ومعرّفات الفيديو والدروس والوسائط، **ويولّد تلقائيًا** مفردات وبنك أسئلة كبيرًا لكل درس.
- **مشغّل وسائط**: YouTube IFrame API، Vimeo Player، HTML5 Audio/Video، مع حفظ موضع المشاهدة واستئنافه، ومعالجة الأخطاء وفتح المصدر البديل.
- **مفردات + مراجعة متباعدة**: بنك مشترك يتوسّع مع كل درس، خوارزمية SM-2 قابلة للاختبار، بطاقات تفاعلية (Again/Hard/Good/Easy)، وتذكير مراجعة يومي على لوحة التعلّم.
- **اختبارات ديناميكية**: جلسة اختبار مخزّنة على الخادم تسحب 8 أسئلة عشوائية من بنك مُتجدد، مع محاولات بأسئلة جديدة وربط مباشر بقفل الدروس.
- **قصص واختبارات**: 19 قصة متدرجة (foundation → c1) مع أسئلة فهم، وقت قراءة تقديري، وتصحيح تلقائي وحفظ أفضل نتيجة، وزر للانتقال إلى القصة التالية.
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
| `YOUTUBE_API_KEY` | اختياري. عند ضبطه يستخدم `db:sync` واجهة YouTube Data API v3 للأوصاف والمدد الرسمية. بدونه يعمل InnerTube/الكتالوج المهيكل. |
| `YOUTUBE_CHANNEL_HANDLE` | اختياري، افتراضيًا `@zamericanenglish`، لاكتشاف قوائم القناة عند توفر المفتاح. |
| `NEXT_PUBLIC_PROGRESS_HEARTBEAT_SECONDS` | دورية نبضة حفظ التقدّم من المشغّل. |
| `NEXT_PUBLIC_SITE_URL` | رابط الموقع (اختياري). |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` / `ADMIN_NAME` | تُستخدم وقت التغذية لإنشاء حساب مشرف. |

لا تضع أي أسرار حقيقية في المستودع.

## إعداد قاعدة البيانات

```bash
npm run db:setup        # إنشاء/ترقية الجداول (idempotent، يضيف أعمدة وجداول جديدة)
npm run db:seed         # تغذية المحتوى التجريبي (للتطوير فقط؛ يعيد ضبط المحتوى)
npm run db:sync         # مزامنة منهج zAmerican English كاملًا (يتطلب إنترنت)
npm run db:stories      # إضافة/تحديث مكتبة القصص دون مسح التقدّم
npm run db:verify-media # فحص روابط الوسائط عبر الشبكة
```

> السكربتات تقرأ `.env.local` تلقائيًا. ضع فيه `DATABASE_URL` قبل تشغيلها.

### مزامنة منهج zAmerican English

يقرأ `npm run db:sync` قوائم التشغيل المعرَّفة في `src/lib/content/catalog.ts` (كتالوج JSON مهيكل بمعرّفات Playlist حقيقية)، ويجلب فيديوهاتها من يوتيوب (مع تخزين مؤقت في `youtube_cache` وإعادة محاولة وتراجع إلى كاش قديم عند انقطاع الشبكة)، ثم ينشئ الكورسات والدروس والوسائط. عند ضبط `YOUTUBE_API_KEY` تُجلب الأوصاف والمدد من Data API v3؛ وبدونه تُستخدم InnerTube وصفحة القائمة العامة، مع إثراء الأوصاف من نقطة `player` العامة.

**التوليد**: لكل درس تُولَّد مفردات من بنك CEFR، وبنك أسئلة يجمع أسئلة القواعد مع أسئلة مشتقة من مفردات الدرس (معنى الكلمة، الكلمة من المعنى، وإكمال جملة). تُسحب 8 أسئلة عشوائيًا لكل محاولة من البنك، ويُحدَّث البنك عند `--refresh-content`. الأمر **idempotent** (تكراره لا يضاعف البيانات ولا يمسّ تقدّم المتعلّمين).

```bash
npm run db:sync                          # يستخدم الكاش إن وُجد
npm run db:sync -- --refresh             # يعيد جلب قوائم التشغيل من يوتيوب
npm run db:sync -- --refresh --refresh-content  # يعيد توليد المفردات وبنوك الأسئلة
npm run db:stories                       # يضيف/يحدّث قصص المكتبة وأسئلتها
```

> لا تشغّل `db:seed` على قاعدة الإنتاج: فهو يمسح محتوى الكورسات والقصص والتقدّم المرتبط بها. استخدم `db:sync` و`db:stories` للتحديث الآمن.

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
npm run test       # Vitest (84 اختبارًا، يعمل دون قاعدة بيانات عبر PGlite)
```

## بنية المشروع

```
src/
  app/
    (auth)/            صفحات الدخول والتسجيل + Server Actions
    (app)/             لوحة التعلّم، الكورسات، الدروس، المفردات، المراجعة، القصص، التقدم، الإعدادات
    admin/             لوحة الإدارة (users, media)
    api/               progress, review, quizzes/attempt, quizzes/session, stories/attempt, health
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
    progression.ts     قواعد فتح الدروس ونسبة النجاح (قابلة للاختبار)
    content/             catalog.ts (منهج zAmerican), generate.ts (توليد المفردات/الأسئلة), story-library.ts, seed-data.ts
scripts/               setup-db, seed, sync-catalog, sync-stories, verify-media
```

## التحقق من الوسائط — حدود مهمة

- الفحص **تقديري وليس ضمانًا**: يعتمد على استجابة المصادر الخارجية وقت الفحص، وقد يفشل مؤقتًا بسبب الشبكة (يُسجَّل `NEEDS_REVIEW`).
- لا يجري تجاوز أي قيود تضمين أو خصوصية؛ الروابط غير القابلة للتضمين تُعرض مع زر «فتح المصدر».
- المحتوى التجريبي يستخدم روابط عيّنات عامة (YouTube/Vimeo/SoundHelix/MDN/SampleLib) لأغراض العرض، وبعضها مجرد تجهيزات اختبار متوقّع أن تفشل (`fixture-invalid-url`, `fixture-unavailable`).

## النشر على Netlify

التطبيق يستخدم PostgreSQL، لذا لا يعتمد على قرص دائم ويعمل على Netlify Functions. ملف `netlify.toml` يضبط Node 24 ويشغّل `npm run build` فقط؛ ترقية المخطط عملية يدوية آمنة قبل النشر، حتى لا يعتمد البناء على قاعدة الإنتاج.

1. **أنشئ قاعدة بيانات Neon** (مجانية): <https://neon.tech> → New Project → انسخ **Pooled connection string**
   (المضيف يحتوي `-pooler`).
2. **جهّز القاعدة محليًا** بوضع الرابط في `.env.local`:

   ```bash
   DATABASE_URL=postgresql://...-pooler.../neondb?sslmode=require
   ```

   ثم:

   ```bash
   npm run db:setup
   npm run db:sync -- --refresh --refresh-content   # محتوى zAmerican الحقيقي
   npm run db:stories                               # مكتبة القصص
   # db:seed للتطوير المحلي فقط، وليس لقاعدة الإنتاج
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
   - Build command: `npm run build` (مضبوط في `netlify.toml`)، مع تشغيل `db:setup` يدويًا بعد أي تغيير في المخطط.
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
