import type { LucideIcon } from "lucide-react";
import { BookOpenIcon } from "lucide-react";
import { getWorkspaceIconComponent } from "@/lib/workspace-icons";
import { cn } from "@/lib/utils";

type WorkspaceIconProps = {
  icon?: string | null;
  fallbackIcon?: LucideIcon;
  className?: string;
  iconClassName?: string;
};

export function WorkspaceIcon({
  icon,
  fallbackIcon: FallbackIcon = BookOpenIcon,
  className,
  iconClassName,
}: WorkspaceIconProps) {
  const IconComponent = getWorkspaceIconComponent(icon);

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center",
        className,
      )}
      aria-hidden
    >
      {IconComponent ? (
        <IconComponent className={cn("size-5", iconClassName)} strokeWidth={1.5} />
      ) : icon?.trim() ? (
        <span className={cn("text-lg leading-none", iconClassName)}>
          {icon.trim()}
        </span>
      ) : (
        <FallbackIcon className={cn("size-5", iconClassName)} strokeWidth={1.5} />
      )}
    </span>
  );
}
