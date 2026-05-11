## Client Portal — Build Plan

A private, invite-only portal where your clients can log in to see their projects, exchange files, and message you. Includes an admin dashboard for you to manage everything.

---

### 1. Authentication (invite-only)

- Email + password login at `/portal/login`
- **No public signup.** Clients can only register via an invite link you send (token-based, single-use, expires in 7 days)
- Password reset flow at `/portal/reset-password`
- First admin (you) is seeded manually via SQL

### 2. Database schema

- `profiles` — display name, company, avatar (1:1 with auth user)
- `user_roles` — separate table with `app_role` enum (`admin`, `client`) and `has_role()` security-definer function (prevents privilege escalation)
- `invitations` — email, token, role, expires_at, used_at, invited_by
- `projects` — title, description, status (`active`/`paused`/`completed`), client_id, created_by
- `project_assets` — file path in storage, project_id, uploaded_by, label, type
- `messages` — project_id, sender_id, body, read_at
- File storage bucket `client-files` (private, RLS scoped per project)

All tables get RLS: clients see only their own projects/files/messages; admins see everything via `has_role(auth.uid(), 'admin')`.

### 3. Client side (`/portal/*`)

- `/portal` — list of their projects with status badges
- `/portal/projects/$id` — single project: overview, file list (download + upload), message thread

### 4. Admin side (`/admin/*`)

- `/admin` — overview: clients, projects, recent activity
- `/admin/clients` — list clients, send invitations
- `/admin/projects` — create/edit projects, assign to clients, change status
- `/admin/projects/$id` — same view as client + ability to upload files and reply to messages

### 5. Navigation

Add a small "Client Login" link to the site header that routes to `/portal/login`. Marketing pages stay untouched.

---

### Tech notes

- TanStack Start file-based routes under `_authenticated/` layout for gating
- Server functions (`createServerFn`) for all mutations; `requireSupabaseAuth` middleware
- `lovable.auth` is **not** used — Google OAuth was not requested; email/password only. (Easy to add later.)
- File uploads via Supabase Storage with signed URLs; max 50 MB per file
- Realtime not included in v1 (messages refresh on send / page focus). Can add later.

### What I'll need from you after build

- Your email address to seed as the first admin account (you'll set the password on first login via the reset flow, or I can set a temporary one)

---

### Out of scope for v1 (call out if you want any)

- Google sign-in
- Real-time message updates
- In-portal payments / invoices
- Email notifications when a new file/message is posted (your existing notify@ infra can be wired up later)