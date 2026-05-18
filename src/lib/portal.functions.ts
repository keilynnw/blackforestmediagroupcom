import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { enqueueTemplateEmail } from "@/lib/email-notify.server";

async function notifyPortalActivity(opts: {
  kind: "message" | "upload";
  projectId: string;
  actorId: string;
  detail?: string;
}) {
  try {
    const [{ data: project }, { data: actor }, { data: actorRoles }] = await Promise.all([
      supabaseAdmin.from("projects").select("id, title").eq("id", opts.projectId).maybeSingle(),
      supabaseAdmin.from("profiles").select("display_name").eq("id", opts.actorId).maybeSingle(),
      supabaseAdmin.from("user_roles").select("role").eq("user_id", opts.actorId),
    ]);
    const isAdminActor = (actorRoles ?? []).some((r: any) => r.role === "admin");
    if (isAdminActor) return; // only notify when a client triggers activity
    await enqueueTemplateEmail("portal-activity", {
      kind: opts.kind,
      projectTitle: (project as any)?.title ?? "Untitled",
      actorName: (actor as any)?.display_name ?? "A client",
      detail: opts.detail ?? "",
      projectUrl: `https://blackforestmediagroup.com/admin/projects/${opts.projectId}`,
    });
  } catch (err) {
    console.error("notifyPortalActivity failed", err);
  }
}

// ===== Helpers =====
async function assertAdmin(supabase: any, userId: string) {
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (error || !data) throw new Error("Forbidden");
}

// ===== Role lookup =====
export const getMyRole = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);
    const roles = (data ?? []).map((r: any) => r.role as string);
    return { userId, roles, isAdmin: roles.includes("admin") };
  });

// ===== Invitations =====
export const createInvitation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      email: z.string().trim().email().max(255),
      role: z.enum(["client", "admin"]).default("client"),
    }),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const token = crypto.randomUUID() + crypto.randomUUID().replace(/-/g, "");
    const { data: row, error } = await supabaseAdmin
      .from("invitations")
      .insert({
        email: data.email.toLowerCase(),
        role: data.role,
        token,
        invited_by: context.userId,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return { invitation: row };
  });

export const listInvitations = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { data, error } = await supabaseAdmin
      .from("invitations")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw new Error(error.message);
    return { invitations: data ?? [] };
  });

export const acceptInvitation = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      token: z.string().min(10).max(200),
      password: z.string().min(8).max(200),
      displayName: z.string().trim().min(1).max(100),
    }),
  )
  .handler(async ({ data }) => {
    const { data: invite, error: inviteErr } = await supabaseAdmin
      .from("invitations")
      .select("*")
      .eq("token", data.token)
      .maybeSingle();
    if (inviteErr) throw new Error(inviteErr.message);
    if (!invite) throw new Error("Invalid invitation");
    if (invite.used_at) throw new Error("Invitation already used");
    if (new Date(invite.expires_at) < new Date()) throw new Error("Invitation expired");

    // Create user (auto-confirmed)
    const { data: created, error: userErr } = await supabaseAdmin.auth.admin.createUser({
      email: invite.email,
      password: data.password,
      email_confirm: true,
      user_metadata: { display_name: data.displayName },
    });
    if (userErr || !created.user) throw new Error(userErr?.message ?? "Could not create account");

    // Update profile + role
    await supabaseAdmin
      .from("profiles")
      .upsert({ id: created.user.id, display_name: data.displayName });
    await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: created.user.id, role: invite.role });
    await supabaseAdmin
      .from("invitations")
      .update({ used_at: new Date().toISOString() })
      .eq("id", invite.id);

    return { ok: true, email: invite.email };
  });

// ===== Clients =====
export const createClient = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      displayName: z.string().trim().min(1).max(100),
      company: z.string().trim().max(150).optional().nullable(),
      email: z.string().trim().email().max(255).optional().nullable(),
      password: z.string().min(8).max(200).optional().nullable(),
    }),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);

    const email =
      data.email?.toLowerCase().trim() ||
      `client+${crypto.randomUUID().slice(0, 8)}@placeholder.blackforestmediagroup.com`;

    // Create auth user. If a password is provided, the client can log in immediately.
    const { data: created, error: userErr } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password: data.password || undefined,
        email_confirm: true,
        user_metadata: { display_name: data.displayName },
      });
    if (userErr || !created.user) {
      throw new Error(userErr?.message ?? "Could not create client");
    }

    const userId = created.user.id;

    const { error: profileErr } = await supabaseAdmin
      .from("profiles")
      .upsert({
        id: userId,
        display_name: data.displayName,
        company: data.company?.trim() || null,
      });
    if (profileErr) throw new Error(profileErr.message);

    const { error: roleErr } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: userId, role: "client" });
    if (roleErr) throw new Error(roleErr.message);

    return {
      client: {
        id: userId,
        display_name: data.displayName,
        company: data.company?.trim() || null,
        email,
        created_at: new Date().toISOString(),
      },
    };
  });

