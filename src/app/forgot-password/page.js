import ForgotPasswordForm from "@/components/auth/forgot-password-form";

export const metadata = {
  title: "Forgot Password | Mindnamo",
  description: "Reset your expert account password.",
};

export default function ForgotPasswordPage() {
  return (
    <div className="flex min-h-dvh w-full bg-white">
      {/* Left Side - Visuals */}
      <div className="hidden lg:flex w-1/2 bg-zinc-950 items-center justify-center relative overflow-hidden">
        <div 
          className="absolute inset-0 opacity-40 mix-blend-overlay bg-cover bg-center"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1555421689-491a97ff2040?q=80&w=2670&auto=format&fit=crop')" }}
        ></div>
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/90 via-zinc-950/50 to-zinc-950/30"></div>

        <div className="relative z-10 p-16 text-white max-w-xl">
          <h1 className="text-5xl font-bold tracking-tight mb-6 leading-[1.1]">
            Secure Access <br/> Recovery.
          </h1>
          <p className="text-zinc-400 text-lg leading-relaxed">
            Protecting your expert profile is our priority. Follow the steps to regain access to your dashboard safely.
          </p>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex w-full lg:w-1/2 items-center justify-center p-8 py-12 lg:p-16">
        <ForgotPasswordForm />
      </div>
    </div>
  );
}