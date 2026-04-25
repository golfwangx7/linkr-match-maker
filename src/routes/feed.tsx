import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { BottomNav } from "@/components/BottomNav";
import { SwipeCard, SwipeActions, type SwipeProfile } from "@/components/SwipeCard";
import { Flame, Sparkles, SlidersHorizontal, X, Undo2 } from "lucide-react";
import { toast } from "sonner";
import { CATEGORIES } from "@/lib/categories";

export const Route = createFileRoute("/feed")({
  component: Feed,
});

type Gender = "Male" | "Female" | "Diverse";
const GENDERS: Gender[] = ["Male", "Female", "Diverse"];

type Filters = {
  country: string;
  genders: Gender[];
  categories: string[];
};

const EMPTY_FILTERS: Filters = { country: "", genders: [], categories: [] };

function Feed() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState<SwipeProfile[] | null>(null);
  const [matchModal, setMatchModal] = useState<SwipeProfile | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [lastSwipe, setLastSwipe] = useState<{ profile: SwipeProfile; swipeId: string } | null>(null);
  const [undoing, setUndoing] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) navigate({ to: "/auth", search: { mode: "signin" } });
  }, [user, authLoading, navigate]);

  const loadFeed = useCallback(async () => {
    if (!user) return;
    const { data: me } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();
    if (!me?.role) {
      navigate({ to: "/onboarding" });
      return;
    }
    const oppositeRole = me.role === "creator" ? "brand" : "creator";

    const { data: swiped } = await supabase
      .from("swipes")
      .select("swiped_id")
      .eq("swiper_id", user.id);
    const excluded = new Set((swiped ?? []).map((s) => s.swiped_id));
    excluded.add(user.id);

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("role", oppositeRole)
      .not("display_name", "is", null)
      .limit(50);

    if (error) {
      toast.error(error.message);
      return;
    }
    setProfiles(
      (data ?? [])
        .filter((p) => !excluded.has(p.id))
        .reverse() as SwipeProfile[],
    );
  }, [user, navigate]);

  useEffect(() => {
    if (user) loadFeed();
  }, [user, loadFeed]);

  const filtered = useMemo(() => {
    if (!profiles) return null;
    const country = filters.country.trim().toLowerCase();
    return profiles.filter((p) => {
      const anyP = p as SwipeProfile & { country?: string | null; gender?: string | null };
      if (country && (anyP.country ?? "").toLowerCase() !== country) return false;
      if (filters.genders.length > 0 && !filters.genders.includes(anyP.gender as Gender))
        return false;
      if (filters.categories.length > 0) {
        const cats = p.categories ?? [];
        if (!filters.categories.some((c) => cats.includes(c))) return false;
      }
      return true;
    });
  }, [profiles, filters]);

  const handleSwipe = async (dir: "like" | "skip") => {
    if (!user || !filtered || filtered.length === 0) return;
    const target = filtered[filtered.length - 1];
    setProfiles((p) => (p ? p.filter((x) => x.id !== target.id) : []));

    const { data: inserted, error } = await supabase
      .from("swipes")
      .insert({
        swiper_id: user.id,
        swiped_id: target.id,
        direction: dir,
      })
      .select("id")
      .maybeSingle();
    if (error) {
      toast.error(error.message);
      return;
    }
    if (inserted) {
      setLastSwipe({ profile: target, swipeId: inserted.id });
    }

    if (dir === "like") {
      const { data: match } = await supabase
        .from("matches")
        .select("id")
        .or(
          `and(user_a.eq.${user.id},user_b.eq.${target.id}),and(user_a.eq.${target.id},user_b.eq.${user.id})`,
        )
        .maybeSingle();
      if (match) setMatchModal(target);
    }
  };

  const handleUndo = async () => {
    if (!user || !lastSwipe || undoing) return;
    setUndoing(true);
    const { profile, swipeId } = lastSwipe;
    const { error } = await supabase.from("swipes").delete().eq("id", swipeId);
    if (error) {
      toast.error(error.message);
      setUndoing(false);
      return;
    }
    // If a match was created from this swipe, remove it too.
    await supabase
      .from("matches")
      .delete()
      .or(
        `and(user_a.eq.${user.id},user_b.eq.${profile.id}),and(user_a.eq.${profile.id},user_b.eq.${user.id})`,
      );
    setProfiles((p) => (p ? [...p, profile] : [profile]));
    setMatchModal((m) => (m && m.id === profile.id ? null : m));
    setLastSwipe(null);
    setUndoing(false);
    toast.success("Swipe undone");
  };

  if (authLoading || profiles === null || filtered === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Flame className="h-8 w-8 animate-pulse text-primary" />
      </div>
    );
  }

  const top = filtered[filtered.length - 1];
  const visible = filtered.slice(-3);
  const activeFilterCount =
    (filters.country.trim() ? 1 : 0) + filters.genders.length + filters.categories.length;

  return (
    <div className="flex min-h-screen flex-col bg-background pb-16">
      <header className="flex items-center justify-between px-5 pt-10 pb-2">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-primary shadow-glow">
            <Flame className="h-4.5 w-4.5 text-primary-foreground" strokeWidth={2.5} />
          </div>
          <span className="text-lg font-bold">Linkr</span>
        </div>
        <button
          onClick={() => setFilterOpen(true)}
          aria-label="Filters"
          className="relative flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card transition-transform active:scale-90"
        >
          <SlidersHorizontal className="h-4.5 w-4.5" />
          {activeFilterCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-gradient-primary px-1 text-[10px] font-bold text-primary-foreground shadow-glow">
              {activeFilterCount}
            </span>
          )}
        </button>
      </header>

      <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-4 pb-20">
        <div className="relative w-full flex-1 min-h-0">
          {filtered.length === 0 ? (
            <EmptyState hasFilters={activeFilterCount > 0} onClear={() => setFilters(EMPTY_FILTERS)} />
          ) : (
            visible.map((p, i) => (
              <SwipeCard
                key={p.id}
                profile={p}
                onSwipe={handleSwipe}
                active={i === visible.length - 1}
                index={visible.length - 1 - i}
              />
            ))
          )}
        </div>
      </main>

      {top && (
        <div className="pointer-events-none fixed inset-x-0 bottom-20 z-30 flex flex-col items-center gap-2 pb-[env(safe-area-inset-bottom)]">
          <div className="pointer-events-auto">
            <SwipeActions
              onSkip={() => handleSwipe("skip")}
              onLike={() => handleSwipe("like")}
            />
          </div>
          {lastSwipe && (
            <button
              type="button"
              onClick={handleUndo}
              disabled={undoing}
              className="pointer-events-auto inline-flex items-center gap-1.5 rounded-full border border-border bg-card/90 px-3 py-1.5 text-[11px] font-medium text-muted-foreground backdrop-blur transition-colors active:bg-muted disabled:opacity-50"
            >
              <Undo2 className="h-3 w-3" />
              Undo
            </button>
          )}
        </div>
      )}

      {matchModal && (
        <MatchModal profile={matchModal} onClose={() => setMatchModal(null)} />
      )}

      {filterOpen && (
        <FilterSheet
          value={filters}
          onApply={(f) => {
            setFilters(f);
            setFilterOpen(false);
          }}
          onClose={() => setFilterOpen(false)}
        />
      )}

      <BottomNav />
    </div>
  );
}

