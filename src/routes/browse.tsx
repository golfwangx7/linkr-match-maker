import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { BottomNav } from "@/components/BottomNav";
import { Flame, MapPin, Tag } from "lucide-react";
import { toast } from "sonner";

type FeedProfile = {
  id: string;
  role: "creator" | "brand" | null;
  display_name: string | null;
  image_url: string | null;
  country: string | null;
  categories: string[] | null;
};

const FILTERS = ["All", "Beauty", "Fashion", "Tech"] as const;
type Filter = (typeof FILTERS)[number];

export const Route = createFileRoute("/browse")({
  component: Browse,
});

function Browse() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState<FeedProfile[] | null>(null);
  const [filter, setFilter] = useState<Filter>("All");

  useEffect(() => {
    if (!authLoading && !user) navigate({ to: "/auth", search: { mode: "signin" } });
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, role, display_name, image_url, country, categories")
        .not("display_name", "is", null)
        .neq("id", user.id)
        .limit(200);
      if (error) {
        toast.error(error.message);
        return;
      }
      setProfiles((data ?? []) as FeedProfile[]);
    })();
  }, [user]);

  const filtered = useMemo(() => {
    if (!profiles) return null;
    if (filter === "All") return profiles;
    return profiles.filter((p) =>
      (p.categories ?? []).some((c) => c.toLowerCase() === filter.toLowerCase()),
    );
  }, [profiles, filter]);

  if (authLoading || profiles === null || filtered === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Flame className="h-8 w-8 animate-pulse text-primary" />
      </div>
    );
  }

  return (
    <div
      className="fixed inset-x-0 top-0 flex flex-col overflow-hidden bg-background"
      style={{ height: "100dvh" }}
    >
      <div
        className="flex-1 overflow-y-auto overscroll-contain"
        style={{
          WebkitOverflowScrolling: "touch",
        }}
      >
        <header className="px-5 pt-[max(2.5rem,env(safe-area-inset-top))] pb-3">
          <h1 className="text-2xl font-bold">Feed</h1>
          <p className="text-sm text-muted-foreground">Browse creators and brands</p>
        </header>

        <div className="sticky top-0 z-10 -mb-2 bg-background/80 px-5 py-3 backdrop-blur-xl">
          <div className="flex gap-2 overflow-x-auto">
            {FILTERS.map((f) => {
              const active = filter === f;
              return (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFilter(f)}
                  className={`shrink-0 rounded-full border px-4 py-1.5 text-xs font-semibold transition-all ${
                    active
                      ? "border-transparent bg-gradient-primary text-primary-foreground shadow-glow"
                      : "border-border bg-card text-muted-foreground"
                  }`}
                >
                  {f}
                </button>
              );
            })}
          </div>
        </div>

        <main className="mx-auto w-full max-w-md px-4 pt-4">
          {filtered.length === 0 ? (
            <div className="mt-16 text-center text-sm text-muted-foreground">
              No profiles match this filter.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {filtered.map((p) => (
                <ProfileCard key={p.id} profile={p} />
              ))}
            </div>
          )}
        </main>
      </div>

      <BottomNav />
    </div>
  );
}

function ProfileCard({ profile }: { profile: FeedProfile }) {
  const fallback =
    profile.role === "brand"
      ? "https://images.unsplash.com/photo-1556742393-d75f468bfcb0?w=600&auto=format&fit=crop"
      : "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=600&auto=format&fit=crop";
  const cat = profile.categories?.[0];

  return (
    <Link
      to="/u/$id"
      params={{ id: profile.id }}
      className="group overflow-hidden rounded-2xl border border-border bg-card shadow-soft transition-transform active:scale-95"
    >
      <div className="relative aspect-square w-full overflow-hidden">
        <img
          src={profile.image_url || fallback}
          alt={profile.display_name ?? "profile"}
          className="absolute inset-0 h-full w-full object-cover"
          loading="lazy"
          onError={(e) => {
            (e.target as HTMLImageElement).src = fallback;
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
        {profile.role && (
          <span className="absolute left-2 top-2 rounded-full bg-black/50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white backdrop-blur">
            {profile.role}
          </span>
        )}
      </div>
      <div className="space-y-1 p-3">
        <h3 className="truncate text-sm font-bold">
          {profile.display_name ?? "Anonymous"}
        </h3>
        <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
          <MapPin className="h-3 w-3 shrink-0" />
          <span className="truncate">{profile.country || "—"}</span>
        </div>
        {cat && (
          <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <Tag className="h-3 w-3 shrink-0" />
            <span className="truncate">{cat}</span>
          </div>
        )}
      </div>
    </Link>
  );
}
