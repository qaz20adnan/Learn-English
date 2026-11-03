import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, IBM_Plex_Sans_Arabic } from "next/font/google";
import { ThemeProvider } from "@/components/layout/ThemeProvider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

/**
 * IBM Plex Sans Arabic — the primary UI typeface (Decision D1, Stage 2).
 * Covers Arabic and Latin in one family, so mixed-language UI stays optically
 * consistent; Geist below it only backfills glyphs the Plex subset may miss.
 */
const plexSansArabic = IBM_Plex_Sans_Arabic({
  variable: "--font-plex-arabic",
  subsets: ["arabic"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Fluently | فلوينتلي — أكاديمية التحدث بالإنجليزية",
    template: "%s · Fluently | فلوينتلي",
  },
  description:
    "Fluently | فلوينتلي — منصة عربية حديثة لتعلّم الإنجليزية: كورسات منظمة، مشغل فيديو وصوت، مفردات مع مراجعة ذكية، قصص واختبارات، وتتبع للتقدم.",
  applicationName: "Fluently | فلوينتلي",
  authors: [{ name: "Eng. Adnan Al-Qadi" }],
  creator: "Eng. Adnan Al-Qadi",
  keywords: [
    "تعلم الإنجليزية",
    "كورسات إنجليزية",
    "محادثة إنجليزية",
    "Fluently",
    "English learning",
  ],
  openGraph: {
    title: "Fluently | فلوينتلي — أكاديمية التحدث بالإنجليزية",
    description:
      "كورسات منظمة، مشغل موحّد، مفردات بمراجعة ذكية، قصص واختبارات، وتتبع دقيق للتقدم.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f8fc" },
    { media: "(prefers-color-scheme: dark)", color: "#070b16" },
  ],
};

const localeInit = `(function(){try{var m=document.cookie.match(/(?:^|; )eja_locale=([^;]+)/);var l=m?decodeURIComponent(m[1]):'ar';document.documentElement.lang=l;document.documentElement.dir=l==='en'?'ltr':'rtl';}catch(e){}})();`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ar"
      dir="rtl"
      suppressHydrationWarning
      className={`${plexSansArabic.variable} ${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: localeInit }} />
      </head>
      <body className="min-h-full flex flex-col font-sans">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
