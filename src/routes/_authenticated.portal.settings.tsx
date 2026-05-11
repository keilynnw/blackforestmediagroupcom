import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/_authenticated/portal/settings")({
  component: PortalSettings,
});

function PortalSettings() {
  const { email } = useAuth();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    if (password !== confirm) {
      toast.error("Passwords do not match");
      return;
    }
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password });
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Password updated");
    setPassword("");
    setConfirm("");
  }

  return (
    <div className="space-y-10 max-w-xl">
      <div>
        <Link
          to="/portal"
          className="text-xs tracking-[0.3em] uppercase text-muted-foreground hover:text-accent"
        >
          ← Projects
        </Link>
        <h1 className="font-display text-4xl text-accent mt-4">Account settings</h1>
        {email && (
          <p className="text-sm text-muted-foreground mt-2">
            Signed in as {email}
          </p>
        )}
      </div>

      <section className="border border-border/40 p-6">
        <h2 className="text-xs tracking-[0.4em] uppercase text-muted-foreground mb-4">
          Change password
        </h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="password"
            placeholder="New password (min 8 characters)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            required
            minLength={8}
            className="w-full bg-transparent border border-border px-4 py-2 focus:outline-none focus:border-accent"
          />
          <input
            type="password"
            placeholder="Confirm new password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            autoComplete="new-password"
            required
            minLength={8}
            className="w-full bg-transparent border border-border px-4 py-2 focus:outline-none focus:border-accent"
          />
          <button
            type="submit"
            disabled={saving || !password || !confirm}
            className="bg-accent text-accent-foreground px-6 py-2 text-xs tracking-[0.3em] uppercase hover:bg-accent/90 disabled:opacity-60"
          >
            {saving ? "Saving…" : "Update password"}
          </button>
        </form>
      </section>
    </div>
  );
}
