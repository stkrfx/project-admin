import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// ----------------------------
// 1. SAFE REDIS INITIALIZATION
// ----------------------------
let redis;

try {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    console.warn("⚠️  Redis environment variables missing — rate limiting disabled.");
  } else {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
  }
} catch (err) {
  console.error("❌ Redis initialization failed. Rate limiting disabled.", err);
  redis = null;
}

// ----------------------------
// 2. FALLBACK LIMITER (NOOP)
// ----------------------------
const noopLimiter = {
  limit: async () => ({
    success: true,
    remaining: 9999,
    reset: Date.now() + 60_000,
    limit: 9999,
  }),
};

// Helper to avoid crashes
const createLimiter = (config) =>
  redis ? new Ratelimit({ redis, ...config }) : noopLimiter;

// ----------------------------
// 3. ACTUAL RATE LIMITERS
// ----------------------------

// Login / password attempts
export const authRateLimit = createLimiter({
  limiter: Ratelimit.slidingWindow(5, "15 m"),
  analytics: true,
  prefix: "ratelimit:auth",
});

// OTP sending — prevents abuse cost
export const otpRateLimit = createLimiter({
  limiter: Ratelimit.slidingWindow(3, "10 m"),
  analytics: true,
  prefix: "ratelimit:otp",
});
