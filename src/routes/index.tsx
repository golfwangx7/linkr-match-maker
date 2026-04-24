import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { Flame, Sparkles, Heart } from "lucide-react";
import authBg from "@/assets/auth-bg.jpg";

export const Route = createFileRoute("/")({
  component: Landing,
});

function Landing() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) navigate({ to: "/feed" });
  }, [user, loading, navigate]);

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-background">
      <img
        src={authBg}
        alt=""
        aria-hidden
        className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-60"
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-background/40 via-background/70 to-background" />

      <div className="relative z-10 mx-auto flex w-full max-w-md flex-1 flex-col px-6 pt-16">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-primary shadow-glow">
            <Flame className="h-5 w-5 text-primary-foreground" strokeWidth={2.5} />
          </div>
          <span className="text-xl font-bold tracking-tight">Linkr</span>
        </div>

        <div className="mt-20 flex-1">
          <h1 className="text-5xl font-bold leading-[1.05]">
            Where creators
            <br />
            meet <span className="text-gradient">brands.</span>
          </h1>
          <p className="mt-5 text-base text-muted-foreground">
            Swipe. Match. Collaborate. The fastest way to find your next UGC partnership.
          </p>

          <div className="mt-10 space-y-3">
            <Feature icon={Heart} text="Swipe through curated profiles" />
            <Feature icon={Sparkles} text="Match instantly when it's mutual" />
            <Feature icon={Flame} text="Chat and start collaborating" />
          </div>
        </div>

        <div className="space-y-3 pb-10 pt-8">
          <Link
            to="/auth"
            search={{ mode: "signup" }}
            className="flex h-14 items-center justify-center rounded-full bg-gradient-primary text-base font-semibold text-primary-foreground shadow-glow transition-transform active:scale-[0.98]"
          >
            Get started
          </Link>
          <Link
            to="/auth"
            search={{ mode: "signin" }}
            className="flex h-14 items-center justify-center rounded-full border border-border bg-card/50 text-base font-semibold backdrop-blur transition-colors active:bg-card"
          >
            I already have an account
          </Link>
        </div>
      </div>
    </div>
  );
}

function Feature({ icon: Icon, text }: { icon: typeof Heart; text: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border bg-card/40 px-4 py-3 backdrop-blur">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-primary">
        <Icon className="h-4 w-4 text-primary-foreground" />
      </div>
      <span className="text-sm font-medium">{text}</span>
    </div>
  );
}