export const listClients = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { data: roles } = await supabaseAdmin
      .from("user_roles")
      .select("user_id, role");
    const clientIds = (roles ?? [])
      .filter((r: any) => r.role === "client")
      .map((r: any) => r.user_id);
    if (clientIds.length === 0) return { clients: [] };
    const { data: profiles } = await supabaseAdmin
      .from("profiles")
      .select("id, display_name, company, created_at")
      .in("id", clientIds);

    // Fetch emails from auth.users (paginated)
    const emailMap = new Map<string, string>();
    let page = 1;
    while (page < 20) {
      const { data: usersPage, error: uErr } =
        await supabaseAdmin.auth.admin.listUsers({ page, perPage: 200 });
      if (uErr) break;
      for (const u of usersPage.users) {
        if (u.email) emailMap.set(u.id, u.email);
      }
      if (usersPage.users.length < 200) break;
      page++;
    }

    return {
      clients: (profiles ?? []).map((p: any) => ({
        ...p,
        email: emailMap.get(p.id) ?? null,
      })),
    };
  });

export const updateClientCredentials = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      userId: z.string().uuid(),
      email: z.string().trim().email().max(255).optional(),
      password: z.string().min(8).max(200).optional(),
    }).refine((v) => v.email || v.password, {
      message: "Provide an email or password to update",
    }),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const updates: { email?: string; password?: string; email_confirm?: boolean } = {};
    if (data.email) {
      updates.email = data.email.toLowerCase();
      updates.email_confirm = true;
    }
    if (data.password) updates.password = data.password;
    const { error } = await supabaseAdmin.auth.admin.updateUserById(
      data.userId,
      updates,
    );
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ===== Projects =====
export const listProjects = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    const { data, error } = await supabase
      .from("projects")
      .select("id, title, description, status, client_id, created_at, updated_at")
      .order("updated_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { projects: data ?? [] };
  });

export const listProjectsAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { data: projects } = await supabaseAdmin
      .from("projects")
      .select("*")
      .order("updated_at", { ascending: false });
    const clientIds = Array.from(new Set((projects ?? []).map((p: any) => p.client_id)));
    const { data: profiles } = clientIds.length
      ? await supabaseAdmin.from("profiles").select("id, display_name, company").in("id", clientIds)
      : { data: [] as any[] };
    const map = new Map((profiles ?? []).map((p: any) => [p.id, p]));
    return {
      projects: (projects ?? []).map((p: any) => ({
        ...p,
        client: map.get(p.client_id) ?? null,
      })),
    };
  });

// Exported for unit/integration tests. Performs the insert + verify flow
// with whichever admin client is passed in (real one in production, mock in tests).
export async function createProjectImpl(
  admin: any,
  input: { title: string; description?: string | null; clientId?: string | null; userId: string },
) {
  const payload = {
    title: input.title,
    description: input.description?.trim() ? input.description.trim() : null,
    client_id: input.clientId ?? null,
    created_by: input.userId,
  };

  const { data: row, error } = await admin
    .from("projects")
    .insert(payload)
    .select()
    .single();

  if (error) {
    console.error("[createProject] insert error", error);
    throw new Error(error.message);
  }

  if (!row?.id) {
    console.error("[createProject] insert returned no project", row);
    throw new Error("Project could not be created. Please try again.");
  }

  const { data: verified, error: verifyError } = await admin
    .from("projects")
    .select("*")
    .eq("id", row.id)
    .maybeSingle();

  if (verifyError || !verified) {
    console.error("[createProject] verification failed", verifyError ?? { id: row.id });
    throw new Error(verifyError?.message ?? "Project was not saved. Please try again.");
  }

  return { project: verified };
}

export const createProject = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      title: z.string().trim().min(1).max(200),
      description: z.string().trim().max(2000).optional(),
      clientId: z.string().uuid().optional().nullable(),
    }),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    return createProjectImpl(supabaseAdmin, {
      title: data.title,
      description: data.description,
      clientId: data.clientId,
      userId: context.userId,
    });
  });

