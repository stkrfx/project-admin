import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// 1. Initialize Redis & Rate Limiter
// "Sliding Window" is the best algorithm for smoothing out traffic spikes
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

const ratelimit = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(10, "10 s"), // Allow 10 requests per 10 seconds
  analytics: true,
});

export default async function proxy(req) {
  const { pathname } = req.nextUrl;

  // --- LAYER 1: RATE LIMITING ---
  // We identify users by IP address
  const ip = req.ip || "127.0.0.1";
  
  // Only limit sensitive routes (API + Auth) to save database costs
  // Static assets (images, css) usually don't need strict limiting
  if (pathname.startsWith("/api") || pathname.startsWith("/login") || pathname.startsWith("/register")) {
    const { success, pending, limit, reset, remaining } = await ratelimit.limit(ip);
    
    // Block the request if limit exceeded
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

  // --- LAYER 2: ACCESS CONTROL (AUTH) ---
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  const authRoutes = ["/login", "/register", "/verify-email"];
  const protectedRoutes = ["/"];

  // SCENARIO A: Authenticated User -> Block Auth Pages
  if (token) {
    if (authRoutes.some((route) => pathname.startsWith(route))) {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  // SCENARIO B: Guest User -> Block Protected Pages
  if (!token) {
    if (protectedRoutes.some((route) => pathname.startsWith(route))) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
  }

  // Allow request to proceed
  return NextResponse.next();
}

// Configure paths
export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * 1. /_next (internal Next.js files)
     * 2. /static (static files)
     * 3. /favicon.ico, /sitemap.xml (public files)
     * * Note: We include /api here so we can rate limit it!
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};