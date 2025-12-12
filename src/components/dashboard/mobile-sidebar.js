"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Menu, X, Brain } from "lucide-react";
import Sidebar from "@/components/dashboard/sidebar";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";

export function MobileSidebar() {
  const [open, setOpen] = useState(false);
  
  // 1. Add a state to track mounting
  const [isMounted, setIsMounted] = useState(false);
  
  const pathname = usePathname();

  // 2. Set mounted to true once on the client
  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // 3. Render nothing during SSR to avoid ID mismatch
  if (!isMounted) {
    return null;
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="md:hidden text-zinc-500 hover:text-zinc-900"
        >
          <Menu className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      
      <SheetContent side="left" className="p-0 bg-white border-r border-zinc-200 w-72 [&>button]:hidden">
        
        <SheetTitle className="sr-only">
          Mobile Navigation Menu
        </SheetTitle>
        
        <div className="flex flex-col h-full">
            {/* Custom Premium Header */}
            <div className="flex items-center justify-between px-6 h-16 border-b border-zinc-100 bg-white">
                <Link href="/" onClick={() => setOpen(false)} className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900 text-white">
                        <Brain className="h-4 w-4" />
                    </div>
                    <span className="text-lg font-bold text-zinc-900">
                        Mindnamo
                    </span>
                </Link>

                <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => setOpen(false)}
                    className="h-8 w-8 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-full transition-colors"
                >
                    <X className="h-5 w-5" />
                </Button>
            </div>

            {/* Sidebar Content */}
            <div className="flex-1 overflow-y-auto">
                <Sidebar />
            </div>
        </div>

      </SheetContent>
    </Sheet>
  );
}