import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Flame, ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/reset-password")({
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Supabase auto-sets the session from the recovery link.
    // Confirm we have one before allowing a password change.
    const hash = typeof window !== "undefined" ? window.location.hash : "";
    if (hash.includes("type=recovery") || hash.includes("access_token")) {
      setReady(true);
      return;
    }
    supabase.auth.getSession().then(({ data }) => {
      setReady(!!data.session);
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      toast.error("Passwords don't match");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success("Password updated");
      navigate({ to: "/feed" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-gradient-hero px-6">
      <div className="mx-auto w-full max-w-md flex-1 pt-12">
        <Link
          to="/auth"
          search={{ mode: "signin" }}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>

        <div className="mt-10 flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-primary shadow-glow">
            <Flame className="h-5 w-5 text-primary-foreground" strokeWidth={2.5} />
          </div>
          <span className="text-xl font-bold">Linkr</span>
        </div>

        <h1 className="mt-8 text-3xl font-bold">Set a new password</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Choose a new password for your account.
        </p>

        {!ready ? (
          <p className="mt-8 text-sm text-muted-foreground">
            This link is invalid or has expired. Request a new password reset email.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
                New password
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="h-14 w-full rounded-2xl border border-border bg-card px-4 text-base outline-none transition-colors focus:border-primary"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Confirm password
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="••••••••"
                className="h-14 w-full rounded-2xl border border-border bg-card px-4 text-base outline-none transition-colors focus:border-primary"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="flex h-14 w-full items-center justify-center rounded-full bg-gradient-primary text-base font-semibold text-primary-foreground shadow-glow transition-transform active:scale-[0.98] disabled:opacity-60"
            >
              {loading ? "Updating…" : "Update password"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
