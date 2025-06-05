import type { NextAuthConfig } from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { compare } from "bcryptjs"
import { prisma } from "@/lib/db"
import { loginSchema } from "@/lib/validations/auth"

export default {
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
            firstName: true,
            lastName: true,
            password: true,
            role: true,
            language: true,
            isActive: true,
          }
        })
        
        if (!user || !user.isActive) {
          console.log('User not found or inactive:', { email, found: !!user, active: user?.isActive })
          return null
        }
        
        const isValidPassword = await compare(password, user.password)
        
        if (!isValidPassword) {
          console.log('Password validation failed for:', email)
          return null
        }
        
        console.log('Login successful for:', email)
        
        return {
          id: user.id,
          email: user.email,
          name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
          role: user.role,
          language: user.language,
        }
      }
    })
  ],
  debug: false,
} satisfies NextAuthConfig