import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  listCalendarEntries,
  createCalendarEntry,
  updateCalendarEntry,
  deleteCalendarEntry,
  createSignedUploadUrl,
  getCalendarAttachmentUrl,
} from "@/lib/portal.functions";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Entry = {
  id: string;
  project_id: string;
  scheduled_date: string;
  title: string;
  notes: string | null;
  platform: string | null;
  status: "idea" | "scheduled" | "published";
  attachment_path: string | null;
  attachment_name: string | null;
  attachment_type: string | null;
  attachment_size: number | null;
  approved: boolean;
  comments: string | null;
};

const STATUSES: Entry["status"][] = ["idea", "scheduled", "published"];

function pad(n: number) {
  return n.toString().padStart(2, "0");
}
function fmtDate(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function endOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}

export function ContentCalendar({ projectId }: { projectId: string }) {
  const qc = useQueryClient();
  const [cursor, setCursor] = useState(() => startOfMonth(new Date()));
  const [editing, setEditing] = useState<Entry | null>(null);
  const [creatingDate, setCreatingDate] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverDate, setDragOverDate] = useState<string | null>(null);
  const [showOnlyApproved, setShowOnlyApproved] = useState(false);
  const [showOnlyWithComments, setShowOnlyWithComments] = useState(false);



  const list = useServerFn(listCalendarEntries);
  const create = useServerFn(createCalendarEntry);
  const update = useServerFn(updateCalendarEntry);
  const remove = useServerFn(deleteCalendarEntry);

  const monthStart = fmtDate(cursor);
  const monthEnd = fmtDate(endOfMonth(cursor));
  const queryKey = ["calendar", projectId, monthStart];

  const { data: entries = [], isLoading } = useQuery({
    queryKey,
    queryFn: () =>
      list({ data: { projectId, monthStart, monthEnd } }) as Promise<Entry[]>,
  });

  const createMut = useMutation({
    mutationFn: (vars: {
      scheduledDate: string;
      title: string;
      notes?: string;
      platform?: string;
      status?: Entry["status"];
      attachmentPath?: string | null;
      attachmentName?: string | null;
      attachmentType?: string | null;
      attachmentSize?: number | null;
      approved?: boolean;
      comments?: string | null;
    }) => create({ data: { projectId, ...vars } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey });
      setCreatingDate(null);
    },
    onError: (e: any) => toast.error(e?.message ?? "Could not create"),
  });

  const updateMut = useMutation({
    mutationFn: (vars: Partial<Entry> & { id: string }) =>
      update({
        data: {
          id: vars.id,
          scheduledDate: vars.scheduled_date,
          title: vars.title,
          notes: vars.notes,
          platform: vars.platform,
          status: vars.status,
          attachmentPath: vars.attachment_path,
          attachmentName: vars.attachment_name,
          attachmentType: vars.attachment_type,
          attachmentSize: vars.attachment_size,
          approved: vars.approved,
          comments: vars.comments,
        },
      }),

    onSuccess: () => {
      qc.invalidateQueries({ queryKey });
      setEditing(null);
    },
    onError: (e: any) => toast.error(e?.message ?? "Could not save"),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => remove({ data: { id } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey });
      setEditing(null);
    },
    onError: (e: any) => toast.error(e?.message ?? "Could not delete"),
  });

  const moveMut = useMutation({
    mutationFn: (vars: { entry: Entry; newDate: string }) =>
      update({
        data: {
          id: vars.entry.id,
          scheduledDate: vars.newDate,
          title: vars.entry.title,
          notes: vars.entry.notes,
          platform: vars.entry.platform,
          status: vars.entry.status,
        },
      }),
    onMutate: async (vars) => {
      await qc.cancelQueries({ queryKey });
      const prev = qc.getQueryData<Entry[]>(queryKey);
      qc.setQueryData<Entry[]>(queryKey, (old = []) =>
        old.map((e) =>
          e.id === vars.entry.id ? { ...e, scheduled_date: vars.newDate } : e,
        ),
      );
      return { prev };
    },
    onError: (e: any, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(queryKey, ctx.prev);
      toast.error(e?.message ?? "Could not move entry");
    },
    onSettled: () => qc.invalidateQueries({ queryKey }),
  });

  function handleDrop(targetDate: string) {
    const id = draggingId;
    setDraggingId(null);
    setDragOverDate(null);
    if (!id) return;
    const entry = entries.find((e) => e.id === id);
    if (!entry || entry.scheduled_date === targetDate) return;
    moveMut.mutate({ entry, newDate: targetDate });
  }


  // Build day grid (Mon-first)
  const grid = useMemo(() => {
    const first = startOfMonth(cursor);
    const last = endOfMonth(cursor);
    const startWeekday = (first.getDay() + 6) % 7; // Mon=0
    const cells: { date: Date; inMonth: boolean }[] = [];
    for (let i = 0; i < startWeekday; i++) {
      const d = new Date(first);
      d.setDate(d.getDate() - (startWeekday - i));
      cells.push({ date: d, inMonth: false });
    }
    for (let day = 1; day <= last.getDate(); day++) {
      cells.push({ date: new Date(cursor.getFullYear(), cursor.getMonth(), day), inMonth: true });
    }
    while (cells.length % 7 !== 0) {
      const d = new Date(cells[cells.length - 1].date);
      d.setDate(d.getDate() + 1);
      cells.push({ date: d, inMonth: false });
    }
    return cells;
  }, [cursor]);

  const byDay = useMemo(() => {
    const map = new Map<string, Entry[]>();
    for (const e of entries) {
      const arr = map.get(e.scheduled_date) ?? [];
      arr.push(e);
      map.set(e.scheduled_date, arr);
    }
    return map;
  }, [entries]);

  const monthLabel = cursor.toLocaleString("default", { month: "long", year: "numeric" });

  return (
    <section>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-3">
        <h2 className="text-xs tracking-[0.4em] uppercase text-muted-foreground">
          Content calendar
        </h2>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowOnlyApproved((v) => !v)}
            className={`text-[10px] tracking-[0.2em] uppercase border px-2 py-1 transition-colors ${
              showOnlyApproved
                ? "border-emerald-500 text-emerald-500 bg-emerald-500/10"
                : "border-border text-muted-foreground hover:border-accent"
            }`}
            title="Toggle approved only"
          >
            {showOnlyApproved ? "✓ Approved" : "Approved"}
          </button>
          <button
            onClick={() => setShowOnlyWithComments((v) => !v)}
            className={`text-[10px] tracking-[0.2em] uppercase border px-2 py-1 transition-colors ${
              showOnlyWithComments
                ? "border-accent text-accent bg-accent/10"
                : "border-border text-muted-foreground hover:border-accent"
            }`}
            title="Toggle with comments only"
          >
            {showOnlyWithComments ? "💬 Comments" : "Comments"}
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={() =>
                setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))
              }
              className="text-xs tracking-[0.3em] uppercase border border-border px-3 py-1 hover:border-accent"
            >
              ←
            </button>
            <span className="text-xs tracking-[0.3em] uppercase text-accent min-w-[10rem] text-center">
              {monthLabel}
            </span>
            <button
              onClick={() =>
                setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))
              }
              className="text-xs tracking-[0.3em] uppercase border border-border px-3 py-1 hover:border-accent"
            >
              →
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-px bg-border/40 border border-border/40 text-xs">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
          <div
            key={d}
            className="bg-background px-2 py-1 text-[10px] tracking-[0.3em] uppercase text-muted-foreground"
          >
            {d}
          </div>
        ))}
        {grid.map(({ date, inMonth }, i) => {
          const key = fmtDate(date);
          const rawDay = byDay.get(key) ?? [];
          const day = rawDay.filter((e) => {
            if (showOnlyApproved && !e.approved) return false;
            if (showOnlyWithComments && !e.comments) return false;
            return true;
          });
          const isToday = key === fmtDate(new Date());
          return (
            <div
              key={i}
              onDragOver={(ev) => {
                if (!inMonth || !draggingId) return;
                ev.preventDefault();
                ev.dataTransfer.dropEffect = "move";
                if (dragOverDate !== key) setDragOverDate(key);
              }}
              onDragLeave={() => {
                if (dragOverDate === key) setDragOverDate(null);
              }}
              onDrop={(ev) => {
                if (!inMonth) return;
                ev.preventDefault();
                handleDrop(key);
              }}
              className={`bg-background min-h-[110px] p-1.5 flex flex-col transition-colors ${
                inMonth ? "" : "opacity-40"
              } ${dragOverDate === key && draggingId ? "ring-1 ring-accent ring-inset bg-accent/5" : ""}`}
            >
              <div className="flex items-center justify-between mb-1">
                <span
                  className={`text-[11px] ${isToday ? "text-accent font-semibold" : "text-muted-foreground"}`}
                >
                  {date.getDate()}
                </span>
                {inMonth && (
                  <button
                    onClick={() => setCreatingDate(key)}
                    className="text-[10px] text-muted-foreground hover:text-accent"
                    aria-label="Add entry"
                  >
                    +
                  </button>
                )}
              </div>
              <div className="space-y-1">
                {day.map((e) => (
                  <button
                    key={e.id}
                    onClick={() => setEditing(e)}
                    draggable
                    onDragStart={(ev) => {
                      setDraggingId(e.id);
                      ev.dataTransfer.effectAllowed = "move";
                      ev.dataTransfer.setData("text/plain", e.id);
                    }}
                    onDragEnd={() => {
                      setDraggingId(null);
                      setDragOverDate(null);
                    }}
                    className={`w-full text-left text-[11px] px-1.5 py-1 truncate border-l-2 ${statusBar(e.status)} bg-muted/30 hover:bg-muted/60 cursor-grab active:cursor-grabbing ${draggingId === e.id ? "opacity-50" : ""}`}
                    title={`${e.title} — drag to move`}
                  >
                    {e.platform && (
                      <span className="text-[9px] tracking-[0.2em] uppercase text-muted-foreground mr-1">
                        {e.platform}
                      </span>
                    )}
                    {e.attachment_path && (
                      <span className="text-accent mr-1" title="Has attachment">
                        ▶
                      </span>
                    )}
                    {e.approved && (
                      <span className="text-emerald-500 mr-1" title="Approved">
                        ✓
                      </span>
                    )}
                    {e.comments && (
                      <span className="text-muted-foreground mr-1" title="Has comments">
                        💬
                      </span>
                    )}
                    {e.title}
                  </button>
                ))}
              </div>
            </div>
          );
        })}

      </div>

      {isLoading && (
        <p className="text-xs text-muted-foreground mt-2">Loading…</p>
      )}

      {(creatingDate || editing) && (
        <EntryDialog
          projectId={projectId}
          initial={
            editing ?? {
              id: "",
              project_id: projectId,
              scheduled_date: creatingDate!,
              title: "",
              notes: "",
              platform: "",
              status: "idea",
              attachment_path: null,
              attachment_name: null,
              attachment_type: null,
              attachment_size: null,
              approved: false,
              comments: null,
            }
          }
          isNew={!editing}
          saving={createMut.isPending || updateMut.isPending}
          deleting={deleteMut.isPending}
          onClose={() => {
            setEditing(null);
            setCreatingDate(null);
          }}
          onSave={(v) => {
            if (editing) {
              updateMut.mutate({ id: editing.id, ...v });
            } else {
              createMut.mutate({
                scheduledDate: v.scheduled_date!,
                title: v.title!,
                notes: v.notes ?? undefined,
                platform: v.platform ?? undefined,
                status: v.status,
                attachmentPath: v.attachment_path ?? undefined,
                attachmentName: v.attachment_name ?? undefined,
                attachmentType: v.attachment_type ?? undefined,
                attachmentSize: v.attachment_size ?? undefined,
                approved: v.approved,
                comments: v.comments ?? undefined,
              });
            }
          }}
          onDelete={editing ? () => deleteMut.mutate(editing.id) : undefined}
        />
      )}

    </section>
  );
}

