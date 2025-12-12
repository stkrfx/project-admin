import VerifyForm from "@/components/auth/verify-form";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Verify Email | Mindnamo",
  description: "Verify your email address to secure your account.",
};

export default async function VerifyEmailPage({ searchParams }) {
  const params = await searchParams;

  // NEW — Decode email safely
  let email = null;

  try {
    if (params?.data) {
      // Base64 decode (from register redirect)
      email = atob(params.data)?.trim()?.toLowerCase();
    } else if (params?.email) {
      // Backward compatibility (older URLs)
      email = params.email.trim().toLowerCase();
    }
  } catch (err) {
    // Bad or tampered Base64 → block access
    return redirect("/register");
  }

  // PAGE-LEVEL GUARD
  if (!email) {
    return redirect("/register");
  }

  return (
    <div className="flex min-h-dvh w-full bg-white">
      {/* Left Side - Visuals */}
      <div className="hidden lg:flex w-1/2 bg-zinc-950 items-center justify-center relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-40 mix-blend-overlay bg-cover bg-center"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1614064641938-3bcee529cfc4?q=80&w=2669&auto=format&fit=crop')",
          }}
        ></div>
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/90 via-zinc-950/50 to-zinc-950/30"></div>

        <div className="relative z-10 p-16 text-white max-w-xl">
          <div className="mb-6 inline-flex items-center rounded-full border border-zinc-700 bg-zinc-900/50 px-3 py-1 text-sm text-zinc-300 backdrop-blur-sm shadow-sm">
            <span className="flex h-2 w-2 rounded-full bg-blue-500 mr-2"></span>
            Security Check
          </div>
          <h1 className="text-5xl font-bold tracking-tight mb-6 leading-[1.1]">
            Protecting your <br /> digital assets.
          </h1>
          <p className="text-zinc-400 text-lg leading-relaxed">
            We require email verification to ensure your expert profile and
            revenue data remain secure and exclusive to you.
          </p>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex w-full lg:w-1/2 items-center justify-center p-8 py-12 lg:p-16">
        <VerifyForm email={email} />
      </div>
    </div>
  );
}
