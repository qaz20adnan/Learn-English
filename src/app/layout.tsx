import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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

export const metadata: Metadata = {
  title: {
    default: "أكاديمية رحلة الإنجليزية",
    template: "%s · أكاديمية رحلة الإنجليزية",
  },
  description:
    "منصة عربية لتعلم الإنجليزية: كورسات منظمة، مشغل فيديو وصوت، مفردات مع مراجعة ذكية، قصص واختبارات، وتتبع للتقدم.",
  applicationName: "English Journey Academy",
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
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
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