export const updateProject = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      id: z.string().uuid(),
      title: z.string().trim().min(1).max(200).optional(),
      description: z.string().trim().max(2000).optional(),
      status: z.enum(["active", "paused", "completed"]).optional(),
      clientId: z.string().uuid().nullable().optional(),
      strategy: z.string().max(50000).nullable().optional(),
    }),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { id, clientId, ...rest } = data;
    const fields: any = { ...rest };
    if (clientId !== undefined) fields.client_id = clientId;
    const { error } = await supabaseAdmin.from("projects").update(fields).eq("id", id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getProjectDetail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ id: z.string().uuid() }))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: project, error } = await supabase
      .from("projects")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!project) throw new Error("Project not found");

    const clientId = (project as any).client_id as string | null;
    const [assetsRes, messagesRes, clientRes] = await Promise.all([
      supabase
        .from("project_assets")
        .select("*")
        .eq("project_id", data.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("messages")
        .select("*")
        .eq("project_id", data.id)
        .order("created_at", { ascending: true }),
      clientId
        ? supabase
            .from("profiles")
            .select("id, display_name, company")
            .eq("id", clientId)
            .maybeSingle()
        : Promise.resolve({ data: null } as any),
    ]);

    // sender display names
    const senderIds = Array.from(
      new Set((messagesRes.data ?? []).map((m: any) => m.sender_id)),
    );
    const { data: senders } = senderIds.length
      ? await supabase.from("profiles").select("id, display_name").in("id", senderIds)
      : { data: [] as any[] };
    const senderMap = new Map((senders ?? []).map((s: any) => [s.id, s.display_name]));

    return {
      project,
      client: clientRes.data,
      assets: assetsRes.data ?? [],
      messages: (messagesRes.data ?? []).map((m: any) => ({
        ...m,
        sender_name: senderMap.get(m.sender_id) ?? "Unknown",
      })),
    };
  });

// ===== Messages =====
export const sendMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      projectId: z.string().uuid(),
      body: z.string().trim().min(1).max(5000),
    }),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("messages").insert({
      project_id: data.projectId,
      sender_id: context.userId,
      body: data.body,
    });
    if (error) throw new Error(error.message);
    await notifyPortalActivity({
      kind: "message",
      projectId: data.projectId,
      actorId: context.userId,
      detail: data.body.slice(0, 500),
    });
    return { ok: true };
  });

// ===== Files =====
export const createSignedUploadUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      projectId: z.string().uuid(),
      filename: z.string().min(1).max(255),
    }),
  )
  .handler(async ({ data, context }) => {
    // Verify access (admin OR project client) by trying to read the project via RLS
    const { data: proj } = await context.supabase
      .from("projects")
      .select("id")
      .eq("id", data.projectId)
      .maybeSingle();
    if (!proj) throw new Error("Forbidden");

    const safeName = data.filename.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `${data.projectId}/${Date.now()}_${safeName}`;
    const { data: signed, error } = await supabaseAdmin.storage
      .from("client-files")
      .createSignedUploadUrl(path);
    if (error) throw new Error(error.message);
    return { path, token: signed.token, signedUrl: signed.signedUrl };
  });

export const registerAsset = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      projectId: z.string().uuid(),
      storagePath: z.string().min(1).max(500),
      label: z.string().trim().max(200).optional(),
      fileType: z.string().max(100).optional(),
      fileSize: z.number().int().nonnegative().optional(),
    }),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("project_assets").insert({
      project_id: data.projectId,
      uploaded_by: context.userId,
      storage_path: data.storagePath,
      label: data.label ?? null,
      file_type: data.fileType ?? null,
      file_size: data.fileSize ?? null,
    });
    if (error) throw new Error(error.message);
    await notifyPortalActivity({
      kind: "upload",
      projectId: data.projectId,
      actorId: context.userId,
      detail: data.label || data.storagePath.split("/").pop() || "(file)",
    });
    return { ok: true };
  });

export const getAssetDownloadUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ assetId: z.string().uuid() }))
  .handler(async ({ data, context }) => {
    const { data: asset, error } = await context.supabase
      .from("project_assets")
      .select("storage_path")
      .eq("id", data.assetId)
      .maybeSingle();
    if (error || !asset) throw new Error("Not found");
    const { data: signed, error: sErr } = await supabaseAdmin.storage
      .from("client-files")
      .createSignedUrl((asset as any).storage_path, 60 * 10);
    if (sErr) throw new Error(sErr.message);
    return { url: signed.signedUrl };
  });

// ===== Content Calendar =====
const CalendarStatus = z.enum(["idea", "scheduled", "published"]);

