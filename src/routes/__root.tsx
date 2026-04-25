import { Outlet, createRootRoute, HeadContent, Scripts, Link } from "@tanstack/react-router";
import { AuthProvider } from "@/lib/auth-context";
import { Toaster } from "@/components/ui/sonner";
import { useNotifications } from "@/hooks/use-notifications";
import { SplashScreen } from "@/components/SplashScreen";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-hero px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-gradient">404</h1>
        <h2 className="mt-4 text-xl font-semibold">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          This page doesn't exist.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-full bg-gradient-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { name: "theme-color", content: "#0A0A0F" },
      { title: "Linkr — Match creators with brands" },
      { name: "description", content: "Linkr connects UGC creators with brands. Swipe, match, and collaborate." },
      { property: "og:title", content: "Linkr — Match creators with brands" },
      { property: "og:description", content: "Linkr connects UGC creators with brands. Swipe, match, and collaborate." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: "Linkr — Match creators with brands" },
      { name: "twitter:description", content: "Linkr connects UGC creators with brands. Swipe, match, and collaborate." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/17ba6e8e-f68d-4e19-863d-615fefc3ffe4/id-preview-4a9039fd--6e9ca4d6-4288-4431-8938-2069202ca8c6.lovable.app-1777047425286.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/17ba6e8e-f68d-4e19-863d-615fefc3ffe4/id-preview-4a9039fd--6e9ca4d6-4288-4431-8938-2069202ca8c6.lovable.app-1777047425286.png" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", type: "image/png", href: "/app-icon.png" },
      { rel: "apple-touch-icon", href: "/app-icon.png" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark" style={{ background: "#0A0A0F" }}>
      <head>
        <HeadContent />
      </head>
      <body style={{ background: "#0A0A0F" }}>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  return (
    <AuthProvider>
      <NotificationsBridge />
      <SplashScreen />
      <Outlet />
      <Toaster />
    </AuthProvider>
  );
}

function NotificationsBridge() {
  useNotifications();
  return null;
}
