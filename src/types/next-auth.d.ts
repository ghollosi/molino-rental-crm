import { UserRole, Language } from '@prisma/client'
import NextAuth, { DefaultSession } from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      role: UserRole
      language: Language
      phone?: string | null
    } & DefaultSession['user']
  }

  interface User {
    id: string
    role: UserRole
    language: Language
    phone?: string | null
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role: UserRole
    language: Language
    phone?: string | null
  }
}