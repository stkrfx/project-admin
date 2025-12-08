"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, User, Mail, Lock, ArrowRight, Brain, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GoogleButton } from "@/components/auth/google-button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

// Server Action
import { registerUser } from "@/actions/register";

const formSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Please enter a valid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
});

export default function RegisterForm() {
  const router = useRouter();
  
  // 'null' | 'google' | 'credentials'
  const [loadingType, setLoadingType] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
  });

  const handleGoogleSignUp = async () => {
    setLoadingType("google");
    try {
      await signIn("google", { callbackUrl: "/dashboard" });
    } catch (error) {
      toast.error("Google Sign-Up failed. Please try again.");
      setLoadingType(null);
    }
  };

  async function onSubmit(values) {
    setLoadingType("credentials");

    try {
      // Call Server Action directly
      const result = await registerUser(values);

      if (result.error) {
        toast.error(result.error);
        setLoadingType(null); // Reset only on error so user can retry
        return;
      }

      if (result.success) {
        toast.success("Account created!", {
          description: "Please verify your email address.",
        });

        // Redirect to the separate verification page with email param
        router.push(`/verify-email?email=${encodeURIComponent(values.email)}`);
        
        // Note: We intentionally DO NOT reset loadingType here. 
        // This keeps the form locked while the redirect happens, preventing double-clicks.
      }

    } catch (error) {
      toast.error("Something went wrong. Please try again.");
      setLoadingType(null);
    }
  }

  const isLoading = !!loadingType;

  return (
    <div className="w-full max-w-md space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Branding */}
      <div className="flex flex-col items-center text-center space-y-2">
        <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-zinc-900 text-white shadow-lg mb-2">
          <Brain className="h-6 w-6" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
          Join Mindnamo
        </h1>
        <p className="text-sm text-zinc-500">
          Create your expert account to get started.
        </p>
      </div>

      <div className="space-y-4">
        {/* Google Sign Up */}
        <GoogleButton 
          onClick={handleGoogleSignUp}
          isLoading={loadingType === "google"}
          disabled={isLoading} 
        />

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-zinc-200" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2 text-zinc-500">Or continue with</span>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            
            {/* Name Field */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-zinc-700 font-medium">Full Name</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                      <Input
                        placeholder="John Doe"
                        disabled={isLoading}
                        className="pl-9 h-11 bg-zinc-50/30 border-zinc-200 focus-visible:ring-zinc-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Email Field */}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-zinc-700 font-medium">Email</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                      <Input
                        placeholder="name@example.com"
                        disabled={isLoading}
                        className="pl-9 h-11 bg-zinc-50/30 border-zinc-200 focus-visible:ring-zinc-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Password Field */}
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-zinc-700 font-medium">Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        disabled={isLoading}
                        className="pl-9 pr-10 h-11 bg-zinc-50/30 border-zinc-200 focus-visible:ring-zinc-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        {...field}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        disabled={isLoading}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 transition-colors disabled:opacity-50"
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full h-11 bg-zinc-900 hover:bg-zinc-800 text-white font-medium shadow-lg shadow-zinc-900/10 transition-all duration-200"
              disabled={isLoading}
            >
              {loadingType === "credentials" ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Account...
                </>
              ) : (
                <>
                  Create Account <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </form>
        </Form>
      </div>

      <div className="text-center text-sm text-zinc-500">
        Already have an account?{" "}
        <Link
          href="/login"
          className={cn(
            "font-semibold text-zinc-900 hover:underline hover:text-zinc-700 transition-colors",
            isLoading && "pointer-events-none opacity-50"
          )}
        >
          Sign in
        </Link>
      </div>
    </div>
  );
}