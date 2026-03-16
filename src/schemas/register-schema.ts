import { z } from "zod"

export const RegisterSchema = z.object({
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
  companyName: z
    .string()
    .trim()
    .min(2, { message: "Company Name must contain at least 2 characters." })
    .max(100, { message: "Company Name must contain at most 100 characters." }),
  email: z
    .string()
    .email({ message: "Invalid email address" })
    .toLowerCase()
    .trim(),
  password: z.string().min(6, {
    message: "Password must contain at least 6 characters",
  }),
})
