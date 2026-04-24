import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { BottomNav } from "@/components/BottomNav";
import { MessageCircle, Heart } from "lucide-react";

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

export const Route = createFileRoute("/matches")({
  component: Matches,
});

function Matches() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [matches, setMatches] = useState<MatchRow[] | null>(null);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth", search: { mode: "signin" } });
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data: ms } = await supabase
        .from("matches")
        .select("*")
        .or(`user_a.eq.${user.id},user_b.eq.${user.id}`)
        .order("created_at", { ascending: false });
      if (!ms) {
        setMatches([]);
        return;
      }
      const otherIds = ms.map((m) => (m.user_a === user.id ? m.user_b : m.user_a));
      const matchIds = ms.map((m) => m.id);
      const [{ data: profs }, { data: msgs }] = await Promise.all([
        supabase
          .from("profiles")
          .select("id, display_name, image_url, role")
          .in("id", otherIds),
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
          const unread =
            !!lastMessage &&
            lastMessage.sender_id !== user.id &&
            new Date(lastMessage.created_at) > new Date(lastRead);
          return {
            ...m,
            other: byId.get(m.user_a === user.id ? m.user_b : m.user_a) ?? null,
            lastMessage,
            unread,
          };
        }),
      );
    };
    load();

    const channel = supabase
      .channel("matches-list")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "matches" },
        () => load(),
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        () => load(),
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "matches" },
        () => load(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="px-5 pt-12 pb-4">
        <h1 className="text-3xl font-bold">Matches</h1>
        <p className="mt-1 text-sm text-muted-foreground">Your mutual likes — start a conversation.</p>
      </header>

      <main className="mx-auto w-full max-w-md px-5">
        {matches === null ? (
          <div className="py-20 text-center text-sm text-muted-foreground">Loading…</div>
        ) : matches.length === 0 ? (
          <div className="mt-10 rounded-3xl border border-border bg-gradient-card p-8 text-center">
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
      </main>

      <BottomNav />
    </div>
  );
}
