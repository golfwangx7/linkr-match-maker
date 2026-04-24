import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { ArrowLeft, Send } from "lucide-react";
import { toast } from "sonner";

type Message = {
  id: string;
  match_id: string;
  sender_id: string;
  content: string;
  created_at: string;
};

type OtherProfile = {
  id: string;
  display_name: string | null;
  image_url: string | null;
  role: "creator" | "brand" | null;
};

export const Route = createFileRoute("/chat/$matchId")({
  component: Chat,
});

function Chat() {
  const { matchId } = Route.useParams();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [other, setOther] = useState<OtherProfile | null>(null);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth", search: { mode: "signin" } });
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!user) return;
    let isUserA = false;

    const markRead = async () => {
      const patch = isUserA
        ? { last_read_a: new Date().toISOString() }
        : { last_read_b: new Date().toISOString() };
      await supabase.from("matches").update(patch).eq("id", matchId);
    };

    const init = async () => {
      const { data: m } = await supabase
        .from("matches")
        .select("user_a, user_b")
        .eq("id", matchId)
        .maybeSingle();
      if (!m) {
        toast.error("Match not found");
        navigate({ to: "/matches" });
        return;
      }
      isUserA = m.user_a === user.id;
      const otherId = isUserA ? m.user_b : m.user_a;
      const { data: prof } = await supabase
        .from("profiles")
        .select("id, display_name, image_url, role")
        .eq("id", otherId)
        .maybeSingle();
      setOther(prof);

      const { data: msgs } = await supabase
        .from("messages")
        .select("*")
        .eq("match_id", matchId)
        .order("created_at", { ascending: true });
      setMessages(msgs ?? []);
      markRead();
    };
    init();

    const channel = supabase
      .channel(`messages-${matchId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `match_id=eq.${matchId}` },
        (payload) => {
          setMessages((cur) => {
            const next = payload.new as Message;
            if (cur.some((m) => m.id === next.id)) return cur;
            return [...cur, next];
          });
          if ((payload.new as Message).sender_id !== user.id) markRead();
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, matchId, navigate]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !text.trim()) return;
    setSending(true);
    const content = text.trim().slice(0, 1000);
    setText("");
    const { error } = await supabase.from("messages").insert({
      match_id: matchId,
      sender_id: user.id,
      content,
    });
    setSending(false);
    if (error) toast.error(error.message);
  };

  return (
    <div className="flex h-screen flex-col bg-background">
      <header className="flex items-center gap-3 border-b border-border bg-background/80 px-4 py-3 pt-12 backdrop-blur-xl">
        <Link to="/matches" className="rounded-full p-2 active:bg-muted">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        {other?.id ? (
          <Link
            to="/u/$id"
            params={{ id: other.id }}
            className="flex min-w-0 flex-1 items-center gap-3 rounded-full transition-opacity active:opacity-70"
          >
            <div className="h-10 w-10 overflow-hidden rounded-full bg-muted">
              {other.image_url ? (
                <img src={other.image_url} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-primary text-sm font-bold text-primary-foreground">
                  {other.display_name?.[0]?.toUpperCase() ?? "?"}
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1 text-left">
              <h2 className="truncate font-semibold">{other.display_name ?? "…"}</h2>
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                {other.role}
              </p>
            </div>
          </Link>
        ) : (
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-muted" />
            <div className="min-w-0 flex-1">
              <h2 className="truncate font-semibold">…</h2>
            </div>
          </div>
        )}
      </header>

      <div ref={scrollRef} className="no-scrollbar flex-1 overflow-y-auto px-4 py-4">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <div className="text-4xl">👋</div>
            <p className="mt-3 text-sm text-muted-foreground">
              Say hi to {other?.display_name ?? "your match"}!
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {messages.map((m) => {
              const mine = m.sender_id === user?.id;
              return (
                <div
                  key={m.id}
                  className={`flex ${mine ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[78%] break-words rounded-2xl px-4 py-2.5 text-sm ${
                      mine
                        ? "rounded-br-md bg-gradient-primary text-primary-foreground"
                        : "rounded-bl-md bg-card text-foreground"
                    }`}
                  >
                    {m.content}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <form
        onSubmit={send}
        className="flex items-center gap-2 border-t border-border bg-background px-3 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
      >
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a message…"
          maxLength={1000}
          className="h-12 flex-1 rounded-full border border-border bg-card px-4 text-sm outline-none focus:border-primary"
        />
        <button
          type="submit"
          disabled={!text.trim() || sending}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-primary text-primary-foreground shadow-glow transition-transform active:scale-90 disabled:opacity-40"
          aria-label="Send"
        >
          <Send className="h-5 w-5" />
        </button>
      </form>
    </div>
  );
}
