import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listProjectsAdmin, listClients } from "@/lib/portal.functions";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: AdminOverview,
});

function AdminOverview() {
  const fetchProjects = useServerFn(listProjectsAdmin);
  const fetchClients = useServerFn(listClients);
  const projects = useQuery({ queryKey: ["admin-projects"], queryFn: () => fetchProjects() });
  const clients = useQuery({ queryKey: ["admin-clients"], queryFn: () => fetchClients() });

  const total = projects.data?.projects.length ?? 0;
  const active = (projects.data?.projects ?? []).filter((p: any) => p.status === "active").length;

  return (
    <div className="space-y-10">
      <div>
        <p className="text-xs tracking-[0.4em] uppercase text-muted-foreground mb-3">Admin</p>
        <h1 className="font-display text-4xl text-accent">Overview</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Stat label="Clients" value={clients.data?.clients.length ?? 0} />
        <Stat label="Active projects" value={active} />
        <Stat label="Total projects" value={total} />
      </div>

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs tracking-[0.4em] uppercase text-muted-foreground">Recent projects</h2>
          <Link to="/admin/projects" className="text-xs tracking-[0.3em] uppercase text-accent hover:underline">
            View all →
          </Link>
        </div>
        <div className="border border-border/40 divide-y divide-border/40">
          {(projects.data?.projects ?? []).slice(0, 5).map((p: any) => (
            <Link
              key={p.id}
              to="/admin/projects/$id"
              params={{ id: p.id }}
              className="flex items-center justify-between p-4 hover:bg-muted/30"
            >
              <div>
                <p className="text-foreground">{p.title}</p>
                <p className="text-xs text-muted-foreground">
                  {p.client?.display_name ?? "—"} · {p.status}
                </p>
              </div>
              <span className="text-xs text-muted-foreground">
                {new Date(p.updated_at).toLocaleDateString()}
              </span>
            </Link>
          ))}
          {(projects.data?.projects ?? []).length === 0 && (
            <p className="p-6 text-sm text-muted-foreground">No projects yet.</p>
          )}
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="border border-border/40 p-6">
      <p className="text-xs tracking-[0.3em] uppercase text-muted-foreground">{label}</p>
      <p className="font-display text-4xl text-accent mt-2">{value}</p>
    </div>
  );
}
