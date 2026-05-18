import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useRef, useState } from "react";
import {
  getProjectDetail,
  sendMessage,
  createSignedUploadUrl,
  registerAsset,
  getAssetDownloadUrl,
} from "@/lib/portal.functions";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { ContentCalendar } from "@/components/content-calendar";
import { ProjectNotes } from "@/components/project-notes";
import { StrategyPanel } from "@/components/strategy-panel";

export const Route = createFileRoute("/_authenticated/portal/projects/$id")({
  component: ProjectDetail,
});

function ProjectDetail() {
  const { id } = Route.useParams();
  const { userId, isAdmin } = useAuth();
  const qc = useQueryClient();
  const fetchDetail = useServerFn(getProjectDetail);
  const sendMsg = useServerFn(sendMessage);
  const createUrl = useServerFn(createSignedUploadUrl);
  const register = useServerFn(registerAsset);
  const download = useServerFn(getAssetDownloadUrl);

  const { data, isLoading } = useQuery({
    queryKey: ["project", id],
    queryFn: () => fetchDetail({ data: { id } }),
  });

  const [body, setBody] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [tab, setTab] = useState<"strategy" | "calendar" | "notes" | "files" | "messages">("strategy");

  const sendMut = useMutation({
    mutationFn: () => sendMsg({ data: { projectId: id, body } }),
    onSuccess: () => {
      setBody("");
      qc.invalidateQueries({ queryKey: ["project", id] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Could not send"),
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
        <Link to="/portal" className="text-xs tracking-[0.3em] uppercase text-muted-foreground hover:text-accent">
          ← Projects
        </Link>
        <div className="mt-4 flex items-center justify-between">
          <h1 className="font-display text-4xl md:text-5xl text-accent">{project.title}</h1>
          <span className="text-[10px] tracking-[0.3em] uppercase px-3 py-1 border border-accent/40 text-accent">
            {project.status}
          </span>
        </div>
        {client && (
          <p className="text-sm text-muted-foreground mt-2">
            Client: {client.display_name}{client.company ? ` · ${client.company}` : ""}
          </p>
        )}
        {project.description && (
          <p className="text-foreground/80 mt-4 max-w-2xl">{project.description}</p>
        )}
      </div>

      <nav className="flex gap-1 border-b border-border/40 -mb-px overflow-x-auto">
        {(
          [
            ["strategy", "Strategy"],
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
        <StrategyPanel projectId={id} strategy={project.strategy ?? null} canEdit={isAdmin} />
      )}

      {tab === "calendar" && <ContentCalendar projectId={id} />}

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
              placeholder="Write a message…"
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
