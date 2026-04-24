import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { BottomNav } from "@/components/BottomNav";
import { SwipeCard, SwipeActions, type SwipeProfile } from "@/components/SwipeCard";
import { Flame, Sparkles } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/feed")({
  component: Feed,
});

function Feed() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState<SwipeProfile[] | null>(null);
  const [myRole, setMyRole] = useState<"creator" | "brand" | null>(null);
  const [matchModal, setMatchModal] = useState<SwipeProfile | null>(null);

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
    setMyRole(me.role);
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
    setProfiles((data ?? []).filter((p) => !excluded.has(p.id)).reverse());
  }, [user, navigate]);

  useEffect(() => {
    if (user) loadFeed();
  }, [user, loadFeed]);

  const handleSwipe = async (dir: "like" | "skip") => {
    if (!user || !profiles || profiles.length === 0) return;
    const target = profiles[profiles.length - 1];
    setProfiles((p) => p?.slice(0, -1) ?? []);

    const { error } = await supabase.from("swipes").insert({
      swiper_id: user.id,
      swiped_id: target.id,
      direction: dir,
    });
    if (error) {
      toast.error(error.message);
      return;
    }

    if (dir === "like") {
      // Check if a match was just created
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

  if (authLoading || profiles === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Flame className="h-8 w-8 animate-pulse text-primary" />
      </div>
    );
  }

  const top = profiles[profiles.length - 1];
  const visible = profiles.slice(-3);

  return (
    <div className="flex min-h-screen flex-col bg-background pb-24">
      <header className="flex items-center justify-between px-5 pt-12 pb-4">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-primary shadow-glow">
            <Flame className="h-4.5 w-4.5 text-primary-foreground" strokeWidth={2.5} />
          </div>
          <span className="text-lg font-bold">Linkr</span>
        </div>
        <span className="text-xs uppercase tracking-wider text-muted-foreground">
          Browsing {myRole === "creator" ? "brands" : "creators"}
        </span>
      </header>

      <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-5">
        <div className="relative aspect-[3/4] w-full">
          {profiles.length === 0 ? (
            <EmptyState />
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

        {top && (
          <SwipeActions
            onSkip={() => handleSwipe("skip")}
            onLike={() => handleSwipe("like")}
          />
        )}
      </main>

      {matchModal && (
        <MatchModal profile={matchModal} onClose={() => setMatchModal(null)} />
      )}

      <BottomNav />
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center rounded-3xl border border-border bg-gradient-card p-8 text-center">
      <Sparkles className="h-10 w-10 text-primary" />
      <h3 className="mt-4 text-xl font-bold">You're all caught up</h3>
      <p className="mt-2 text-sm text-muted-foreground">
        Check back soon — new profiles join Linkr every day.
      </p>
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
