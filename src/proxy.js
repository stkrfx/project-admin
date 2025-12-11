import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

const ratelimit = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(10, "10 s"),
  analytics: true,
});

export default async function proxy(req) {
  const { pathname } = req.nextUrl;
  const ip = req.ip || "127.0.0.1";

  // 1. Rate Limiting
  if (pathname.startsWith("/api") || pathname.startsWith("/login") || pathname.startsWith("/register")) {
    const { success, limit, reset, remaining } = await ratelimit.limit(ip);
    if (!success) {
      return new NextResponse("Too Many Requests", {
        status: 429,
        headers: {
          "X-RateLimit-Limit": limit.toString(),
          "X-RateLimit-Remaining": remaining.toString(),
          "X-RateLimit-Reset": reset.toString(),
        },
      });
    }
  }

  // 2. Auth Logic
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  
  // FIX: Add Forgot/Reset password pages to the allowlist
  const publicRoutes = [
    "/login", 
    "/register", 
    "/verify-email", 
    "/forgot-password", 
    "/reset-password" // Important for the email link!
  ];
  
  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route));

  // SCENARIO A: Authenticated User on Auth Page -> Redirect to Dashboard
  if (token && isPublicRoute) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  // SCENARIO B: Guest User on Protected Page -> Redirect to Login
  if (!token && !isPublicRoute && !pathname.startsWith("/api")) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};