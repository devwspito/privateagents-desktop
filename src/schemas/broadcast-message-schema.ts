import { z } from "zod"

export const BroadcastMessageSchema = z.object({
  from_agent_id: z
    .string()
    .min(1, { message: "Please select a sender agent." }),
  department_id: z
    .string()
    .min(1, { message: "Please select a target department." }),
  subject: z
    .string()
    .trim()
    .max(200, { message: "Subject must contain at most 200 characters." })
    .optional(),
  body: z
    .string()
    .trim()
    .min(1, { message: "Message body is required." })
    .max(10000, {
      message: "Message body must contain at most 10000 characters.",
    }),
  message_type: z
    .enum(["notification", "task", "request", "alert", "info"])
    .optional(),
  priority: z.enum(["low", "medium", "high"]).optional(),
})

export type BroadcastMessageFormType = z.infer<typeof BroadcastMessageSchema>
