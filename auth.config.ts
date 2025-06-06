import type { NextAuthConfig } from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { compare } from "bcryptjs"
import { loginSchema } from "@/lib/validations/auth"
import { PrismaClient } from "@prisma/client"

export default {
  providers: [
    Credentials({
      async authorize(credentials) {
        const validatedFields = loginSchema.safeParse(credentials)
        
        if (!validatedFields.success) {
          return null
        }
        
        const { email, password } = validatedFields.data
        
        // Create new Prisma instance for each auth attempt
        const prisma = new PrismaClient()
        
        try {
          const user = await prisma.user.findUnique({
            where: { email },
            select: {
              id: true,
              email: true,
              password: true,
              firstName: true,  // Maps to 'name' column
              lastName: true,
              role: true,
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
          
          // Use firstName (which is mapped to name column)
          const displayName = user.firstName || user.email.split('@')[0]
          
          return {
            id: user.id,
            email: user.email,
            name: displayName,
            role: user.role,
          }
        } finally {
          await prisma.$disconnect()
        }
      }
    })
  ],
  debug: false,
} satisfies NextAuthConfig