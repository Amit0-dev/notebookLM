import { cn } from "@/lib/utils";

/** Narrow column — auth & focused forms */
export const SHELF_COLUMN = "w-full max-w-[26.25rem]"; // 420px

/** Wide canvas — dashboard & multi-panel operate surfaces */
export const SHELF_CANVAS = "w-full max-w-[80rem]"; // 1440px — inspiration + extra width

type ShellProps = {
  children: React.ReactNode;
  className?: string;
  as?: "div" | "main" | "section";
};

export function FixedColumn({
  children,
  className,
  as: Comp = "div",
}: ShellProps) {
  return (
    <Comp className={cn("mx-auto px-6", SHELF_COLUMN, className)}>
      {children}
    </Comp>
  );
}

export function DeskCanvas({
  children,
  className,
  as: Comp = "div",
}: ShellProps) {
  return (
    <Comp
      className={cn(
        "mx-auto w-full px-5 sm:px-8 lg:px-12",
        SHELF_CANVAS,
        className,
      )}
    >
      {children}
    </Comp>
  );
}
