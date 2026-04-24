import { useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { motion, useMotionValue, useTransform, type PanInfo } from "framer-motion";
import { Heart, X, Instagram, Music2, Tag, Sparkles, DollarSign, Info } from "lucide-react";

export type SwipeProfile = {
  id: string;
  role: "creator" | "brand";
  display_name: string | null;
  bio: string | null;
  image_url: string | null;
  instagram: string | null;
  tiktok: string | null;
  product_description: string | null;
  categories: string[] | null;
};

export function SwipeCard({
  profile,
  onSwipe,
  active,
  index,
}: {
  profile: SwipeProfile;
  onSwipe: (dir: "like" | "skip") => void;
  active: boolean;
  index: number;
}) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-18, 18]);
  const likeOpacity = useTransform(x, [20, 120], [0, 1]);
  const skipOpacity = useTransform(x, [-120, -20], [1, 0]);
  const [exitX, setExitX] = useState(0);
  const navigate = useNavigate();
  const pointerStart = useRef<{ x: number; y: number; t: number } | null>(null);

  const handleEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x > 120) {
      setExitX(400);
      onSwipe("like");
    } else if (info.offset.x < -120) {
      setExitX(-400);
      onSwipe("skip");
    }
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    pointerStart.current = { x: e.clientX, y: e.clientY, t: Date.now() };
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    const start = pointerStart.current;
    pointerStart.current = null;
    if (!start || !active) return;
    const dx = Math.abs(e.clientX - start.x);
    const dy = Math.abs(e.clientY - start.y);
    const dt = Date.now() - start.t;
    // Treat as tap: small movement and short duration
    if (dx < 8 && dy < 8 && dt < 300) {
      navigate({ to: "/u/$id", params: { id: profile.id } });
    }
  };

  const fallback =
    profile.role === "creator"
      ? "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=800&auto=format&fit=crop"
      : "https://images.unsplash.com/photo-1556742393-d75f468bfcb0?w=800&auto=format&fit=crop";

  return (
    <motion.div
      className="absolute inset-0"
      drag={active ? "x" : false}
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      style={{ x, rotate, zIndex: 10 - index }}
      onDragEnd={handleEnd}
      animate={
        exitX
          ? { x: exitX, opacity: 0, transition: { duration: 0.3 } }
          : { scale: active ? 1 : 1 - index * 0.04, y: index * -8 }
      }
      whileTap={{ cursor: "grabbing" }}
    >
      <div className="relative h-full w-full overflow-hidden rounded-3xl bg-gradient-card shadow-card">
        <img
          src={profile.image_url || fallback}
          alt={profile.display_name ?? "profile"}
          className="absolute inset-0 h-full w-full object-cover"
          draggable={false}
          onError={(e) => {
            (e.target as HTMLImageElement).src = fallback;
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />

        {/* like / skip badges */}
        <motion.div
          style={{ opacity: likeOpacity }}
          className="absolute left-6 top-8 rotate-[-12deg] rounded-xl border-4 border-success px-4 py-1.5 text-2xl font-black text-success"
        >
          LIKE
        </motion.div>
        <motion.div
          style={{ opacity: skipOpacity }}
          className="absolute right-6 top-8 rotate-[12deg] rounded-xl border-4 border-destructive px-4 py-1.5 text-2xl font-black text-destructive"
        >
          NOPE
        </motion.div>

        {/* Prominent opportunity hook */}
        <div className="absolute left-5 right-5 top-5 flex">
          <div className="inline-flex max-w-full items-center gap-1.5 rounded-full bg-gradient-primary px-3.5 py-1.5 text-xs font-bold uppercase tracking-wide text-primary-foreground shadow-glow">
            {profile.role === "brand" ? (
              <>
                <Sparkles className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">Looking for UGC creators</span>
              </>
            ) : (
              <>
                <DollarSign className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">Open to paid collabs</span>
              </>
            )}
          </div>
        </div>

        <div className="absolute inset-x-0 bottom-0 p-6 text-white">
          <div className="mb-2 inline-flex rounded-full bg-white/15 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider backdrop-blur">
            {profile.role}
          </div>
          <h2 className="text-3xl font-bold">{profile.display_name ?? "Anonymous"}</h2>
          {(profile.bio || profile.product_description) && (
            <p className="mt-2 line-clamp-3 text-sm text-white/85">
              {profile.bio || profile.product_description}
            </p>
          )}
          {profile.categories && profile.categories.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {profile.categories.slice(0, 4).map((c) => (
                <span
                  key={c}
                  className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-medium backdrop-blur"
                >
                  <Tag className="h-3 w-3" /> {c}
                </span>
              ))}
            </div>
          )}
          {profile.role === "creator" && (profile.instagram || profile.tiktok) && (
            <div className="mt-3 flex gap-3 text-xs text-white/75">
              {profile.instagram && (
                <span className="inline-flex items-center gap-1">
                  <Instagram className="h-3.5 w-3.5" /> {profile.instagram}
                </span>
              )}
              {profile.tiktok && (
                <span className="inline-flex items-center gap-1">
                  <Music2 className="h-3.5 w-3.5" /> {profile.tiktok}
                </span>
              )}
            </div>
          )}

          {active && (
            <Link
              to="/profile/$id"
              params={{ id: profile.id }}
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
              className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3.5 py-2 text-xs font-semibold text-white backdrop-blur transition-colors hover:bg-white/25"
            >
              <Info className="h-3.5 w-3.5" />
              View full profile
            </Link>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export function SwipeActions({
  onSkip,
  onLike,
  disabled,
}: {
  onSkip: () => void;
  onLike: () => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center justify-center gap-6 pt-6">
      <button
        onClick={onSkip}
        disabled={disabled}
        className="flex h-16 w-16 items-center justify-center rounded-full border border-border bg-card shadow-soft transition-transform active:scale-90 disabled:opacity-40"
        aria-label="Skip"
      >
        <X className="h-7 w-7 text-destructive" strokeWidth={3} />
      </button>
      <button
        onClick={onLike}
        disabled={disabled}
        className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-primary shadow-glow transition-transform active:scale-90 disabled:opacity-40"
        aria-label="Like"
      >
        <Heart className="h-9 w-9 text-primary-foreground" fill="currentColor" />
      </button>
    </div>
  );
}
