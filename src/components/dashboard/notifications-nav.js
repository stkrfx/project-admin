"use client";

import { useState } from "react";
import { Bell, Check, Clock, Calendar, DollarSign, X } from "lucide-react";
import { cn } from "@/lib/utils";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area"; // Requires: npx shadcn@latest add scroll-area

// Mock Initial Data
const initialNotifications = [
  {
    id: 1,
    title: "New Appointment Request",
    description: "Sarah Johnson wants to book a consultation.",
    time: "2 min ago",
    icon: Calendar,
    color: "text-violet-500",
    read: false,
  },
  {
    id: 2,
    title: "Revenue Milestone Reached",
    description: "You hit $10k in sales this month!",
    time: "1 hour ago",
    icon: DollarSign,
    color: "text-emerald-500",
    read: false,
  },
  {
    id: 3,
    title: "System Update",
    description: "Mindnamo dashboard has been updated.",
    time: "1 day ago",
    icon: Clock,
    color: "text-blue-500",
    read: true,
  },
];

export function NotificationsNav() {
  const [notifications, setNotifications] = useState(initialNotifications);
  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAsRead = (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative text-zinc-500 hover:text-zinc-900 focus-visible:ring-0">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-2 right-2 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white animate-pulse" />
          )}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent className="w-80 p-0" align="end" forceMount>
        <div className="flex items-center justify-between p-4 border-b border-zinc-100">
          <DropdownMenuLabel className="p-0 text-sm font-semibold text-zinc-900">
            Notifications
          </DropdownMenuLabel>
          {unreadCount > 0 && (
            <button 
              onClick={markAllRead}
              className="text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors"
            >
              Mark all read
            </button>
          )}
        </div>

        <ScrollArea className="h-[300px]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-6 space-y-2">
              <Bell className="h-8 w-8 text-zinc-200" />
              <p className="text-sm text-zinc-500">No notifications yet.</p>
            </div>
          ) : (
            <div className="flex flex-col">
              {notifications.map((notification) => (
                <DropdownMenuItem
                  key={notification.id}
                  className={cn(
                    "flex items-start gap-3 p-4 cursor-pointer focus:bg-zinc-50 border-b border-zinc-50 last:border-0",
                    !notification.read && "bg-blue-50/50"
                  )}
                  onClick={() => markAsRead(notification.id)}
                >
                  <div className={cn("p-2 rounded-full bg-white border border-zinc-100 shadow-sm shrink-0", notification.color)}>
                    <notification.icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className={cn("text-sm leading-none", !notification.read ? "font-semibold text-zinc-900" : "font-medium text-zinc-700")}>
                      {notification.title}
                    </p>
                    <p className="text-xs text-zinc-500 line-clamp-2">
                      {notification.description}
                    </p>
                    <p className="text-[10px] text-zinc-400 font-medium pt-1">
                      {notification.time}
                    </p>
                  </div>
                  {!notification.read && (
                    <div className="h-2 w-2 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                  )}
                </DropdownMenuItem>
              ))}
            </div>
          )}
        </ScrollArea>
        
        <DropdownMenuSeparator className="m-0" />
        <div className="p-2 bg-zinc-50/50 text-center">
            <Button variant="ghost" size="sm" className="w-full text-xs h-8 text-zinc-500">
                View all notifications
            </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}