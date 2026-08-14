import type { LucideIcon } from "lucide-react";
import {
  BarChart3Icon,
  BookOpenIcon,
  BriefcaseIcon,
  CodeIcon,
  SparklesIcon,
} from "lucide-react";

/** Short slug stored in DB — maps to a Lucide icon in the UI. */
export const WORKSPACE_ICON_IDS = [
  "book",
  "briefcase",
  "code",
  "chart",
  "sparkles",
] as const;

export type WorkspaceIconId = (typeof WORKSPACE_ICON_IDS)[number];

export const WORKSPACE_ICON_OPTIONS: {
  id: WorkspaceIconId;
  label: string;
  Icon: LucideIcon;
}[] = [
  { id: "book", label: "Reading", Icon: BookOpenIcon },
  { id: "briefcase", label: "Work", Icon: BriefcaseIcon },
  { id: "code", label: "Code", Icon: CodeIcon },
  { id: "chart", label: "Data", Icon: BarChart3Icon },
  { id: "sparkles", label: "AI", Icon: SparklesIcon },
];

export const DEFAULT_WORKSPACE_ICON: WorkspaceIconId = "book";

const iconById = Object.fromEntries(
  WORKSPACE_ICON_OPTIONS.map((option) => [option.id, option.Icon]),
) as Record<WorkspaceIconId, LucideIcon>;

export function isWorkspaceIconId(value: string): value is WorkspaceIconId {
  return (WORKSPACE_ICON_IDS as readonly string[]).includes(value);
}

export function getWorkspaceIconComponent(
  icon: string | null | undefined,
): LucideIcon | null {
  if (!icon?.trim()) return null;
  const key = icon.trim();
  return isWorkspaceIconId(key) ? iconById[key] : null;
}

export function getSuggestedWorkspaceIcon(seed?: string): WorkspaceIconId {
  const source = seed?.trim() || String(Date.now());
  let hash = 0;
  for (let i = 0; i < source.length; i++) {
    hash = source.charCodeAt(i) + ((hash << 5) - hash);
  }
  return WORKSPACE_ICON_IDS[Math.abs(hash) % WORKSPACE_ICON_IDS.length];
}
