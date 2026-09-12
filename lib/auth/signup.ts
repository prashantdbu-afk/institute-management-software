import { z } from "zod"

export const publicSignupSchema = z
  .object({
    email: z.string().email(),
    password: z.string().min(8),
    firstName: z.string().trim().min(1).max(100),
    lastName: z.string().trim().min(1).max(100),
  })
  .strict()

export type PublicSignupInput = z.infer<typeof publicSignupSchema>
