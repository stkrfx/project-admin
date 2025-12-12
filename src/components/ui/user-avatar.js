"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import Image from "next/image";
import { User } from "lucide-react";
import { useState } from "react";

export function UserAvatar({ user, className, ...props }) {
  const [imageError, setImageError] = useState(false);

  // Generate initials
  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).join("").substring(0, 2).toUpperCase()
    : "U";

  // Check if image is valid (ignore ui-avatars)
  // Check if image is valid (allow ui-avatars)
const isValidImage = user?.image && !imageError;


  return (
    <Avatar className={className} {...props}>
      {isValidImage ? (
        <div className="relative aspect-square h-full w-full">
          <Image
            src={user.image}
            alt={user.name || "User"}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover"
            priority // Preloads the image!
            onError={() => setImageError(true)}
            referrerPolicy="no-referrer"
          />
        </div>
      ) : (
        <AvatarFallback className="bg-zinc-900 text-white font-medium">
          {initials}
        </AvatarFallback>
      )}
    </Avatar>
  );
}