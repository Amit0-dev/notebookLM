"use client";

import { useEffect, useRef, useState } from "react";
import { format } from "date-fns";
import {
  MoreHorizontalIcon,
  PaperclipIcon,
  PencilIcon,
  SendHorizonalIcon,
  Share2Icon,
  SparklesIcon,
  SquareIcon,
  Trash2Icon,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Spinner } from "@/components/ui/spinner";
import { ThemeToggle } from "@/components/theme-toggle";
import { WorkspaceIcon } from "@/components/workspaces/workspace-icon";
import { DeleteWorkspaceDialog } from "@/components/workspaces/delete-workspace-button";
import {
  Message,
  MessageContent,
  MessageHeader,
} from "@/components/ui/message";
import { Bubble, BubbleContent } from "@/components/ui/bubble";
import {
  useWorkspaceChat,
  type ChatUIMessage,
} from "@/hooks/use-workspace-chat";
import { ChatMarkdown } from "@/components/workspace/chat-markdown";
import { MessageSources } from "@/components/workspace/message-sources";
import {
  getMessageCitations,
  getUIMessageText,
} from "@/lib/chat/message-utils";
import { getUserFacingError } from "@/lib/errors";
import { useBilling } from "@/components/billing/billing-provider";
import { cn } from "@/lib/utils";
import type { Workspace } from "@/lib/validators/workspace";

type WorkspaceChatPanelProps = {
  workspace: Workspace;
  conversationId: string | null;
  onConversationId?: (conversationId: string) => void;
  onEdit?: () => void;
};

function messageTimeLabel(message: ChatUIMessage) {
  const createdAt = (message as ChatUIMessage & { createdAt?: Date | string })
    .createdAt;
  if (!createdAt) return undefined;
  const date = typeof createdAt === "string" ? new Date(createdAt) : createdAt;
  if (Number.isNaN(date.getTime())) return undefined;
  return format(date, "h:mm a");
}

function TypingDots() {
  return (
    <span className="inline-flex items-center gap-1 py-1" aria-label="Thinking">
      <span className="size-1.5 animate-bounce rounded-full bg-foreground/50 [animation-delay:0ms]" />
      <span className="size-1.5 animate-bounce rounded-full bg-foreground/50 [animation-delay:150ms]" />
      <span className="size-1.5 animate-bounce rounded-full bg-foreground/50 [animation-delay:300ms]" />
    </span>
  );
}

