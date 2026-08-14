/**
 * Safe post-login redirect — only allow dashboard routes.
 */
export function getSafeAuthRedirect(next: string | null | undefined): string {
  if (!next) return "/dashboard";
  if (!next.startsWith("/dashboard")) return "/dashboard";
  if (next.startsWith("//")) return "/dashboard";
  return next;
}
