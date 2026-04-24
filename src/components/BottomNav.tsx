import { Link, useLocation } from "@tanstack/react-router";
import { Flame, MessageCircle, User } from "lucide-react";

export function BottomNav() {
  const { pathname } = useLocation();
  const items = [
    { to: "/feed", label: "Discover", icon: Flame },
    { to: "/matches", label: "Matches", icon: MessageCircle },
    { to: "/profile", label: "Profile", icon: User },
  ] as const;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-md items-stretch justify-around px-4 pb-[env(safe-area-inset-bottom)]">
        {items.map(({ to, label, icon: Icon }) => {
          const active = pathname.startsWith(to);
          return (
            <Link
              key={to}
              to={to}
              className="flex flex-1 flex-col items-center gap-1 py-3 transition-colors"
            >
              <Icon
                className={`h-6 w-6 transition-all ${
                  active ? "text-primary scale-110" : "text-muted-foreground"
                }`}
                strokeWidth={active ? 2.5 : 2}
              />
              <span
                className={`text-[10px] font-medium uppercase tracking-wider ${
                  active ? "text-primary" : "text-muted-foreground"
                }`}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
