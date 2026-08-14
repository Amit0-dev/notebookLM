import type { UIMessage } from "ai";
import type {
  ConversationMessage,
  MessageCitation,
} from "@/lib/validators/message";

export type ChatMessageMetadata = {
  citations?: MessageCitation[] | null;
};

export type ChatUIMessage = UIMessage<
  ChatMessageMetadata,
  {
    citations: MessageCitation[];
  }
>;

/** Map persisted DB messages → AI SDK UIMessage shape for useChat. */
export function toUIMessages(
  messages: ConversationMessage[],
): ChatUIMessage[] {
  return messages.map((message) => {
    const citations = message.citations ?? [];
    const parts: ChatUIMessage["parts"] = [
      { type: "text" as const, text: message.content },
    ];

    if (citations.length > 0) {
      parts.push({
        type: "data-citations",
        id: "citations",
        data: citations,
      });
    }

    return {
      id: message.id,
      role: message.role === "USER" ? "user" : "assistant",
      metadata: { citations },
      parts,
    };
  });
}

export function getUIMessageText(message: UIMessage): string {
  return message.parts
    .filter((part): part is { type: "text"; text: string } => part.type === "text")
    .map((part) => part.text)
    .join("");
}

/** Prefer streamed data parts, then message metadata. Dedupe by source/chunk/url. */
export function getMessageCitations(
  message: UIMessage | ChatUIMessage,
): MessageCitation[] {
  const fromParts: MessageCitation[] = [];

  for (const part of message.parts) {
    if (part.type === "data-citations" && Array.isArray(part.data)) {
      fromParts.push(...(part.data as MessageCitation[]));
    }
  }

  const fromMeta =
    (message.metadata as ChatMessageMetadata | undefined)?.citations ?? [];

  const combined = fromParts.length > 0 ? fromParts : fromMeta;
  return dedupeCitations(combined);
}

function dedupeCitations(citations: MessageCitation[]): MessageCitation[] {
  const seen = new Set<string>();
  const result: MessageCitation[] = [];

  for (const citation of citations) {
    const key = [
      citation.sourceId ?? "",
      citation.chunkId ?? "",
      citation.url ?? "",
      citation.sourceTitle ?? "",
      citation.excerpt?.slice(0, 40) ?? "",
    ].join("|");

    if (seen.has(key)) continue;
    seen.add(key);
    result.push(citation);
  }

  return result;
}
