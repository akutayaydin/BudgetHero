// client/src/components/category-badge.tsx
import React from "react";
import { cn } from "@/lib/utils";
import { getCategoryIcon, getCategoryColor } from "@/lib/category-icons";

interface CategoryBadgeProps {
  categoryName: string;
  className?: string;
}

export function CategoryBadge({ categoryName, className }: CategoryBadgeProps) {
  const Icon = getCategoryIcon(categoryName);
  const colorClass = getCategoryColor(categoryName);
  
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center">
        <Icon className={cn("w-4 h-4", colorClass)} />
      </div>
      <span className="text-sm">{categoryName}</span>
    </div>
  );
}
