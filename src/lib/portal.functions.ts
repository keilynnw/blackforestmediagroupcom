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
    return { clients: profiles ?? [] };
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

export const createProject = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      title: z.string().trim().min(1).max(200),
      description: z.string().trim().max(2000).optional(),
      clientId: z.string().uuid(),
    }),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { data: row, error } = await supabaseAdmin
      .from("projects")
      .insert({
        title: data.title,
        description: data.description ?? null,
        client_id: data.clientId,
        created_by: context.userId,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return { project: row };
  });

export const updateProject = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      id: z.string().uuid(),
      title: z.string().trim().min(1).max(200).optional(),
      description: z.string().trim().max(2000).optional(),
      status: z.enum(["active", "paused", "completed"]).optional(),
    }),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { id, ...fields } = data;
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
      supabase
        .from("profiles")
        .select("id, display_name, company")
        .eq("id", (project as any).client_id)
        .maybeSingle(),
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
