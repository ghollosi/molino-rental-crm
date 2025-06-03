import { UserRole, Language } from '@prisma/client'
import NextAuth, { DefaultSession } from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      firstName?: string | null
      lastName?: string | null
      phone?: string | null
      role: UserRole
      language: Language
    } & DefaultSession['user']
  }

  interface User {
    id: string
    firstName?: string | null
    lastName?: string | null
    phone?: string | null
    role: UserRole
    language: Language
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    firstName?: string | null
    lastName?: string | null
    phone?: string | null
    role: UserRole
    language: Language
  }
}