"use client";

import { useMemo, useState, type ReactNode } from "react";
import { ChatMarkdown } from "@/components/workspace/chat-markdown";
import { cn } from "@/lib/utils";
import type {
  Artifact,
  ArtifactType,
  FlashcardsContent,
  MindmapContent,
  QuizContent,
  ReportContent,
  SummaryContent,
  TakeawaysContent,
} from "@/lib/validators/artifact";

function asRecord(value: unknown): Record<string, unknown> | null {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
}

function SummaryView({ content }: { content: unknown }) {
  const data = asRecord(content) as SummaryContent | null;
  const markdown = data?.markdown?.trim();
  if (!markdown) {
    return <EmptyContent />;
  }
  return <ChatMarkdown content={markdown} />;
}

function TakeawaysView({ content }: { content: unknown }) {
  const data = asRecord(content) as TakeawaysContent | null;
  const items = data?.items ?? [];
  if (items.length === 0) return <EmptyContent />;

  return (
    <ol className="space-y-3">
      {items.map((item, index) => (
        <li
          key={`${index}-${item.slice(0, 24)}`}
          className="flex gap-3 rounded-xl border border-border/70 bg-card/50 px-4 py-3"
        >
          <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-medium tabular-nums">
            {index + 1}
          </span>
          <p className="text-sm leading-relaxed">{item}</p>
        </li>
      ))}
    </ol>
  );
}

function FlashcardsView({ content }: { content: unknown }) {
  const data = asRecord(content) as FlashcardsContent | null;
  const cards = data?.cards ?? [];
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  if (cards.length === 0) return <EmptyContent />;

  const card = cards[Math.min(index, cards.length - 1)]!;

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-4">
      <button
        type="button"
        onClick={() => setFlipped((v) => !v)}
        className="min-h-48 rounded-2xl border border-border/80 bg-card px-6 py-8 text-left shadow-sm transition-colors hover:bg-secondary/30"
      >
        <p className="mb-3 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
          {flipped ? "Answer" : "Prompt"} · {index + 1}/{cards.length}
        </p>
        <p className="font-heading text-lg leading-snug">
          {flipped ? card.back : card.front}
        </p>
        <p className="mt-6 text-xs text-muted-foreground">Click to flip</p>
      </button>
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          disabled={index === 0}
          onClick={() => {
            setIndex((i) => Math.max(0, i - 1));
            setFlipped(false);
          }}
          className="rounded-xl border border-border px-3 py-2 text-sm disabled:opacity-40"
        >
          Previous
        </button>
        <button
          type="button"
          disabled={index >= cards.length - 1}
          onClick={() => {
            setIndex((i) => Math.min(cards.length - 1, i + 1));
            setFlipped(false);
          }}
          className="rounded-xl border border-border px-3 py-2 text-sm disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </div>
  );
}

