import { createFileRoute, Outlet, redirect, Link, useRouter } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: async ({ location }) => {
    if (typeof window === "undefined") return;
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      throw redirect({
        to: "/portal/login",
        search: { redirect: location.href } as any,
      });
    }
  },
  component: AuthLayout,
});

function AuthLayout() {
  const { isAdmin, signOut, loading } = useAuth();
  const router = useRouter();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border/40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <Link to="/portal" className="font-display text-lg sm:text-xl text-accent">
            Black Forest <span className="font-script text-primary">Portal</span>
          </Link>
          <nav className="flex flex-wrap items-center gap-x-4 gap-y-2 sm:gap-6 text-[11px] sm:text-xs tracking-[0.2em] uppercase">
            <Link to="/portal" activeOptions={{ exact: true }} activeProps={{ className: "text-accent" }} className="text-foreground/70 hover:text-foreground">
              My Projects
            </Link>
            <Link to="/portal/settings" activeProps={{ className: "text-accent" }} className="text-foreground/70 hover:text-foreground">
              Settings
            </Link>
            {isAdmin && (
              <Link to="/admin" activeProps={{ className: "text-accent" }} className="text-foreground/70 hover:text-foreground">
                Admin
              </Link>
            )}
            <button
              onClick={async () => {
                await signOut();
                router.navigate({ to: "/portal/login" });
              }}
              disabled={loading}
              className="text-foreground/70 hover:text-foreground"
            >
              Sign out
            </button>
          </nav>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        <Outlet />
      </main>
    </div>
  );
}
