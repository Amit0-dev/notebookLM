import { z } from "zod";
import { api } from "@/lib/api/client";
import { parseWithZod } from "@/lib/validators/parse";
import {
  artifactSchema,
  createArtifactSchema,
  type Artifact,
  type CreateArtifactInput,
} from "@/lib/validators/artifact";

export const artifactKeys = {
  all: ["artifacts"] as const,
  lists: (workspaceId: string) =>
    [...artifactKeys.all, "list", workspaceId] as const,
  detail: (workspaceId: string, artifactId: string) =>
    [...artifactKeys.all, "detail", workspaceId, artifactId] as const,
};

function parseArtifact(data: unknown): Artifact {
  return parseWithZod(artifactSchema, data, "Invalid artifact data");
}

function parseArtifactList(data: unknown): Artifact[] {
  return parseWithZod(z.array(artifactSchema), data, "Invalid artifact list");
}

export async function listArtifacts(workspaceId: string) {
  const data = await api<unknown>(
    `/api/v1/workspace/${workspaceId}/artifacts`,
  );
  return parseArtifactList(data);
}

export async function getArtifact(workspaceId: string, artifactId: string) {
  const data = await api<unknown>(
    `/api/v1/workspace/${workspaceId}/artifacts/${artifactId}`,
  );
  return parseArtifact(data);
}

export async function createArtifact(
  workspaceId: string,
  input: CreateArtifactInput,
) {
  const body = parseWithZod(createArtifactSchema, input, "Create artifact");
  const data = await api<unknown>(
    `/api/v1/workspace/${workspaceId}/artifacts`,
    { method: "POST", body },
  );
  return parseArtifact(data);
}

export async function deleteArtifact(workspaceId: string, artifactId: string) {
  await api<void>(`/api/v1/workspace/${workspaceId}/artifacts/${artifactId}`, {
    method: "DELETE",
  });
}
