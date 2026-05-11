import { createFileRoute, useNavigate, useSearch, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { acceptInvitation } from "@/lib/portal.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/portal/accept-invite")({
  validateSearch: (search: Record<string, unknown>) => ({
    token: typeof search.token === "string" ? search.token : "",
  }),
  component: AcceptInvitePage,
});

function AcceptInvitePage() {
  const { token } = useSearch({ from: "/portal/accept-invite" });
  const navigate = useNavigate();
  const accept = useServerFn(acceptInvitation);
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <p className="text-muted-foreground">No invitation token provided.</p>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await accept({ data: { token, password, displayName } });
      toast.success("Account created — please sign in.");
      navigate({ to: "/portal/login" });
    } catch (err: any) {
      toast.error(err?.message ?? "Could not accept invitation");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-6 py-16">
      <div className="w-full max-w-md">
        <Link to="/" className="block text-center text-xs tracking-[0.4em] uppercase text-muted-foreground mb-6">
          Black Forest
        </Link>
        <h1 className="font-display text-4xl text-accent text-center mb-2">Welcome</h1>
        <p className="text-center text-sm text-muted-foreground mb-10">Create your portal account.</p>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs tracking-[0.25em] uppercase text-foreground/70 mb-2">Your name</label>
            <input
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full bg-transparent border border-border px-4 py-3 focus:outline-none focus:border-accent"
            />
          </div>
          <div>
            <label className="block text-xs tracking-[0.25em] uppercase text-foreground/70 mb-2">Password</label>
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-transparent border border-border px-4 py-3 focus:outline-none focus:border-accent"
            />
            <p className="text-xs text-muted-foreground mt-2">At least 8 characters.</p>
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-accent text-accent-foreground py-3 text-xs tracking-[0.3em] uppercase hover:bg-accent/90 disabled:opacity-60"
          >
            {submitting ? "Creating…" : "Create account"}
          </button>
        </form>
      </div>
    </div>
  );
}
