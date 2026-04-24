import { useEffect, useRef } from "react";
import { useLocation } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";

/**
 * Subscribes globally to:
 *  - new incoming likes (someone liked you)
 *  - new matches involving you
 *  - new messages to you
 * and surfaces them as in-app toast notifications.
 *
 * Suppresses toasts that the user is already actively viewing
 * (e.g. a message from the chat that's currently open).
 */
export function useNotifications() {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const pathRef = useRef(pathname);
  pathRef.current = pathname;

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("in-app-notifications")
      // Someone liked you
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "swipes",
          filter: `swiped_id=eq.${user.id}`,
        },
        async (payload) => {
          const row = payload.new as { swiper_id: string; direction: string };
          if (row.direction !== "like") return;
          const { data: prof } = await supabase
            .from("profiles")
            .select("display_name")
            .eq("id", row.swiper_id)
            .maybeSingle();
          const name = prof?.display_name ?? "Someone";
          toast(`${name} liked you 💖`, {
            description: "Tap Matches to like back.",
          });
        },
      )
      // New match
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "matches" },
        async (payload) => {
          const row = payload.new as { user_a: string; user_b: string };
          if (row.user_a !== user.id && row.user_b !== user.id) return;
          const otherId = row.user_a === user.id ? row.user_b : row.user_a;
          const { data: prof } = await supabase
            .from("profiles")
            .select("display_name")
            .eq("id", otherId)
            .maybeSingle();
          const name = prof?.display_name ?? "Someone";
          toast.success(`It's a match with ${name}! 🎉`, {
            description: "Say hi in Messages.",
          });
        },
      )
      // New message
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        async (payload) => {
          const row = payload.new as {
            match_id: string;
            sender_id: string;
            content: string;
          };
          if (row.sender_id === user.id) return;
          // Verify this message belongs to one of my matches.
          const { data: m } = await supabase
            .from("matches")
            .select("id, user_a, user_b")
            .eq("id", row.match_id)
            .maybeSingle();
          if (!m) return;
          if (m.user_a !== user.id && m.user_b !== user.id) return;
          // Suppress if already viewing this chat.
          if (pathRef.current === `/chat/${row.match_id}`) return;
          const { data: prof } = await supabase
            .from("profiles")
            .select("display_name")
            .eq("id", row.sender_id)
            .maybeSingle();
          const name = prof?.display_name ?? "New message";
          toast(`${name}: ${row.content.slice(0, 80)}`, {
            description: "Tap Matches to reply.",
          });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);
}
