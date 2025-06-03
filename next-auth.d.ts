import { UserRole, Language } from "@prisma/client"
import { DefaultSession } from "next-auth"

export type ExtendedUser = DefaultSession["user"] & {
  id: string
  firstName?: string | null
  lastName?: string | null
  phone?: string | null
  role: UserRole
  language: Language
}

declare module "next-auth" {
  interface Session {
    user: ExtendedUser
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    firstName?: string | null
    lastName?: string | null
    phone?: string | null
    role?: UserRole
    language?: Language
  }
}