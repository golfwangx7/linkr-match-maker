import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — Linkr" },
      { name: "description", content: "How Linkr handles and protects your data." },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background pb-12">
      <header className="px-5 pt-12 pb-4">
        <div className="flex items-center gap-3">
          <Link
            to="/settings"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card text-foreground transition-opacity active:opacity-70"
            aria-label="Back"
          >
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-3xl font-bold">Privacy Policy</h1>
        </div>
      </header>

      <main className="mx-auto w-full max-w-md px-5">
        <p className="text-xs text-muted-foreground">Last updated: April 2026</p>

        <div className="mt-6 space-y-6 text-sm leading-relaxed text-foreground">
          <section>
            <h2 className="mb-2 text-base font-semibold">What we store</h2>
            <p className="text-muted-foreground">
              We store the information you provide while using Linkr, including
              your profile details (display name, role, bio, image, social
              handles, country, gender, and categories), the swipes you make,
              the matches you create, and the messages you exchange with other
              users.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold">How we use your data</h2>
            <p className="text-muted-foreground">
              Your data is used solely to provide the Linkr service: showing
              your profile to potential matches, surfacing relevant creators
              and brands to you, enabling messaging between matched users, and
              keeping your account secure.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold">Sharing</h2>
            <p className="text-muted-foreground">
              We do not sell your personal data to third parties. Your profile
              information is only visible to other authenticated users of the
              app, and your messages are only visible to you and your match.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold">Your control</h2>
            <p className="text-muted-foreground">
              You can update your profile at any time from the Profile screen.
              You can permanently delete your account and all associated data
              from Settings → Delete account. This action is irreversible.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold">Contact</h2>
            <p className="text-muted-foreground">
              Questions about your data? Reach us at{" "}
              <a
                href="mailto:linkr.support@gmail.com"
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                linkr.support@gmail.com
              </a>
              .
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
