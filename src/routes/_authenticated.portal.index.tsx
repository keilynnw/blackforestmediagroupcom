import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listProjects } from "@/lib/portal.functions";

export const Route = createFileRoute("/_authenticated/portal/")({
  component: PortalHome,
});

const STATUS_STYLES: Record<string, string> = {
  active: "bg-accent/20 text-accent",
  paused: "bg-muted text-muted-foreground",
  completed: "bg-primary/20 text-primary",
};

function PortalHome() {
  const fetchProjects = useServerFn(listProjects);
  const { data, isLoading } = useQuery({
    queryKey: ["my-projects"],
    queryFn: () => fetchProjects(),
  });
  const projects = data?.projects ?? [];

  return (
    <div>
      <p className="text-xs tracking-[0.4em] uppercase text-muted-foreground mb-4">Your work</p>
      <h1 className="font-display text-4xl md:text-5xl text-accent mb-10">Projects</h1>

      {isLoading && <p className="text-muted-foreground">Loading…</p>}
      {!isLoading && projects.length === 0 && (
        <p className="text-muted-foreground border border-border/40 p-10 text-center">
          No projects yet. We'll add your first project here once it's set up.
        </p>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {projects.map((p: any) => (
          <Link
            key={p.id}
            to="/portal/projects/$id"
            params={{ id: p.id }}
            className="block border border-border/40 p-6 hover:border-accent transition-colors"
          >
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-display text-2xl text-accent">{p.title}</h2>
              <span className={`text-[10px] tracking-[0.3em] uppercase px-2 py-1 ${STATUS_STYLES[p.status] ?? ""}`}>
                {p.status}
              </span>
            </div>
            {p.description && (
              <p className="text-sm text-muted-foreground line-clamp-2">{p.description}</p>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
