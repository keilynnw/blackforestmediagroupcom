import { createFileRoute, Outlet, Link, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin")({
  beforeLoad: async () => {
    if (typeof window === "undefined") return;
    const { data: sessionRes } = await supabase.auth.getSession();
    const userId = sessionRes.session?.user?.id;
    if (!userId) throw redirect({ to: "/portal/login" });
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();
    if (!data) throw redirect({ to: "/portal" });
  },
  component: AdminLayout,
});

function AdminLayout() {
  return (
    <div>
      <nav className="flex gap-6 text-xs tracking-[0.3em] uppercase border-b border-border/40 pb-4 mb-8">
        <Link to="/admin" activeOptions={{ exact: true }} activeProps={{ className: "text-accent" }} className="text-foreground/70 hover:text-foreground">
          Overview
        </Link>
        <Link to="/admin/clients" activeProps={{ className: "text-accent" }} className="text-foreground/70 hover:text-foreground">
          Clients
        </Link>
        <Link to="/admin/projects" activeProps={{ className: "text-accent" }} className="text-foreground/70 hover:text-foreground">
          Projects
        </Link>
      </nav>
      <Outlet />
    </div>
  );
}