function QuizView({ content }: { content: unknown }) {
  const data = asRecord(content) as QuizContent | null;
  const questions = data?.questions ?? [];
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [revealed, setRevealed] = useState(false);

  const score = useMemo(() => {
    if (!revealed || questions.length === 0) return null;
    let correct = 0;
    questions.forEach((q, i) => {
      if (answers[i] === q.correctIndex) correct += 1;
    });
    return { correct, total: questions.length };
  }, [answers, questions, revealed]);

  if (questions.length === 0) return <EmptyContent />;

  return (
    <div className="space-y-5">
      {questions.map((q, qi) => {
        const selected = answers[qi];
        return (
          <div
            key={`${qi}-${q.question.slice(0, 20)}`}
            className="rounded-2xl border border-border/80 bg-card/50 p-4"
          >
            <p className="text-sm font-medium leading-relaxed">
              <span className="mr-2 text-muted-foreground">{qi + 1}.</span>
              {q.question}
            </p>
            <ul className="mt-3 space-y-2">
              {q.options.map((option, oi) => {
                const isSelected = selected === oi;
                const isCorrect = q.correctIndex === oi;
                const showResult = revealed;
                return (
                  <li key={`${qi}-${oi}`}>
                    <button
                      type="button"
                      disabled={revealed}
                      onClick={() =>
                        setAnswers((prev) => ({ ...prev, [qi]: oi }))
                      }
                      className={cn(
                        "flex w-full items-start gap-2 rounded-xl border px-3 py-2.5 text-left text-sm transition-colors",
                        isSelected && !showResult
                          ? "border-primary bg-primary/8"
                          : "border-border/70 hover:bg-secondary/40",
                        showResult &&
                          isCorrect &&
                          "border-emerald-500/50 bg-emerald-500/10",
                        showResult &&
                          isSelected &&
                          !isCorrect &&
                          "border-destructive/40 bg-destructive/8",
                      )}
                    >
                      {option}
                    </button>
                  </li>
                );
              })}
            </ul>
            {revealed ? (
              <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                {q.explanation}
              </p>
            ) : null}
          </div>
        );
      })}

      <div className="flex flex-wrap items-center gap-3">
        {!revealed ? (
          <button
            type="button"
            onClick={() => setRevealed(true)}
            disabled={Object.keys(answers).length < questions.length}
            className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-40"
          >
            Check answers
          </button>
        ) : (
          <>
            <p className="text-sm font-medium">
              Score: {score?.correct}/{score?.total}
            </p>
            <button
              type="button"
              onClick={() => {
                setAnswers({});
                setRevealed(false);
              }}
              className="rounded-xl border border-border px-3 py-2 text-sm"
            >
              Try again
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function MindmapView({ content }: { content: unknown }) {
  const data = asRecord(content) as MindmapContent | null;
  const nodes = data?.nodes ?? [];
  const edges = data?.edges ?? [];
  if (nodes.length === 0) return <EmptyContent />;

  const childrenByParent = new Map<string, string[]>();
  const targets = new Set(edges.map((e) => e.target));
  for (const edge of edges) {
    const list = childrenByParent.get(edge.source) ?? [];
    list.push(edge.target);
    childrenByParent.set(edge.source, list);
  }

  const roots = nodes.filter((n) => !targets.has(n.id));
  const labelById = new Map(nodes.map((n) => [n.id, n.label]));

  function renderNode(id: string, depth: number): ReactNode {
    const children = childrenByParent.get(id) ?? [];
    return (
      <li key={id} className="space-y-2">
        <div
          className={cn(
            "rounded-xl border border-border/70 px-3 py-2 text-sm",
            depth === 0
              ? "bg-primary text-primary-foreground"
              : "bg-card/70",
          )}
        >
          {labelById.get(id) ?? id}
        </div>
        {children.length > 0 ? (
          <ul className="ml-4 space-y-2 border-l border-border/60 pl-3">
            {children.map((childId) => renderNode(childId, depth + 1))}
          </ul>
        ) : null}
      </li>
    );
  }

  return (
    <ul className="space-y-3">
      {(roots.length > 0 ? roots : nodes.slice(0, 1)).map((node) =>
        renderNode(node.id, 0),
      )}
    </ul>
  );
}

function ReportView({ content }: { content: unknown }) {
  const data = asRecord(content) as ReportContent | null;
  if (data?.markdown?.trim()) {
    return <ChatMarkdown content={data.markdown} />;
  }
  if (data?.sections?.length) {
    return (
      <div className="space-y-6">
        {data.sections.map((section, index) => (
          <section key={`${index}-${section.title}`}>
            <h3 className="font-heading text-lg font-medium">{section.title}</h3>
            <div className="mt-2">
              <ChatMarkdown content={section.content} />
            </div>
          </section>
        ))}
      </div>
    );
  }
  return <EmptyContent />;
}

function EmptyContent() {
  return (
    <p className="text-sm text-muted-foreground">
      No content available for this artifact yet.
    </p>
  );
}

const VIEWERS: Record<
  ArtifactType,
  (props: { content: unknown }) => ReactNode
> = {
  SUMMARY: SummaryView,
  TAKEAWAYS: TakeawaysView,
  FLASHCARDS: FlashcardsView,
  QUIZ: QuizView,
  MINDMAP: MindmapView,
  REPORT: ReportView,
};

export function ArtifactContentView({ artifact }: { artifact: Artifact }) {
  if (artifact.status === "PENDING" || artifact.status === "PROCESSING") {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
        <span className="size-8 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-foreground" />
        <div>
          <p className="text-sm font-medium">Generating {artifact.title}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            This usually takes a moment.
          </p>
        </div>
      </div>
    );
  }

  if (artifact.status === "FAILED") {
    const meta = asRecord(artifact.metadata);
    const errorText =
      typeof meta?.processingError === "string"
        ? meta.processingError
        : "Generation failed. Try creating this artifact again.";
    return (
      <div
        role="alert"
        className="rounded-2xl border border-destructive/30 bg-destructive/8 px-4 py-4"
      >
        <p className="text-sm font-medium text-destructive">Generation failed</p>
        <p className="mt-1.5 text-sm text-muted-foreground">{errorText}</p>
      </div>
    );
  }

  const Viewer = VIEWERS[artifact.type];
  return <Viewer content={artifact.content} />;
}
