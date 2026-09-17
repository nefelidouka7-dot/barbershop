"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from "react";
import { useRouter } from "next/navigation";
import {
  defaultLocale,
  isLocale,
  LOCALE_COOKIE,
  type Locale,
} from "@/lib/i18n/config";
import { getDictionary, type Dictionary } from "@/lib/i18n/dictionaries";

type LocaleContextValue = {
  locale: Locale;
  dict: Dictionary;
  setLocale: (next: Locale) => void;
  isPending: boolean;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

function writeLocaleCookie(locale: Locale) {
  const maxAge = 60 * 60 * 24 * 365;
  document.cookie = `${LOCALE_COOKIE}=${locale};path=/;max-age=${maxAge};samesite=lax`;
}

export function LocaleProvider({
  initialLocale,
  children,
}: {
  initialLocale: Locale;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [locale, setLocaleState] = useState<Locale>(
    isLocale(initialLocale) ? initialLocale : defaultLocale
  );
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (isLocale(initialLocale) && initialLocale !== locale) {
      setLocaleState(initialLocale);
    }
    // Sync only when server sends a new cookie-backed locale after refresh.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialLocale]);

  const setLocale = useCallback(
    (next: Locale) => {
      if (next === locale) return;
      writeLocaleCookie(next);
      setLocaleState(next);
      document.documentElement.lang = next;
      startTransition(() => {
        router.refresh();
      });
    },
    [locale, router]
  );

  const value = useMemo<LocaleContextValue>(
    () => ({
      locale,
      dict: getDictionary(locale),
      setLocale,
      isPending,
    }),
    [locale, setLocale, isPending]
  );

  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  );
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    throw new Error("useLocale must be used within LocaleProvider");
  }
  return ctx;
}
