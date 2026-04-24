import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { BottomNav } from "@/components/BottomNav";
import { CATEGORIES } from "@/lib/categories";
import { LogOut, Save, Upload, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useRef } from "react";

type Profile = {
  id: string;
  role: "creator" | "brand" | null;
  display_name: string | null;
  bio: string | null;
  image_url: string | null;
  instagram: string | null;
  tiktok: string | null;
  product_description: string | null;
  categories: string[] | null;
};

export const Route = createFileRoute("/profile")({
  component: ProfilePage,
});

function ProfilePage() {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [p, setP] = useState<Profile | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth", search: { mode: "signin" } });
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => setP(data));
  }, [user]);

  const update = <K extends keyof Profile>(k: K, v: Profile[K]) =>
    setP((cur) => (cur ? { ...cur, [k]: v } : cur));

  const toggleCat = (c: string) => {
    if (!p) return;
    const cur = p.categories ?? [];
    update("categories", cur.includes(c) ? cur.filter((x) => x !== c) : [...cur, c]);
  };

  const save = async () => {
    if (!p || !user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: p.display_name,
        bio: p.bio,
        image_url: p.image_url,
        instagram: p.instagram,
        tiktok: p.tiktok,
        product_description: p.product_description,
        categories: p.categories,
      })
      .eq("id", user.id);
    setSaving(false);
    if (error) toast.error(error.message);
    else toast.success("Profile updated");
  };

  const handleSignOut = async () => {
    await signOut();
    navigate({ to: "/" });
  };

  if (!p) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-sm text-muted-foreground">Loading…</div>
      </div>
    );
  }

  const isCreator = p.role === "creator";

  return (
    <div className="min-h-screen bg-background pb-28">
      <header className="px-5 pt-12 pb-4">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Profile</h1>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground"
          >
            <LogOut className="h-3.5 w-3.5" /> Sign out
          </button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-md px-5">
        <div className="flex flex-col items-center gap-3">
          <div className="h-28 w-28 overflow-hidden rounded-full border-4 border-primary/30 bg-muted shadow-glow">
            {p.image_url ? (
              <img src={p.image_url} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-primary text-3xl font-bold text-primary-foreground">
                {p.display_name?.[0]?.toUpperCase() ?? "?"}
              </div>
            )}
          </div>
          <span className="rounded-full bg-gradient-primary px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-primary-foreground shadow-glow">
            {p.role}
          </span>
        </div>

        <div className="mt-8 space-y-4">
          <Field label={isCreator ? "Username" : "Brand name"}>
            <input
              value={p.display_name ?? ""}
              onChange={(e) => update("display_name", e.target.value)}
              maxLength={50}
              className="input-linkr"
            />
          </Field>
          <Field label={isCreator ? "Profile image URL" : "Product image URL"}>
            <input
              value={p.image_url ?? ""}
              onChange={(e) => update("image_url", e.target.value)}
              className="input-linkr"
              placeholder="https://…"
            />
          </Field>
          <Field label={isCreator ? "Bio" : "Short description"}>
            <textarea
              value={(isCreator ? p.bio : p.product_description) ?? ""}
              onChange={(e) =>
                isCreator
                  ? update("bio", e.target.value)
                  : update("product_description", e.target.value)
              }
              maxLength={200}
              rows={3}
              className="input-linkr min-h-[88px] py-3"
            />
          </Field>

          {isCreator && (
            <>
              <Field label="Instagram">
                <div className="relative">
                  <Instagram className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    value={p.instagram ?? ""}
                    onChange={(e) => update("instagram", e.target.value)}
                    className="input-linkr pl-11"
                    placeholder="@yourhandle"
                  />
                </div>
              </Field>
              <Field label="TikTok">
                <div className="relative">
                  <Music2 className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    value={p.tiktok ?? ""}
                    onChange={(e) => update("tiktok", e.target.value)}
                    className="input-linkr pl-11"
                    placeholder="@yourhandle"
                  />
                </div>
              </Field>
            </>
          )}

          <div>
            <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Categories
            </label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((c) => {
                const active = (p.categories ?? []).includes(c);
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => toggleCat(c)}
                    className={`rounded-full border px-4 py-2 text-sm font-medium transition-all ${
                      active
                        ? "border-transparent bg-gradient-primary text-primary-foreground shadow-glow"
                        : "border-border bg-card text-foreground"
                    }`}
                  >
                    {c}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <button
          onClick={save}
          disabled={saving}
          className="mt-8 flex h-14 w-full items-center justify-center gap-2 rounded-full bg-gradient-primary text-base font-semibold text-primary-foreground shadow-glow transition-transform active:scale-[0.98] disabled:opacity-60"
        >
          <Save className="h-5 w-5" />
          {saving ? "Saving…" : "Save changes"}
        </button>
      </main>

      <BottomNav />

      <style>{`
        .input-linkr {
          height: 56px;
          width: 100%;
          border-radius: 1rem;
          border: 1px solid var(--border);
          background: var(--card);
          padding: 0 1rem;
          font-size: 1rem;
          outline: none;
          transition: border-color .2s;
          color: var(--foreground);
        }
        .input-linkr:focus { border-color: var(--primary); }
      `}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </label>
      {children}
    </div>
  );
}
