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
  session: { 
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  cookies: {
    sessionToken: {
      name: "next-auth.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
    callbackUrl: {
      name: "next-auth.callback-url",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
    csrfToken: {
      name: "next-auth.csrf-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
  useSecureCookies: process.env.NODE_ENV === "production",
  trustHost: true,
  callbacks: {
    async session({ token, session }) {
      if (token.sub && session.user) {
        session.user.id = token.sub
      }

      if (session.user) {
        session.user.name = token.name
        session.user.email = token.email!
        session.user.role = token.role as any
        session.user.language = token.language as any
        session.user.phone = token.phone as any
      }

      return session
    },
    async jwt({ token, user }) {
      if (!token.sub) return token

      try {
        const existingUser = await prisma.user.findUnique({
          where: { id: token.sub },
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            language: true,
            phone: true,
          }
        })

        if (!existingUser) {
          console.log(`[NextAuth] User not found for token.sub: ${token.sub}`)
          return token
        }

        token.name = existingUser.name
        token.email = existingUser.email
        token.role = existingUser.role
        token.language = existingUser.language
        token.phone = existingUser.phone

        return token
      } catch (error) {
        console.error('[NextAuth] JWT callback error:', error)
        return token
      }
    },
  },
  ...authConfig,
})