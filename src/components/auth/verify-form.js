"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, ArrowRight, Brain } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { REGEXP_ONLY_DIGITS } from "input-otp";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  InputOTPSeparator,
} from "@/components/ui/input-otp";

import { resendOtp } from "@/actions/resend";

const verifySchema = z.object({
  otp: z.string().min(6, { message: "Your code must be 6 digits." }),
});

export default function VerifyForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email");

  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const maskedEmail = email 
    ? email.replace(/^(.{2})(.*)(@.*)$/, (_, a, b, c) => a + "*".repeat(b.length) + c) 
    : "your email";

  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setInterval(() => setCountdown((prev) => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  const form = useForm({
    resolver: zodResolver(verifySchema),
    defaultValues: { otp: "" },
  });

  async function onResend() {
    if (countdown > 0) return;
    if (!email) {
        toast.error("Missing email address.");
        return;
    }
    
    // Set a small local load state for the resend button text
    setIsLoading(true); 
    try {
        const result = await resendOtp(email);

        if (result.error) {
            toast.error("Resend Failed", { description: result.error });
        } else {
            toast.success("Code resent!", { description: "Check your inbox." });
            setCountdown(60); 
        }
    } catch (error) {
        toast.error("Failed to resend code.");
    } finally {
        setIsLoading(false);
    }
  }

  async function onSubmit(values) {
    if (!email) {
      toast.error("Email missing. Please register again.");
      router.push("/register");
      return;
    }

    setIsLoading(true);

    try {
      // Login via NextAuth (calls auth.js authorize())
      const res = await signIn("credentials", {
        redirect: false,
        email: email,
        otp: values.otp,
      });

      if (res?.error) {
        toast.error("Verification Failed", {
            description: res.error === "Invalid OTP" ? "Incorrect code. Please try again." : res.error
        });
        form.reset();
        setIsLoading(false);
        return;
      }

      toast.success("Verified & Logged In!", {
        description: "Welcome to Mindnamo.",
      });

      router.push("/"); 
      router.refresh();

    } catch (error) {
      toast.error("Something went wrong. Please try again.");
      setIsLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <div className="flex flex-col items-center text-center space-y-2">
        <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-zinc-900 text-white shadow-lg mb-2">
          <Brain className="h-6 w-6" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
          Verify your email
        </h1>
        <p className="text-sm text-zinc-500 max-w-xs">
          Enter the 6-digit code sent to <span className="font-medium text-zinc-900">{maskedEmail}</span>
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 flex flex-col items-center">
          <FormField
            control={form.control}
            name="otp"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="sr-only">One-Time Password</FormLabel>
                <FormControl>
                  <InputOTP 
                    maxLength={6} 
                    pattern={REGEXP_ONLY_DIGITS}
                    disabled={isLoading}
                    {...field}
                    onComplete={() => form.handleSubmit(onSubmit)()}
                  >
                    <InputOTPGroup>
                      <InputOTPSlot index={0} className="h-12 w-12 text-lg" />
                      <InputOTPSlot index={1} className="h-12 w-12 text-lg" />
                      <InputOTPSlot index={2} className="h-12 w-12 text-lg" />
                    </InputOTPGroup>
                    <InputOTPSeparator />
                    <InputOTPGroup>
                      <InputOTPSlot index={3} className="h-12 w-12 text-lg" />
                      <InputOTPSlot index={4} className="h-12 w-12 text-lg" />
                      <InputOTPSlot index={5} className="h-12 w-12 text-lg" />
                    </InputOTPGroup>
                  </InputOTP>
                </FormControl>
                <FormDescription className="text-xs text-center">
                  Entering the code will automatically verify and log you in.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            className="w-full h-11 bg-zinc-900 hover:bg-zinc-800 text-white font-medium shadow-lg"
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <>
                Verify & Login <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </form>
      </Form>

      <div className="text-center text-sm text-zinc-500">
        Didn&apos;t receive code?{" "}
        <button
          type="button"
          onClick={onResend}
          disabled={isLoading || countdown > 0}
          className={cn(
            "font-semibold text-zinc-900 hover:underline hover:text-zinc-700 transition-colors",
            (isLoading || countdown > 0) && "opacity-50 cursor-not-allowed no-underline"
          )}
        >
          {countdown > 0 ? `Resend in ${countdown}s` : "Resend"}
        </button>
      </div>
      
      <div className="text-center">
         <button 
            onClick={() => router.push("/register")}
            className="text-xs text-zinc-400 hover:text-zinc-600 transition-colors"
         >
            Wrong email? Change address
         </button>
      </div>
    </div>
  );
}