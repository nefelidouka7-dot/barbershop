"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "@/components/i18n/locale-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/states";
import { toast } from "@/components/ui/use-toast";
import { createClient } from "@/lib/supabase/client";
import { shopName } from "@/lib/utils";

export default function ResetPasswordPage() {
  const router = useRouter();
  const { dict } = useLocale();
  const t = dict.reset;
  const [ready, setReady] = useState(false);
  const [invalid, setInvalid] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        const supabase = createClient();
        const hash = window.location.hash.startsWith("#")
          ? window.location.hash.slice(1)
          : "";
        const params = new URLSearchParams(hash);
        const accessToken = params.get("access_token");
        const refreshToken = params.get("refresh_token");

        if (accessToken && refreshToken) {
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (sessionError) throw sessionError;
          window.history.replaceState(null, "", "/auth/reset");
        }

        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (cancelled) return;
        if (!user) {
          setInvalid(true);
          return;
        }
        setReady(true);
      } catch {
        if (!cancelled) setInvalid(true);
      }
    }

    init();
    return () => {
      cancelled = true;
    };
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 6) {
      setError(t.tooShort);
      return;
    }
    if (password !== confirm) {
      setError(t.mismatch);
      return;
    }
    setSaving(true);
    try {
      const supabase = createClient();
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });
      if (updateError) {
        setError(updateError.message);
        return;
      }
      toast({ title: t.success });
      router.push("/admin");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t.invalid);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-5">
      <h1 className="font-display text-4xl">{shopName()}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{t.title}</p>

      {!ready && !invalid ? (
        <div className="mt-10 flex justify-center">
          <Spinner />
        </div>
      ) : invalid ? (
        <p className="mt-8 text-sm text-muted-foreground">{t.invalid}</p>
      ) : (
        <form className="mt-8 space-y-4" onSubmit={onSubmit}>
          <p className="text-sm text-muted-foreground">{t.subtitle}</p>
          <div className="space-y-2">
            <Label htmlFor="password">{t.password}</Label>
            <Input
              id="password"
              type="password"
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm">{t.confirm}</Label>
            <Input
              id="confirm"
              type="password"
              minLength={6}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
            />
          </div>
          {error && <p className="text-sm text-red-300">{error}</p>}
          <Button type="submit" className="w-full" disabled={saving}>
            {saving ? <Spinner /> : t.save}
          </Button>
        </form>
      )}
    </div>
  );
}
