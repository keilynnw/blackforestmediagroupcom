import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/portal/login")({
  validateSearch: (search: Record<string, unknown>) => ({
    redirect: typeof search.redirect === "string" ? search.redirect : "/portal",
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const search = useSearch({ from: "/portal/login" });
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setSubmitting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Welcome back");
    navigate({ to: search.redirect || "/portal" });
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-6 py-16">
      <div className="w-full max-w-md">
        <Link to="/" className="block text-center text-xs tracking-[0.4em] uppercase text-muted-foreground mb-6">
          Black Forest
        </Link>
        <h1 className="font-display text-4xl text-accent text-center mb-2">Client <span className="font-script text-primary">portal</span></h1>
        <p className="text-center text-sm text-muted-foreground mb-10">Sign in to view your projects.</p>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs tracking-[0.25em] uppercase text-foreground/70 mb-2">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-transparent border border-border px-4 py-3 focus:outline-none focus:border-accent"
            />
          </div>
          <div>
            <label className="block text-xs tracking-[0.25em] uppercase text-foreground/70 mb-2">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-transparent border border-border px-4 py-3 focus:outline-none focus:border-accent"
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-accent text-accent-foreground py-3 text-xs tracking-[0.3em] uppercase hover:bg-accent/90 disabled:opacity-60"
          >
            {submitting ? "Signing in…" : "Sign in"}
          </button>
        </form>
        <div className="mt-6 text-center text-xs text-muted-foreground">
          <Link to="/portal/reset-password" className="hover:text-accent">Forgot password?</Link>
        </div>
      </div>
    </div>
  );
}
