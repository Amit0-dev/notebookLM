"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { FixedColumn } from "@/components/layout/fixed-column";
import { ThemeToggle } from "@/components/theme-toggle";
import { authClient } from "@/lib/auth-client";
import { fadeUp, sealMarkEntrance, sealPress } from "@/lib/motion";
import { cn } from "@/lib/utils";

type AuthMode = "signin" | "signup";

function GoogleMark({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 48 48"
      aria-hidden="true"
      focusable="false"
    >
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 8 3l5.7-5.7C34.2 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.5-.4-3.5z"
      />
      <path
        fill="#FF3D00"
        d="M6.3 14.7l6.6 4.8C14.6 16.1 18.9 12 24 12c3.1 0 5.8 1.1 8 3l5.7-5.7C34.2 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.3 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.3 4.2-4.1 5.6l.1.1 6.2 5.2c-.4.4 6.5-4.7 6.5-14.4 0-1.3-.1-2.5-.4-3.5z"
      />
    </svg>
  );
}

function SealMark({ className }: { className?: string }) {
  return (
    <motion.span
      className={cn(
        "inline-flex size-9 shrink-0 items-center justify-center bg-primary font-heading text-[0.8rem] font-bold tracking-wide text-primary-foreground shadow-[2px_2px_0_0_color-mix(in_srgb,var(--foreground)_18%,transparent)]",
        className,
      )}
      aria-hidden="true"
      {...sealMarkEntrance}
    >
      印
    </motion.span>
  );
}

export function AuthPanel({ initialMode = "signin" }: { initialMode?: AuthMode }) {
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(
    searchParams.get("error")
      ? "Sign-in didn’t complete. Try again, or use a different Google account."
      : null,
  );

  const isSignUp = mode === "signup";
  const heading = isSignUp ? "Create your desk" : "Return to your desk";
  const supporting = isSignUp
    ? "Open a ShelfLM workspace. Feed sources. Chat with what you keep."
    : "Continue where your sources and conversations wait.";
  const cta = isSignUp ? "Continue with Google" : "Sign in with Google";

  async function handleGoogle() {
    setError(null);
    setPending(true);

    try {
      const result = await authClient.signIn.social({
        provider: "google",
        callbackURL: "/dashboard",
        errorCallbackURL: "/login?error=1",
      });

      if (result.error) {
        setError(
          result.error.message ??
            "Google sign-in failed. Check your connection and try again.",
        );
        setPending(false);
      }
    } catch {
      setError("Google sign-in failed. Check your connection and try again.");
      setPending(false);
    }
  }

  return (
    <div className="relative flex min-h-full flex-1 flex-col justify-center py-16">
      <FixedColumn as="main" className="flex flex-col gap-10">
        <motion.header
          className="flex items-start justify-between gap-4 border-b border-border pb-5"
          {...fadeUp}
        >
          <div className="min-w-0">
            <Link
              href="/"
              className="font-heading text-2xl font-semibold tracking-[-0.02em] text-foreground"
            >
              ShelfLM
            </Link>
            <p className="mt-1 font-mono text-[0.65rem] tracking-[0.14em] text-muted-foreground uppercase">
              Learning workspace
            </p>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <SealMark />
          </div>
        </motion.header>

        <motion.div
          className="flex flex-col gap-3"
          key={mode}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.36, ease: [0.16, 1, 0.3, 1] }}
        >
          <h1 className="font-heading text-[1.75rem] leading-tight font-semibold tracking-[-0.02em] text-balance">
            {heading}
          </h1>
          <p className="max-w-[36ch] text-[0.95rem] leading-relaxed text-muted-foreground">
            {supporting}
          </p>
        </motion.div>

        <motion.div className="flex flex-col gap-4" {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.06 }}>
          <motion.button
            type="button"
            onClick={handleGoogle}
            disabled={pending}
            className={cn(
              "group relative flex h-12 w-full items-center justify-center gap-3 border border-primary bg-primary px-4 text-sm font-medium text-primary-foreground outline-none",
              "hover:brightness-[0.96] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
              "disabled:cursor-wait disabled:opacity-80",
            )}
            {...sealPress}
          >
            <span
              className="pointer-events-none absolute top-1.5 right-1.5 size-2 rounded-[1px] bg-[var(--ring)] opacity-90"
              aria-hidden="true"
            />
            <GoogleMark className="size-4 shrink-0" />
            <span>{pending ? "Opening Google…" : cta}</span>
          </motion.button>

          <div
            className="flex items-center gap-3 font-mono text-[0.7rem] tracking-[0.08em] text-muted-foreground uppercase"
            role="tablist"
            aria-label="Account mode"
          >
            <button
              type="button"
              role="tab"
              aria-selected={!isSignUp}
              onClick={() => {
                setMode("signin");
                setError(null);
              }}
              className={cn(
                "border-b border-transparent pb-1 transition-colors outline-none focus-visible:border-ring",
                !isSignUp
                  ? "border-foreground text-foreground"
                  : "hover:text-foreground",
              )}
            >
              Sign in
            </button>
            <span aria-hidden="true" className="text-border">
              /
            </span>
            <button
              type="button"
              role="tab"
              aria-selected={isSignUp}
              onClick={() => {
                setMode("signup");
                setError(null);
              }}
              className={cn(
                "border-b border-transparent pb-1 transition-colors outline-none focus-visible:border-ring",
                isSignUp
                  ? "border-foreground text-foreground"
                  : "hover:text-foreground",
              )}
            >
              Sign up
            </button>
          </div>
        </motion.div>

        <AnimatePresence mode="wait">
          {error ? (
            <motion.div
              key="error"
              role="alert"
              className="border border-primary/40 bg-[color-mix(in_srgb,var(--primary)_8%,transparent)] px-3 py-3"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            >
              <p className="font-mono text-[0.7rem] tracking-[0.12em] text-primary uppercase">
                Seal incomplete
              </p>
              <p className="mt-1.5 text-sm leading-relaxed text-foreground">
                {error}
              </p>
            </motion.div>
          ) : null}
        </AnimatePresence>

        <p className="border-t border-border pt-5 text-xs leading-relaxed text-muted-foreground">
          By continuing you open a ShelfLM account with Google. Landing page
          comes later — this gate is the entrance.
        </p>
      </FixedColumn>
    </div>
  );
}
