import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import {
  listClients,
  listInvitations,
  createInvitation,
  createClient,
  updateClientCredentials,
} from "@/lib/portal.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/clients")({
  component: AdminClients,
});

function ClientCredentialsEditor({
  client,
  onSaved,
}: {
  client: { id: string; display_name: string | null; email: string | null };
  onSaved: () => void;
}) {
  const update = useServerFn(updateClientCredentials);
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState(client.email ?? "");
  const [password, setPassword] = useState("");

  const mut = useMutation({
    mutationFn: () => {
      const payload: any = { userId: client.id };
      if (email && email !== client.email) payload.email = email.trim();
      if (password) payload.password = password;
      if (!payload.email && !payload.password) {
        throw new Error("Change the email or set a new password");
      }
      return update({ data: payload });
    },
    onSuccess: () => {
      toast.success("Credentials updated");
      setPassword("");
      setOpen(false);
      onSaved();
    },
    onError: (e: any) => toast.error(e?.message ?? "Could not update"),
  });

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-xs tracking-[0.3em] uppercase text-accent hover:underline shrink-0"
      >
        Edit login
      </button>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        mut.mutate();
      }}
      className="mt-3 space-y-2 border-t border-border/40 pt-3"
    >
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full bg-transparent border border-border px-3 py-2 text-sm focus:outline-none focus:border-accent"
      />
      <input
        type="text"
        placeholder="New password (leave blank to keep current)"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        autoComplete="new-password"
        className="w-full bg-transparent border border-border px-3 py-2 text-sm focus:outline-none focus:border-accent"
      />
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={mut.isPending}
          className="bg-accent text-accent-foreground px-4 py-2 text-xs tracking-[0.3em] uppercase hover:bg-accent/90 disabled:opacity-60"
        >
          {mut.isPending ? "…" : "Save"}
        </button>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setPassword("");
            setEmail(client.email ?? "");
          }}
          className="px-4 py-2 text-xs tracking-[0.3em] uppercase border border-border hover:bg-muted/40"
        >
          Cancel
        </button>
      </div>
      <p className="text-[10px] text-muted-foreground">
        Password must be at least 8 characters. Share it with the client securely.
      </p>
    </form>
  );
}

