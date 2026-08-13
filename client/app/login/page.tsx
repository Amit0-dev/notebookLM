import { Suspense } from "react";
import { AuthPanel } from "@/components/auth/auth-panel";
import { FixedColumn } from "@/components/layout/fixed-column";

export const metadata = {
  title: "Sign in · ShelfLM",
  description: "Sign in or create your ShelfLM desk.",
};

function AuthFallback() {
  return (
    <div className="flex min-h-full flex-1 flex-col justify-center py-16">
      <FixedColumn>
        <div className="h-40 animate-pulse border border-border bg-secondary/60" />
      </FixedColumn>
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
