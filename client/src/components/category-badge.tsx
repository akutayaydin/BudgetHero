// client/src/components/category-badge.tsx
import React from "react";
import { cn } from "@/lib/utils";
import { getCategoryIcon } from "@/lib/category-icons";

interface CategoryBadgeProps {
  categoryName: string;
  className?: string;
}

export function CategoryBadge({ categoryName, className }: CategoryBadgeProps) {
  const Icon = getCategoryIcon(categoryName);

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center">
        <Icon className="w-3 h-3 text-muted-foreground" />
      </div>
      <span>{categoryName}</span>
    </div>
  );
}
