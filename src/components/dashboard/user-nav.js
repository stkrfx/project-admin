"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { LogOut, User, CreditCard, Settings } from "lucide-react";
import { toast } from "sonner";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import {
  Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function UserNav({ user }) {
  const router = useRouter();

  const handleLogout = async () => {
    toast.info("Signing out...");
    await signOut({ callbackUrl: "/login" });
  };

  // --- 1. KEYBOARD SHORTCUTS LOGIC ---
  useEffect(() => {
    const handleKeyDown = (event) => {
      // Check for Cmd (Mac) or Ctrl (Windows)
      const modifier = event.metaKey || event.ctrlKey;

      if (!modifier) return;

      switch (event.key.toLowerCase()) {
        case "q": // Shift + Cmd + Q = Logout
          if (event.shiftKey) {
            event.preventDefault();
            handleLogout();
          }
          break;
        case "p": // Shift + Cmd + P = Profile
          if (event.shiftKey) {
            event.preventDefault();
            router.push("/profile");
          }
          break;
        case "b": // Cmd + B = Billing
          event.preventDefault();
          router.push("/revenue");
          break;
        case "s": // Cmd + S = Settings
          event.preventDefault();
          router.push("/settings");
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [router]);

  // --- 2. AVATAR PERFORMANCE FIX ---
  // Generate initials securely
  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).join("").substring(0, 2).toUpperCase()
    : "U";

  // FIX: If the image is from 'ui-avatars', ignore it. 
  // We prefer our instant CSS fallback over a slow-loading external image.
  const isGenericImage = user?.image?.includes("ui-avatars.com");
  const displayImage = isGenericImage ? null : user?.image;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full focus-visible:ring-0">
          <Avatar className="h-10 w-10 border border-zinc-200 shadow-sm transition-transform hover:scale-105">
            <AvatarImage src={displayImage} alt={user?.name} className="object-cover" />
            <AvatarFallback className="bg-zinc-900 text-white font-medium">
              {initials}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none text-zinc-900">{user?.name}</p>
            <p className="text-xs leading-none text-zinc-500 truncate">
              {user?.email}
            </p>
          </div>
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuGroup>
          <DropdownMenuItem 
            className="cursor-pointer"
            onClick={() => router.push("/profile")}
          >
            <User className="mr-2 h-4 w-4" />
            <span>Profile</span>
            <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
          </DropdownMenuItem>
          
          <DropdownMenuItem 
            className="cursor-pointer"
            onClick={() => router.push("/revenue")}
          >
            <CreditCard className="mr-2 h-4 w-4" />
            <span>Billing</span>
            <DropdownMenuShortcut>⌘B</DropdownMenuShortcut>
          </DropdownMenuItem>
          
          <DropdownMenuItem 
            className="cursor-pointer"
            onClick={() => router.push("/settings")}
          >
            <Settings className="mr-2 h-4 w-4" />
            <span>Settings</span>
            <DropdownMenuShortcut>⌘S</DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600 cursor-pointer focus:bg-red-50">
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
          <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}