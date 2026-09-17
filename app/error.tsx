"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useLocale } from "@/components/i18n/locale-provider";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { locale } = useLocale();

  useEffect(() => {
    console.error(error);
  }, [error]);

  const copy =
    locale === "el"
      ? {
          title: "Κάτι πήγε στραβά",
          fallback: "Δοκιμάστε ξανά.",
          retry: "Ξανά",
          home: "Αρχική",
        }
      : {
          title: "Something went wrong",
          fallback: "Please try again.",
          retry: "Try again",
          home: "Home",
        };

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center px-5 text-center">
      <p className="font-display text-3xl">{copy.title}</p>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        {error.message || copy.fallback}
      </p>
      <div className="mt-6 flex gap-3">
        <Button onClick={reset}>{copy.retry}</Button>
        <Button asChild variant="outline">
          <Link href="/">{copy.home}</Link>
        </Button>
      </div>
    </div>
  );
}
