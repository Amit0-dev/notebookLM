import { z } from "zod";

/** Parse unknown input; throw a short Error on failure (no Zod dumps). */
export function parseWithZod<T extends z.ZodType>(
  schema: T,
  data: unknown,
  label = "Validation failed",
): z.infer<T> {
  const result = schema.safeParse(data);

  if (!result.success) {
    if (label.toLowerCase().includes("invalid")) {
      throw new Error("We couldn’t read the server response. Please try again.");
    }

    const first = result.error.issues[0];
    const detail = first?.message ?? "Invalid input";
    throw new Error(detail);
  }

  return result.data;
}

export function fieldErrors(error: z.ZodError): Record<string, string> {
  const fields: Record<string, string> = {};

  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_form";
    if (!fields[key]) {
      fields[key] = issue.message;
    }
  }

  return fields;
}
