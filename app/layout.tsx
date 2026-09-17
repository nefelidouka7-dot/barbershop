import type { Metadata } from "next";
import { EB_Garamond, Manrope } from "next/font/google";
import { LocaleProvider } from "@/components/i18n/locale-provider";
import { Toaster } from "@/components/ui/use-toast";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getLocale } from "@/lib/i18n/get-locale";
import { shopName } from "@/lib/utils";
import "./globals.css";

const display = EB_Garamond({
  subsets: ["latin", "latin-ext", "greek"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-display",
});

const sans = Manrope({
  subsets: ["latin", "latin-ext", "greek"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
});
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
      <body className={`${display.variable} ${sans.variable} font-sans`}>
        <LocaleProvider initialLocale={locale}>{children}</LocaleProvider>
        <Toaster />
      </body>
    </html>
  );
}
