import { Suspense } from "react";
import { AuthPanel } from "@/components/auth/auth-panel";

export const metadata = {
  title: "Sign in · ShelfLM",
  description: "Sign in or create your ShelfLM workspace.",
};

function AuthFallback() {
  return (
    <div className="flex min-h-full flex-1 items-center justify-center p-8">
      <div className="h-72 w-full max-w-md animate-pulse rounded-2xl bg-muted/60" />
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<AuthFallback />}>
      <AuthPanel />
    </Suspense>
  );
}
