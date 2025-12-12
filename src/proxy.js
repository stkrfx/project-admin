import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// 1. SAFE INITIALIZATION (Prevents crash if env vars are missing)
let ratelimit;

try {
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });

    ratelimit = new Ratelimit({
      redis: redis,
      limiter: Ratelimit.slidingWindow(10, "10 s"),
      analytics: true,
    });
  }
} catch (error) {
  console.warn("Middleware Redis init failed (Rate Limiting disabled):", error.message);
}

export default async function middleware(req) {
  const { pathname } = req.nextUrl;

  /* -------------------------------------------------------------
 * 1. RATE LIMIT PUBLIC ENDPOINTS
 * ------------------------------------------------------------- */
const publicRateLimited = ["/api", "/login", "/register"];

// ⭐ FIX: Detect UploadThing routes
const isUploadThing = pathname.startsWith("/api/uploadthing");

// ⭐ FIX: Skip rate limiting for UploadThing
if (ratelimit && publicRateLimited.some((p) => pathname.startsWith(p)) && !isUploadThing) {
  const ip =
    req.ip ||
    req.headers.get("x-real-ip") ||
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "127.0.0.1";

  const { success, limit, remaining, reset } = await ratelimit.limit(ip);

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


  // -------------------------------------------------------------
  // 2. DEFINE ROUTE CATEGORIES
  // -------------------------------------------------------------
  
  // A: Auth Routes -> Only for guests. Redirect to / if logged in.
  const authRoutes = [
    "/login",
    "/register",
    "/verify-email",
    "/forgot-password",
    "/reset-password",
  ];

  // B: Public API Routes -> Available to everyone. NEVER redirect.
  const publicApiRoutes = [
    "/api/public",
    "/api/webhook",
    "/api/uploadthing", 
    "/api/auth", // Allow NextAuth
  ];

  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));
  const isPublicApiRoute = publicApiRoutes.some((route) => pathname.startsWith(route));

  // -------------------------------------------------------------
  // 3. READ AUTH TOKEN
  // -------------------------------------------------------------
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  });

  // -------------------------------------------------------------
  // 4. PROTECT PRIVATE API ROUTES
  // -------------------------------------------------------------
 // ⭐ Skip auth for UploadThing
if (pathname.startsWith("/api") && !isPublicApiRoute && !isUploadThing && !token) {
  return new NextResponse("Unauthorized API access", { status: 401 });
}


  // -------------------------------------------------------------
  // 5. AUTH PAGES BEHAVIOR (Guest Only)
  // -------------------------------------------------------------
  // If user is logged in and tries to hit /login or /register -> Redirect to Dashboard
  if (token && isAuthRoute) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  // -------------------------------------------------------------
  // 6. PROTECT APP PAGES
  // -------------------------------------------------------------
  // If NO token, NOT an auth page, and NOT a public API -> Redirect to Login
  if (!token && !isAuthRoute && !isPublicApiRoute) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
}

// -------------------------------------------------------------
// 7. MATCHER CONFIG
// -------------------------------------------------------------
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};