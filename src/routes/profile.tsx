import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { BottomNav } from "@/components/BottomNav";
import { CATEGORIES } from "@/lib/categories";
import {
  LogOut,
  Save,
  Upload,
  Loader2,
  Shield,
  Mail,
  Trash2,
  ChevronDown,
  Settings,
} from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type Profile = {
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

export const Route = createFileRoute("/profile")({
  component: ProfilePage,
});

function ProfilePage() {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [p, setP] = useState<Profile | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth", search: { mode: "signin" } });
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => setP(data));
  }, [user]);

  const update = <K extends keyof Profile>(k: K, v: Profile[K]) =>
    setP((cur) => (cur ? { ...cur, [k]: v } : cur));

  const toggleCat = (c: string) => {
    if (!p) return;
    const cur = p.categories ?? [];
    update("categories", cur.includes(c) ? cur.filter((x) => x !== c) : [...cur, c]);
  };

  const save = async () => {
    if (!p || !user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: p.display_name,
        bio: p.bio,
        image_url: p.image_url,
        instagram: p.instagram,
        tiktok: p.tiktok,
        product_description: p.product_description,
        categories: p.categories,
      })
      .eq("id", user.id);
    setSaving(false);
    if (error) toast.error(error.message);
    else toast.success("Profile updated");
  };

  const handleSignOut = async () => {
    await signOut();
    navigate({ to: "/" });
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) {
        toast.error("Not signed in");
        setDeleting(false);
        return;
      }
      const { error } = await supabase.functions.invoke("delete-account", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (error) throw error;
      toast.success("Account deleted");
      await signOut();
      navigate({ to: "/auth", search: { mode: "signin" } });
    } catch (e) {
      toast.error((e as Error).message ?? "Failed to delete account");
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be smaller than 5MB");
      return;
    }

    setUploading(true);
    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `${user.id}/${Date.now()}.${ext}`;

    const { error: upErr } = await supabase.storage
      .from("profile-images")
      .upload(path, file, { upsert: true, contentType: file.type });

    if (upErr) {
      setUploading(false);
      toast.error(upErr.message);
      return;
    }

    const { data: urlData } = supabase.storage.from("profile-images").getPublicUrl(path);
    const publicUrl = urlData.publicUrl;

    const { error: updErr } = await supabase
      .from("profiles")
      .update({ image_url: publicUrl })
      .eq("id", user.id);

    setUploading(false);

    if (updErr) {
      toast.error(updErr.message);
      return;
    }

    update("image_url", publicUrl);
    toast.success("Image uploaded");
  };

  if (!p) {
    return <div className="flex min-h-screen items-center justify-center bg-background"><div className="text-sm text-muted-foreground">Loading…</div></div>;
  }

  const isCreator = p.role === "creator";

  return (
    <div className="min-h-screen bg-background pb-40">
      <header className="px-5 pt-12 pb-4">
        <div className="flex items-center justify-between gap-2">
          <h1 className="truncate text-2xl font-bold sm:text-3xl">Profile</h1>
          <div className="flex shrink-0 items-center gap-2">
            <button
              onClick={handleSignOut}
              className="flex h-10 items-center gap-1.5 rounded-full border border-border bg-card px-3 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign out</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-md px-5">
        <div className="flex flex-col items-center gap-3">
          <div className="relative h-28 w-28 overflow-hidden rounded-full border-4 border-primary/30 bg-muted shadow-glow">
            {p.image_url ? (
              <img src={p.image_url} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-primary text-3xl font-bold text-primary-foreground">
                {p.display_name?.[0]?.toUpperCase() ?? "?"}
              </div>
            )}
            {uploading && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/70">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            )}
          </div>
          <span className="rounded-full bg-gradient-primary px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-primary-foreground shadow-glow">
            {p.role}
          </span>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:border-primary disabled:opacity-60"
          >
            <Upload className="h-4 w-4" />
            {uploading ? "Uploading…" : isCreator ? "Upload profile picture" : "Upload product image"}
          </button>
        </div>

        <div className="mt-8 space-y-4">
          <Field label={isCreator ? "Username" : "Brand name"}>
            <input
              value={p.display_name ?? ""}
              onChange={(e) => update("display_name", e.target.value)}
              maxLength={50}
              className="input-linkr"
            />
          </Field>
          <Field label={isCreator ? "Bio" : "Short description"}>
            <textarea
              value={(isCreator ? p.bio : p.product_description) ?? ""}
              onChange={(e) =>
                isCreator
                  ? update("bio", e.target.value)
                  : update("product_description", e.target.value)
              }
              maxLength={200}
              rows={3}
              className="input-linkr min-h-[88px] py-3"
            />
          </Field>

          {isCreator && (
            <>
              <Field label="Instagram">
                <div className="flex items-stretch gap-2">
                  <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-border bg-muted text-base font-semibold text-muted-foreground">
                    @
                  </span>
                  <input
                    type="text"
                    value={(p.instagram ?? "").replace(/^@/, "")}
                    onChange={(e) =>
                      update("instagram", e.target.value.replace(/^@+/, ""))
                    }
                    className="input-linkr"
                    placeholder="yourhandle"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                  />
                </div>
              </Field>
              <Field label="TikTok">
                <div className="flex items-stretch gap-2">
                  <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-border bg-muted text-base font-semibold text-muted-foreground">
                    @
                  </span>
                  <input
                    type="text"
                    value={(p.tiktok ?? "").replace(/^@/, "")}
                    onChange={(e) =>
                      update("tiktok", e.target.value.replace(/^@+/, ""))
                    }
                    className="input-linkr"
                    placeholder="yourhandle"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                  />
                </div>
              </Field>
            </>
          )}

          <div>
            <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Categories
            </label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((c) => {
                const active = (p.categories ?? []).includes(c);
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

        <section className="mt-10">
          <h2 className="mb-3 px-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Settings
          </h2>
          <div className="overflow-hidden rounded-2xl border border-border bg-card">
            <button
              type="button"
              onClick={() => setShowPrivacy((v) => !v)}
              className="flex w-full items-center gap-3 px-4 py-4 text-left transition-colors hover:bg-muted/40"
            >
              <Shield className="h-5 w-5 text-primary" />
              <span className="flex-1 text-sm font-medium">Privacy Policy</span>
              <ChevronDown
                className={`h-4 w-4 text-muted-foreground transition-transform ${showPrivacy ? "rotate-180" : ""}`}
              />
            </button>
            {showPrivacy && (
              <div className="space-y-3 border-t border-border bg-muted/20 px-4 py-4 text-xs leading-relaxed text-muted-foreground">
                <p>
                  We store the information you provide while using Linkr — your profile details,
                  swipes, matches, and messages — to operate the app.
                </p>
                <p>
                  Your data is used solely to provide the service: showing your profile to
                  potential matches, surfacing relevant creators and brands, and enabling
                  messaging between matched users.
                </p>
                <p>We do not sell your personal data to third parties.</p>
                <p>
                  You can delete your account and all associated data at any time below.
                </p>
              </div>
            )}

            <div className="flex items-center gap-3 border-t border-border px-4 py-4">
              <Mail className="h-5 w-5 text-primary" />
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium">Support</div>
                <a
                  href="mailto:linkr.support@gmail.com"
                  className="block truncate text-xs text-primary underline-offset-4 hover:underline"
                >
                  linkr.support@gmail.com
                </a>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="flex w-full items-center gap-3 border-t border-border px-4 py-4 text-left transition-colors hover:bg-destructive/10"
            >
              <Trash2 className="h-5 w-5 text-destructive" />
              <span className="flex-1 text-sm font-medium text-destructive">
                Delete account
              </span>
            </button>
          </div>
        </section>

        <button
          onClick={save}
          disabled={saving}
          className="mt-8 flex h-14 w-full items-center justify-center gap-2 rounded-full bg-gradient-primary text-base font-semibold text-primary-foreground shadow-glow transition-transform active:scale-[0.98] disabled:opacity-60"
        >
          <Save className="h-5 w-5" />
          {saving ? "Saving…" : "Save changes"}
        </button>

        <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete your profile, matches, and messages.
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={(e) => {
                  e.preventDefault();
                  handleDelete();
                }}
                disabled={deleting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleting ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" /> Deleting…
                  </span>
                ) : (
                  "Delete account"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </main>

      <BottomNav />

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
          color: var(--foreground);
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
