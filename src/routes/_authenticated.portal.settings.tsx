import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/_authenticated/portal/settings")({
  component: PortalSettings,
});

function PortalSettings() {
  const { session, userId } = useAuth();
  const email = session?.user?.email ?? null;

  const [displayName, setDisplayName] = useState("");
  const [company, setCompany] = useState("");
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [sendingReset, setSendingReset] = useState(false);

  useEffect(() => {
    if (!userId) return;
    supabase
      .from("profiles")
      .select("display_name, company")
      .eq("id", userId)
      .maybeSingle()
      .then(({ data }) => {
        setDisplayName(data?.display_name ?? "");
        setCompany(data?.company ?? "");
        setProfileLoaded(true);
      });
  }, [userId]);

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!userId) return;
    setSavingProfile(true);
    const { error } = await supabase
      .from("profiles")
      .upsert({
        id: userId,
        display_name: displayName.trim() || null,
        company: company.trim() || null,
      });
    setSavingProfile(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Profile updated");
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    if (password !== confirm) {
      toast.error("Passwords do not match");
      return;
    }
    setSavingPassword(true);
    const { error } = await supabase.auth.updateUser({ password });
    setSavingPassword(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Password updated");
    setPassword("");
    setConfirm("");
  }

  async function sendResetEmail() {
    if (!email) {
      toast.error("No email on file");
      return;
    }
    setSendingReset(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/portal/reset-password`,
    });
    setSendingReset(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Reset link sent — check your inbox");
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
      </div>

      <section className="border border-border/40 p-6">
        <h2 className="text-xs tracking-[0.4em] uppercase text-muted-foreground mb-4">
          Profile
        </h2>
        <form onSubmit={saveProfile} className="space-y-3">
          <div>
            <label className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground">
              Email
            </label>
            <input
              type="email"
              value={email ?? ""}
              readOnly
              disabled
              className="w-full bg-muted/30 border border-border px-4 py-2 mt-1 text-foreground/70 cursor-not-allowed"
            />
            <p className="text-[10px] text-muted-foreground mt-1">
              Contact your account manager to change your email.
            </p>
          </div>
          <div>
            <label className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground">
              Display name
            </label>
            <input
              type="text"
              placeholder="Your name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              disabled={!profileLoaded}
              className="w-full bg-transparent border border-border px-4 py-2 mt-1 focus:outline-none focus:border-accent"
            />
          </div>
          <div>
            <label className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground">
              Company
            </label>
            <input
              type="text"
              placeholder="Company (optional)"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              disabled={!profileLoaded}
              className="w-full bg-transparent border border-border px-4 py-2 mt-1 focus:outline-none focus:border-accent"
            />
          </div>
          <button
            type="submit"
            disabled={savingProfile || !profileLoaded}
            className="bg-accent text-accent-foreground px-6 py-2 text-xs tracking-[0.3em] uppercase hover:bg-accent/90 disabled:opacity-60"
          >
            {savingProfile ? "Saving…" : "Save profile"}
          </button>
        </form>
      </section>

      <section className="border border-border/40 p-6">
        <h2 className="text-xs tracking-[0.4em] uppercase text-muted-foreground mb-4">
          Change password
        </h2>
        <form onSubmit={changePassword} className="space-y-3">
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
            disabled={savingPassword || !password || !confirm}
            className="bg-accent text-accent-foreground px-6 py-2 text-xs tracking-[0.3em] uppercase hover:bg-accent/90 disabled:opacity-60"
          >
            {savingPassword ? "Saving…" : "Update password"}
          </button>
        </form>
      </section>

      <section className="border border-border/40 p-6">
        <h2 className="text-xs tracking-[0.4em] uppercase text-muted-foreground mb-2">
          Reset password by email
        </h2>
        <p className="text-sm text-muted-foreground mb-4">
          Forgot your current password? Send a reset link to{" "}
          <span className="text-foreground">{email ?? "your email"}</span>.
        </p>
        <button
          type="button"
          onClick={sendResetEmail}
          disabled={sendingReset || !email}
          className="border border-accent/40 text-accent px-6 py-2 text-xs tracking-[0.3em] uppercase hover:bg-accent hover:text-accent-foreground transition-colors disabled:opacity-60"
        >
          {sendingReset ? "Sending…" : "Email me a reset link"}
        </button>
      </section>
    </div>
  );
}
