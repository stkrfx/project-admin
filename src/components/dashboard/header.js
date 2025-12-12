import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { UserNav } from "@/components/dashboard/user-nav";
import { NotificationsNav } from "@/components/dashboard/notifications-nav";
import { MobileSidebar } from "@/components/dashboard/mobile-sidebar";
import { Brain } from "lucide-react";
import { getDashboardContext } from "@/actions/dashboard";

// 🔥 Added imports
import connectDB from "@/lib/db";
import User from "@/models/User";

export default async function Header() {
    const session = await getServerSession(authOptions);

    // ❌ OLD:
    // const user = session?.user;

    // ✅ NEW: Always fetch fresh user from DB
    // [!code ++] START: Fetch fresh user data directly from DB
    await connectDB();
    let user = session?.user?.id
        ? await User.findById(session.user.id)
            .select("name email image username")
            .lean()
        : session?.user;

    // ⭐ FIX: Fully serialize user to convert ObjectId / Buffers → strings
    if (user) {
        user = JSON.parse(JSON.stringify(user));
    }
    // [!code ++] END

    const data = await getDashboardContext();
    const isLive = data?.profile?.isVetted;

    return (
        <header className="flex items-center justify-between px-6 py-3 border-b border-zinc-200 bg-white/80 backdrop-blur-md sticky top-0 z-40 h-16 w-full">

            {/* Left: Brand & Status */}
            <div className="flex items-center gap-4 md:gap-6">
                <MobileSidebar />
                <Link href="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-900 text-white shadow-sm">
                        <Brain className="h-5 w-5" />
                    </div>
                    <span className="text-xl font-bold tracking-tight text-zinc-900 hidden sm:block">
                        Mindnamo
                    </span>
                </Link>

                <div className="hidden md:block h-6 w-px bg-zinc-200" />

                {/* Live Status Indicator */}
                <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-50 border border-zinc-100">
                    {isLive ? (
                        <>
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </span>
                            <span className="text-xs font-medium text-zinc-600">Online</span>
                        </>
                    ) : (
                        <>
                            <div className="h-2 w-2 rounded-full bg-yellow-400" />
                            <span className="text-xs font-medium text-zinc-600">Unverified</span>
                        </>
                    )}
                </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2">
                <NotificationsNav data={data?.notifications || []} />
                <UserNav user={user} />
            </div>
        </header>
    );
}
