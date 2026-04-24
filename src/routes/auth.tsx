import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import { Flame, ArrowLeft, Apple } from "lucide-react";

type Search = { mode?: "signin" | "signup" };

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    mode: s.mode === "signin" ? "signin" : "signup",
  }),
  component: AuthPage,
});

function AuthPage() {
  const { mode } = Route.useSearch();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && user) {
      // route after auth depends on whether they picked a role
      supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle()
        .then(({ data }) => {
          if (!data?.role) navigate({ to: "/onboarding" });
          else navigate({ to: "/feed" });
        });
    }
  }, [user, authLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/feed` },
        });
        if (error) throw error;
        toast.success("Welcome to Linkr!");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back!");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleApple = async () => {
    setLoading(true);
    try {
      const result = await lovable.auth.signInWithOAuth("apple", {
        redirect_uri: window.location.origin,
      });
      if (result.error) throw result.error;
      // If redirected, browser navigates away; otherwise session is set.
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Apple sign-in failed";
      toast.error(msg);
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-gradient-hero px-6">
      <div className="mx-auto w-full max-w-md flex-1 pt-12">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground">
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>

        <div className="mt-10 flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-primary shadow-glow">
            <Flame className="h-5 w-5 text-primary-foreground" strokeWidth={2.5} />
          </div>
          <span className="text-xl font-bold">Linkr</span>
        </div>

        <h1 className="mt-8 text-3xl font-bold">
          {mode === "signup" ? "Create your account" : "Welcome back"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {mode === "signup"
            ? "Start matching with creators or brands today."
            : "Sign in to continue swiping."}
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="h-14 w-full rounded-2xl border border-border bg-card px-4 text-base outline-none transition-colors focus:border-primary"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Password
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

          <button
            type="submit"
            disabled={loading}
            className="flex h-14 w-full items-center justify-center rounded-full bg-gradient-primary text-base font-semibold text-primary-foreground shadow-glow transition-transform active:scale-[0.98] disabled:opacity-60"
          >
            {loading ? "Please wait…" : mode === "signup" ? "Create account" : "Sign in"}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-muted-foreground">
          {mode === "signup" ? "Already have an account? " : "New to Linkr? "}
          <Link
            to="/auth"
            search={{ mode: mode === "signup" ? "signin" : "signup" }}
            className="font-semibold text-primary"
          >
            {mode === "signup" ? "Sign in" : "Create one"}
          </Link>
        </div>
      </div>
    </div>
  );
}
