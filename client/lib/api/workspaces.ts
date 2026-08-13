import { api } from "@/lib/api/client";
import {
  createWorkspaceSchema,
  type CreateWorkspaceInput,
  type UpdateWorkspaceInput,
  type Workspace,
  updateWorkspaceSchema,
  workspaceSchema,
} from "@/lib/validators/workspace";
import { parseWithZod } from "@/lib/validators/parse";
import { z } from "zod";

export const workspaceKeys = {
  all: ["workspaces"] as const,
  lists: () => [...workspaceKeys.all, "list"] as const,
  detail: (id: string) => [...workspaceKeys.all, "detail", id] as const,
};

function parseWorkspace(data: unknown): Workspace {
  return parseWithZod(workspaceSchema, data, "Invalid workspace data");
}

function parseWorkspaceList(data: unknown): Workspace[] {
  return parseWithZod(z.array(workspaceSchema), data, "Invalid workspace list");
}

export async function listWorkspaces() {
  const data = await api<unknown>("/api/v1/workspace");
  return parseWorkspaceList(data);
}

export async function getWorkspace(workspaceId: string) {
  const data = await api<unknown>(`/api/v1/workspace/${workspaceId}`);
  return parseWorkspace(data);
}

export async function createWorkspace(input: CreateWorkspaceInput) {
  const body = parseWithZod(createWorkspaceSchema, input, "Create workspace");
  const data = await api<unknown>("/api/v1/workspace", {
    method: "POST",
    body,
  });
  return parseWorkspace(data);
}

export async function updateWorkspace(
  workspaceId: string,
  input: UpdateWorkspaceInput,
) {
  const body = parseWithZod(updateWorkspaceSchema, input, "Update workspace");
  const data = await api<unknown>(`/api/v1/workspace/${workspaceId}`, {
    method: "PATCH",
    body,
  });
  return parseWorkspace(data);
}

export async function deleteWorkspace(workspaceId: string) {
  await api<void>(`/api/v1/workspace/${workspaceId}`, {
    method: "DELETE",
  });
}
