import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/portal/reset-password")({
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const [hasRecoveryToken, setHasRecoveryToken] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const hash = window.location.hash;
    if (hash.includes("type=recovery") || hash.includes("access_token")) {
      setHasRecoveryToken(true);
    }
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setHasRecoveryToken(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function requestReset(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/portal/reset-password`,
    });
    setSubmitting(false);
    if (error) toast.error(error.message);
    else toast.success("Check your email for a reset link.");
  }

  async function setNewPassword(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    const { error } = await supabase.auth.updateUser({ password });
    setSubmitting(false);
    if (error) toast.error(error.message);
    else toast.success("Password updated. You can sign in now.");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-6 py-16">
      <div className="w-full max-w-md">
        <Link to="/portal/login" className="block text-center text-xs tracking-[0.4em] uppercase text-muted-foreground mb-6">
          Back to sign in
        </Link>
        <h1 className="font-display text-4xl text-accent text-center mb-10">
          {hasRecoveryToken ? "Set new password" : "Reset password"}
        </h1>
        {hasRecoveryToken ? (
          <form onSubmit={setNewPassword} className="space-y-5">
            <input
              type="password"
              required
              minLength={8}
              placeholder="New password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-transparent border border-border px-4 py-3 focus:outline-none focus:border-accent"
            />
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-accent text-accent-foreground py-3 text-xs tracking-[0.3em] uppercase hover:bg-accent/90"
            >
              Update password
            </button>
          </form>
        ) : (
          <form onSubmit={requestReset} className="space-y-5">
            <input
              type="email"
              required
              placeholder="Your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-transparent border border-border px-4 py-3 focus:outline-none focus:border-accent"
            />
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-accent text-accent-foreground py-3 text-xs tracking-[0.3em] uppercase hover:bg-accent/90"
            >
              Send reset link
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
