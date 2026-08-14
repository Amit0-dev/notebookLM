import { z } from "zod";
import { api } from "@/lib/api/client";
import { parseWithZod } from "@/lib/validators/parse";
import {
  conversationSchema,
  createConversationSchema,
  type Conversation,
  type CreateConversationInput,
} from "@/lib/validators/conversation";
import {
  conversationMessageSchema,
  type ConversationMessage,
} from "@/lib/validators/message";

export const conversationKeys = {
  all: ["conversations"] as const,
  lists: (workspaceId: string) =>
    [...conversationKeys.all, "list", workspaceId] as const,
  detail: (workspaceId: string, conversationId: string) =>
    [...conversationKeys.all, "detail", workspaceId, conversationId] as const,
  messages: (workspaceId: string, conversationId: string) =>
    [
      ...conversationKeys.all,
      "messages",
      workspaceId,
      conversationId,
    ] as const,
};

function parseConversation(data: unknown): Conversation {
  return parseWithZod(conversationSchema, data, "Invalid conversation data");
}

function parseConversationList(data: unknown): Conversation[] {
  return parseWithZod(
    z.array(conversationSchema),
    data,
    "Invalid conversation list",
  );
}

export async function listConversations(workspaceId: string) {
  const data = await api<unknown>(
    `/api/v1/workspace/${workspaceId}/conversations`,
  );
  return parseConversationList(data);
}

export async function createConversation(
  workspaceId: string,
  input: CreateConversationInput = {},
) {
  const body = parseWithZod(
    createConversationSchema,
    input,
    "Create conversation",
  );
  const data = await api<unknown>(
    `/api/v1/workspace/${workspaceId}/conversations`,
    {
      method: "POST",
      body,
    },
  );
  return parseConversation(data);
}

export async function deleteConversation(
  workspaceId: string,
  conversationId: string,
) {
  await api<void>(
    `/api/v1/workspace/${workspaceId}/conversations/${conversationId}`,
    { method: "DELETE" },
  );
}

export async function listConversationMessages(
  workspaceId: string,
  conversationId: string,
) {
  const data = await api<unknown>(
    `/api/v1/workspace/${workspaceId}/conversations/${conversationId}/messages`,
  );
  return parseWithZod(
    z.array(conversationMessageSchema),
    data,
    "Invalid message list",
  ) as ConversationMessage[];
}
