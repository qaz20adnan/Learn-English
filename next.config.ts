import type { NextConfig } from "next";

/**
 * T5 — ترويسات الأمان (Sprint 0).
 *
 * - الأربع الأولى إلزامية فوراً (منع التخمين، تقييد الإحالة، تقييد قدرات المتصفح، منع التأطير).
 * - CSP في وضع Report-Only لمدة أسبوع (قرار الخطة: لا إلزام قبل مراقبة الانتهاكات —
 *   خطر كسر مشغل يوتيوب R3). بعد أسبوع بلا انتهاكات: انقل السياسة إلى
 *   Content-Security-Policy وأعد فحص E2E للمشغل.
 * - script-src 'unsafe-inline' مطلوب حالياً لسكربتات التهيئة المضمنة في Next.js —
 *   تشديده بالـ nonce بند تطوير مستقل (Sprint 1+).
 * - media-src/img-src واسعة (https:) لأن محتوى الدروس يأتي من قاعدة البيانات ولا يمكن
 *   حصر مضيفاته مسبقاً — راقب تقارير الانتهاك لتضييقها لاحقاً.
 * - frame-ancestors لا يعمل في وضع Report-Only؛ الحماية الفعلية من التأطير عبر X-Frame-Options.
 */
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
  { key: "X-Frame-Options", value: "DENY" },
  {
    key: "Content-Security-Policy-Report-Only",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "media-src 'self' https:",
      "font-src 'self' data:",
      "connect-src 'self'",
      "frame-src https://www.youtube.com https://www.youtube-nocookie.com https://player.vimeo.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  serverExternalPackages: ['pg'],
  cacheComponents: true,
  partialPrefetching: true,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
