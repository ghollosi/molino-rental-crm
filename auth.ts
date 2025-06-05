import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/db"
import authConfig from "./auth.config"

export const {
  handlers,
  auth,
  signIn,
  signOut,
} = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    async session({ token, session }) {
      if (token.sub && session.user) {
        session.user.id = token.sub
        
        // Explicit assignment to ensure fields are included
        const user = session.user as any
        user.name = token.name
        user.email = token.email
        user.phone = token.phone
        user.role = token.role
        user.language = token.language
      }

      return session
    },
    async jwt({ token, user }) {
      if (!token.sub) return token

      const existingUser = await prisma.user.findUnique({
        where: { id: token.sub },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          role: true,
          language: true,
        }
      })

      if (!existingUser) return token

      token.name = `${existingUser.firstName || ''} ${existingUser.lastName || ''}`.trim() || existingUser.email?.split('@')[0] || 'User'
      token.email = existingUser.email
      token.phone = existingUser.phone
      token.role = existingUser.role
      token.language = existingUser.language

      return token
    },
  },
  ...authConfig,
})