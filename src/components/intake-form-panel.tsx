import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { markIntakeSubmitted } from "@/lib/portal.functions";
import { toast } from "sonner";

const FORM_URL =
  "https://docs.google.com/forms/d/e/1FAIpQLSeuT_4C3EAVUgI0ik2axeVDCJaU21rNFr0j-RlIUCKiyZ89kA/viewform";
const RESPONSES_URL =
  "https://docs.google.com/forms/d/e/1FAIpQLSeuT_4C3EAVUgI0ik2axeVDCJaU21rNFr0j-RlIUCKiyZ89kA/viewanalytics";

export function IntakeFormPanel({
  projectId,
  submittedAt,
  isAdmin,
}: {
  projectId: string;
  submittedAt: string | null;
  isAdmin: boolean;
}) {
  const qc = useQueryClient();
  const mark = useServerFn(markIntakeSubmitted);

  const markMut = useMutation({
    mutationFn: () => mark({ data: { projectId } }),
    onSuccess: () => {
      toast.success("Marked as submitted");
      qc.invalidateQueries({ queryKey: ["project", projectId] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Could not update"),
  });

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-xs tracking-[0.4em] uppercase text-muted-foreground">
          Intake Form
        </h2>
        <p className="text-xs text-muted-foreground/70 mt-1">
          {isAdmin
            ? "Submission status for this client's intake form."
            : "Tell us about your project so we can hit the ground running."}
        </p>
      </div>

      <div className="border border-border/60 p-6 space-y-4">
        {submittedAt ? (
          <div>
            <p className="text-sm text-accent">
              ✓ Submitted on {new Date(submittedAt).toLocaleString()}
            </p>
            {!isAdmin && (
              <p className="text-xs text-muted-foreground mt-2">
                Need to update something? Open the form again and let us know.
              </p>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            {isAdmin ? "Not yet submitted." : "Not submitted yet."}
          </p>
        )}

        <div className="flex flex-wrap gap-3 pt-2">
          <a
            href={FORM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] tracking-[0.3em] uppercase border border-accent bg-accent text-accent-foreground px-4 py-3 hover:bg-accent/90"
          >
            {submittedAt ? "Open form again" : "Complete intake form"}
          </a>

          {!isAdmin && !submittedAt && (
            <button
              onClick={() => markMut.mutate()}
              disabled={markMut.isPending}
              className="text-[10px] tracking-[0.3em] uppercase border border-accent/40 text-accent px-4 py-3 hover:bg-accent hover:text-accent-foreground disabled:opacity-50"
            >
              {markMut.isPending ? "Saving…" : "I've submitted it"}
            </button>
          )}

          {isAdmin && (
            <a
              href={RESPONSES_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] tracking-[0.3em] uppercase border border-accent/40 text-accent px-4 py-3 hover:bg-accent hover:text-accent-foreground"
            >
              View responses
            </a>
          )}
        </div>

        {!isAdmin && (
          <p className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground/60 pt-2">
            After submitting in Google Forms, click "I've submitted it" so we know it's ready.
          </p>
        )}
      </div>
    </section>
  );
}
