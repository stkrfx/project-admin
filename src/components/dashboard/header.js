import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { UserNav } from "@/components/dashboard/user-nav";
import { NotificationsNav } from "@/components/dashboard/notifications-nav";
import { MobileSidebar } from "@/components/dashboard/mobile-sidebar"; // 1. Import
import { Brain } from "lucide-react";

export default async function Header() {
  const session = await getServerSession(authOptions);
  const user = session?.user;

  return (
    <header className="flex items-center justify-between px-6 py-3 border-b border-zinc-200 bg-white/80 backdrop-blur-md sticky top-0 z-40 h-16 w-full">
        
        {/* Left Side: Brand & Mobile Menu */}
        <div className="flex items-center gap-4 md:gap-6">
            
            {/* 2. Mobile Sidebar Trigger (Visible only on mobile) */}
            <MobileSidebar />

            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-900 text-white shadow-sm">
                    <Brain className="h-5 w-5" />
                </div>
                {/* Hide text on very small screens if needed, or keep it */}
                <span className="text-xl font-bold tracking-tight text-zinc-900 hidden sm:block">
                    Mindnamo
                </span>
            </Link>

            <div className="hidden md:block h-6 w-px bg-zinc-200" />

            <div className="hidden md:flex flex-col justify-center">
                <h2 className="text-sm font-semibold text-zinc-900 leading-none">
                    Expert Portal
                </h2>
                <p className="text-xs text-zinc-500 mt-1">
                    Welcome back, <span className="font-medium text-zinc-700">{user?.name?.split(" ")[0] || "Expert"}</span>
                </p>
            </div>
        </div>

        {/* Right Side: Actions */}
        <div className="flex items-center gap-x-2">
            <NotificationsNav />
            <UserNav user={user} />
        </div>
    </header>
  );
}