export const listCalendarEntries = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      projectId: z.string().uuid(),
      monthStart: z.string(), // YYYY-MM-DD
      monthEnd: z.string(),   // YYYY-MM-DD
    }),
  )
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("content_calendar_entries")
      .select("*")
      .eq("project_id", data.projectId)
      .gte("scheduled_date", data.monthStart)
      .lte("scheduled_date", data.monthEnd)
      .order("scheduled_date", { ascending: true });
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const createCalendarEntry = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      projectId: z.string().uuid(),
      scheduledDate: z.string(),
      title: z.string().min(1).max(200),
      notes: z.string().max(4000).optional().nullable(),
      platform: z.string().max(80).optional().nullable(),
      status: CalendarStatus.optional(),
      attachmentPath: z.string().max(500).optional().nullable(),
      attachmentName: z.string().max(255).optional().nullable(),
      attachmentType: z.string().max(100).optional().nullable(),
      attachmentSize: z.number().int().nonnegative().optional().nullable(),
      approved: z.boolean().optional(),
      comments: z.string().max(4000).optional().nullable(),
    }),
  )
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const { data: row, error } = await context.supabase
      .from("content_calendar_entries")
      .insert({
        project_id: data.projectId,
        scheduled_date: data.scheduledDate,
        title: data.title,
        notes: data.notes ?? null,
        platform: data.platform ?? null,
        status: data.status ?? "idea",
        created_by: userId,
        attachment_path: data.attachmentPath ?? null,
        attachment_name: data.attachmentName ?? null,
        attachment_type: data.attachmentType ?? null,
        attachment_size: data.attachmentSize ?? null,
        approved: data.approved ?? false,
        comments: data.comments ?? null,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const updateCalendarEntry = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      id: z.string().uuid(),
      scheduledDate: z.string().optional(),
      title: z.string().min(1).max(200).optional(),
      notes: z.string().max(4000).optional().nullable(),
      platform: z.string().max(80).optional().nullable(),
      status: CalendarStatus.optional(),
      attachmentPath: z.string().max(500).optional().nullable(),
      attachmentName: z.string().max(255).optional().nullable(),
      attachmentType: z.string().max(100).optional().nullable(),
      attachmentSize: z.number().int().nonnegative().optional().nullable(),
      approved: z.boolean().optional(),
      comments: z.string().max(4000).optional().nullable(),
    }),
  )
  .handler(async ({ data, context }) => {
    const patch: any = {};
    if (data.scheduledDate !== undefined) patch.scheduled_date = data.scheduledDate;
    if (data.title !== undefined) patch.title = data.title;
    if (data.notes !== undefined) patch.notes = data.notes;
    if (data.platform !== undefined) patch.platform = data.platform;
    if (data.status !== undefined) patch.status = data.status;
    if (data.attachmentPath !== undefined) patch.attachment_path = data.attachmentPath;
    if (data.attachmentName !== undefined) patch.attachment_name = data.attachmentName;
    if (data.attachmentType !== undefined) patch.attachment_type = data.attachmentType;
    if (data.attachmentSize !== undefined) patch.attachment_size = data.attachmentSize;
    if (data.approved !== undefined) patch.approved = data.approved;
    if (data.comments !== undefined) patch.comments = data.comments;
    const { data: row, error } = await context.supabase
      .from("content_calendar_entries")
      .update(patch)
      .eq("id", data.id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const deleteCalendarEntry = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ id: z.string().uuid() }))
  .handler(async ({ data, context }) => {
    // Best-effort cleanup of attachment in storage
    const { data: existing } = await context.supabase
      .from("content_calendar_entries")
      .select("attachment_path")
      .eq("id", data.id)
      .maybeSingle();
    const path = (existing as any)?.attachment_path as string | null | undefined;
    const { error } = await context.supabase
      .from("content_calendar_entries")
      .delete()
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    if (path) {
      await supabaseAdmin.storage.from("client-files").remove([path]).catch(() => {});
    }
    return { ok: true };
  });

export const getCalendarAttachmentUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ entryId: z.string().uuid() }))
  .handler(async ({ data, context }) => {
    const { data: entry, error } = await context.supabase
      .from("content_calendar_entries")
      .select("attachment_path")
      .eq("id", data.entryId)
      .maybeSingle();
    if (error || !entry || !(entry as any).attachment_path) {
      throw new Error("Not found");
    }
    const { data: signed, error: sErr } = await supabaseAdmin.storage
      .from("client-files")
      .createSignedUrl((entry as any).attachment_path, 60 * 10);
    if (sErr) throw new Error(sErr.message);
    return { url: signed.signedUrl };
  });

