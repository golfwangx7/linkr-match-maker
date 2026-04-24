import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";

/**
 * Returns the number of users who liked the current user but
 * the current user hasn't swiped on yet.
 */
export function useIncomingLikesCount() {
  const { user } = useAuth();
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!user) {
      setCount(0);
      return;
    }

    const load = async () => {
      const [{ data: incoming }, { data: mine }] = await Promise.all([
        supabase
          .from("swipes")
          .select("swiper_id")
          .eq("swiped_id", user.id)
          .eq("direction", "like"),
        supabase.from("swipes").select("swiped_id").eq("swiper_id", user.id),
      ]);
      const swipedSet = new Set((mine ?? []).map((s) => s.swiped_id));
      const pending = new Set(
        (incoming ?? [])
          .map((s) => s.swiper_id)
          .filter((id) => !swipedSet.has(id)),
      );
      setCount(pending.size);
    };

    load();

    const channel = supabase
      .channel("incoming-likes")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "swipes" },
        () => load(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return count;
}
