import type { Metadata } from "next";
import { RecoveryRedirect } from "@/components/auth/recovery-redirect";
import { LocaleProvider } from "@/components/i18n/locale-provider";
import { ScrollProgress } from "@/components/motion/scroll-progress";
import { Toaster } from "@/components/ui/use-toast";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getLocale } from "@/lib/i18n/get-locale";
import { shopName } from "@/lib/utils";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const dict = getDictionary(locale);
  return {
    title: shopName(),
    description: dict.meta.description,
  };
}

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const locale = await getLocale();

  return (
    <html lang={locale} className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=EB+Garamond:wght@400;500;600;700&family=Manrope:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans">
        <LocaleProvider initialLocale={locale}>
          <ScrollProgress />
          <RecoveryRedirect />
          {children}
        </LocaleProvider>
        <Toaster />
      </body>
    </html>
  );
}
