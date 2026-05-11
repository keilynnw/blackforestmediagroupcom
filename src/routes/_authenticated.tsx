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
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/portal" className="font-display text-xl text-accent">
            Black Forest <span className="font-script text-primary">Portal</span>
          </Link>
          <nav className="flex items-center gap-6 text-xs tracking-[0.2em] uppercase">
            <Link to="/portal" activeOptions={{ exact: true }} activeProps={{ className: "text-accent" }} className="text-foreground/70 hover:text-foreground">
              My Projects
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
      <main className="max-w-6xl mx-auto px-6 py-10">
        <Outlet />
      </main>
    </div>
  );
}
