import { z } from "zod"

export const CronJobSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { message: "Name is required." })
    .max(100, { message: "Name must contain at most 100 characters." }),
  schedule: z.string().trim().min(1, { message: "Schedule is required." }),
  command: z
    .string()
    .trim()
    .min(1, { message: "Command is required." })
    .max(1000, { message: "Command must contain at most 1000 characters." }),
  agent_id: z.string().optional().or(z.literal("")),
  enabled: z.boolean().default(true),
})

export type CronJobFormType = z.infer<typeof CronJobSchema>
