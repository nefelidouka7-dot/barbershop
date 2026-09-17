"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState, Spinner } from "@/components/ui/states";
import { toast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import type { Barber } from "@/types/database";

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() || "")
    .join("");
}

export default function BarbersAdminPage() {
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [photo, setPhoto] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const { data } = await supabase.from("barbers").select("*").order("name");
      setBarbers((data as Barber[]) || []);
    } catch {
      setBarbers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const activeCount = useMemo(
    () => barbers.filter((b) => b.active).length,
    [barbers]
  );

  async function createBarber() {
    if (name.trim().length < 2) {
      toast({ title: "Name required", description: "At least 2 characters." });
      return;
    }
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase.from("barbers").insert({
      name: name.trim(),
      bio: bio.trim() || null,
      photo_url: photo.trim() || null,
      active: true,
    });
    setSaving(false);
    if (error) toast({ title: "Failed", description: error.message });
    else {
      toast({ title: "Barber added" });
      setName("");
      setBio("");
      setPhoto("");
      load();
    }
  }

  async function toggle(b: Barber) {
    const supabase = createClient();
    const { error } = await supabase
      .from("barbers")
      .update({ active: !b.active })
      .eq("id", b.id);
    if (error) toast({ title: "Update failed", description: error.message });
    else {
      toast({ title: b.active ? "Deactivated" : "Activated" });
      load();
    }
  }

  async function save(b: Barber, patch: Partial<Barber>) {
    const supabase = createClient();
    const { error } = await supabase.from("barbers").update(patch).eq("id", b.id);
    if (error) toast({ title: "Update failed", description: error.message });
    else {
      toast({ title: "Saved" });
      load();
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="pb-8">
      <header className="border-b border-border pb-8">
        <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">
          Team
        </p>
        <h1 className="mt-2 font-display text-4xl md:text-5xl">Barbers</h1>
        <p className="mt-3 max-w-xl text-muted-foreground">
          Profiles that appear on the booking flow and the public site.
        </p>
        <div className="mt-6 flex flex-wrap gap-6 text-sm">
          <p>
            <span className="font-display text-2xl text-primary">
              {activeCount}
            </span>
            <span className="ml-2 text-muted-foreground">active</span>
          </p>
          <p>
            <span className="font-display text-2xl">{barbers.length}</span>
            <span className="ml-2 text-muted-foreground">in roster</span>
          </p>
        </div>
      </header>

      <div className="mt-10 grid gap-12 lg:grid-cols-[1fr_340px]">
        <section>
          {barbers.length === 0 ? (
            <EmptyState
              title="No barbers yet"
              description="Add the first chair from the form on the right."
            />
          ) : (
            <ul className="grid gap-5 sm:grid-cols-2">
              {barbers.map((b) => {
                const open = editingId === b.id;
                return (
                  <li
                    key={b.id}
                    className={cn(
                      "overflow-hidden border border-border transition",
                      open && "border-primary/45",
                      !b.active && "opacity-70"
                    )}
                  >
                    <div className="relative aspect-[4/3] bg-muted">
                      {b.photo_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={b.photo_url}
                          alt={b.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/20 via-card to-background">
                          <span className="font-display text-5xl text-primary/80">
                            {initials(b.name) || "—"}
                          </span>
                        </div>
                      )}
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-background/95 via-background/50 to-transparent p-4 pt-12">
                        <div className="flex items-end justify-between gap-2">
                          <div className="min-w-0">
                            <p className="truncate font-display text-2xl">
                              {b.name}
                            </p>
                            {b.bio && (
                              <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                                {b.bio}
                              </p>
                            )}
                          </div>
                          <Badge variant={b.active ? "success" : "secondary"}>
                            {b.active ? "Active" : "Off"}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 border-t border-border px-3 py-2.5">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="flex-1"
                        onClick={() => setEditingId(open ? null : b.id)}
                      >
                        {open ? "Close" : "Edit"}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toggle(b)}
                      >
                        {b.active ? "Deactivate" : "Activate"}
                      </Button>
                    </div>

                    {open && (
                      <div className="space-y-3 border-t border-border bg-card/30 p-4">
                        <div className="space-y-1.5">
                          <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                            Name
                          </Label>
                          <Input
                            defaultValue={b.name}
                            onBlur={(e) => {
                              if (e.target.value.trim() && e.target.value !== b.name) {
                                save(b, { name: e.target.value.trim() });
                              }
                            }}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                            Bio
                          </Label>
                          <Textarea
                            defaultValue={b.bio || ""}
                            rows={3}
                            onBlur={(e) => {
                              if (e.target.value !== (b.bio || "")) {
                                save(b, { bio: e.target.value || null });
                              }
                            }}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                            Photo URL
                          </Label>
                          <Input
                            defaultValue={b.photo_url || ""}
                            placeholder="https://…"
                            onBlur={(e) => {
                              if (e.target.value !== (b.photo_url || "")) {
                                save(b, {
                                  photo_url: e.target.value.trim() || null,
                                });
                              }
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <aside className="lg:sticky lg:top-6 lg:self-start">
          <form
            className="border border-border border-primary/25 bg-primary/[0.03] p-5"
            onSubmit={(e) => {
              e.preventDefault();
              createBarber();
            }}
          >
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
              New profile
            </p>
            <h2 className="mt-2 font-display text-2xl">Add barber</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Name and photo show on the public booking steps.
            </p>

            <div className="mt-5 aspect-[4/3] overflow-hidden border border-border bg-muted">
              {photo.trim() ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={photo.trim()}
                  alt="Preview"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/15 via-card to-background">
                  <span className="font-display text-4xl text-primary/70">
                    {initials(name) || "?"}
                  </span>
                </div>
              )}
            </div>

            <div className="mt-4 space-y-3">
              <div className="space-y-1.5">
                <Label>Name</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Alex"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label>Bio</Label>
                <Textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Short intro for the shop page"
                  rows={3}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Photo URL</Label>
                <Input
                  value={photo}
                  onChange={(e) => setPhoto(e.target.value)}
                  placeholder="https://…"
                />
              </div>
              <Button type="submit" className="w-full" disabled={saving}>
                {saving ? "Saving…" : "Create profile"}
              </Button>
            </div>
          </form>
        </aside>
      </div>
    </div>
  );
}
