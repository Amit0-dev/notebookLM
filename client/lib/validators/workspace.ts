import { z } from "zod";

export const CHAT_MODELS = ["gpt-4o-mini", "gpt-4o"] as const;

export const createWorkspaceSchema = z.object({
  title: z.string().trim().min(1, "Workspace title is required").max(120),
  description: z.string().trim().max(500).optional(),
  icon: z.string().trim().max(32).optional(),
  defaultModel: z.enum(CHAT_MODELS).optional(),
});

export const updateWorkspaceSchema = createWorkspaceSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required",
  });

export type CreateWorkspaceInput = z.infer<typeof createWorkspaceSchema>;
export type UpdateWorkspaceInput = z.infer<typeof updateWorkspaceSchema>;

/** Matches server `workspaceSelect` — no userId in API responses. */
export const workspaceSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().nullable().optional(),
  icon: z.string().nullable().optional(),
  defaultModel: z.string(),
  createdAt: z.union([z.string(), z.date()]),
  updatedAt: z.union([z.string(), z.date()]),
});

export type Workspace = z.infer<typeof workspaceSchema>;
