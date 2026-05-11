/* @vitest-environment jsdom */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

// ---- Mocks (must be set up before importing the route) ----

const navigateMock = vi.fn();
const createMock = vi.fn();
const listMock = vi.fn(async () => ({ projects: [] }));

vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (cfg: any) => cfg,
  Link: ({ children, ...props }: any) =>
    React.createElement("a", props, children),
  useNavigate: () => navigateMock,
}));

vi.mock("@tanstack/react-start", () => ({
  useServerFn: (fn: any) => fn,
}));

vi.mock("@/lib/portal.functions", () => ({
  listProjectsAdmin: (...args: any[]) => listMock(...args),
  createProject: (...args: any[]) => createMock(...args),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

// Now import the component
import { Route as AdminProjectsRoute } from "@/routes/_authenticated.admin.projects.index";

const AdminProjects = (AdminProjectsRoute as any).component as React.ComponentType;

function renderWithQuery() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    React.createElement(QueryClientProvider, { client: qc }, React.createElement(AdminProjects)),
  );
}

describe("AdminProjects create flow", () => {
  beforeEach(() => {
    navigateMock.mockReset();
    createMock.mockReset();
    listMock.mockClear();
  });

  it("navigates to the new project page after a successful create", async () => {
    const newProject = {
      id: "abc-123-id",
      title: "Test Project",
      description: null,
      status: "active",
      client_id: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    createMock.mockResolvedValueOnce({ project: newProject });

    renderWithQuery();

    await userEvent.type(screen.getByPlaceholderText(/project title/i), "Test Project");
    await userEvent.click(screen.getByRole("button", { name: /create project/i }));

    await waitFor(() => {
      expect(createMock).toHaveBeenCalledWith({
        data: { title: "Test Project", description: undefined },
      });
    });

    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith({
        to: "/admin/projects/$id",
        params: { id: "abc-123-id" },
      });
    });
  });

  it("does NOT navigate when the server returns no project id", async () => {
    createMock.mockResolvedValueOnce({ project: null });

    renderWithQuery();

    await userEvent.type(screen.getByPlaceholderText(/project title/i), "Broken");
    await userEvent.click(screen.getByRole("button", { name: /create project/i }));

    await waitFor(() => expect(createMock).toHaveBeenCalled());
    // Give the mutation a tick to settle
    await new Promise((r) => setTimeout(r, 10));
    expect(navigateMock).not.toHaveBeenCalled();
  });
});
