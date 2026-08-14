export const WORKSPACE_CARD_VARIANTS = [
  "navy",
  "beige",
  "green",
  "peach",
] as const;

export type WorkspaceCardVariant = (typeof WORKSPACE_CARD_VARIANTS)[number];

export function getWorkspaceCardVariant(id: string): WorkspaceCardVariant {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  return WORKSPACE_CARD_VARIANTS[Math.abs(hash) % WORKSPACE_CARD_VARIANTS.length];
}

export const workspaceCardStyles: Record<WorkspaceCardVariant, string> = {
  navy: "bg-[#1a1c2e] text-[#f8f6f2] border-transparent dark:bg-[#2a2f4a] dark:text-[#f0ede8] dark:border-[#3d4466]",
  beige:
    "bg-[#f5efe6] text-[#1a1c2e] border-[#e8e0d4] dark:bg-[#2a2824] dark:text-[#f0ede8] dark:border-[#3a3834]",
  green:
    "bg-[#4b5d52] text-[#f8f6f2] border-transparent dark:bg-[#3d4f47] dark:text-[#f0ede8] dark:border-[#4a5c54]",
  peach:
    "bg-[#fde8d8] text-[#1a1c2e] border-[#f5d4c0] dark:bg-[#4a3d38] dark:text-[#f0ede8] dark:border-[#5c4a44]",
};

export const workspaceCardMetaMuted: Record<WorkspaceCardVariant, string> = {
  navy: "text-[#f8f6f2]/70 dark:text-[#f0ede8]/70",
  beige: "text-[#1a1c2e]/70 dark:text-[#f0ede8]/70",
  green: "text-[#f8f6f2]/70 dark:text-[#f0ede8]/70",
  peach: "text-[#1a1c2e]/70 dark:text-[#f0ede8]/70",
};
