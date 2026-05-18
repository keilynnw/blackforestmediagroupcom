import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

function escapeIcs(s: string) {
  return (s ?? "")
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

function foldLine(line: string) {
  if (line.length <= 75) return line;
  const out: string[] = [];
  let i = 0;
  while (i < line.length) {
    out.push((i === 0 ? "" : " ") + line.slice(i, i + 73));
    i += 73;
  }
  return out.join("\r\n");
}

function toIcsDate(d: string) {
  return d.replace(/-/g, "");
}

function addOneDay(d: string) {
  const dt = new Date(d + "T00:00:00Z");
  dt.setUTCDate(dt.getUTCDate() + 1);
  return dt.toISOString().slice(0, 10).replace(/-/g, "");
}

export const Route = createFileRoute("/api/public/calendar/$token")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        // Accept trailing .ics for nicer URLs (e.g. /api/public/calendar/abc123.ics)
        const raw = params.token ?? "";
        const token = raw.endsWith(".ics") ? raw.slice(0, -4) : raw;
        if (!token || token.length < 16) {
          return new Response("Not found", { status: 404 });
        }

        const { data: project, error: pErr } = await supabaseAdmin
          .from("projects")
          .select("id, title")
          .eq("calendar_token", token)
          .maybeSingle();

        if (pErr || !project) {
          return new Response("Not found", { status: 404 });
        }

        const { data: entries } = await supabaseAdmin
          .from("content_calendar_entries")
          .select(
            "id, scheduled_date, title, notes, platform, status, approved, comments, updated_at",
          )
          .eq("project_id", project.id)
          .order("scheduled_date", { ascending: true });

        const now = new Date()
          .toISOString()
          .replace(/[-:]/g, "")
          .replace(/\.\d{3}/, "");

        const lines: string[] = [
          "BEGIN:VCALENDAR",
          "VERSION:2.0",
          "PRODID:-//Black Forest Media//Content Calendar//EN",
          "CALSCALE:GREGORIAN",
          "METHOD:PUBLISH",
          foldLine(`X-WR-CALNAME:${escapeIcs(project.title)} — Content`),
          foldLine(`NAME:${escapeIcs(project.title)} — Content`),
          "X-PUBLISHED-TTL:PT1H",
          "REFRESH-INTERVAL;VALUE=DURATION:PT1H",
        ];

        for (const e of entries ?? []) {
          const stamp = new Date(e.updated_at)
            .toISOString()
            .replace(/[-:]/g, "")
            .replace(/\.\d{3}/, "");
          const summary = `${e.approved ? "✓ " : ""}${e.title}${e.platform ? ` (${e.platform})` : ""}`;
          const descParts: string[] = [];
          if (e.status) descParts.push(`Status: ${e.status}`);
          if (e.platform) descParts.push(`Platform: ${e.platform}`);
          descParts.push(`Approved: ${e.approved ? "yes" : "no"}`);
          if (e.notes) descParts.push(`\nNotes:\n${e.notes}`);
          if (e.comments) descParts.push(`\nComments:\n${e.comments}`);

          lines.push(
            "BEGIN:VEVENT",
            `UID:${e.id}@blackforestmediagroup.com`,
            `DTSTAMP:${now}`,
            `LAST-MODIFIED:${stamp}`,
            `DTSTART;VALUE=DATE:${toIcsDate(e.scheduled_date)}`,
            `DTEND;VALUE=DATE:${addOneDay(e.scheduled_date)}`,
            foldLine(`SUMMARY:${escapeIcs(summary)}`),
            foldLine(`DESCRIPTION:${escapeIcs(descParts.join("\n"))}`),
            `STATUS:${e.status === "published" ? "CONFIRMED" : "TENTATIVE"}`,
            "END:VEVENT",
          );
        }

        lines.push("END:VCALENDAR");

        return new Response(lines.join("\r\n"), {
          status: 200,
          headers: {
            "Content-Type": "text/calendar; charset=utf-8",
            "Content-Disposition": `inline; filename="calendar-${token.slice(0, 8)}.ics"`,
            "Cache-Control": "public, max-age=300",
          },
        });
      },
    },
  },
});
