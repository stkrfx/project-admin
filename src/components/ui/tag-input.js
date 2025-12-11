"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export function TagInput({ placeholder, tags, setTags }) {
  const [inputValue, setInputValue] = useState("");

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const newTag = inputValue.trim();
      if (newTag && !tags.includes(newTag)) {
        setTags([...tags, newTag]);
        setInputValue("");
      }
    }
  };

  const removeTag = (tagToRemove) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  return (
    <div className="space-y-3">
      <Input
        placeholder={placeholder}
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        className="bg-white"
      />
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <Badge key={tag} variant="secondary" className="px-3 py-1 text-sm bg-zinc-100 text-zinc-800 hover:bg-zinc-200">
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="ml-2 hover:text-red-500 focus:outline-none"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
      </div>
    </div>
  );
}