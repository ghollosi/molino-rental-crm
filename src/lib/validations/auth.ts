import { z } from "zod"

export const loginSchema = z.object({
  email: z.string().email({
    message: "Érvényes email címet adjon meg",
  }),
  password: z.string().min(6, {
    message: "A jelszónak legalább 6 karakter hosszúnak kell lennie",
  }),
})

export const registerSchema = z.object({
  name: z.string().min(2, {
    message: "A név legalább 2 karakter hosszú legyen",
  }),
  email: z.string().email({
    message: "Érvényes email címet adjon meg",
  }),
  password: z.string().min(6, {
    message: "A jelszónak legalább 6 karakter hosszúnak kell lennie",
  }),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "A jelszavak nem egyeznek",
  path: ["confirmPassword"],
})

export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>