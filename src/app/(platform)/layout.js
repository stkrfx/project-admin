import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Header from "@/components/dashboard/header";

export default async function PlatformLayout({ children }) {
  const session = await getServerSession(authOptions);

  // Global Auth Guard: If not logged in, kick to login
  if (!session) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-dvh flex-col bg-zinc-50/50">
      {/* 1. Header is rendered ONCE here for all platform pages */}
      <Header />
      
      {/* 2. Children will be either the Dashboard Layout or Chat Pages */}
      <div className="flex-1 flex flex-col">
        {children}
      </div>
    </div>
  );
}