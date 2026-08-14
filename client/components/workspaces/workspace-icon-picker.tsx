"use client";

import { WORKSPACE_ICON_OPTIONS } from "@/lib/workspace-icons";
import type { WorkspaceIconId } from "@/lib/workspace-icons";
import { cn } from "@/lib/utils";

type WorkspaceIconPickerProps = {
  value: WorkspaceIconId;
  onChange: (value: WorkspaceIconId) => void;
  disabled?: boolean;
  compact?: boolean;
};

export function WorkspaceIconPicker({
  value,
  onChange,
  disabled,
  compact = false,
}: WorkspaceIconPickerProps) {
  return (
    <div className={cn("flex flex-col gap-1.5", compact && "gap-1")}>
      <span className="text-sm font-medium text-foreground">Icon</span>
      <div
        className="flex flex-nowrap gap-2"
        role="radiogroup"
        aria-label="Workspace icon"
      >
        {WORKSPACE_ICON_OPTIONS.map(({ id, label, Icon }) => {
          const selected = value === id;
          return (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={selected}
              aria-label={label}
              disabled={disabled}
              onClick={() => onChange(id)}
              className={cn(
                "flex shrink-0 items-center justify-center rounded-xl border transition-colors outline-none",
                "focus-visible:ring-2 focus-visible:ring-ring/25 disabled:opacity-50",
                compact ? "size-9" : "size-10",
                selected
                  ? "border-primary bg-primary text-primary-foreground shadow-sm"
                  : "border-border/80 bg-background text-foreground hover:bg-secondary",
              )}
            >
              <Icon className="size-4" strokeWidth={1.5} />
            </button>
          );
        })}
      </div>
    </div>
  );
}
