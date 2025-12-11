"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { LogOut, User, CreditCard, Settings } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
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
import { UserAvatar } from "@/components/ui/user-avatar";

export function UserNav({ user: initialUser }) {
  const router = useRouter();
  const { data: session } = useSession(); // ⭐ LIVE SESSION DATA

  // ⭐ Prefer session user → falls back to header user
  const user = session?.user || initialUser;

  const handleLogout = async () => {
    toast.info("Signing out...");
    await signOut({ callbackUrl: "/login" });
  };

  // --- KEYBOARD SHORTCUTS ---
  useEffect(() => {
    const handleKeyDown = (event) => {
      const modifier = event.metaKey || event.ctrlKey;
      if (!modifier) return;

      switch (event.key.toLowerCase()) {
        case "q":
          if (event.shiftKey) {
            event.preventDefault();
            handleLogout();
          }
          break;
        case "p":
          if (event.shiftKey) {
            event.preventDefault();
            router.push("/profile");
          }
          break;
        case "b":
          event.preventDefault();
          router.push("/revenue");
          break;
        case "s":
          event.preventDefault();
          router.push("/settings");
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [router]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="relative h-10 w-10 rounded-full focus-visible:ring-0"
        >
          {/* ⭐ UserAvatar now updates instantly when session updates */}
          <UserAvatar
            user={user}
            className="h-10 w-10 border border-zinc-200 shadow-sm"
          />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none text-zinc-900">
              {user?.name}
            </p>
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
            <DropdownMenuShortcut className="hidden md:inline-flex">
              ⇧⌘P
            </DropdownMenuShortcut>
          </DropdownMenuItem>

          <DropdownMenuItem
            className="cursor-pointer"
            onClick={() => router.push("/revenue")}
          >
            <CreditCard className="mr-2 h-4 w-4" />
            <span>Billing</span>
            <DropdownMenuShortcut className="hidden md:inline-flex">
              ⌘B
            </DropdownMenuShortcut>
          </DropdownMenuItem>

          <DropdownMenuItem
            className="cursor-pointer"
            onClick={() => router.push("/settings")}
          >
            <Settings className="mr-2 h-4 w-4" />
            <span>Settings</span>
            <DropdownMenuShortcut className="hidden md:inline-flex">
              ⌘S
            </DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={handleLogout}
          className="text-red-600 focus:text-red-600 cursor-pointer focus:bg-red-50"
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
          <DropdownMenuShortcut className="hidden md:inline-flex">
            ⇧⌘Q
          </DropdownMenuShortcut>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
