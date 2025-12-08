"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Calendar, DollarSign, Settings, User } from "lucide-react";
import { cn } from "@/lib/utils";

const routes = [
  {
    label: "Overview",
    icon: LayoutDashboard,
    href: "/", // Updated to root
    color: "text-sky-500",
  },
  {
    label: "Appointments",
    icon: Calendar,
    href: "/appointments", // Removed /dashboard prefix
    color: "text-violet-500",
  },
  {
    label: "Revenue",
    icon: DollarSign,
    href: "/revenue", // Removed /dashboard prefix
    color: "text-emerald-500",
  },
  {
    label: "Profile",
    icon: User,
    href: "/profile", // Removed /dashboard prefix
    color: "text-pink-700",
  },
  {
    label: "Settings",
    icon: Settings,
    href: "/settings", // Removed /dashboard prefix
    color: "text-zinc-500",
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="space-y-4 py-4 flex flex-col h-full bg-zinc-900 text-white border-r border-zinc-800 shadow-xl">
      <div className="px-3 py-2 flex-1">
        {/* Logo removed as it lives in the Header now */}
        
        <div className="space-y-1">
          {routes.map((route) => (
            <Link
              key={route.href}
              href={route.href}
              className={cn(
                "text-sm group flex p-3 w-full justify-start font-medium cursor-pointer hover:text-white hover:bg-white/10 rounded-lg transition-all",
                pathname === route.href ? "text-white bg-white/10" : "text-zinc-400"
              )}
            >
              <div className="flex items-center flex-1">
                <route.icon className={cn("h-5 w-5 mr-3", route.color)} />
                {route.label}
              </div>
            </Link>
          ))}
        </div>
      </div>
      
      {/* Footer / Tier Info */}
      <div className="px-3 py-4 border-t border-zinc-800">
        <div className="bg-zinc-800/50 rounded-xl p-4">
            <p className="text-xs text-zinc-400">Expert Tier</p>
            <p className="text-sm font-bold text-white">Professional</p>
        </div>
      </div>
    </div>
  );
}