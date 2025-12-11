"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Calendar, DollarSign, Settings, User } from "lucide-react";
import { cn } from "@/lib/utils";

const routes = [
  {
    label: "Overview",
    icon: LayoutDashboard,
    href: "/",
    color: "text-sky-600",
  },
  {
    label: "Appointments",
    icon: Calendar,
    href: "/appointments",
    color: "text-violet-600",
  },
  {
    label: "Revenue",
    icon: DollarSign,
    href: "/revenue",
    color: "text-emerald-600",
  },
  {
    label: "Profile",
    icon: User,
    href: "/profile",
    color: "text-pink-600",
  },
  {
    label: "Settings",
    icon: Settings,
    href: "/settings",
    color: "text-zinc-600",
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="space-y-4 py-4 flex flex-col h-full bg-white border-r border-zinc-200">
      <div className="px-3 py-2 flex-1">
        <div className="space-y-1">
          {routes.map((route) => (
            <Link
              key={route.href}
              href={route.href}
              className={cn(
                "text-sm group flex p-3 w-full justify-start font-medium cursor-pointer rounded-xl transition-all duration-200",
                pathname === route.href 
                  ? "bg-zinc-100 text-zinc-900 shadow-sm" // Active State
                  : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50" // Inactive State
              )}
            >
              <div className="flex items-center flex-1">
                <route.icon className={cn("h-5 w-5 mr-3 transition-colors", route.color)} />
                {route.label}
              </div>
            </Link>
          ))}
        </div>
      </div>
      
      {/* Footer removed to match your "No Plan" business model */}
    </div>
  );
}