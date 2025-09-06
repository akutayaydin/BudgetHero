// client/src/components/category-badge.tsx
import React from "react";
import { cn } from "@/lib/utils";
import { getCategoryIcon, getCategoryColor } from "@/lib/category-icons";

interface CategoryBadgeProps {
  categoryName: string;
  className?: string;
  editable?: boolean;
}

export function CategoryBadge({ categoryName, className, editable }: CategoryBadgeProps) {
  const Icon = getCategoryIcon(categoryName);
  const colorClass = getCategoryColor(categoryName);
  
  return (
    <div
      className={cn(
        "flex items-center gap-2",
        editable && "cursor-pointer",
        className,
      )}
    >
      <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center">
        <Icon className={cn("w-4 h-4", colorClass)} />
      </div>
      <span
        className={cn(
          "text-sm",
          editable &&
          "px-2 pb-[1px] group-hover:border-b group-hover:border-dashed group-hover:border-gray-300 dark:group-hover:border-gray-600",
        )}
      >
        {categoryName}
      </span>
    </div>
  );
}
