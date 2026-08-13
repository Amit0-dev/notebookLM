export class ApiError extends Error {
  status: number;
  details?: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

/**
 * Same-origin API calls (Next rewrites /api/* → Express).
 * Keeps better-auth session cookies on the request.
 */
export async function api<T>(
  path: string,
  options: Omit<RequestInit, "body"> & { body?: unknown } = {},
): Promise<T> {
  const { body, headers, ...rest } = options;

  const response = await fetch(path, {
    ...rest,
    credentials: "include",
    headers: {
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const contentType = response.headers.get("content-type") ?? "";
  const isJson = contentType.includes("application/json");
  const payload = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    let message = `Request failed (${response.status})`;

    if (typeof payload === "object" && payload) {
      if ("error" in payload && typeof payload.error === "string") {
        message = payload.error;
      } else if ("message" in payload && typeof payload.message === "string") {
        message = payload.message;
      }
    }

    throw new ApiError(message, response.status, payload);
  }

  return payload as T;
}
