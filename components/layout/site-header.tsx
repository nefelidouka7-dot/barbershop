"use client";

import Link from "next/link";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import { useLocale } from "@/components/i18n/locale-provider";
import { SiteLogo } from "@/components/layout/site-logo";
import { shopName } from "@/lib/utils";

export function SiteHeader() {
  const { dict } = useLocale();

  return (
    <header className="absolute inset-x-0 top-0 z-20">
      <div className="bg-gradient-to-b from-background/70 via-background/25 via-40% to-transparent pt-1 pb-16 md:pb-24">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-5 py-4 md:gap-4 md:px-8 md:py-5">
          <SiteLogo priority />
          <nav className="flex items-center gap-0.5 text-[13px] font-medium tracking-wide text-foreground/90 sm:gap-1 [text-shadow:0_1px_12px_rgba(0,0,0,0.55)]">
            <a
              href="/#services"
              className="nav-link hidden px-2.5 py-1.5 transition-colors duration-300 hover:text-primary sm:inline md:px-3"
            >
              {dict.nav.menu}
            </a>
            <a
              href="/#barbers"
              className="nav-link hidden px-2.5 py-1.5 transition-colors duration-300 hover:text-primary sm:inline md:px-3"
            >
              {dict.nav.barbers}
            </a>
            <a
              href="/#visit"
              className="nav-link hidden px-2.5 py-1.5 transition-colors duration-300 hover:text-primary md:inline md:px-3"
            >
              {dict.nav.visit}
            </a>
            <Link
              href="/account"
              className="nav-link hidden px-2.5 py-1.5 transition-colors duration-300 hover:text-primary sm:inline md:px-3"
            >
              {dict.nav.account}
            </Link>
            <LanguageSwitcher className="ml-1.5 border-foreground/25 bg-background/20 backdrop-blur-[2px]" />
            <Link
              href="/book"
              className="btn-sheen ml-2 border border-foreground/25 bg-background/20 px-3.5 py-2 text-foreground backdrop-blur-[2px] transition-all duration-500 ease-soft hover:border-primary/45 hover:bg-primary/12 hover:text-primary hover:-translate-y-px md:px-4"
            >
              {dict.nav.book}
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}

export function SiteFooter() {
  const { dict } = useLocale();
  const name = shopName();

  return (
    <footer className="border-t border-border/60">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 md:grid-cols-3 md:px-8 md:py-16">
        <div>
          <SiteLogo size="footer" />
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted-foreground">
            {dict.footer.blurb}
          </p>
          <div className="mt-5">
            <LanguageSwitcher />
          </div>
        </div>
        <div>
          <p className="text-xs tracking-[0.18em] text-muted-foreground uppercase">
            {dict.footer.explore}
          </p>
          <ul className="mt-4 space-y-2 text-sm">
            <li>
              <a href="/#services" className="transition-colors duration-300 hover:text-primary">
                {dict.footer.services}
              </a>
            </li>
            <li>
              <a href="/#barbers" className="transition-colors duration-300 hover:text-primary">
                {dict.footer.barbers}
              </a>
            </li>
            <li>
              <Link href="/book" className="transition-colors duration-300 hover:text-primary">
                {dict.footer.book}
              </Link>
            </li>
            <li>
              <Link href="/account" className="transition-colors duration-300 hover:text-primary">
                {dict.footer.account}
              </Link>
            </li>
            <li>
              <Link href="/admin" className="transition-colors duration-300 hover:text-primary">
                {dict.footer.staff}
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="text-xs tracking-[0.18em] text-muted-foreground uppercase">
            {dict.footer.contact}
          </p>
          <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
            <li>{dict.footer.address}</li>
            <li>
              <a href="tel:+302310952223" className="hover:text-foreground">
                231 095 2223
              </a>
            </li>
            <li>{dict.footer.hoursShort}</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border/40 py-5 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} {name}
      </div>
    </footer>
  );
}
