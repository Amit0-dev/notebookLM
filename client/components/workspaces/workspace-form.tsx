"use client";

import { useMemo, useState } from "react";
import { CHAT_MODELS, createWorkspaceSchema } from "@/lib/validators/workspace";
import type { CreateWorkspaceInput } from "@/lib/validators/workspace";
import { fieldErrors } from "@/lib/validators/parse";
import {
  deskFieldClass,
  deskTextareaClass,
  SealButton,
} from "@/components/layout/desk-shell";
import { getUserFacingError } from "@/lib/errors";
import { cn } from "@/lib/utils";

export type WorkspaceFormValues = {
  title: string;
  description: string;
  icon: string;
  defaultModel: (typeof CHAT_MODELS)[number];
};

type WorkspaceFormProps = {
  initial?: Partial<WorkspaceFormValues>;
  submitLabel: string;
  pending?: boolean;
  onSubmit: (values: CreateWorkspaceInput) => Promise<void> | void;
  onCancel?: () => void;
};

const defaults: WorkspaceFormValues = {
  title: "",
  description: "",
  icon: "",
  defaultModel: "gpt-4o-mini",
};

export function WorkspaceForm({
  initial,
  submitLabel,
  pending,
  onSubmit,
  onCancel,
}: WorkspaceFormProps) {
  const [values, setValues] = useState<WorkspaceFormValues>({
    ...defaults,
    ...initial,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);

  const modelOptions = useMemo(() => [...CHAT_MODELS], []);

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
      icon: values.icon.trim() || undefined,
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
        getUserFacingError(err, "Couldn’t save the workspace. Please try again."),
      );
    }
  }

  return (
    <form className="flex flex-col gap-6" onSubmit={handleSubmit} noValidate>
      <div className="flex flex-col gap-2">
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

      <div className="flex flex-col gap-2">
        <label
          htmlFor="workspace-description"
          className="text-sm font-medium text-foreground"
        >
          Description
        </label>
        <textarea
          id="workspace-description"
          name="description"
          value={values.description}
          onChange={(e) => update("description", e.target.value)}
          placeholder="What this desk holds (optional)"
          className={cn(deskTextareaClass)}
          aria-invalid={Boolean(errors.description)}
          maxLength={500}
        />
        {errors.description ? (
          <p className="text-sm text-destructive">{errors.description}</p>
        ) : null}
      </div>

      <div className="grid grid-cols-[5rem_1fr] gap-4">
        <div className="flex flex-col gap-2">
          <label
            htmlFor="workspace-icon"
            className="text-sm font-medium text-foreground"
          >
            Icon
          </label>
          <input
            id="workspace-icon"
            name="icon"
            value={values.icon}
            onChange={(e) => update("icon", e.target.value)}
            placeholder="本"
            className={cn(deskFieldClass, "text-center")}
            aria-invalid={Boolean(errors.icon)}
            maxLength={8}
          />
        </div>

        <div className="flex flex-col gap-2">
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
            className={cn(deskFieldClass)}
            aria-invalid={Boolean(errors.defaultModel)}
          >
            {modelOptions.map((model) => (
              <option key={model} value={model}>
                {model}
              </option>
            ))}
          </select>
        </div>
      </div>

      {formError ? (
        <div
          role="alert"
          className="rounded-xl border border-destructive/30 bg-destructive/8 px-4 py-3"
        >
          <p className="text-sm leading-relaxed text-foreground">{formError}</p>
        </div>
      ) : null}

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
    </form>
  );
}
