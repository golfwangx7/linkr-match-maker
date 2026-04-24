import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import { Sparkles, Building2, Flame } from "lucide-react";
import { CATEGORIES } from "@/lib/categories";

export const Route = createFileRoute("/onboarding")({
  component: Onboarding,
});

type Role = "creator" | "brand";

function Onboarding() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState<"role" | "details">("role");
  const [role, setRole] = useState<Role | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [instagram, setInstagram] = useState("");
  const [tiktok, setTiktok] = useState("");
  const [productDescription, setProductDescription] = useState("");
  const [selectedCats, setSelectedCats] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth", search: { mode: "signin" } });
  }, [user, loading, navigate]);

  const toggleCat = (c: string) =>
    setSelectedCats((cur) => (cur.includes(c) ? cur.filter((x) => x !== c) : [...cur, c]));

  const handleSave = async () => {
    if (!user || !role) return;
    if (!displayName.trim()) {
      toast.error(role === "creator" ? "Username required" : "Brand name required");
      return;
    }
    if (selectedCats.length === 0) {
      toast.error("Pick at least one category");
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        role,
        display_name: displayName.trim(),
        bio: bio.trim() || null,
        image_url: imageUrl.trim() || null,
        instagram: role === "creator" ? instagram.trim() || null : null,
        tiktok: role === "creator" ? tiktok.trim() || null : null,
        product_description: role === "brand" ? productDescription.trim() || null : null,
        categories: selectedCats,
      })
      .eq("id", user.id);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Profile ready!");
    navigate({ to: "/feed" });
  };

  return (
    <div className="min-h-screen bg-gradient-hero px-6 pb-20 pt-12">
      <div className="mx-auto w-full max-w-md">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-primary shadow-glow">
            <Flame className="h-5 w-5 text-primary-foreground" strokeWidth={2.5} />
          </div>
          <span className="text-xl font-bold">Linkr</span>
        </div>

        {step === "role" ? (
          <div className="mt-10">
            <h1 className="text-3xl font-bold">I am a…</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Choose how you want to use Linkr. You can't change this later.
            </p>

            <div className="mt-8 space-y-4">
              <RoleCard
                icon={Sparkles}
                title="Creator"
                desc="I make content and want to partner with brands."
                selected={role === "creator"}
                onClick={() => setRole("creator")}
              />
              <RoleCard
                icon={Building2}
                title="Brand"
                desc="I have a product and want creators to promote it."
                selected={role === "brand"}
                onClick={() => setRole("brand")}
              />
            </div>

            <button
              disabled={!role}
              onClick={() => setStep("details")}
              className="mt-10 flex h-14 w-full items-center justify-center rounded-full bg-gradient-primary text-base font-semibold text-primary-foreground shadow-glow transition-transform active:scale-[0.98] disabled:opacity-40"
            >
              Continue
            </button>
          </div>
        ) : (
          <div className="mt-10">
            <h1 className="text-3xl font-bold">
              {role === "creator" ? "Your creator profile" : "Your brand profile"}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">Tell others about yourself.</p>

            <div className="mt-8 space-y-4">
              <Field label={role === "creator" ? "Username" : "Brand name"}>
                <input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  maxLength={50}
                  className="input-linkr"
                  placeholder={role === "creator" ? "@yourhandle" : "Your brand"}
                />
              </Field>

              <Field label={role === "creator" ? "Profile image URL" : "Product image URL"}>
                <input
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="input-linkr"
                  placeholder="https://…"
                />
              </Field>

              <Field label={role === "creator" ? "Bio" : "Short description"}>
                <textarea
                  value={role === "creator" ? bio : productDescription}
                  onChange={(e) =>
                    role === "creator"
                      ? setBio(e.target.value)
                      : setProductDescription(e.target.value)
                  }
                  maxLength={200}
                  rows={3}
                  className="input-linkr min-h-[88px] py-3"
                  placeholder={role === "creator" ? "Tell brands about your vibe…" : "What's your product?"}
                />
              </Field>

              {role === "creator" && (
                <>
                  <Field label="Instagram handle">
                    <input
                      value={instagram}
                      onChange={(e) => setInstagram(e.target.value)}
                      className="input-linkr"
                      placeholder="@yourhandle"
                    />
                  </Field>
                  <Field label="TikTok handle">
                    <input
                      value={tiktok}
                      onChange={(e) => setTiktok(e.target.value)}
                      className="input-linkr"
                      placeholder="@yourhandle"
                    />
                  </Field>
                </>
              )}

              <div>
                <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Categories
                </label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map((c) => {
                    const active = selectedCats.includes(c);
                    return (
                      <button
                        key={c}
                        type="button"
                        onClick={() => toggleCat(c)}
                        className={`rounded-full border px-4 py-2 text-sm font-medium transition-all ${
                          active
                            ? "border-transparent bg-gradient-primary text-primary-foreground shadow-glow"
                            : "border-border bg-card text-foreground"
                        }`}
                      >
                        {c}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <button
              disabled={saving}
              onClick={handleSave}
              className="mt-10 flex h-14 w-full items-center justify-center rounded-full bg-gradient-primary text-base font-semibold text-primary-foreground shadow-glow transition-transform active:scale-[0.98] disabled:opacity-60"
            >
              {saving ? "Saving…" : "Start swiping"}
            </button>
          </div>
        )}
      </div>

      <style>{`
        .input-linkr {
          height: 56px;
          width: 100%;
          border-radius: 1rem;
          border: 1px solid var(--border);
          background: var(--card);
          padding: 0 1rem;
          font-size: 1rem;
          outline: none;
          transition: border-color .2s;
        }
        .input-linkr:focus { border-color: var(--primary); }
      `}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </label>
      {children}
    </div>
  );
}

function RoleCard({
  icon: Icon,
  title,
  desc,
  selected,
  onClick,
}: {
  icon: typeof Sparkles;
  title: string;
  desc: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-3xl border p-5 text-left transition-all ${
        selected
          ? "border-primary bg-card shadow-glow"
          : "border-border bg-card/60"
      }`}
    >
      <div className="flex items-start gap-4">
        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${
            selected ? "bg-gradient-primary" : "bg-muted"
          }`}
        >
          <Icon
            className={`h-6 w-6 ${selected ? "text-primary-foreground" : "text-foreground"}`}
            strokeWidth={2.2}
          />
        </div>
        <div>
          <div className="text-lg font-semibold">{title}</div>
          <div className="mt-1 text-sm text-muted-foreground">{desc}</div>
        </div>
      </div>
    </button>
  );
}
