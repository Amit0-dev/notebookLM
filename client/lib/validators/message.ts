import { z } from "zod";

export const messageRoleSchema = z.enum(["USER", "ASSISTANT"]);

export const messageCitationSchema = z
  .object({
    sourceId: z.string().optional(),
    sourceTitle: z.string().optional(),
    sourceType: z.string().optional(),
    chunkId: z.string().optional(),
    chunkIndex: z.number().optional(),
    page: z.union([z.number(), z.string()]).nullable().optional(),
    excerpt: z.string().optional(),
    score: z.number().optional(),
    url: z.string().optional(),
  })
  .passthrough();

export const conversationMessageSchema = z.object({
  id: z.string(),
  conversationId: z.string(),
  role: messageRoleSchema,
  content: z.string(),
  citations: z.preprocess((value) => {
    if (value == null) return null;
    if (Array.isArray(value)) return value;
    return [];
  }, z.array(messageCitationSchema).nullable()),
  createdAt: z.union([z.string(), z.date()]),
});

export type MessageRole = z.infer<typeof messageRoleSchema>;
export type MessageCitation = z.infer<typeof messageCitationSchema>;
export type ConversationMessage = z.infer<typeof conversationMessageSchema>;
