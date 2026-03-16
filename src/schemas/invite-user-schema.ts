import { z } from "zod"

export const InviteUserSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(2, { message: "First Name must contain at least 2 characters." })
    .max(50, { message: "First Name must contain at most 50 characters." }),
  lastName: z
    .string()
    .trim()
    .min(2, { message: "Last Name must contain at least 2 characters." })
    .max(50, { message: "Last Name must contain at most 50 characters." }),
  email: z
    .string()
    .email({ message: "Invalid email address" })
    .toLowerCase()
    .trim(),
  role: z.enum(["admin", "member", "viewer"], {
    required_error: "Please select a role.",
  }),
  permissionProfile: z
    .enum(["operator", "viewer", "manager", "developer", "full"])
    .optional(),
})

export type InviteUserFormType = z.infer<typeof InviteUserSchema>
