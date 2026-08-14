"use client";

import { useState } from "react";
import {
  ChevronDownIcon,
  ExternalLinkIcon,
  FileTextIcon,
  GlobeIcon,
  Link2Icon,
  VideoIcon,
} from "lucide-react";
import type { MessageCitation } from "@/lib/validators/message";
import { cn } from "@/lib/utils";

type MessageSourcesProps = {
  citations: MessageCitation[];
  className?: string;
};

function sourceIcon(type?: string) {
  const normalized = (type ?? "").toUpperCase();
  if (normalized === "WEB" || normalized === "WEBSITE") {
    return GlobeIcon;
  }
  if (normalized === "YOUTUBE") {
    return VideoIcon;
  }
  if (normalized === "PDF" || normalized === "FILE" || normalized === "TEXT") {
    return FileTextIcon;
  }
  return Link2Icon;
}

function sourceLabel(citation: MessageCitation, index: number) {
  if (citation.sourceTitle?.trim()) return citation.sourceTitle.trim();
  if (citation.url) {
    try {
      return new URL(citation.url).hostname;
    } catch {
      return citation.url;
    }
  }
  return `Source ${index + 1}`;
}

export function MessageSources({ citations, className }: MessageSourcesProps) {
  const [open, setOpen] = useState(true);

  if (citations.length === 0) return null;

  return (
    <div
      className={cn(
        "mt-3 overflow-hidden rounded-xl border border-border/70 bg-secondary/40",
        className,
      )}
    >
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary/80 hover:text-foreground"
      >
        <span>
          Sources
          <span className="ml-1.5 tabular-nums text-foreground/70">
            {citations.length}
          </span>
        </span>
        <ChevronDownIcon
          className={cn(
            "size-3.5 transition-transform",
            open ? "rotate-0" : "-rotate-90",
          )}
        />
      </button>

      {open ? (
        <ul className="space-y-2 border-t border-border/60 px-3 py-2.5">
          {citations.map((citation, index) => {
            const Icon = sourceIcon(citation.sourceType);
            const title = sourceLabel(citation, index);
            const metaBits = [
              citation.sourceType
                ? citation.sourceType.replace(/_/g, " ").toLowerCase()
                : null,
              citation.page != null && citation.page !== ""
                ? `p. ${citation.page}`
                : null,
            ].filter(Boolean);

            const body = (
              <>
                <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md bg-background text-muted-foreground">
                  <Icon className="size-3.5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-start justify-between gap-2">
                    <span className="text-sm font-medium text-foreground">
                      {title}
                    </span>
                    {citation.url ? (
                      <ExternalLinkIcon className="mt-0.5 size-3 shrink-0 text-muted-foreground" />
                    ) : null}
                  </span>
                  {metaBits.length > 0 ? (
                    <span className="mt-0.5 block text-[11px] capitalize text-muted-foreground">
                      {metaBits.join(" · ")}
                    </span>
                  ) : null}
                  {citation.excerpt ? (
                    <span className="mt-1 block line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                      {citation.excerpt}
                    </span>
                  ) : null}
                </span>
              </>
            );

            return (
              <li key={`${citation.sourceId ?? citation.url ?? title}-${index}`}>
                {citation.url ? (
                  <a
                    href={citation.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex gap-2.5 rounded-lg p-1.5 transition-colors hover:bg-background/80"
                  >
                    {body}
                  </a>
                ) : (
                  <div className="flex gap-2.5 rounded-lg p-1.5">{body}</div>
                )}
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
