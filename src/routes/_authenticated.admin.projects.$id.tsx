import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useRef, useState } from "react";
import {
  getProjectDetail,
  sendMessage,
  createSignedUploadUrl,
  registerAsset,
  getAssetDownloadUrl,
  deleteAsset,
  updateProject,
  listClients,
} from "@/lib/portal.functions";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { ContentCalendar } from "@/components/content-calendar";
import { ProjectNotes } from "@/components/project-notes";
import { StrategyPanel } from "@/components/strategy-panel";
import { IntakeFormPanel } from "@/components/intake-form-panel";

export const Route = createFileRoute("/_authenticated/admin/projects/$id")({
  component: AdminProjectDetail,
  errorComponent: ProjectDetailError,
  notFoundComponent: () => (
    <div className="py-12 text-center">
      <p className="text-sm text-muted-foreground mb-4">Project not found.</p>
      <Link to="/admin/projects" className="text-xs tracking-[0.3em] uppercase text-accent">
        ← Back to projects
      </Link>
    </div>
  ),
});

function ProjectDetailError({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();
  const message =
    error instanceof Response
      ? `${error.status} ${error.statusText}`
      : error?.message || "Something went wrong loading this project.";
  return (
    <div className="py-12 text-center space-y-4">
      <h2 className="text-lg font-display">Couldn't load project</h2>
      <p className="text-sm text-muted-foreground">{message}</p>
      <div className="flex justify-center gap-3">
        <button
          type="button"
          onClick={() => {
            router.invalidate();
            reset();
          }}
          className="text-xs tracking-[0.3em] uppercase border border-accent px-4 py-2 hover:bg-accent hover:text-accent-foreground"
        >
          Try again
        </button>
        <Link to="/admin/projects" className="text-xs tracking-[0.3em] uppercase border border-border px-4 py-2 hover:bg-muted">
          Back to projects
        </Link>
      </div>
    </div>
  );
}

function AdminProjectDetail() {
  const { id } = Route.useParams();
  const { userId } = useAuth();
  const qc = useQueryClient();
  const fetchDetail = useServerFn(getProjectDetail);
  const sendMsg = useServerFn(sendMessage);
  const createUrl = useServerFn(createSignedUploadUrl);
  const register = useServerFn(registerAsset);
  const download = useServerFn(getAssetDownloadUrl);
  const del = useServerFn(deleteAsset);
  const update = useServerFn(updateProject);
  const fetchClients = useServerFn(listClients);

  const { data, isLoading } = useQuery({
    queryKey: ["project", id],
    queryFn: async () => {
      try {
        return await fetchDetail({ data: { id } });
      } catch (e) {
        if (e instanceof Response) {
          throw new Error(
            e.status === 401 || e.status === 403
              ? "Your session expired or you don't have access. Please sign in again."
              : `Request failed (${e.status} ${e.statusText})`,
          );
        }
        throw e;
      }
    },
    retry: false,
    throwOnError: true,
  });
  const clientsQ = useQuery({
    queryKey: ["admin-clients"],
    queryFn: () => fetchClients(),
  });

  const [body, setBody] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [tab, setTab] = useState<"strategy" | "intake" | "calendar" | "notes" | "files" | "messages">("strategy");

  const sendMut = useMutation({
    mutationFn: () => sendMsg({ data: { projectId: id, body } }),
    onSuccess: () => {
      setBody("");
      qc.invalidateQueries({ queryKey: ["project", id] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Could not send"),
  });

  const statusMut = useMutation({
    mutationFn: (status: "active" | "paused" | "completed") =>
      update({ data: { id, status } }),
    onSuccess: () => {
      toast.success("Status updated");
      qc.invalidateQueries({ queryKey: ["project", id] });
      qc.invalidateQueries({ queryKey: ["admin-projects"] });
    },
  });

  const clientMut = useMutation({
    mutationFn: (clientId: string | null) =>
      update({ data: { id, clientId } }),
    onSuccess: () => {
      toast.success("Client updated");
      qc.invalidateQueries({ queryKey: ["project", id] });
      qc.invalidateQueries({ queryKey: ["admin-projects"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Could not update client"),
  });

  async function handleFile(file: File) {
    setUploading(true);
    try {
      const { signedUrl, path } = await createUrl({
        data: { projectId: id, filename: file.name },
      });
      const res = await fetch(signedUrl, { method: "PUT", body: file });
      if (!res.ok) throw new Error("Upload failed");
      await register({
        data: {
          projectId: id,
          storagePath: path,
          label: file.name,
          fileType: file.type,
          fileSize: file.size,
        },
      });
      toast.success("Uploaded");
      qc.invalidateQueries({ queryKey: ["project", id] });
    } catch (e: any) {
      toast.error(e?.message ?? "Upload failed");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function handleDownload(assetId: string) {
    try {
      const { url } = await download({ data: { assetId } });
      window.open(url, "_blank");
    } catch (e: any) {
      toast.error(e?.message ?? "Could not download");
    }
  }

  if (isLoading) return <p className="text-muted-foreground">Loading…</p>;
  if (!data) return <p className="text-muted-foreground">Project not found.</p>;

  const { project, client } = data as any;
  const assets = (data as any).assets ?? [];
  const messages = (data as any).messages ?? [];

  return (
    <div className="space-y-12">
      <div>
        <Link to="/admin/projects" className="text-xs tracking-[0.3em] uppercase text-muted-foreground hover:text-accent">
          ← All projects
        </Link>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <h1 className="font-display text-4xl md:text-5xl text-accent">{project.title}</h1>
          <select
            value={project.status}
            onChange={(e) => statusMut.mutate(e.target.value as any)}
            className="bg-background border border-border px-3 py-2 text-xs tracking-[0.2em] uppercase"
          >
            <option value="active">Active</option>
            <option value="paused">Paused</option>
            <option value="completed">Completed</option>
          </select>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <span className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground">
            Client
          </span>
          <select
            value={project.client_id ?? ""}
            onChange={(e) =>
              clientMut.mutate(e.target.value ? e.target.value : null)
            }
            disabled={clientMut.isPending}
            className="bg-background border border-border px-3 py-2 text-xs"
          >
            <option value="">— No client assigned —</option>
            {(clientsQ.data?.clients ?? []).map((c: any) => (
              <option key={c.id} value={c.id}>
                {c.display_name ?? c.id}
                {c.company ? ` · ${c.company}` : ""}
              </option>
            ))}
          </select>
          {client?.company && (
            <span className="text-xs text-muted-foreground">{client.company}</span>
          )}
        </div>
        {project.description && (
          <p className="text-foreground/80 mt-4 max-w-2xl">{project.description}</p>
        )}
      </div>

      <nav className="flex gap-1 border-b border-border/40 -mb-px overflow-x-auto">
        {(
          [
            ["strategy", "Strategy"],
            ["intake", "Intake Form"],
            ["calendar", "Calendar"],
            ["notes", "Notes"],
            ["files", "Files"],
            ["messages", "Messages"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-3 text-xs tracking-[0.3em] uppercase border-b-2 transition-colors ${
              tab === key
                ? "border-accent text-accent"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {label}
          </button>
        ))}
      </nav>

      {tab === "strategy" && (
        <StrategyPanel projectId={id} strategy={project.strategy ?? null} canEdit={true} />
      )}

      {tab === "intake" && (
        <IntakeFormPanel
          projectId={id}
          submittedAt={(project as any).intake_submitted_at ?? null}
          isAdmin={true}
        />
      )}

      {tab === "calendar" && <ContentCalendar projectId={id} />}

      {tab === "notes" && <ProjectNotes projectId={id} />}

      {tab === "files" && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs tracking-[0.4em] uppercase text-muted-foreground">Files</h2>
            <label className="text-xs tracking-[0.3em] uppercase border border-accent/40 px-4 py-2 cursor-pointer hover:bg-accent hover:text-accent-foreground transition-colors">
              {uploading ? "Uploading…" : "+ Upload"}
              <input
                ref={fileRef}
                type="file"
                className="hidden"
                disabled={uploading}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFile(f);
                }}
              />
            </label>
          </div>
          {assets.length === 0 ? (
            <p className="text-sm text-muted-foreground border border-border/40 p-6">No files yet.</p>
          ) : (
            <ul className="border border-border/40 divide-y divide-border/40">
              {assets.map((a: any) => (
                <li key={a.id} className="flex items-center justify-between p-4">
                  <div>
                    <p className="text-foreground">{a.label ?? a.storage_path.split("/").pop()}</p>
                    <p className="text-xs text-muted-foreground">
                      {a.file_type ?? "file"}
                      {a.file_size ? ` · ${(a.file_size / 1024).toFixed(0)} KB` : ""}
                      {" · "}{new Date(a.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDownload(a.id)}
                    className="text-xs tracking-[0.3em] uppercase text-accent hover:underline"
                  >
                    Download
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {tab === "messages" && (
        <section>
          <h2 className="text-xs tracking-[0.4em] uppercase text-muted-foreground mb-4">Messages</h2>
          <div className="border border-border/40 max-h-96 overflow-y-auto p-4 space-y-3 mb-3">
            {messages.length === 0 && (
              <p className="text-sm text-muted-foreground">No messages yet.</p>
            )}
            {messages.map((m: any) => {
              const mine = m.sender_id === userId;
              return (
                <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-md ${mine ? "bg-accent/15" : "bg-muted/40"} px-4 py-2`}>
                    <p className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-1">
                      {m.sender_name} · {new Date(m.created_at).toLocaleString()}
                    </p>
                    <p className="text-sm whitespace-pre-wrap text-foreground">{m.body}</p>
                  </div>
                </div>
              );
            })}
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (body.trim()) sendMut.mutate();
            }}
            className="flex gap-2"
          >
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Reply…"
              rows={2}
              className="flex-1 bg-transparent border border-border px-4 py-2 focus:outline-none focus:border-accent resize-none"
            />
            <button
              type="submit"
              disabled={sendMut.isPending || !body.trim()}
              className="bg-accent text-accent-foreground px-6 text-xs tracking-[0.3em] uppercase hover:bg-accent/90 disabled:opacity-60"
            >
              Send
            </button>
          </form>
        </section>
      )}
    </div>
  );
}
