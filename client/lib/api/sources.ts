import { z } from "zod";
import { api, ApiError } from "@/lib/api/client";
import { parseWithZod } from "@/lib/validators/parse";
import {
  createSourceSchema,
  importWebsiteSchema,
  importYoutubeSchema,
  listSourcesQuerySchema,
  sourceSchema,
  type CreateSourceInput,
  type ImportWebsiteInput,
  type ImportYoutubeInput,
  type ListSourcesQuery,
  type Source,
} from "@/lib/validators/source";

export const sourceKeys = {
  all: ["sources"] as const,
  lists: (workspaceId: string) =>
    [...sourceKeys.all, "list", workspaceId] as const,
  list: (workspaceId: string, query?: ListSourcesQuery) =>
    [...sourceKeys.lists(workspaceId), query ?? {}] as const,
  detail: (workspaceId: string, sourceId: string) =>
    [...sourceKeys.all, "detail", workspaceId, sourceId] as const,
};

function parseSource(data: unknown): Source {
  return parseWithZod(sourceSchema, data, "Invalid source data");
}

function parseSourceList(data: unknown): Source[] {
  return parseWithZod(z.array(sourceSchema), data, "Invalid source list");
}

function toQueryString(query?: ListSourcesQuery) {
  if (!query) return "";
  const params = new URLSearchParams();
  if (query.q) params.set("q", query.q);
  if (query.type) params.set("type", query.type);
  if (query.status) params.set("status", query.status);
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export async function listSources(
  workspaceId: string,
  query?: ListSourcesQuery,
) {
  const filters = query
    ? parseWithZod(listSourcesQuerySchema, query, "List sources query")
    : undefined;
  const data = await api<unknown>(
    `/api/v1/workspace/${workspaceId}/sources${toQueryString(filters)}`,
  );
  return parseSourceList(data);
}

export async function createSource(
  workspaceId: string,
  input: CreateSourceInput,
) {
  const body = parseWithZod(createSourceSchema, input, "Create source");
  const data = await api<unknown>(
    `/api/v1/workspace/${workspaceId}/sources`,
    { method: "POST", body },
  );
  return parseSource(data);
}

export async function importWebsite(
  workspaceId: string,
  input: ImportWebsiteInput,
) {
  const body = parseWithZod(importWebsiteSchema, input, "Import website");
  const data = await api<unknown>(
    `/api/v1/workspace/${workspaceId}/sources/import/website`,
    { method: "POST", body },
  );
  return parseSource(data);
}

export async function importYoutube(
  workspaceId: string,
  input: ImportYoutubeInput,
) {
  const body = parseWithZod(importYoutubeSchema, input, "Import YouTube");
  const data = await api<unknown>(
    `/api/v1/workspace/${workspaceId}/sources/import/youtube`,
    { method: "POST", body },
  );
  return parseSource(data);
}

export async function uploadPdf(
  workspaceId: string,
  file: File,
  title?: string,
) {
  const form = new FormData();
  form.append("file", file);
  if (title?.trim()) form.append("title", title.trim());

  const response = await fetch(
    `/api/v1/workspace/${workspaceId}/sources/upload`,
    {
      method: "POST",
      credentials: "include",
      body: form,
    },
  );

  const contentType = response.headers.get("content-type") ?? "";
  const isJson = contentType.includes("application/json");
  const payload = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    let message = `Upload failed (${response.status})`;
    if (typeof payload === "object" && payload) {
      if ("error" in payload && typeof payload.error === "string") {
        message = payload.error;
      } else if ("message" in payload && typeof payload.message === "string") {
        message = payload.message;
      }
    }
    throw new ApiError(message, response.status, payload);
  }

  return parseSource(payload);
}

export async function deleteSource(workspaceId: string, sourceId: string) {
  await api<void>(`/api/v1/workspace/${workspaceId}/sources/${sourceId}`, {
    method: "DELETE",
  });
}
