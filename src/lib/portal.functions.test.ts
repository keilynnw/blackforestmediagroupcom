import { describe, it, expect, vi } from "vitest";
import { createProjectImpl } from "./portal.functions";

type Row = { id: string; title: string; description: string | null; client_id: string | null; created_by: string };

function makeAdmin(initial: Row[] = []) {
  const rows: Row[] = [...initial];

  const admin = {
    from(_table: string) {
      return {
        // INSERT chain: .insert(payload).select().single()
        insert(payload: any) {
          const newRow: Row = {
            id: "11111111-1111-1111-1111-111111111111",
            title: payload.title,
            description: payload.description,
            client_id: payload.client_id,
            created_by: payload.created_by,
          };
          rows.push(newRow);
          return {
            select() {
              return {
                async single() {
                  return { data: newRow, error: null };
                },
              };
            },
          };
        },
        // VERIFY chain: .select("*").eq("id", id).maybeSingle()
        select(_cols: string) {
          return {
            eq(col: string, val: string) {
              return {
                async maybeSingle() {
                  const found = rows.find((r) => (r as any)[col] === val) ?? null;
                  return { data: found, error: null };
                },
              };
            },
          };
        },
      };
    },
    _rows: rows,
  };
  return admin;
}

describe("createProjectImpl (integration)", () => {
  it("inserts a row and returns the verified project with an id", async () => {
    const admin = makeAdmin();
    const insertSpy = vi.spyOn(admin, "from");

    const result = await createProjectImpl(admin, {
      title: "  Launch Campaign  ",
      description: "  Q3 social push  ",
      clientId: null,
      userId: "user-abc",
    });

    expect(result.project).toBeDefined();
    expect(result.project.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(admin._rows).toHaveLength(1);
    expect(admin._rows[0]).toMatchObject({
      title: "  Launch Campaign  ",
      description: "Q3 social push",
      client_id: null,
      created_by: "user-abc",
    });
    expect(insertSpy).toHaveBeenCalledWith("projects");
  });

  it("throws when the insert returns no row", async () => {
    const admin = {
      from: () => ({
        insert: () => ({
          select: () => ({
            async single() {
              return { data: null, error: null };
            },
          }),
        }),
      }),
    };
    await expect(
      createProjectImpl(admin, { title: "X", userId: "u" }),
    ).rejects.toThrow(/could not be created/i);
  });

  it("propagates the insert error message", async () => {
    const admin = {
      from: () => ({
        insert: () => ({
          select: () => ({
            async single() {
              return { data: null, error: { message: "permission denied" } };
            },
          }),
        }),
      }),
    };
    await expect(
      createProjectImpl(admin, { title: "X", userId: "u" }),
    ).rejects.toThrow("permission denied");
  });
});