export function WorkspaceChatPanel({
  workspace,
  conversationId,
  onConversationId,
  onEdit,
}: WorkspaceChatPanelProps) {
  const [input, setInput] = useState("");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const {
    messages,
    sendMessage,
    status,
    stop,
    error: chatError,
    clearError,
    historyPending,
    historyError,
    refetchHistory,
    historyFetching,
  } = useWorkspaceChat({
    workspaceId: workspace.id,
    conversationId,
    model: workspace.defaultModel,
    onConversationId,
  });

  const isSubmitted = status === "submitted";
  const isStreaming = status === "streaming";
  const isBusy = isSubmitted || isStreaming;
  const showHistoryLoading = Boolean(conversationId) && historyPending && !isBusy;
  const showHistoryError = Boolean(conversationId) && historyError && !isBusy;

  const lastMessage = messages[messages.length - 1];
  const lastIsAssistant = lastMessage?.role === "assistant";
  const lastAssistantText = lastIsAssistant
    ? getUIMessageText(lastMessage)
    : "";
  const showTypingPlaceholder =
    isBusy && (!lastIsAssistant || lastAssistantText.length === 0);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: isStreaming ? "smooth" : "auto",
      block: "end",
    });
  }, [messages, status, isStreaming, lastAssistantText]);

  const { openLowBalanceDialog } = useBilling();

  // Intercept 402 credit errors from the AI SDK stream.
  // The SDK surfaces them as plain Error objects — detect by message text.
  // Clear the error so the inline alert doesn't show, open the billing dialog instead.
  useEffect(() => {
    if (!chatError) return;
    const msg = chatError.message ?? "";
    if (
      msg.includes("Insufficient credits") ||
      msg.includes("402") ||
      msg.toLowerCase().includes("purchase more credits")
    ) {
      clearError();
      openLowBalanceDialog();
    }
  }, [chatError, clearError, openLowBalanceDialog]);

  async function handleSend() {
    const text = input.trim();
    if (!text || isBusy) return;
    clearError();
    setInput("");
    await sendMessage({ text });
  }

  return (
    <div className="flex h-full min-w-0 flex-1 flex-col bg-background">
      <header className="flex shrink-0 items-start justify-between gap-4 border-b border-border/60 px-5 py-4 sm:px-7">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-secondary">
              <WorkspaceIcon icon={workspace.icon} />
            </span>
            <div className="min-w-0">
              <h1 className="font-heading truncate text-2xl font-medium tracking-[-0.02em] sm:text-[1.75rem]">
                {workspace.title}
              </h1>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {isBusy
                  ? isStreaming
                    ? "ShelfLM is writing…"
                    : "ShelfLM is thinking…"
                  : "Grounded chat across your sources"}
              </p>
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <ThemeToggle className="rounded-full" />
          <button
            type="button"
            className="hidden h-9 items-center gap-2 rounded-full border border-border/80 bg-background px-3.5 text-sm font-medium transition-colors hover:bg-secondary sm:inline-flex"
          >
            <Share2Icon className="size-3.5" />
            Share
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger
              className="flex size-9 items-center justify-center rounded-full border border-border/80 bg-background text-muted-foreground outline-none transition-colors hover:bg-secondary hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/25"
              aria-label="Workspace actions"
            >
              <MoreHorizontalIcon className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-44 rounded-xl">
              <DropdownMenuItem className="gap-2 rounded-lg" onClick={onEdit}>
                <PencilIcon className="size-3.5" />
                Edit workspace
              </DropdownMenuItem>
              <DropdownMenuItem
                variant="destructive"
                className="gap-2 rounded-lg"
                onClick={() => setDeleteOpen(true)}
              >
                <Trash2Icon className="size-3.5" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <div
        ref={scrollRef}
        className="min-h-0 flex-1 overflow-y-auto px-5 py-6 sm:px-7"
      >
        {showHistoryLoading ? (
          <div
            className="mx-auto flex max-w-3xl flex-col gap-4"
            aria-busy="true"
          >
            <div className="ml-auto h-16 w-2/3 animate-pulse rounded-2xl bg-muted" />
            <div className="h-24 w-4/5 animate-pulse rounded-2xl bg-muted/70" />
            <div className="ml-auto h-12 w-1/2 animate-pulse rounded-2xl bg-muted" />
          </div>
        ) : null}

        {showHistoryError ? (
          <div
            role="alert"
            className="mx-auto max-w-md rounded-2xl border border-destructive/30 bg-destructive/8 px-4 py-4 text-center"
          >
            <p className="text-sm font-medium text-destructive">
              Couldn&apos;t load messages
            </p>
            <p className="mt-1.5 text-sm text-muted-foreground">
              {getUserFacingError(
                historyError,
                "We couldn't load this conversation. Please try again.",
              )}
            </p>
            <button
              type="button"
              onClick={() => void refetchHistory()}
              className="mt-3 text-sm font-medium underline underline-offset-2"
              disabled={historyFetching}
            >
              {historyFetching ? "Retrying…" : "Retry"}
            </button>
          </div>
        ) : null}

        {!showHistoryLoading && !showHistoryError ? (
          messages.length === 0 && !isBusy ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
              <span className="flex size-12 items-center justify-center rounded-2xl bg-secondary text-primary">
                <SparklesIcon className="size-5" />
              </span>
              <div className="space-y-1">
                <p className="font-heading text-xl font-medium">
                  Start a conversation
                </p>
                <p className="max-w-sm text-sm text-muted-foreground">
                  Ask anything about your sources. Answers stay grounded in what
                  you&apos;ve kept.
                </p>
              </div>
            </div>
          ) : (
            <div className="mx-auto flex max-w-3xl flex-col gap-5">
              {messages.map((msg, index) => {
                const isUser = msg.role === "user";
                const text = getUIMessageText(msg);
                const citations = isUser ? [] : getMessageCitations(msg);
                const time = messageTimeLabel(msg);
                const isLast = index === messages.length - 1;
                const isStreamingThis =
                  isStreaming && isLast && msg.role === "assistant";

                return (
                  <Message
                    key={msg.id}
                    align={isUser ? "end" : "start"}
                  >
                    <MessageContent
                      className={!isUser ? "max-w-full" : undefined}
                    >
                      {!isUser ? (
                        <MessageHeader>
                          <span className="inline-flex items-center gap-1.5">
                            <SparklesIcon className="size-3" />
                            ShelfLM
                            {isStreamingThis ? (
                              <span className="text-muted-foreground">
                                · streaming
                              </span>
                            ) : null}
                          </span>
                        </MessageHeader>
                      ) : time ? (
                        <MessageHeader>{time}</MessageHeader>
                      ) : null}
                      <Bubble
                        variant={isUser ? "muted" : "ghost"}
                        align={isUser ? "end" : "start"}
                      >
                        <BubbleContent
                          className={cn(
                            !isUser && "rounded-none px-0 py-0",
                            isUser &&
                              "rounded-2xl bg-secondary px-4 py-2.5 whitespace-pre-wrap text-[0.95rem] leading-relaxed",
                          )}
                        >
                          {isUser ? (
                            text
                          ) : (
                            <>
                              <ChatMarkdown
                                content={text}
                                streaming={isStreamingThis}
                              />
                              {citations.length > 0 ? (
                                <MessageSources citations={citations} />
                              ) : null}
                            </>
                          )}
                        </BubbleContent>
                      </Bubble>
                    </MessageContent>
                  </Message>
                );
              })}

              {showTypingPlaceholder ? (
                <Message align="start">
                  <MessageContent>
                    <MessageHeader>
                      <span className="inline-flex items-center gap-1.5">
                        <SparklesIcon className="size-3" />
                        ShelfLM
                        <span className="text-muted-foreground">· thinking</span>
                      </span>
                    </MessageHeader>
                    <Bubble variant="ghost" align="start">
                      <BubbleContent className="rounded-none px-0 py-0">
                        <TypingDots />
                      </BubbleContent>
                    </Bubble>
                  </MessageContent>
                </Message>
              ) : null}

              <div ref={bottomRef} className="h-px w-full shrink-0" />
            </div>
          )
        ) : null}

        {chatError ? (
          <div
            role="alert"
            className="mx-auto mt-4 max-w-3xl rounded-xl border border-destructive/30 bg-destructive/8 px-4 py-3"
          >
            <p className="text-sm text-foreground">
              {getUserFacingError(
                chatError,
                "Chat failed. Check your connection and try again.",
              )}
            </p>
          </div>
        ) : null}
      </div>

      <div className="shrink-0 border-t border-border/60 px-5 py-4 sm:px-7">
        <form
          className="mx-auto flex max-w-3xl items-end gap-2 rounded-2xl border border-border/80 bg-card p-2 shadow-sm"
          onSubmit={(e) => {
            e.preventDefault();
            void handleSend();
          }}
        >
          <button
            type="button"
            className="mb-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            aria-label="Attach"
            disabled={isBusy}
          >
            <PaperclipIcon className="size-4" />
          </button>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isBusy ? "Waiting for reply…" : "Ask anything…"}
            rows={1}
            disabled={isBusy}
            className="max-h-32 min-h-[2.25rem] flex-1 resize-none bg-transparent py-2 text-sm outline-none placeholder:text-muted-foreground disabled:opacity-50"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void handleSend();
              }
            }}
          />
          {isBusy ? (
            <div className="mb-0.5 flex items-center gap-1.5">
              <span className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Spinner className="size-4" />
              </span>
              <button
                type="button"
                onClick={() => stop()}
                className="flex h-9 items-center gap-1.5 rounded-xl border border-border px-3 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                aria-label="Stop generating"
              >
                <SquareIcon className="size-3 fill-current" />
                Stop
              </button>
            </div>
          ) : (
            <button
              type="submit"
              disabled={!input.trim()}
              className="mb-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Send"
            >
              <SendHorizonalIcon className="size-4" />
            </button>
          )}
        </form>
        {!conversationId && !isBusy ? (
          <p className="mx-auto mt-2 max-w-3xl text-center text-xs text-muted-foreground">
            Sending will start a new chat in this workspace.
          </p>
        ) : null}
      </div>

      <DeleteWorkspaceDialog
        workspaceId={workspace.id}
        workspaceTitle={workspace.title}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
      />
    </div>
  );
}
