import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { listProjectsAdmin, createProject } from "@/lib/portal.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/projects/")({
  component: AdminProjects,
});

function AdminProjects() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const fetchProjects = useServerFn(listProjectsAdmin);
  const create = useServerFn(createProject);

  const projects = useQuery({ queryKey: ["admin-projects"], queryFn: () => fetchProjects() });

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const createMut = useMutation({
    mutationFn: async () => {
      const result = await create({ data: { title: title.trim(), description: description.trim() || undefined } });
      if (!result?.project?.id) throw new Error("Project could not be created. Please try again.");
      return result.project;
    },
    onSuccess: async (project) => {
      qc.setQueryData(["admin-projects"], (current: any) => ({
        projects: [project, ...((current?.projects ?? []).filter((p: any) => p.id !== project.id))],
      }));
      qc.setQueryData(["project", project.id], {
        project,
        client: null,
        assets: [],
        messages: [],
      });
      void qc.invalidateQueries({ queryKey: ["admin-projects"] });
      toast.success("Project created — assign a client from the project page");
      setTitle("");
      setDescription("");
      navigate({ to: "/admin/projects/$id", params: { id: project.id } });
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed"),
  });

  return (
    <div className="space-y-10">
      <h1 className="font-display text-4xl text-accent">Projects</h1>

      <section className="border border-border/40 p-6">
        <h2 className="text-xs tracking-[0.4em] uppercase text-muted-foreground mb-4">New project</h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (title) createMut.mutate();
          }}
          className="space-y-3"
        >
          <input
            placeholder="Project title"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-transparent border border-border px-4 py-2 focus:outline-none focus:border-accent"
          />
          <textarea
            placeholder="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="w-full bg-transparent border border-border px-4 py-2 focus:outline-none focus:border-accent resize-none"
          />
          <p className="text-xs text-muted-foreground">
            You can assign a client from the project page after it's created.
          </p>
          <button
            type="submit"
            disabled={createMut.isPending || !title.trim()}
            className="bg-accent text-accent-foreground px-6 py-2 text-xs tracking-[0.3em] uppercase hover:bg-accent/90 disabled:opacity-60"
          >
            Create project
          </button>
        </form>
      </section>

      <section>
        <h2 className="text-xs tracking-[0.4em] uppercase text-muted-foreground mb-3">All projects</h2>
        <div className="border border-border/40 divide-y divide-border/40">
          {(projects.data?.projects ?? []).map((p: any) => (
            <Link
              key={p.id}
              to="/admin/projects/$id"
              params={{ id: p.id }}
              className="flex items-center justify-between p-4 hover:bg-muted/30"
            >
              <div>
                <p className="text-foreground">{p.title}</p>
                <p className="text-xs text-muted-foreground">
                  {p.client?.display_name ?? "No client assigned"} · {p.status}
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
