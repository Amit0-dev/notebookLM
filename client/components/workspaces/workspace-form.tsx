"use client";

import { useMemo, useState } from "react";
import { CHAT_MODELS, createWorkspaceSchema } from "@/lib/validators/workspace";
import type { CreateWorkspaceInput } from "@/lib/validators/workspace";
import { fieldErrors } from "@/lib/validators/parse";
import {
  deskFieldClass,
  deskSelectClass,
  deskTextareaClass,
  SealButton,
} from "@/components/layout/desk-shell";
import { WorkspaceIconPicker } from "@/components/workspaces/workspace-icon-picker";
import { getUserFacingError } from "@/lib/errors";
import {
  DEFAULT_WORKSPACE_ICON,
  getSuggestedWorkspaceIcon,
  isWorkspaceIconId,
  type WorkspaceIconId,
} from "@/lib/workspace-icons";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export type WorkspaceFormValues = {
  title: string;
  description: string;
  icon: WorkspaceIconId;
  defaultModel: (typeof CHAT_MODELS)[number];
};

type WorkspaceFormProps = {
  initial?: Partial<Omit<WorkspaceFormValues, "icon">> & { icon?: string };
  submitLabel: string;
  pending?: boolean;
  variant?: "page" | "modal";
  onSubmit: (values: CreateWorkspaceInput) => Promise<void> | void;
  onCancel?: () => void;
};

function resolveInitialIcon(icon?: string): WorkspaceIconId {
  if (icon && isWorkspaceIconId(icon)) return icon;
  if (icon?.trim()) return getSuggestedWorkspaceIcon(icon);
  return DEFAULT_WORKSPACE_ICON;
}

const SELECT_CHEVRON =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")";

export function WorkspaceForm({
  initial,
  submitLabel,
  pending,
  variant = "page",
  onSubmit,
  onCancel,
}: WorkspaceFormProps) {
  const [values, setValues] = useState<WorkspaceFormValues>({
    title: initial?.title ?? "",
    description: initial?.description ?? "",
    icon: resolveInitialIcon(initial?.icon),
    defaultModel: initial?.defaultModel ?? "gpt-4o-mini",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);

  const modelOptions = useMemo(() => [...CHAT_MODELS], []);
  const isModal = variant === "modal";

  function update<K extends keyof WorkspaceFormValues>(
    key: K,
    value: WorkspaceFormValues[K],
  ) {
    setValues((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    const payload = {
      title: values.title,
      description: values.description.trim() || undefined,
      icon: values.icon,
      defaultModel: values.defaultModel,
    };

    const parsed = createWorkspaceSchema.safeParse(payload);
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      return;
    }

    try {
      await onSubmit(parsed.data);
    } catch (err) {
      setFormError(
        getUserFacingError(err, "Couldn't save the workspace. Please try again."),
      );
    }
  }

  return (
    <form
      className={cn("flex flex-col", isModal ? "gap-3" : "gap-5")}
      onSubmit={handleSubmit}
      noValidate
    >
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="workspace-title"
          className="text-sm font-medium text-foreground"
        >
          Title
        </label>
        <input
          id="workspace-title"
          name="title"
          value={values.title}
          onChange={(e) => update("title", e.target.value)}
          placeholder="Research notes"
          className={cn(deskFieldClass)}
          aria-invalid={Boolean(errors.title)}
          autoFocus
          maxLength={120}
        />
        {errors.title ? (
          <p className="text-sm text-destructive">{errors.title}</p>
        ) : null}
      </div>

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="workspace-description"
          className="text-sm font-medium text-foreground"
        >
          Description
          <span className="ml-1 font-normal text-muted-foreground">
            (optional)
          </span>
        </label>
        <textarea
          id="workspace-description"
          name="description"
          value={values.description}
          onChange={(e) => update("description", e.target.value)}
          placeholder="What this desk holds"
          rows={isModal ? 2 : 4}
          className={cn(
            deskTextareaClass,
            isModal && "min-h-0 resize-none py-2.5",
          )}
          aria-invalid={Boolean(errors.description)}
          maxLength={500}
        />
        {errors.description ? (
          <p className="text-sm text-destructive">{errors.description}</p>
        ) : null}
      </div>

      <WorkspaceIconPicker
        value={values.icon}
        onChange={(icon) => update("icon", icon)}
        disabled={pending}
        compact={isModal}
      />

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="workspace-model"
          className="text-sm font-medium text-foreground"
        >
          Default model
        </label>
        <select
          id="workspace-model"
          name="defaultModel"
          value={values.defaultModel}
          onChange={(e) =>
            update(
              "defaultModel",
              e.target.value as WorkspaceFormValues["defaultModel"],
            )
          }
          className={cn(deskSelectClass)}
          style={{ backgroundImage: SELECT_CHEVRON }}
          aria-invalid={Boolean(errors.defaultModel)}
        >
          {modelOptions.map((model) => (
            <option key={model} value={model}>
              {model}
            </option>
          ))}
        </select>
      </div>

      {formError ? (
        <div
          role="alert"
          className="rounded-xl border border-destructive/30 bg-destructive/8 px-4 py-3"
        >
          <p className="text-sm leading-relaxed text-foreground">{formError}</p>
        </div>
      ) : null}

      {isModal ? (
        <div className="flex gap-2 pt-1">
          {onCancel ? (
            <Button
              type="button"
              variant="outline"
              className="h-10 flex-1 rounded-full bg-background"
              onClick={onCancel}
              disabled={pending}
            >
              Cancel
            </Button>
          ) : null}
          <SealButton
            type="submit"
            className="h-10 flex-1"
            disabled={pending}
            pending={pending}
          >
            {submitLabel}
          </SealButton>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <SealButton type="submit" disabled={pending} pending={pending}>
            {submitLabel}
          </SealButton>
          {onCancel ? (
            <button
              type="button"
              onClick={onCancel}
              className="self-start text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Cancel
            </button>
          ) : null}
        </div>
      )}
    </form>
  );
}