function statusBar(s: Entry["status"]) {
  switch (s) {
    case "scheduled":
      return "border-accent";
    case "published":
      return "border-emerald-500";
    default:
      return "border-muted-foreground/40";
  }
}

function EntryDialog({
  projectId,
  initial,
  isNew,
  saving,
  deleting,
  onClose,
  onSave,
  onDelete,
}: {
  projectId: string;
  initial: Entry;
  isNew: boolean;
  saving: boolean;
  deleting: boolean;
  onClose: () => void;
  onSave: (v: Partial<Entry>) => void;
  onDelete?: () => void;
}) {
  const [title, setTitle] = useState(initial.title);
  const [notes, setNotes] = useState(initial.notes ?? "");
  const [platform, setPlatform] = useState(initial.platform ?? "");
  const [status, setStatus] = useState<Entry["status"]>(initial.status);
  const [date, setDate] = useState(initial.scheduled_date);
  const [attachmentPath, setAttachmentPath] = useState<string | null>(initial.attachment_path);
  const [attachmentName, setAttachmentName] = useState<string | null>(initial.attachment_name);
  const [attachmentType, setAttachmentType] = useState<string | null>(initial.attachment_type);
  const [attachmentSize, setAttachmentSize] = useState<number | null>(initial.attachment_size);
  const [approved, setApproved] = useState<boolean>(initial.approved);
  const [comments, setComments] = useState<string>(initial.comments ?? "");
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const getUploadUrl = useServerFn(createSignedUploadUrl);
  const getDownloadUrl = useServerFn(getCalendarAttachmentUrl);

  async function handleFile(file: File) {
    if (!file) return;
    // 200 MB cap for video uploads
    const MAX = 200 * 1024 * 1024;
    if (file.size > MAX) {
      toast.error("File is too large (max 200 MB)");
      return;
    }
    setUploading(true);
    setProgress(0);
    try {
      const { path, token } = await getUploadUrl({
        data: { projectId, filename: file.name },
      });
      const { error } = await supabase.storage
        .from("client-files")
        .uploadToSignedUrl(path, token, file, {
          contentType: file.type || "application/octet-stream",
          upsert: false,
        });
      if (error) throw error;
      setAttachmentPath(path);
      setAttachmentName(file.name);
      setAttachmentType(file.type || null);
      setAttachmentSize(file.size);
      setProgress(100);
      toast.success("Attachment uploaded");
    } catch (e: any) {
      toast.error(e?.message ?? "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function openAttachment() {
    if (!initial.id || !attachmentPath) return;
    try {
      const { url } = await getDownloadUrl({ data: { entryId: initial.id } });
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (e: any) {
      toast.error(e?.message ?? "Could not open attachment");
    }
  }

  function removeAttachment() {
    setAttachmentPath(null);
    setAttachmentName(null);
    setAttachmentType(null);
    setAttachmentSize(null);
  }

  return (
    <div
      className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-background border border-border max-w-lg w-full p-6 space-y-4 my-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-xs tracking-[0.4em] uppercase text-accent">
            {isNew ? "New entry" : "Edit entry"}
          </h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-accent">
            ✕
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <label className="space-y-1">
            <span className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground">
              Date
            </span>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-transparent border border-border px-3 py-2 text-sm focus:outline-none focus:border-accent"
            />
          </label>
          <label className="space-y-1">
            <span className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground">
              Status
            </span>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as Entry["status"])}
              className="w-full bg-background border border-border px-3 py-2 text-sm focus:outline-none focus:border-accent"
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="block space-y-1">
          <span className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground">
            Title
          </span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Post title or topic"
            className="w-full bg-transparent border border-border px-3 py-2 text-sm focus:outline-none focus:border-accent"
          />
        </label>

        <label className="block space-y-1">
          <span className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground">
            Platform
          </span>
          <input
            value={platform}
            onChange={(e) => setPlatform(e.target.value)}
            placeholder="Instagram, LinkedIn, Blog…"
            className="w-full bg-transparent border border-border px-3 py-2 text-sm focus:outline-none focus:border-accent"
          />
        </label>

        <label className="block space-y-1">
          <span className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground">
            Notes
          </span>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            placeholder="Caption, hooks, references…"
            className="w-full bg-transparent border border-border px-3 py-2 text-sm focus:outline-none focus:border-accent resize-none"
          />
        </label>

        <div className="space-y-2">
          <span className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground">
            Attachment
          </span>
          {attachmentPath ? (
            <div className="flex items-center justify-between gap-3 border border-border px-3 py-2 text-sm">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-accent">▶</span>
                <button
                  type="button"
                  onClick={openAttachment}
                  disabled={!initial.id}
                  className="truncate text-left hover:underline disabled:no-underline disabled:opacity-70"
                  title={initial.id ? "Open attachment" : "Save entry to preview"}
                >
                  {attachmentName ?? "attachment"}
                </button>
                {attachmentSize != null && (
                  <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                    {formatBytes(attachmentSize)}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={removeAttachment}
                className="text-[10px] tracking-[0.3em] uppercase text-destructive hover:underline"
              >
                Remove
              </button>
            </div>
          ) : (
            <label className="block border border-dashed border-border px-3 py-4 text-center text-xs text-muted-foreground hover:border-accent cursor-pointer">
              <input
                type="file"
                accept="video/*,image/*,application/pdf"
                className="hidden"
                disabled={uploading}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFile(f);
                  e.target.value = "";
                }}
              />
              {uploading
                ? `Uploading… ${progress}%`
                : "Click to upload a video, image, or PDF (max 200 MB)"}
            </label>
          )}
        </div>

        <label className="flex items-center gap-2 cursor-pointer select-none pt-1">
          <input
            type="checkbox"
            checked={approved}
            onChange={(e) => setApproved(e.target.checked)}
            className="h-4 w-4 accent-emerald-500"
          />
          <span className="text-xs tracking-[0.3em] uppercase text-muted-foreground">
            Approved
          </span>
          {approved && <span className="text-emerald-500 text-xs">✓</span>}
        </label>

        <label className="block space-y-1">
          <span className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground">
            Comments
          </span>
          <textarea
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            rows={3}
            placeholder="Feedback, change requests, sign-off notes…"
            className="w-full bg-transparent border border-border px-3 py-2 text-sm focus:outline-none focus:border-accent resize-none"
          />
        </label>

        <div className="flex items-center justify-between pt-2">
          {onDelete ? (
            <button
              onClick={onDelete}
              disabled={deleting}
              className="text-xs tracking-[0.3em] uppercase text-destructive hover:underline disabled:opacity-50"
            >
              {deleting ? "Deleting…" : "Delete"}
            </button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="text-xs tracking-[0.3em] uppercase border border-border px-4 py-2 hover:border-accent"
            >
              Cancel
            </button>
            <button
              disabled={saving || uploading || !title.trim() || !date}
              onClick={() =>
                onSave({
                  title: title.trim(),
                  notes: notes.trim() || null,
                  platform: platform.trim() || null,
                  status,
                  scheduled_date: date,
                  attachment_path: attachmentPath,
                  attachment_name: attachmentName,
                  attachment_type: attachmentType,
                  attachment_size: attachmentSize,
                  approved,
                  comments: comments.trim() || null,
                })
              }
              className="bg-accent text-accent-foreground px-6 py-2 text-xs tracking-[0.3em] uppercase hover:bg-accent/90 disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function formatBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  return `${(n / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

