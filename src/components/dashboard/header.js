import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { UserNav } from "@/components/dashboard/user-nav";
import { NotificationsNav } from "@/components/dashboard/notifications-nav";
import { MobileSidebar } from "@/components/dashboard/mobile-sidebar";
import { Brain, MessageSquare } from "lucide-react"; // [!code ++]
import { getDashboardContext } from "@/actions/dashboard";

import connectDB from "@/lib/db";
import User from "@/models/User";

export default async function Header() {
  const session = await getServerSession(authOptions);

  // Fetch fresh user from DB
  await connectDB();
  let user = session?.user?.id
    ? await User.findById(session.user.id)
      .select("name email image username")
      .lean()
    : session?.user;

  if (user) {
    user = JSON.parse(JSON.stringify(user));
  }

  const data = await getDashboardContext();
  const totalUnread = data?.conversations?.reduce((acc, conv) => acc + (conv.expertUnreadCount || 0), 0) || 0;
  const isLive = data?.profile?.isVetted;

  return (
    <header className="flex items-center justify-between px-6 py-3 border-b border-zinc-200 bg-white/80 backdrop-blur-md sticky top-0 z-40 h-16 w-full">

      {/* Left: Brand & Status */}
      <div className="flex items-center gap-4 md:gap-6">
        <MobileSidebar />

        <Link
          href="/"
          className="flex items-center gap-2 transition-opacity hover:opacity-80"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-900 text-white shadow-sm">
            <Brain className="h-5 w-5" />
          </div>
          <span className="text-xl font-bold tracking-tight text-zinc-900 hidden sm:block">
            Mindnamo
          </span>
        </Link>

        <div className="hidden md:block h-6 w-px bg-zinc-200" />

        {/* Live Status */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-50 border border-zinc-100">
          {isLive ? (
            <>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              <span className="text-xs font-medium text-zinc-600">
                Online
              </span>
            </>
          ) : (
            <>
              <div className="h-2 w-2 rounded-full bg-yellow-400" />
              <span className="text-xs font-medium text-zinc-600">
                Unverified
              </span>
            </>
          )}
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">

        {/* ✅ Chat Button */}
        <Link
          href="/chat"
          className="relative p-2 rounded-full hover:bg-zinc-100 transition-colors text-zinc-600"
        >
          <MessageSquare className="h-5 w-5" />
          {totalUnread > 0 && (
            <span className="absolute top-0 right-0 flex h-4 w-4 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-bold text-white border-2 border-white">
              {totalUnread > 9 ? "9+" : totalUnread}
            </span>
          )}
        </Link>

        <NotificationsNav data={data?.notifications || []} />
        <UserNav user={user} />
      </div>
    </header>
  );
}
