// [project-admin] src/components/ProfileImage.js

"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

// Vibrant Tailwind-compatible colors
const COLORS = [
  "bg-red-500", "bg-orange-500", "bg-amber-500", "bg-yellow-500",
  "bg-lime-500", "bg-green-500", "bg-emerald-500", "bg-teal-500",
  "bg-cyan-500", "bg-sky-500", "bg-blue-500", "bg-indigo-500",
  "bg-violet-500", "bg-purple-500", "bg-fuchsia-500", "bg-pink-500",
  "bg-rose-500",
];

const getColorFromName = (name) => {
  if (!name) return "bg-zinc-400";
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % COLORS.length;
  return COLORS[index];
};

export default function ProfileImage({ 
  src, 
  name, 
  sizeClass = "h-10 w-10", 
  textClass = "text-sm", 
  className,
  priority = true 
}) {
  const [visibleSrc, setVisibleSrc] = useState(src);
  const [imgError, setImgError] = useState(false);

  const bgColor = useMemo(() => getColorFromName(name), [name]);

  useEffect(() => {
    if (!src) {
      setVisibleSrc(null);
      return;
    }
    if (src === visibleSrc) return;

    const img = new window.Image();
    img.src = src;
    img.onload = () => {
      setImgError(false);
      setVisibleSrc(src);
    };
    img.onerror = () => {
      setImgError(true);
      setVisibleSrc(src);
    };
  }, [src, visibleSrc]);

  const initials = name
    ? name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "??";

  return (
    <div 
      className={cn(
        "relative overflow-hidden rounded-full shrink-0 select-none border border-white/10 dark:border-zinc-700 shadow-sm",
        visibleSrc && !imgError ? "bg-zinc-100" : bgColor,
        sizeClass,
        className
      )}
    >
      <div className={cn(
          "absolute inset-0 flex items-center justify-center font-bold z-0",
          visibleSrc && !imgError ? "text-zinc-400" : "text-white"
        )}>
        <span className={textClass}>{initials}</span>
      </div>

      {visibleSrc && !imgError && (
        <Image
          key={visibleSrc}
          src={visibleSrc}
          alt={name || "Profile"}
          fill
          className="object-cover z-10"
          sizes="(max-width: 768px) 96px, 128px"
          priority={priority}
          onError={() => setImgError(true)}
          referrerPolicy="no-referrer"
          unoptimized={visibleSrc.includes("ui-avatars.com")}
        />
      )}
    </div>
  );
}