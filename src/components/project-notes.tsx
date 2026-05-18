import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  listProjectNotes,
  createProjectNote,
  updateProjectNote,
  deleteProjectNote,
} from "@/lib/portal.functions";
import { toast } from "sonner";

type Note = {
  id: string;
  project_id: string;
  title: string;
  body: string | null;
  created_at: string;
  updated_at: string;
};

export function ProjectNotes({ projectId }: { projectId: string }) {
  const qc = useQueryClient();
  const list = useServerFn(listProjectNotes);
  const create = useServerFn(createProjectNote);
  const update = useServerFn(updateProjectNote);
  const remove = useServerFn(deleteProjectNote);

  const queryKey = ["project-notes", projectId];
  const { data: notes = [], isLoading } = useQuery({
    queryKey,
    queryFn: () => list({ data: { projectId } }) as Promise<Note[]>,
  });

  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftTitle, setDraftTitle] = useState("");
  const [draftBody, setDraftBody] = useState("");

  function resetForm() {
    setDraftTitle("");
    setDraftBody("");
    setCreating(false);
    setEditingId(null);
  }

  const createMut = useMutation({
    mutationFn: () =>
      create({ data: { projectId, title: draftTitle.trim(), body: draftBody.trim() || null } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey });
      resetForm();
      toast.success("Note added");
    },
    onError: (e: any) => toast.error(e?.message ?? "Could not save note"),
  });

  const updateMut = useMutation({
    mutationFn: (id: string) =>
      update({ data: { id, title: draftTitle.trim(), body: draftBody.trim() || null } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey });
      resetForm();
      toast.success("Note updated");
    },
    onError: (e: any) => toast.error(e?.message ?? "Could not update"),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => remove({ data: { id } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey });
      toast.success("Note deleted");
    },
    onError: (e: any) => toast.error(e?.message ?? "Could not delete"),
  });

  function startEdit(n: Note) {
    setEditingId(n.id);
    setCreating(false);
    setDraftTitle(n.title);
    setDraftBody(n.body ?? "");
  }

  function startCreate() {
    resetForm();
    setCreating(true);
  }

  const editing = creating || editingId !== null;

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xs tracking-[0.4em] uppercase text-muted-foreground">
            Notes
          </h2>
          <p className="text-xs text-muted-foreground/70 mt-1">
            Ideas and content that aren't ready for the calendar yet.
          </p>
        </div>
        {!editing && (
          <button
            onClick={startCreate}
            className="text-[10px] tracking-[0.3em] uppercase border border-accent/40 text-accent px-3 py-2 hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            + New note
          </button>
        )}
      </div>

      {editing && (
        <div className="border border-accent/30 bg-accent/5 p-4 mb-4 space-y-3">
          <input
            value={draftTitle}
            onChange={(e) => setDraftTitle(e.target.value)}
            placeholder="Title"
            autoFocus
            className="w-full bg-background border border-border px-3 py-2 text-sm"
          />
          <textarea
            value={draftBody}
            onChange={(e) => setDraftBody(e.target.value)}
            placeholder="Idea, draft, reference, link…"
            rows={5}
            className="w-full bg-background border border-border px-3 py-2 text-sm font-mono"
          />
          <div className="flex items-center gap-2 justify-end">
            <button
              onClick={resetForm}
              className="text-[10px] tracking-[0.3em] uppercase border border-border px-3 py-2 text-muted-foreground hover:text-foreground"
            >
              Cancel
            </button>
            <button
              disabled={!draftTitle.trim() || createMut.isPending || updateMut.isPending}
              onClick={() => (editingId ? updateMut.mutate(editingId) : createMut.mutate())}
              className="text-[10px] tracking-[0.3em] uppercase border border-accent bg-accent text-accent-foreground px-3 py-2 disabled:opacity-50"
            >
              {editingId ? "Save" : "Add note"}
            </button>
          </div>
        </div>
      )}

      {isLoading ? (
        <p className="text-xs text-muted-foreground">Loading…</p>
      ) : notes.length === 0 && !editing ? (
        <p className="text-xs text-muted-foreground border border-dashed border-border/60 p-6 text-center">
          No notes yet. Capture ideas here before they become scheduled posts.
        </p>
      ) : (
        <ul className="space-y-2">
          {notes.map((n) => (
            <li
              key={n.id}
              className="border border-border/60 bg-background p-4 group"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-medium text-foreground truncate">
                    {n.title}
                  </h3>
                  {n.body && (
                    <p className="text-xs text-muted-foreground mt-2 whitespace-pre-wrap break-words">
                      {n.body}
                    </p>
                  )}
                  <p className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground/60 mt-3">
                    Updated {new Date(n.updated_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => startEdit(n)}
                    className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground hover:text-accent"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => {
                      if (confirm("Delete this note?")) deleteMut.mutate(n.id);
                    }}
                    className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground hover:text-destructive"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
