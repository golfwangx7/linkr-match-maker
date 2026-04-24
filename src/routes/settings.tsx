import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronLeft, ChevronRight, Shield, Mail, Trash2, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
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

export const Route = createFileRoute("/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

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
      setConfirmOpen(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-12">
      <header className="px-5 pt-12 pb-4">
        <div className="flex items-center gap-3">
          <Link
            to="/profile"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card text-foreground transition-opacity active:opacity-70"
            aria-label="Back"
          >
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-3xl font-bold">Settings</h1>
        </div>
      </header>

      <main className="mx-auto w-full max-w-md px-5">
        <section className="mt-4">
          <h2 className="mb-2 px-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            General
          </h2>
          <div className="overflow-hidden rounded-2xl border border-border bg-card">
            <Link
              to="/privacy"
              className="flex items-center gap-3 px-4 py-4 transition-colors hover:bg-muted/40"
            >
              <Shield className="h-5 w-5 text-primary" />
              <span className="flex-1 text-sm font-medium">Privacy Policy</span>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </Link>
          </div>
        </section>

        <section className="mt-6">
          <h2 className="mb-2 px-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Support
          </h2>
          <div className="overflow-hidden rounded-2xl border border-border bg-card">
            <a
              href="mailto:linkr.support@gmail.com"
              className="flex items-center gap-3 px-4 py-4 transition-colors hover:bg-muted/40"
            >
              <Mail className="h-5 w-5 text-primary" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium">Contact support</div>
                <div className="truncate text-xs text-muted-foreground">
                  linkr.support@gmail.com
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </a>
          </div>
        </section>

        <section className="mt-6">
          <h2 className="mb-2 px-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Account
          </h2>
          <div className="overflow-hidden rounded-2xl border border-destructive/30 bg-card">
            <button
              type="button"
              onClick={() => setConfirmOpen(true)}
              className="flex w-full items-center gap-3 px-4 py-4 text-left transition-colors hover:bg-destructive/10"
            >
              <Trash2 className="h-5 w-5 text-destructive" />
              <span className="flex-1 text-sm font-medium text-destructive">
                Delete account
              </span>
            </button>
          </div>
          <p className="mt-2 px-1 text-xs text-muted-foreground">
            Permanently deletes your profile, matches, and messages. This cannot be undone.
          </p>
        </section>
      </main>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete your account?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete your profile, matches, and messages. This action cannot be undone.
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
    </div>
  );
}
