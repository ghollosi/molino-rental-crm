import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { PrismaClient } from "@prisma/client"
import authConfig from "./auth.config"

const prisma = new PrismaClient()

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
        user.role = token.role
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
          role: true,
        }
      })

      if (!existingUser) return token

      token.name = existingUser.email?.split('@')[0] || 'User'
      token.email = existingUser.email
      token.role = existingUser.role

      return token
    },
  },
  ...authConfig,
})