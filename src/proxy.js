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

export default async function middleware(req) {
  const { pathname } = req.nextUrl;
  const ip = req.ip || "127.0.0.1";

  /* -------------------------------------------------------------
   * 1. RATE LIMIT public endpoints
   * ------------------------------------------------------------- */
  const publicRateLimited = ["/api", "/login", "/register"];
  if (publicRateLimited.some((p) => pathname.startsWith(p))) {
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

  /* -------------------------------------------------------------
   * 2. PUBLIC ROUTES (NO AUTH REQUIRED)
   * ------------------------------------------------------------- */
  const publicRoutes = [
    "/login",
    "/register",
    "/verify-email",
    "/forgot-password",
    "/reset-password",
    "/api/public",           // NEW: Explicitly public API namespace
    "/api/webhook",          // Webhooks shouldn't require auth
  ];

  const isPublicRoute = publicRoutes.some((route) =>
    pathname.startsWith(route)
  );

  /* -------------------------------------------------------------
   * 3. GET AUTH TOKEN
   * ------------------------------------------------------------- */
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  });

  /* -------------------------------------------------------------
   * 4. PROTECT API ROUTES — DEFAULT DENY
   * ------------------------------------------------------------- */
  if (pathname.startsWith("/api")) {
    const apiIsPublic = publicRoutes.some((r) => pathname.startsWith(r));

    // ❌ PRIVATE API ROUTE WITHOUT AUTH → reject
    if (!token && !apiIsPublic) {
      return new NextResponse("Unauthorized API access", { status: 401 });
    }
  }

  /* -------------------------------------------------------------
   * 5. AUTH PAGE ACCESS RULES
   * ------------------------------------------------------------- */
  if (token && isPublicRoute) {
    // Already logged in → redirect to dashboard
    return NextResponse.redirect(new URL("/", req.url));
  }

  /* -------------------------------------------------------------
   * 6. PROTECT ALL NON-PUBLIC PAGES
   * ------------------------------------------------------------- */
  if (!token && !isPublicRoute && !pathname.startsWith("/api")) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
}

/* -------------------------------------------------------------
 * 7. MATCHER CONFIG
 * ------------------------------------------------------------- */
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
