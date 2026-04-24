import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { ArrowLeft, Instagram, Music2, Tag, Sparkles, DollarSign } from "lucide-react";

type ProfileRow = {
  id: string;
  role: "creator" | "brand" | null;
  display_name: string | null;
  bio: string | null;
  image_url: string | null;
  instagram: string | null;
  tiktok: string | null;
  product_description: string | null;
  categories: string[] | null;
};

export const Route = createFileRoute("/profile/$id")({
  component: ProfileDetail,
});

function ProfileDetail() {
  const { id } = Route.useParams();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) navigate({ to: "/auth", search: { mode: "signin" } });
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("*")
      .eq("id", id)
      .maybeSingle()
      .then(({ data }) => {
        if (!data) setNotFound(true);
        else setProfile(data as ProfileRow);
      });
  }, [user, id]);

  if (notFound) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-6 text-center">
        <p className="text-base text-muted-foreground">Profile not found.</p>
        <Link
          to="/feed"
          className="rounded-full bg-gradient-primary px-5 py-2 text-sm font-semibold text-primary-foreground shadow-glow"
        >
          Back to feed
        </Link>
      </div>
    );
  }

  if (!profile) {
    return <div className="flex min-h-screen items-center justify-center bg-background"><div className="text-sm text-muted-foreground">Loading…</div></div>;
  }

  const isCreator = profile.role === "creator";
  const fallback = isCreator
    ? "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=900&auto=format&fit=crop"
    : "https://images.unsplash.com/photo-1556742393-d75f468bfcb0?w=900&auto=format&fit=crop";

  return (
    <div className="min-h-screen bg-background pb-12">
      {/* Hero image */}
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-muted">
        <img
          src={profile.image_url || fallback}
          alt={profile.display_name ?? "profile"}
          className="absolute inset-0 h-full w-full object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).src = fallback;
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/30" />

        <Link
          to="/feed"
          className="absolute left-4 top-12 flex h-10 w-10 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur transition-colors hover:bg-black/60"
          aria-label="Back"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>

        <div className="absolute left-5 right-5 top-12 flex justify-end">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-gradient-primary px-3.5 py-1.5 text-xs font-bold uppercase tracking-wide text-primary-foreground shadow-glow">
            {isCreator ? (
              <>
                <DollarSign className="h-3.5 w-3.5" />
                Open to paid collabs
              </>
            ) : (
              <>
                <Sparkles className="h-3.5 w-3.5" />
                Looking for UGC creators
              </>
            )}
          </div>
        </div>

        <div className="absolute inset-x-0 bottom-0 px-6 pb-6 text-white">
          <div className="mb-2 inline-flex rounded-full bg-white/15 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider backdrop-blur">
            {profile.role}
          </div>
          <h1 className="text-4xl font-bold leading-tight">
            {isCreator && profile.display_name ? `@${profile.display_name}` : profile.display_name ?? "Anonymous"}
          </h1>
        </div>
      </div>

      {/* Body */}
      <main className="mx-auto w-full max-w-md px-6 pt-6">
        {(profile.bio || profile.product_description) && (
          <section>
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {isCreator ? "About" : "Description"}
            </h2>
            <p className="whitespace-pre-line text-base leading-relaxed text-foreground">
              {isCreator ? profile.bio : profile.product_description}
            </p>
          </section>
        )}

        {profile.categories && profile.categories.length > 0 && (
          <section className="mt-7">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {isCreator ? "Categories" : "Category"}
            </h2>
            <div className="flex flex-wrap gap-2">
              {profile.categories.map((c) => (
                <span
                  key={c}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3.5 py-1.5 text-sm font-medium"
                >
                  <Tag className="h-3.5 w-3.5 text-primary" />
                  {c}
                </span>
              ))}
            </div>
          </section>
        )}

        {isCreator && (profile.instagram || profile.tiktok) && (
          <section className="mt-7">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Socials
            </h2>
            <div className="space-y-2">
              {profile.instagram && (
                <SocialRow
                  icon={<Instagram className="h-5 w-5" />}
                  label="Instagram"
                  handle={profile.instagram}
                  href={`https://instagram.com/${profile.instagram.replace(/^@/, "")}`}
                />
              )}
              {profile.tiktok && (
                <SocialRow
                  icon={<Music2 className="h-5 w-5" />}
                  label="TikTok"
                  handle={profile.tiktok}
                  href={`https://tiktok.com/@${profile.tiktok.replace(/^@/, "")}`}
                />
              )}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

function SocialRow({
  icon,
  label,
  handle,
  href,
}: {
  icon: React.ReactNode;
  label: string;
  handle: string;
  href: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3 transition-colors hover:border-primary"
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-primary text-primary-foreground shadow-glow">
        {icon}
      </span>
      <div className="flex flex-col">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
        <span className="text-sm font-medium text-foreground">@{handle.replace(/^@/, "")}</span>
      </div>
    </a>
  );
}
