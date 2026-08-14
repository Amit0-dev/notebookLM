import Link from "next/link";
import { SparklesIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type ShelfLogoProps = {
  className?: string;
  href?: string;
};

export function ShelfLogo({ className, href = "/dashboard" }: ShelfLogoProps) {
  const content = (
    <>
      <span className="flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
        <SparklesIcon className="size-4" aria-hidden />
      </span>
      <span className="font-heading text-lg font-semibold tracking-[-0.02em]">
        ShelfLM
      </span>
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className={cn("inline-flex items-center gap-2.5", className)}
      >
        {content}
      </Link>
    );
  }

  return (
    <div className={cn("inline-flex items-center gap-2.5", className)}>
      {content}
    </div>
  );
}
