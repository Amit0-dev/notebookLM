"use client";

import { useEffect, useMemo, useRef } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useQueryClient } from "@tanstack/react-query";
import { conversationKeys } from "@/lib/api/conversations";
import { useConversationMessages } from "@/hooks/use-conversations";
import {
  toUIMessages,
  type ChatUIMessage,
} from "@/lib/chat/message-utils";

type UseWorkspaceChatOptions = {
  workspaceId: string;
  conversationId: string | null;
  model?: string;
  onConversationId?: (conversationId: string) => void;
};

export function useWorkspaceChat({
  workspaceId,
  conversationId,
  model,
  onConversationId,
}: UseWorkspaceChatOptions) {
  const queryClient = useQueryClient();
  const conversationIdRef = useRef(conversationId);
  const onConversationIdRef = useRef(onConversationId);

  useEffect(() => {
    conversationIdRef.current = conversationId;
  }, [conversationId]);

  useEffect(() => {
    onConversationIdRef.current = onConversationId;
  }, [onConversationId]);

  const historyQuery = useConversationMessages(workspaceId, conversationId);

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: `/api/v1/workspace/${workspaceId}/chat`,
        credentials: "include",
        prepareSendMessagesRequest: ({ messages }) => ({
          body: {
            messages,
            conversationId: conversationIdRef.current ?? undefined,
            model: model || undefined,
          },
        }),
        fetch: async (input, init) => {
          const response = await fetch(input, init);
          const headerId = response.headers.get("X-Conversation-Id");
          if (headerId) {
            conversationIdRef.current = headerId;
            onConversationIdRef.current?.(headerId);
          }
          return response;
        },
      }),
    [workspaceId, model],
  );

  const chat = useChat<ChatUIMessage>({
    id: conversationId ?? `draft-${workspaceId}`,
    transport,
    onFinish: () => {
      const activeId = conversationIdRef.current;
      void queryClient.invalidateQueries({
        queryKey: conversationKeys.lists(workspaceId),
      });
      if (activeId) {
        void queryClient.invalidateQueries({
          queryKey: conversationKeys.messages(workspaceId, activeId),
        });
      }
    },
  });

  const syncedForId = useRef<string | null>(null);
  const historyUpdatedAt = historyQuery.dataUpdatedAt;

  useEffect(() => {
    if (!conversationId) {
      syncedForId.current = null;
      chat.setMessages([]);
      return;
    }

    if (chat.status === "streaming" || chat.status === "submitted") {
      return;
    }

    if (!historyQuery.data) return;

    const alreadySynced =
      syncedForId.current === `${conversationId}:${historyUpdatedAt}`;
    if (alreadySynced) return;

    chat.setMessages(toUIMessages(historyQuery.data));
    syncedForId.current = `${conversationId}:${historyUpdatedAt}`;
  }, [
    conversationId,
    historyQuery.data,
    historyUpdatedAt,
    chat.status,
    chat.setMessages,
  ]);

  return {
    ...chat,
    historyPending: Boolean(conversationId) && historyQuery.isPending,
    historyError: historyQuery.isError ? historyQuery.error : null,
    refetchHistory: historyQuery.refetch,
    historyFetching: historyQuery.isFetching,
  };
}

export type { ChatUIMessage };
