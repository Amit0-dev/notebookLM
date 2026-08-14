import { z } from "zod";

export const ARTIFACT_TYPES = [
  "SUMMARY",
  "TAKEAWAYS",
  "FLASHCARDS",
  "QUIZ",
  "MINDMAP",
  "REPORT",
] as const;

export const ARTIFACT_STATUSES = [
  "PENDING",
  "PROCESSING",
  "READY",
  "FAILED",
] as const;

export const artifactTypeSchema = z.enum(ARTIFACT_TYPES);
export const artifactStatusSchema = z.enum(ARTIFACT_STATUSES);

export const artifactSchema = z.object({
  id: z.string(),
  workspaceId: z.string(),
  type: artifactTypeSchema,
  title: z.string(),
  content: z.unknown().nullable().optional(),
  sourceIds: z.array(z.string()).default([]),
  status: artifactStatusSchema,
  metadata: z.unknown().nullable().optional(),
  createdAt: z.union([z.string(), z.date()]),
  updatedAt: z.union([z.string(), z.date()]),
});

export const createArtifactSchema = z.object({
  type: artifactTypeSchema,
  title: z.string().trim().min(1).max(120).optional(),
  sourceIds: z.array(z.string().trim().min(1)).optional(),
});

export type Artifact = z.infer<typeof artifactSchema>;
export type ArtifactType = z.infer<typeof artifactTypeSchema>;
export type ArtifactStatus = z.infer<typeof artifactStatusSchema>;
export type CreateArtifactInput = z.infer<typeof createArtifactSchema>;

export type SummaryContent = { markdown: string };
export type TakeawaysContent = { items: string[] };
export type FlashcardsContent = {
  cards: Array<{ front: string; back: string }>;
};
export type QuizContent = {
  questions: Array<{
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  }>;
};
export type MindmapContent = {
  nodes: Array<{ id: string; label: string }>;
  edges: Array<{ id: string; source: string; target: string }>;
};
export type ReportContent = {
  markdown: string;
  sections: Array<{ title: string; content: string }>;
};
