"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  conversationKeys,
  createConversation,
  deleteConversation,
  listConversationMessages,
  listConversations,
} from "@/lib/api/conversations";
import type { CreateConversationInput } from "@/lib/validators/conversation";

export function useConversations(workspaceId: string) {
  return useQuery({
    queryKey: conversationKeys.lists(workspaceId),
    queryFn: () => listConversations(workspaceId),
    enabled: Boolean(workspaceId),
  });
}

export function useConversationMessages(
  workspaceId: string,
  conversationId: string | null,
) {
  return useQuery({
    queryKey: conversationKeys.messages(
      workspaceId,
      conversationId ?? "none",
    ),
    queryFn: () => listConversationMessages(workspaceId, conversationId!),
    enabled: Boolean(workspaceId && conversationId),
  });
}

export function useCreateConversation(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateConversationInput = {}) =>
      createConversation(workspaceId, input),
    onSuccess: (conversation) => {
      void queryClient.invalidateQueries({
        queryKey: conversationKeys.lists(workspaceId),
      });
      queryClient.setQueryData(
        conversationKeys.detail(workspaceId, conversation.id),
        conversation,
      );
    },
  });
}

export function useDeleteConversation(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (conversationId: string) =>
      deleteConversation(workspaceId, conversationId),
    onSuccess: (_void, conversationId) => {
      void queryClient.invalidateQueries({
        queryKey: conversationKeys.lists(workspaceId),
      });
      queryClient.removeQueries({
        queryKey: conversationKeys.detail(workspaceId, conversationId),
      });
      queryClient.removeQueries({
        queryKey: conversationKeys.messages(workspaceId, conversationId),
      });
    },
  });
}
