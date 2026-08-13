"use client";

import { MoonIcon, SunIcon } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ThemeToggleProps = {
  className?: string;
};

export function ThemeToggle({ className }: ThemeToggleProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && resolvedTheme === "dark";

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      className={cn("relative rounded-sm", className)}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      disabled={!mounted}
      onClick={() => setTheme(isDark ? "light" : "dark")}
    >
      <SunIcon
        className={cn(
          "size-4 transition-transform duration-300",
          isDark ? "scale-0 rotate-90" : "scale-100 rotate-0",
        )}
      />
      <MoonIcon
        className={cn(
          "absolute size-4 transition-transform duration-300",
          isDark ? "scale-100 rotate-0" : "scale-0 -rotate-90",
        )}
      />
    </Button>
  );
}
