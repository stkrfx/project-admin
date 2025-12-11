"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, ArrowRight, Brain, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import { forgotPassword } from "@/actions/forgot-password";

const formSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
});

export default function ForgotPasswordForm() {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
    },
  });

  async function onSubmit(values) {
    setIsLoading(true);
    try {
      const result = await forgotPassword(values);
      
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Check your inbox", {
          description: result.success,
        });
        form.reset();
      }
    } catch (error) {
      toast.error("Something went wrong.");
    } finally {
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
          Reset Password
        </h1>
        <p className="text-sm text-zinc-500">
          Enter your email and we'll send you a recovery link.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    placeholder="name@example.com"
                    disabled={isLoading}
                    className="h-11 bg-zinc-50/50"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            className="w-full h-11 bg-zinc-900 hover:bg-zinc-800"
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <>
                Send Reset Link <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </form>
      </Form>

      <div className="text-center">
        <Link 
          href="/login"
          className="text-sm font-medium text-zinc-500 hover:text-zinc-900 flex items-center justify-center gap-2 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Login
        </Link>
      </div>
    </div>
  );
}