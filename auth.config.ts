import type { NextAuthConfig } from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { compare } from "bcryptjs"
import { prisma } from "@/lib/db"
import { loginSchema } from "@/lib/validations/auth"

export default {
  pages: {
    signIn: '/login',
  },
  providers: [
    Credentials({
      async authorize(credentials) {
        const validatedFields = loginSchema.safeParse(credentials)
        
        if (!validatedFields.success) {
          return null
        }
        
        const { email, password } = validatedFields.data
        
        const user = await prisma.user.findUnique({
          where: { email },
          select: {
            id: true,
            email: true,
            name: true,
            password: true,
            role: true,
            language: true,
            isActive: true,
          }
        })
        
        if (!user || !user.isActive) {
          return null
        }
        
        const isValidPassword = await compare(password, user.password)
        
        if (!isValidPassword) {
          return null
        }
        
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          language: user.language,
        }
      }
    })
  ],
  debug: process.env.NODE_ENV === "development",
} satisfies NextAuthConfig