import NextAuth from "next-auth"
import authConfig from "./auth.config"

const { auth } = NextAuth(authConfig)

export default auth((req) => {
  const isLoggedIn = !!req.auth
  const isAuthRoute = req.nextUrl.pathname.startsWith("/login") || 
                     req.nextUrl.pathname.startsWith("/register")
  const isPublicRoute = req.nextUrl.pathname === "/" || 
                        req.nextUrl.pathname.startsWith("/api")
  const isDashboardRoute = req.nextUrl.pathname.startsWith("/dashboard")

  if (isAuthRoute) {
    if (isLoggedIn) {
      return Response.redirect(new URL("/dashboard", req.nextUrl))
    }
    return
  }

  if (!isLoggedIn && isDashboardRoute) {
    return Response.redirect(new URL("/login", req.nextUrl))
  }

  return
})

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
}