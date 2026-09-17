"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn, shopName } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const links = [
  { href: "/admin", label: "Agenda" },
  { href: "/admin/barbers", label: "Barbers" },
  { href: "/admin/hours", label: "Schedule" },
  { href: "/admin/services", label: "Services" },
  { href: "/admin/customers", label: "Customers" },
  { href: "/admin/stats", label: "Stats" },
];

function isActive(pathname: string, href: string) {
  return href === "/admin"
    ? pathname === "/admin"
    : pathname.startsWith(href);
}

function currentLabel(pathname: string) {
  return links.find((l) => isActive(pathname, l.href))?.label || "Admin";
}

export function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  async function logout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    setOpen(false);
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <>
      {/* Mobile top bar */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur md:hidden">
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <div className="min-w-0">
            <Link href="/admin" className="font-display text-xl leading-none">
              {shopName()}
            </Link>
            <p className="mt-1 truncate text-xs text-muted-foreground">
              {currentLabel(pathname)}
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-expanded={open}
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </header>

      {/* Mobile full menu sheet */}
      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-background/70 backdrop-blur-sm"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
          />
          <div className="absolute inset-x-0 top-0 max-h-[90vh] overflow-y-auto border-b border-border bg-card px-4 pb-6 pt-4 shadow-xl">
            <div className="mb-5 flex items-start justify-between gap-3">
              <div>
                <p className="font-display text-2xl">{shopName()}</p>
                <p className="text-xs text-muted-foreground">Staff panel</p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Close menu"
                onClick={() => setOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            <nav className="flex flex-col gap-1">
              {links.map((l) => {
                const agenda = l.href === "/admin";
                const active = isActive(pathname, l.href);
                return (
                  <Link
                    key={l.href}
                    href={l.href}
                    className={cn(
                      "rounded-md px-3 transition",
                      agenda
                        ? "py-3.5 font-display text-2xl"
                        : "py-3 text-base",
                      active
                        ? "bg-primary/15 text-primary"
                        : "text-foreground/85"
                    )}
                  >
                    {l.label}
                  </Link>
                );
              })}
            </nav>

            <div className="mt-6 space-y-3 border-t border-border pt-4">
              <Button variant="outline" className="w-full" onClick={logout}>
                Sign out
              </Button>
              <Link
                href="/"
                className="block text-center text-sm text-muted-foreground"
              >
                Public site
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden shrink-0 border-r border-border bg-card/20 md:sticky md:top-0 md:flex md:h-screen md:w-56 md:flex-col">
        <div className="px-5 py-5">
          <Link href="/admin" className="font-display text-2xl">
            {shopName()}
          </Link>
          <p className="text-xs text-muted-foreground">Staff panel</p>
        </div>
        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 pb-3">
          {links.map((l) => {
            const agenda = l.href === "/admin";
            const active = isActive(pathname, l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={cn(
                  "whitespace-nowrap rounded-md px-3 transition",
                  agenda
                    ? "mb-3 py-3 font-display text-xl"
                    : "py-2 text-sm",
                  active
                    ? agenda
                      ? "bg-primary/20 text-primary"
                      : "bg-primary/15 text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-border/60 px-3 py-4">
          <Button variant="outline" size="sm" className="w-full" onClick={logout}>
            Sign out
          </Button>
          <Link
            href="/"
            className="mt-3 block text-center text-xs text-muted-foreground hover:text-foreground"
          >
            Public site
          </Link>
        </div>
      </aside>
    </>
  );
}
