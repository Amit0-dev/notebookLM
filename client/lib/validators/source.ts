import { z } from "zod";

export const SOURCE_TYPES = [
  "PDF",
  "WEBSITE",
  "YOUTUBE",
  "TEXT",
  "MARKDOWN",
] as const;

export const SOURCE_STATUSES = [
  "PENDING",
  "PROCESSING",
  "READY",
  "FAILED",
] as const;

export const sourceTypeSchema = z.enum(SOURCE_TYPES);
export const sourceStatusSchema = z.enum(SOURCE_STATUSES);

export const sourceSchema = z.object({
  id: z.string(),
  workspaceId: z.string(),
  type: sourceTypeSchema,
  title: z.string(),
  content: z.string().nullable().optional(),
  url: z.string().nullable().optional(),
  status: sourceStatusSchema,
  metadata: z.unknown().nullable().optional(),
  createdAt: z.union([z.string(), z.date()]),
  updatedAt: z.union([z.string(), z.date()]),
});

export const listSourcesQuerySchema = z.object({
  q: z.string().trim().optional(),
  type: sourceTypeSchema.optional(),
  status: sourceStatusSchema.optional(),
});

export const createTextSourceSchema = z.object({
  type: z.literal("TEXT"),
  title: z.string().trim().min(1, "Title is required").max(200),
  content: z.string().trim().min(1, "Content is required"),
});

export const createMarkdownSourceSchema = z.object({
  type: z.literal("MARKDOWN"),
  title: z.string().trim().min(1, "Title is required").max(200),
  content: z.string().trim().min(1, "Content is required"),
});

export const createSourceSchema = z.discriminatedUnion("type", [
  createTextSourceSchema,
  createMarkdownSourceSchema,
]);

export const importWebsiteSchema = z.object({
  url: z.string().trim().url("Enter a valid URL"),
  title: z.string().trim().max(200).optional(),
});

export const importYoutubeSchema = z.object({
  url: z.string().trim().min(1, "YouTube URL is required"),
  title: z.string().trim().max(200).optional(),
});

export type Source = z.infer<typeof sourceSchema>;
export type SourceType = z.infer<typeof sourceTypeSchema>;
export type SourceStatus = z.infer<typeof sourceStatusSchema>;
export type ListSourcesQuery = z.infer<typeof listSourcesQuerySchema>;
export type CreateSourceInput = z.infer<typeof createSourceSchema>;
export type ImportWebsiteInput = z.infer<typeof importWebsiteSchema>;
export type ImportYoutubeInput = z.infer<typeof importYoutubeSchema>;
