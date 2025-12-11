import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

// 1. General Auth Limiter (Login attempts)
export const authRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "15 m"), // 5 attempts per 15 min
  analytics: true,
  prefix: "ratelimit:auth",
});

// 2. OTP Sender Limiter (PREVENTS COST EXPLOSION)
// Strict: Only 3 OTPs per 10 minutes per email
export const otpRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(3, "10 m"), 
  analytics: true,
  prefix: "ratelimit:otp",
});