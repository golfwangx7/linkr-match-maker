import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { BottomNav } from "@/components/BottomNav";
import { MessageCircle, Heart } from "lucide-react";
import { toast } from "sonner";

type MatchRow = {
  id: string;
  user_a: string;
  user_b: string;
  created_at: string;
  last_read_a: string;
  last_read_b: string;
  other: {
    id: string;
    display_name: string | null;
    image_url: string | null;
    role: "creator" | "brand" | null;
  } | null;
  lastMessage: {
    content: string;
    sender_id: string;
    created_at: string;
  } | null;
  unread: boolean;
};

type LikedByRow = {
  id: string;
  display_name: string | null;
  image_url: string | null;
  role: "creator" | "brand" | null;
};

export const Route = createFileRoute("/matches")({
  component: Matches,
});

function Matches() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [matches, setMatches] = useState<MatchRow[] | null>(null);
  const [likedBy, setLikedBy] = useState<LikedByRow[] | null>(null);
  const [likingBack, setLikingBack] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth", search: { mode: "signin" } });
  }, [user, loading, navigate]);

  const loadAll = async () => {
    if (!user) return;
    // Matches
    const { data: ms } = await supabase
      .from("matches")
      .select("*")
      .or(`user_a.eq.${user.id},user_b.eq.${user.id}`)
      .order("created_at", { ascending: false });
    if (!ms) {
      setMatches([]);
    } else {
      const otherIds = ms.map((m) => (m.user_a === user.id ? m.user_b : m.user_a));
      const matchIds = ms.map((m) => m.id);
      const [{ data: profs }, { data: msgs }] = await Promise.all([
        otherIds.length
          ? supabase
              .from("profiles")
              .select("id, display_name, image_url, role")
              .in("id", otherIds)
          : Promise.resolve({ data: [] as LikedByRow[] }),
        matchIds.length
          ? supabase
              .from("messages")
              .select("match_id, sender_id, content, created_at")
              .in("match_id", matchIds)
              .order("created_at", { ascending: false })
          : Promise.resolve({ data: [] as { match_id: string; sender_id: string; content: string; created_at: string }[] }),
      ]);
      const byId = new Map((profs ?? []).map((p) => [p.id, p]));
      const lastByMatch = new Map<string, { content: string; sender_id: string; created_at: string }>();
      for (const msg of msgs ?? []) {
        if (!lastByMatch.has(msg.match_id)) {
          lastByMatch.set(msg.match_id, {
            content: msg.content,
            sender_id: msg.sender_id,
            created_at: msg.created_at,
          });
        }
      }
      setMatches(
        ms.map((m) => {
          const lastMessage = lastByMatch.get(m.id) ?? null;
          const lastRead = m.user_a === user.id ? m.last_read_a : m.last_read_b;
          const unread = lastMessage
            ? lastMessage.sender_id !== user.id &&
              new Date(lastMessage.created_at) > new Date(lastRead)
            : // Brand-new match with no messages yet → highlight as new.
              new Date(m.created_at) >= new Date(lastRead);
          return {
            ...m,
            other: byId.get(m.user_a === user.id ? m.user_b : m.user_a) ?? null,
            lastMessage,
            unread,
          };
        }),
      );
    }

    // Likes You: people who liked me, that I haven't liked back yet.
    // Note: RLS only lets us read our own swipes (where swiper_id = me),
    // so we use a server function via RPC-less approach: rely on matches
    // table inference. Since incoming likes are not directly readable,
    // we instead query through a workaround — this requires a permissive
    // policy. We'll attempt direct read; if RLS blocks it, the array stays empty.
    const { data: incoming } = await supabase
      .from("swipes")
      .select("swiper_id")
      .eq("swiped_id", user.id)
      .eq("direction", "like");

    const { data: mySwipes } = await supabase
      .from("swipes")
      .select("swiped_id")
      .eq("swiper_id", user.id);

    const swipedSet = new Set((mySwipes ?? []).map((s) => s.swiped_id));
    const candidateIds = Array.from(
      new Set((incoming ?? []).map((s) => s.swiper_id).filter((id) => !swipedSet.has(id))),
    );

    if (candidateIds.length === 0) {
      setLikedBy([]);
    } else {
      const { data: likedProfs } = await supabase
        .from("profiles")
        .select("id, display_name, image_url, role")
        .in("id", candidateIds);
      setLikedBy(likedProfs ?? []);
    }
  };

  useEffect(() => {
    if (!user) return;
    loadAll();

    const channel = supabase
      .channel("matches-list")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "matches" },
        () => loadAll(),
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        () => loadAll(),
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "matches" },
        () => loadAll(),
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "swipes" },
        () => loadAll(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleLikeBack = async (otherId: string) => {
    if (!user || likingBack) return;
    setLikingBack(otherId);
    try {
      const { error } = await supabase.from("swipes").insert({
        swiper_id: user.id,
        swiped_id: otherId,
        direction: "like",
      });
      if (error) throw error;
      toast.success("It's a match! 🎉");
      // Optimistically remove from likedBy; trigger will create the match.
      setLikedBy((prev) => (prev ?? []).filter((p) => p.id !== otherId));
      // Reload to pick up the new match row.
      await loadAll();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not like back");
    } finally {
      setLikingBack(null);
    }
  };

  return (
    <div
      className="fixed inset-x-0 top-0 flex flex-col overflow-hidden bg-background"
      style={{ height: "100dvh" }}
    >
      <div
        className="flex-1 overflow-y-auto overscroll-contain"
        style={{
          paddingBottom: "calc(4rem + env(safe-area-inset-bottom))",
          WebkitOverflowScrolling: "touch",
        }}
      >
        <header className="px-5 pt-[max(3rem,env(safe-area-inset-top))] pb-4">
          <h1 className="text-3xl font-bold">Matches</h1>
          <p className="mt-1 text-sm text-muted-foreground">Your mutual likes — start a conversation.</p>
        </header>

      <main className="mx-auto w-full max-w-md px-5 space-y-6">
        {/* Likes You */}
        {likedBy && likedBy.length > 0 && (
          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-bold">Likes You</h2>
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                {likedBy.length}
              </span>
            </div>
            <div className="-mx-5 overflow-x-auto px-5">
              <div className="flex gap-3 pb-1">
                {likedBy.map((p) => (
                  <div
                    key={p.id}
                    className="relative w-32 shrink-0 overflow-hidden rounded-2xl border border-border bg-card"
                  >
                    <Link
                      to="/u/$id"
                      params={{ id: p.id }}
                      className="block"
                    >
                      <div className="aspect-[3/4] w-full bg-muted">
                        {p.image_url ? (
                          <img
                            src={p.image_url}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-gradient-primary text-2xl font-bold text-primary-foreground">
                            {p.display_name?.[0]?.toUpperCase() ?? "?"}
                          </div>
                        )}
                      </div>
                      <div className="px-2 py-2">
                        <p className="truncate text-sm font-semibold">
                          {p.display_name ?? "Unknown"}
                        </p>
                        <p className="truncate text-[10px] uppercase tracking-wider text-muted-foreground">
                          {p.role}
                        </p>
                      </div>
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleLikeBack(p.id)}
                      disabled={likingBack === p.id}
                      aria-label="Like back"
                      className="absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-full bg-gradient-primary text-primary-foreground shadow-glow transition-transform active:scale-95 disabled:opacity-50"
                    >
                      <Heart className="h-4 w-4 fill-current" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Matches */}
        <section>
          {likedBy && likedBy.length > 0 && (
            <h2 className="mb-3 text-lg font-bold">Messages</h2>
          )}
          {matches === null ? (
            <div className="py-20 text-center text-sm text-muted-foreground">Loading…</div>
          ) : matches.length === 0 ? (
            <div className="mt-2 rounded-3xl border border-border bg-gradient-card p-8 text-center">
              <Heart className="mx-auto h-10 w-10 text-primary" />
              <h3 className="mt-4 text-xl font-bold">No matches yet</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Keep swiping — when someone likes you back, they'll appear here.
              </p>
              <Link
                to="/feed"
                className="mt-5 inline-flex h-11 items-center justify-center rounded-full bg-gradient-primary px-6 text-sm font-semibold text-primary-foreground shadow-glow"
              >
                Find matches
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {matches.map((m) => (
                <Link
                  key={m.id}
                  to="/chat/$matchId"
                  params={{ matchId: m.id }}
                  className="flex items-center gap-4 rounded-2xl border border-border bg-card p-3 transition-colors active:bg-muted"
                >
                  <div className="h-14 w-14 shrink-0 overflow-hidden rounded-full bg-muted">
                    {m.other?.image_url ? (
                      <img
                        src={m.other.image_url}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-primary text-lg font-bold text-primary-foreground">
                        {m.other?.display_name?.[0]?.toUpperCase() ?? "?"}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="truncate font-semibold">
                        {m.other?.display_name ?? "Unknown"}
                      </h3>
                      <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        {m.other?.role}
                      </span>
                    </div>
                    <p
                      className={`truncate text-xs ${
                        m.unread ? "font-semibold text-foreground" : "text-muted-foreground"
                      }`}
                    >
                      {m.lastMessage
                        ? `${m.lastMessage.sender_id === user?.id ? "You: " : ""}${m.lastMessage.content}`
                        : "Start a conversation"}
                    </p>
                  </div>
                  {m.unread ? (
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-destructive" />
                  ) : (
                    <MessageCircle className="h-5 w-5 text-primary" />
                  )}
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>
      </div>

      <BottomNav />
    </div>
  );
}