function AdminClients() {
  const qc = useQueryClient();
  const fetchClients = useServerFn(listClients);
  const fetchInvites = useServerFn(listInvitations);
  const invite = useServerFn(createInvitation);
  const create = useServerFn(createClient);

  const clients = useQuery({ queryKey: ["admin-clients"], queryFn: () => fetchClients() });
  const invites = useQuery({ queryKey: ["admin-invites"], queryFn: () => fetchInvites() });

  const [email, setEmail] = useState("");
  const [newName, setNewName] = useState("");
  const [newCompany, setNewCompany] = useState("");
  const [newEmail, setNewEmail] = useState("");

  const createMut = useMutation({
    mutationFn: () =>
      create({
        data: {
          displayName: newName.trim(),
          company: newCompany.trim() || undefined,
          email: newEmail.trim() || undefined,
        },
      }),
    onSuccess: () => {
      toast.success("Client created — you can now attach them to a project");
      setNewName("");
      setNewCompany("");
      setNewEmail("");
      qc.invalidateQueries({ queryKey: ["admin-clients"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed to create client"),
  });

  const inviteMut = useMutation({
    mutationFn: () => invite({ data: { email, role: "client" } }),
    onSuccess: ({ invitation }: any) => {
      const url = `${window.location.origin}/portal/accept-invite?token=${invitation.token}`;
      navigator.clipboard?.writeText(url).catch(() => {});
      toast.success("Invitation created — link copied to clipboard");
      setEmail("");
      qc.invalidateQueries({ queryKey: ["admin-invites"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed"),
  });

  return (
    <div className="space-y-10">
      <div>
        <h1 className="font-display text-4xl text-accent">Clients</h1>
      </div>

      <section className="border border-border/40 p-6">
        <h2 className="text-xs tracking-[0.4em] uppercase text-muted-foreground mb-4">Add a client</h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (newName.trim()) createMut.mutate();
          }}
          className="space-y-3"
        >
          <input
            required
            placeholder="Client name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="w-full bg-transparent border border-border px-4 py-2 focus:outline-none focus:border-accent"
          />
          <input
            placeholder="Company (optional)"
            value={newCompany}
            onChange={(e) => setNewCompany(e.target.value)}
            className="w-full bg-transparent border border-border px-4 py-2 focus:outline-none focus:border-accent"
          />
          <input
            type="email"
            placeholder="Email (optional — for sending an invite later)"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            className="w-full bg-transparent border border-border px-4 py-2 focus:outline-none focus:border-accent"
          />
          <button
            type="submit"
            disabled={createMut.isPending || !newName.trim()}
            className="bg-accent text-accent-foreground px-6 py-2 text-xs tracking-[0.3em] uppercase hover:bg-accent/90 disabled:opacity-60"
          >
            {createMut.isPending ? "…" : "Create client"}
          </button>
          <p className="text-xs text-muted-foreground">
            Creates the client record so you can attach them to a project. Send a portal invite below when they're ready to log in.
          </p>
        </form>
      </section>

      <section className="border border-border/40 p-6">
        <h2 className="text-xs tracking-[0.4em] uppercase text-muted-foreground mb-4">Invite a client</h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (email.trim()) inviteMut.mutate();
          }}
          className="flex gap-2"
        >
          <input
            type="email"
            required
            placeholder="client@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="flex-1 bg-transparent border border-border px-4 py-2 focus:outline-none focus:border-accent"
          />
          <button
            type="submit"
            disabled={inviteMut.isPending}
            className="bg-accent text-accent-foreground px-6 text-xs tracking-[0.3em] uppercase hover:bg-accent/90"
          >
            {inviteMut.isPending ? "…" : "Send invite"}
          </button>
        </form>
        <p className="text-xs text-muted-foreground mt-2">
          The invite link is copied to your clipboard. Send it to the client.
        </p>
      </section>

      <section>
        <h2 className="text-xs tracking-[0.4em] uppercase text-muted-foreground mb-3">Active clients</h2>
        <div className="border border-border/40 divide-y divide-border/40">
          {(clients.data?.clients ?? []).map((c: any) => (
            <div key={c.id} className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-foreground">{c.display_name ?? "—"}</p>
                  <p className="text-xs text-muted-foreground">
                    {c.email ?? "no email"} · {c.company ?? "No company"} · joined{" "}
                    {new Date(c.created_at).toLocaleDateString()}
                  </p>
                </div>
                <ClientCredentialsEditor
                  client={{ id: c.id, display_name: c.display_name, email: c.email }}
                  onSaved={() => qc.invalidateQueries({ queryKey: ["admin-clients"] })}
                />
              </div>
            </div>
          ))}
          {(clients.data?.clients ?? []).length === 0 && (
            <p className="p-6 text-sm text-muted-foreground">No clients yet.</p>
          )}
        </div>
      </section>

      <section>
        <h2 className="text-xs tracking-[0.4em] uppercase text-muted-foreground mb-3">Pending invitations</h2>
        <div className="border border-border/40 divide-y divide-border/40">
          {(invites.data?.invitations ?? []).map((i: any) => {
            const url = `${typeof window !== "undefined" ? window.location.origin : ""}/portal/accept-invite?token=${i.token}`;
            const expired = new Date(i.expires_at) < new Date();
            return (
              <div key={i.id} className="p-4 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-foreground truncate">{i.email}</p>
                  <p className="text-xs text-muted-foreground">
                    {i.used_at
                      ? "Accepted"
                      : expired
                        ? "Expired"
                        : `Expires ${new Date(i.expires_at).toLocaleDateString()}`}
                  </p>
                </div>
                {!i.used_at && !expired && (
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(url);
                      toast.success("Link copied");
                    }}
                    className="text-xs tracking-[0.3em] uppercase text-accent hover:underline shrink-0"
                  >
                    Copy link
                  </button>
                )}
              </div>
            );
          })}
          {(invites.data?.invitations ?? []).length === 0 && (
            <p className="p-6 text-sm text-muted-foreground">No invitations yet.</p>
          )}
        </div>
      </section>
    </div>
  );
}
