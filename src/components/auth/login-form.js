"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, Mail, Lock, ArrowRight, Brain, Eye, EyeOff } from "lucide-react";
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

const formSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
  password: z.string().min(1, { message: "Password is required." }),
});

export default function LoginForm() {
  const router = useRouter();
  
  // State is now 'null', 'google', or 'credentials' to differentiate loading source
  const [loadingType, setLoadingType] = useState(null); 
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const handleGoogleSignIn = async () => {
    setLoadingType("google");
    try {
      await signIn("google", { callbackUrl: "/" });
    } catch (error) {
      toast.error("Google Sign-In failed. Please try again.");
      setLoadingType(null);
    }
  };

  async function onSubmit(values) {
    setLoadingType("credentials");

    try {
      const res = await signIn("credentials", {
        redirect: false,
        email: values.email,
        password: values.password,
      });

      if (res?.error) {
        toast.error("Authentication Failed", {
          description: "Invalid email or password. Please try again.",
        });
        setLoadingType(null); // Only reset on error
      } else {
        toast.success("Welcome back!", {
          description: "Logged in successfully.",
        });
        router.push("/"); 
        router.refresh();
        // Don't reset loading here to prevent UI flash while redirecting
      }
    } catch (error) {
      toast.error("Error", {
        description: "Something went wrong. Please try again.",
      });
      setLoadingType(null);
    }
  }

  // Derived state for cleaner JSX
  const isLoading = !!loadingType;

  return (
    <div className="w-full max-w-md space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* 1. Branding */}
      <div className="flex flex-col items-center text-center space-y-2">
        <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-zinc-900 text-white shadow-lg mb-2">
          <Brain className="h-6 w-6" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
          Mindnamo
        </h1>
        <p className="text-sm text-zinc-500">
          Enter your credentials to access your expert account.
        </p>
      </div>

      <div className="space-y-4">
        {/* 2. Google Login with Controlled State */}
        <GoogleButton 
          onClick={handleGoogleSignIn}
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
                        disabled={isLoading} // Disable input
                        className="pl-9 h-11 bg-zinc-50/30 border-zinc-200 focus-visible:ring-zinc-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between">
                    <FormLabel className="text-zinc-700 font-medium">Password</FormLabel>
                    <Link 
                      href="/forgot-password" 
                      className={cn(
                        "text-xs font-medium text-zinc-500 hover:text-zinc-900 hover:underline transition-colors",
                        isLoading && "pointer-events-none opacity-50" // Disable Link
                      )}
                    >
                      Forgot password?
                    </Link>
                  </div>
                  
                  <FormControl>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        disabled={isLoading} // Disable input
                        className="pl-9 pr-10 h-11 bg-zinc-50/30 border-zinc-200 focus-visible:ring-zinc-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        {...field}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        disabled={isLoading} // Disable toggle
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
                  Signing In...
                </>
              ) : (
                <>
                  Sign In <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </form>
        </Form>
      </div>

      <div className="text-center text-sm text-zinc-500">
        Don&apos;t have an account?{" "}
        <Link
          href="/register"
          className={cn(
            "font-semibold text-zinc-900 hover:underline hover:text-zinc-700 transition-colors",
            isLoading && "pointer-events-none opacity-50" // Disable Link
          )}
        >
          Sign up
        </Link>
      </div>
    </div>
  );
}