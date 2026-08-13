import { ZodError } from "zod";
import { ApiError } from "@/lib/api/client";

/**
 * Short, user-safe message. Never surfaces stacks or Zod dumps.
 */
export function getUserFacingError(
  err: unknown,
  fallback = "Something went wrong. Please try again.",
): string {
  if (err instanceof ApiError) {
    if (err.status === 401) return "Please sign in again to continue.";
    if (err.status === 403) return "You don’t have permission to do that.";
    if (err.status === 404) return "We couldn’t find that item.";
    if (err.status >= 500) return "The server had a problem. Please try again shortly.";
    return err.message || fallback;
  }

  if (err instanceof ZodError) {
    return "We couldn’t read the server response. Please try again.";
  }

  if (err instanceof Error) {
    const msg = err.message.trim();
    if (
      !msg ||
      msg.length > 160 ||
      msg.includes("\n") ||
      msg.includes("    at ") ||
      /zod|validation|\[\{/i.test(msg)
    ) {
      return fallback;
    }
    return msg;
  }

  return fallback;
}
