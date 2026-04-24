import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";

export function useUnreadMatchesCount() {
  const { user } = useAuth();
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!user) {
      setCount(0);
      return;
    }

    const load = async () => {
      const { data: ms } = await supabase
        .from("matches")
        .select("id, user_a, user_b, last_read_a, last_read_b")
        .or(`user_a.eq.${user.id},user_b.eq.${user.id}`);
      if (!ms || ms.length === 0) {
        setCount(0);
        return;
      }
      const { data: msgs } = await supabase
        .from("messages")
        .select("match_id, sender_id, created_at")
        .in(
          "match_id",
          ms.map((m) => m.id),
        )
        .order("created_at", { ascending: false });

      let unread = 0;
      for (const m of ms) {
        const lastRead =
          m.user_a === user.id ? m.last_read_a : m.last_read_b;
        const latestOther = (msgs ?? []).find(
          (x) => x.match_id === m.id && x.sender_id !== user.id,
        );
        if (latestOther && new Date(latestOther.created_at) > new Date(lastRead)) {
          unread++;
        }
      }
      setCount(unread);
    };
    load();

    const channel = supabase
      .channel("unread-matches")
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
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "matches" },
        () => load(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return count;
}
