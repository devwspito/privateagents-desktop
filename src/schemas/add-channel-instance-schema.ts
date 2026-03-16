import { z } from "zod"

export const AddChannelInstanceSchema = z.object({
  platform: z.string().min(1, { message: "Please select a platform." }),
  name: z
    .string()
    .trim()
    .max(100, { message: "Name must contain at most 100 characters." })
    .optional()
    .or(z.literal("")),
  bot_token: z
    .string()
    .trim()
    .max(500, { message: "Bot token must contain at most 500 characters." })
    .optional()
    .or(z.literal("")),
  access_token: z
    .string()
    .trim()
    .max(500, { message: "Access token must contain at most 500 characters." })
    .optional()
    .or(z.literal("")),
  homeserver_url: z
    .string()
    .trim()
    .url({ message: "Please enter a valid URL." })
    .max(500, {
      message: "Homeserver URL must contain at most 500 characters.",
    })
    .optional()
    .or(z.literal("")),
  default_agent_id: z
    .string()
    .min(1, { message: "Please select a default agent." }),
  auto_respond_offline: z.boolean().default(true),
})

export type AddChannelInstanceFormType = z.infer<
  typeof AddChannelInstanceSchema
>
