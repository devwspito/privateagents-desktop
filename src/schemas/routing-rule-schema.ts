import { z } from "zod"

export const CHANNEL_VALUES = [
  "whatsapp",
  "telegram",
  "slack",
  "discord",
  "webchat",
  "signal",
  "matrix",
  "email",
] as const
export type ChannelType = (typeof CHANNEL_VALUES)[number]

export const RoutingRuleSchema = z.object({
  channel: z.enum(CHANNEL_VALUES, {
    required_error: "Please select a channel.",
  }),
  pattern: z
    .string()
    .trim()
    .max(500, { message: "Pattern must contain at most 500 characters." })
    .optional()
    .or(z.literal("")),
  keywords: z
    .string()
    .trim()
    .max(1000, { message: "Keywords must contain at most 1000 characters." })
    .optional()
    .or(z.literal("")),
  agent_id: z.string().min(1, { message: "Please select an agent." }),
  department_id: z.string().optional().or(z.literal("")),
  priority: z
    .number()
    .int()
    .min(0, { message: "Priority must be at least 0." })
    .max(100, { message: "Priority must be at most 100." })
    .default(0),
})

export type RoutingRuleFormType = z.infer<typeof RoutingRuleSchema>

export const CHANNEL_OPTIONS = [
  { value: "whatsapp", label: "WhatsApp" },
  { value: "telegram", label: "Telegram" },
  { value: "slack", label: "Slack" },
  { value: "discord", label: "Discord" },
  { value: "webchat", label: "WebChat" },
  { value: "signal", label: "Signal" },
  { value: "matrix", label: "Matrix" },
  { value: "email", label: "Email" },
] as const
