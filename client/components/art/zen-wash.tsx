import { cn } from "@/lib/utils";

type ZenWashProps = {
  className?: string;
};

/** Soft sumi-e style wash — decorative only */
export function ZenWash({ className }: ZenWashProps) {
  return (
    <svg
      viewBox="0 0 480 280"
      className={cn("pointer-events-none select-none", className)}
      aria-hidden
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle
        cx="380"
        cy="72"
        r="48"
        className="fill-foreground/8 dark:fill-foreground/12"
      />
      <path
        d="M60 220 Q120 180 200 200 T360 190"
        className="stroke-foreground/10 dark:stroke-foreground/15"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M280 40 Q320 80 340 120 Q360 160 320 200"
        className="stroke-foreground/12 dark:stroke-foreground/18"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <ellipse
        cx="300"
        cy="200"
        rx="90"
        ry="28"
        className="fill-foreground/6 dark:fill-foreground/10"
      />
      <path
        d="M240 60 L248 52 M252 68 L260 60 M236 76 L244 68"
        className="stroke-foreground/15 dark:stroke-foreground/20"
        strokeWidth="1"
        strokeLinecap="round"
      />
      <path
        d="M200 100 Q220 90 240 95 Q260 100 270 115"
        className="stroke-foreground/10 dark:stroke-foreground/14"
        strokeWidth="1"
        fill="none"
      />
    </svg>
  );
}
