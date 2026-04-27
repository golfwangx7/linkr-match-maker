import { useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { motion, useMotionValue, useTransform, type PanInfo } from "framer-motion";
import { Heart, X, Instagram, Music2, Tag, Sparkles, DollarSign, Info, Target } from "lucide-react";

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
  looking_for: string[] | null;
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
      className="absolute inset-0 cursor-pointer"
      drag={active ? "x" : false}
      dragDirectionLock
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      style={{ x, rotate, zIndex: 10 - index, touchAction: "none" }}
      onDragEnd={handleEnd}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
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
          <div className="mb-3 inline-flex rounded-full bg-white/15 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider backdrop-blur">
            {profile.role}
          </div>
          <h2 className="text-3xl font-bold">{profile.display_name ?? "Anonymous"}</h2>
          {(profile.bio || profile.product_description) && (
            <p className="mt-3.5 line-clamp-3 text-sm leading-relaxed text-white/85">
              {profile.bio || profile.product_description}
            </p>
          )}
          {profile.looking_for && profile.looking_for.length > 0 && (
            <div className="mt-4">
              <div className="mb-1.5 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-white/70">
                <Target className="h-3 w-3" />
                {profile.role === "brand" ? "Looking for" : "Open to"}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {profile.looking_for.slice(0, 4).map((l) => (
                  <span
                    key={l}
                    className="inline-flex items-center rounded-full border border-primary/40 bg-primary/20 px-2.5 py-1 text-[11px] font-semibold text-white shadow-[0_0_12px_-4px_var(--primary)] backdrop-blur"
                  >
                    {l}
                  </span>
                ))}
              </div>
            </div>
          )}
          {profile.categories && profile.categories.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-2">
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
            <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3.5 py-2 text-xs font-semibold text-white backdrop-blur">
              <Info className="h-3.5 w-3.5" />
              Tap to view profile
            </div>
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
    <div className="flex items-center justify-center gap-5">
      <button
        onClick={onSkip}
        disabled={disabled}
        className="flex h-12 w-12 items-center justify-center rounded-full border border-destructive/40 bg-card/30 shadow-[0_0_22px_-2px_var(--destructive)] backdrop-blur-xl transition-all hover:bg-card/50 active:scale-90 disabled:opacity-40"
        aria-label="Skip"
      >
        <X className="h-5 w-5 text-destructive drop-shadow-[0_0_6px_var(--destructive)]" strokeWidth={2.5} />
      </button>
      <button
        onClick={onLike}
        disabled={disabled}
        className="flex h-14 w-14 items-center justify-center rounded-full border border-primary/40 bg-card/30 shadow-[0_0_28px_-2px_var(--primary)] backdrop-blur-xl transition-all hover:bg-card/50 active:scale-90 disabled:opacity-40"
        aria-label="Like"
      >
        <Heart className="h-6 w-6 text-primary drop-shadow-[0_0_8px_var(--primary)]" fill="currentColor" />
      </button>
    </div>
  );
}
