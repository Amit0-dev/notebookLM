"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { ZenWash } from "@/components/art/zen-wash";
import { ShelfLogo } from "@/components/brand/shelf-logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { authClient } from "@/lib/auth-client";
import { getSafeAuthRedirect } from "@/lib/auth-redirect";
import { fadeUp } from "@/lib/motion";
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

export function AuthPanel({ initialMode = "signin" }: { initialMode?: AuthMode }) {
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(
    searchParams.get("error")
      ? "Sign-in didn't complete. Try again, or use a different Google account."
      : null,
  );

  const isSignUp = mode === "signup";
  const heading = isSignUp ? "Create account" : "Sign in";
  const supporting = isSignUp
    ? "Open a ShelfLM workspace. Feed sources. Chat with what you keep."
    : "Continue where your sources and conversations wait.";
  const cta = isSignUp ? "Continue with Google" : "Sign in with Google";
  const callbackURL = getSafeAuthRedirect(searchParams.get("next"));

  async function handleGoogle() {
    setError(null);
    setPending(true);

    try {
      const result = await authClient.signIn.social({
        provider: "google",
        callbackURL,
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
    <div className="flex min-h-full flex-1">
      <div className="relative hidden flex-1 flex-col justify-between overflow-hidden bg-secondary/50 p-10 lg:flex">
        <ZenWash className="absolute -right-8 bottom-0 h-64 w-full max-w-md opacity-80" />
        <ShelfLogo href="/" />
        <div className="relative z-10 max-w-md space-y-4">
          <h2 className="font-heading text-4xl leading-tight font-medium tracking-[-0.02em]">
            Your knowledge,{" "}
            <span className="font-semibold italic">organized beautifully.</span>
          </h2>
          <p className="text-[0.95rem] leading-relaxed text-muted-foreground">
            ShelfLM turns scattered sources into grounded conversations and
            learning you can act on.
          </p>
        </div>
        <p className="relative z-10 text-xs text-muted-foreground">
          Workspaces for sources, chat, and artifacts.
        </p>
      </div>

      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between px-6 py-5 lg:px-10">
          <ShelfLogo href="/" className="lg:hidden" />
          <div className="ml-auto">
            <ThemeToggle className="rounded-full" />
          </div>
        </header>

        <main className="flex flex-1 flex-col justify-center px-6 pb-12 lg:px-10">
          <motion.div
            className="mx-auto w-full max-w-md rounded-2xl border border-border/80 bg-card/80 p-8 shadow-sm backdrop-blur-sm"
            {...fadeUp}
          >
            <div className="mb-8 space-y-2">
              <h1 className="font-heading text-3xl font-medium tracking-[-0.02em]">
                {heading}
              </h1>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {supporting}
              </p>
            </div>

            <div className="mb-6 inline-flex w-full rounded-full bg-secondary/70 p-1">
              <button
                type="button"
                role="tab"
                aria-selected={!isSignUp}
                onClick={() => {
                  setMode("signin");
                  setError(null);
                }}
                className={cn(
                  "flex-1 rounded-full py-2 text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/25",
                  !isSignUp
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                Sign in
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={isSignUp}
                onClick={() => {
                  setMode("signup");
                  setError(null);
                }}
                className={cn(
                  "flex-1 rounded-full py-2 text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/25",
                  isSignUp
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                Sign up
              </button>
            </div>

            <motion.button
              type="button"
              onClick={handleGoogle}
              disabled={pending}
              className={cn(
                "flex h-12 w-full items-center justify-center gap-3 rounded-full bg-primary px-4 text-sm font-medium text-primary-foreground outline-none",
                "hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                "disabled:cursor-wait disabled:opacity-80",
              )}
              whileTap={pending ? undefined : { scale: 0.98 }}
            >
              <GoogleMark className="size-4 shrink-0" />
              <span>{pending ? "Opening Google…" : cta}</span>
            </motion.button>

            <AnimatePresence mode="wait">
              {error ? (
                <motion.div
                  key="error"
                  role="alert"
                  className="mt-4 rounded-xl border border-destructive/30 bg-destructive/8 px-4 py-3"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                >
                  <p className="text-sm leading-relaxed text-foreground">
                    {error}
                  </p>
                </motion.div>
              ) : null}
            </AnimatePresence>

            <p className="mt-8 text-center text-xs leading-relaxed text-muted-foreground">
              By continuing you agree to open a ShelfLM account with Google.{" "}
              <Link href="/dashboard" className="underline underline-offset-2">
                Learn more
              </Link>
            </p>
          </motion.div>
        </main>
      </div>
    </div>
  );
}
