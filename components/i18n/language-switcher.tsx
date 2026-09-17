"use client";

import { useLocale } from "@/components/i18n/locale-provider";
import type { Locale } from "@/lib/i18n/config";
import { cn } from "@/lib/utils";

export function LanguageSwitcher({ className }: { className?: string }) {
  const { locale, setLocale, dict, isPending } = useLocale();

  const options: { value: Locale; label: string }[] = [
    { value: "el", label: dict.lang.el },
    { value: "en", label: dict.lang.en },
  ];

  return (
    <div
      className={cn(
        "inline-flex items-center border border-foreground/20 bg-foreground/[0.03] text-[11px] tracking-[0.08em]",
        className
      )}
      role="group"
      aria-label={dict.lang.label}
    >
      {options.map((opt) => {
        const active = locale === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            disabled={isPending}
            onClick={() => setLocale(opt.value)}
            aria-pressed={active}
            className={cn(
              "px-2.5 py-1.5 transition",
              active
                ? "bg-foreground/10 text-foreground"
                : "text-foreground/45 hover:text-foreground/80"
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
