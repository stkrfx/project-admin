"use client";

import { useState } from "react";
import { Bell, AlertTriangle, CheckCircle, Info } from "lucide-react"; // Better icons
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { useRouter } from "next/navigation";

export function NotificationsNav({ data = [] }) {
  const router = useRouter();
  const [readIds, setReadIds] = useState([]);

  // Filter out locally "read" notifications (simple client-side logic)
  const notifications = data.filter(n => !readIds.includes(n.id));

  const handleClick = (n) => {
    setReadIds([...readIds, n.id]);
    if (n.link) router.push(n.link);
  };

  const getIcon = (type) => {
    switch (type) {
        case "warning": return <AlertTriangle className="h-4 w-4 text-orange-600" />;
        case "success": return <CheckCircle className="h-4 w-4 text-emerald-600" />;
        default: return <Info className="h-4 w-4 text-blue-600" />;
    }
  };

  const getBg = (type) => {
    switch (type) {
        case "warning": return "bg-orange-100";
        case "success": return "bg-emerald-100";
        default: return "bg-blue-100";
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative text-zinc-500 hover:text-zinc-900 focus-visible:ring-0">
          <Bell className="h-5 w-5" />
          {notifications.length > 0 && (
            <span className="absolute top-2 right-2 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white animate-pulse" />
          )}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent className="w-[calc(100vw-2rem)] sm:w-80 p-0" align="end" forceMount collisionPadding={16}>
        <div className="flex items-center justify-between p-4 border-b border-zinc-100">
          <DropdownMenuLabel className="p-0 text-sm font-semibold text-zinc-900">
            Notifications
          </DropdownMenuLabel>
        </div>

        <ScrollArea className="h-[300px]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-center p-6 space-y-2">
              <Bell className="h-8 w-8 text-zinc-200" />
              <p className="text-sm text-zinc-500">All caught up!</p>
            </div>
          ) : (
            <div className="flex flex-col">
              {notifications.map((n) => (
                <DropdownMenuItem
                  key={n.id}
                  className="flex items-start gap-3 p-4 cursor-pointer focus:bg-zinc-50 border-b border-zinc-50 last:border-0"
                  onClick={() => handleClick(n)}
                >
                  <div className={cn("p-2 rounded-full shrink-0", getBg(n.type))}>
                    {getIcon(n.type)}
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium text-zinc-900 leading-none">{n.title}</p>
                    <p className="text-xs text-zinc-500 line-clamp-2">{n.description}</p>
                  </div>
                  <div className="h-2 w-2 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                </DropdownMenuItem>
              ))}
            </div>
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}