import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/**
 * Generates a cryptographically secure 6-digit OTP.
 * Uses Web Crypto API (globalThis.crypto) for randomness.
 */
export function generateSecureOtp(length = 6) {
  if (typeof globalThis.crypto !== 'undefined' && globalThis.crypto.getRandomValues) {
    const array = new Uint32Array(1);
    globalThis.crypto.getRandomValues(array);
    const otp = array[0] % (10 ** length);
    return otp.toString().padStart(length, '0');
  }
  
  // Fallback for older environments (unlikely in Next.js 16)
  return Math.floor(100000 + Math.random() * 900000).toString();
}