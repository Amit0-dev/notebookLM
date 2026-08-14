import { z } from "zod";

export const conversationSchema = z.object({
  id: z.string(),
  workspaceId: z.string(),
  title: z.string().nullable().optional(),
  summary: z.string().nullable().optional(),
  summaryMessageCount: z.number().optional(),
  summarizedAt: z.union([z.string(), z.date()]).nullable().optional(),
  createdAt: z.union([z.string(), z.date()]),
  updatedAt: z.union([z.string(), z.date()]),
});

export const createConversationSchema = z.object({
  title: z.string().trim().min(1).max(120).optional(),
});

export type Conversation = z.infer<typeof conversationSchema>;
export type CreateConversationInput = z.infer<typeof createConversationSchema>;
