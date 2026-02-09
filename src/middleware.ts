import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"

export async function middleware(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET
  })

  const { pathname } = request.nextUrl

  // Protected routes that require authentication
  const protectedRoutes = [
    "/dashboard",
    "/finans",
    "/projeler",
    "/gorevler",
    "/raporlama",
    "/takim",
    "/ayarlar"
  ]

  // Check if the current path is a protected route
  const isProtectedRoute = protectedRoutes.some(route =>
    pathname.startsWith(route)
  )

  // Redirect unauthenticated users to login
  if (isProtectedRoute && !token) {
    const url = new URL("/giris", request.url)
    url.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(url)
  }

  // Allow authenticated users to proceed
  return NextResponse.next()
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/finans/:path*",
    "/projeler/:path*",
    "/gorevler/:path*",
    "/raporlama/:path*",
    "/takim/:path*",
    "/ayarlar/:path*"
  ]
}
