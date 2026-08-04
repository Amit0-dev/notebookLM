import { flattenError, type ZodError } from "zod"

export function getZodFieldErrors(err: ZodError) {
    return flattenError(err).fieldErrors
}