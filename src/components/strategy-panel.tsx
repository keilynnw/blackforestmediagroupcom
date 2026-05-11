import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { updateProject } from "@/lib/portal.functions";
import { toast } from "sonner";

export function StrategyPanel({
  projectId,
  strategy,
  canEdit,
}: {
  projectId: string;
  strategy: string | null;
  canEdit: boolean;
}) {
  const qc = useQueryClient();
  const update = useServerFn(updateProject);
  const [draft, setDraft] = useState(strategy ?? "");
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    setDraft(strategy ?? "");
  }, [strategy]);

  const saveMut = useMutation({
    mutationFn: () =>
      update({ data: { id: projectId, strategy: draft } }),
    onSuccess: () => {
      toast.success("Strategy saved");
      setEditing(false);
      qc.invalidateQueries({ queryKey: ["project", projectId] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Could not save"),
  });

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xs tracking-[0.4em] uppercase text-muted-foreground">
          Strategy
        </h2>
        {canEdit && !editing && (
          <button
            onClick={() => setEditing(true)}
            className="text-xs tracking-[0.3em] uppercase border border-accent/40 px-4 py-2 hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            {strategy ? "Edit" : "+ Add strategy"}
          </button>
        )}
      </div>

      {editing && canEdit ? (
        <div className="space-y-3">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={14}
            placeholder="Outline pillars, voice, posting cadence, target audience, KPIs…"
            className="w-full bg-transparent border border-border px-4 py-3 text-sm focus:outline-none focus:border-accent resize-y"
          />
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => {
                setDraft(strategy ?? "");
                setEditing(false);
              }}
              className="text-xs tracking-[0.3em] uppercase border border-border px-4 py-2 hover:border-accent"
            >
              Cancel
            </button>
            <button
              onClick={() => saveMut.mutate()}
              disabled={saveMut.isPending}
              className="bg-accent text-accent-foreground px-6 py-2 text-xs tracking-[0.3em] uppercase hover:bg-accent/90 disabled:opacity-60"
            >
              {saveMut.isPending ? "Saving…" : "Save strategy"}
            </button>
          </div>
        </div>
      ) : strategy ? (
        <div className="border border-border/40 p-6 whitespace-pre-wrap text-sm text-foreground/90 leading-relaxed">
          {strategy}
        </div>
      ) : (
        <p className="border border-border/40 p-6 text-sm text-muted-foreground">
          No strategy has been published yet.
        </p>
      )}
    </section>
  );
}
