import type { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

/**
 * Same-origin streaming proxy for workspace chat.
 * Next.js rewrites buffer SSE; this route pipes the Express UI message stream through.
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ workspaceId: string }> },
) {
  const { workspaceId } = await context.params;
  const body = await request.text();

  const upstream = await fetch(
    `${apiUrl}/api/v1/workspace/${workspaceId}/chat`,
    {
      method: "POST",
      headers: {
        Accept:
          request.headers.get("accept") ?? "text/event-stream",
        "Content-Type":
          request.headers.get("content-type") ?? "application/json",
        Cookie: request.headers.get("cookie") ?? "",
      },
      body,
      cache: "no-store",
    },
  );

  const headers = new Headers();
  const passThrough = [
    "content-type",
    "x-vercel-ai-ui-message-stream",
    "x-conversation-id",
  ] as const;

  for (const name of passThrough) {
    const value = upstream.headers.get(name);
    if (value) headers.set(name, value);
  }

  // Prevent Next/proxy compression from buffering the whole SSE payload.
  headers.set("Cache-Control", "no-cache, no-transform");
  headers.set("Content-Encoding", "none");
  headers.set("X-Accel-Buffering", "no");

  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers,
  });
}