function EmptyState({ hasFilters, onClear }: { hasFilters: boolean; onClear: () => void }) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center rounded-3xl border border-border bg-gradient-card p-8 text-center">
      <Sparkles className="h-10 w-10 text-primary" />
      <h3 className="mt-4 text-xl font-bold">
        {hasFilters ? "No matches for these filters" : "You're all caught up"}
      </h3>
      <p className="mt-2 text-sm text-muted-foreground">
        {hasFilters
          ? "Try removing a filter to see more profiles."
          : "Check back soon — new profiles join Linkr every day."}
      </p>
      {hasFilters && (
        <button
          onClick={onClear}
          className="mt-5 rounded-full bg-gradient-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}

function FilterSheet({
  value,
  onApply,
  onClose,
}: {
  value: Filters;
  onApply: (f: Filters) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState<Filters>(value);

  const toggleGender = (g: Gender) =>
    setDraft((d) => ({
      ...d,
      genders: d.genders.includes(g) ? d.genders.filter((x) => x !== g) : [...d.genders, g],
    }));

  const toggleCat = (c: string) =>
    setDraft((d) => ({
      ...d,
      categories: d.categories.includes(c)
        ? d.categories.filter((x) => x !== c)
        : [...d.categories, c],
    }));

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-t-3xl bg-background p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] shadow-glow sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-muted sm:hidden" />
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Filters</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-border active:bg-muted"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-6 space-y-6">
          <div>
            <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Country
            </label>
            <input
              value={draft.country}
              onChange={(e) => setDraft({ ...draft, country: e.target.value })}
              placeholder="e.g. Germany"
              className="h-12 w-full rounded-2xl border border-border bg-card px-4 text-sm outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Gender
            </label>
            <div className="flex flex-wrap gap-2">
              {GENDERS.map((g) => {
                const active = draft.genders.includes(g);
                return (
                  <button
                    key={g}
                    type="button"
                    onClick={() => toggleGender(g)}
                    className={`rounded-full border px-4 py-2 text-sm font-medium transition-all ${
                      active
                        ? "border-transparent bg-gradient-primary text-primary-foreground shadow-glow"
                        : "border-border bg-card text-foreground"
                    }`}
                  >
                    {g}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Categories
            </label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((c) => {
                const active = draft.categories.includes(c);
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

        <div className="mt-8 flex gap-3">
          <button
            onClick={() => setDraft(EMPTY_FILTERS)}
            className="flex h-12 flex-1 items-center justify-center rounded-full border border-border bg-card text-sm font-semibold"
          >
            Reset
          </button>
          <button
            onClick={() => onApply(draft)}
            className="flex h-12 flex-[2] items-center justify-center rounded-full bg-gradient-primary text-sm font-semibold text-primary-foreground shadow-glow"
          >
            Apply filters
          </button>
        </div>
      </div>
    </div>
  );
}

function MatchModal({ profile, onClose }: { profile: SwipeProfile; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="mx-6 w-full max-w-sm rounded-3xl bg-gradient-card p-8 text-center shadow-glow"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-5xl">🎉</div>
        <h2 className="mt-4 text-3xl font-bold text-gradient">It's a match!</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          You and {profile.display_name} liked each other. Start chatting now.
        </p>
        <div className="mt-6 space-y-3">
          <Link
            to="/matches"
            onClick={onClose}
            className="flex h-12 w-full items-center justify-center rounded-full bg-gradient-primary text-sm font-semibold text-primary-foreground shadow-glow"
          >
            Send a message
          </Link>
          <button
            onClick={onClose}
            className="flex h-12 w-full items-center justify-center rounded-full border border-border bg-card text-sm font-semibold"
          >
            Keep swiping
          </button>
        </div>
      </div>
    </div>
  );
}
