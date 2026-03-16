import { z } from "zod"

export const TextMessageSchema = z.object({
  text: z
    .string()
    .trim()
    .min(1, "Message text cannot be empty")
    .max(2000, "Message text cannot exceed 2000 characters"),
})
