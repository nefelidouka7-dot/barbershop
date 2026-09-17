import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getLocale } from "@/lib/i18n/get-locale";

export default async function NotFound() {
  const locale = await getLocale();
  const copy =
    locale === "el"
      ? {
          missing: "Αυτή η σελίδα δεν υπάρχει.",
          home: "Επιστροφή στην αρχική",
        }
      : {
          missing: "This page doesn't exist.",
          home: "Back home",
        };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-5 text-center">
      <p className="font-display text-5xl">404</p>
      <p className="mt-3 text-muted-foreground">{copy.missing}</p>
      <Button asChild className="mt-8">
        <Link href="/">{copy.home}</Link>
      </Button>
    </div>
  );
}
