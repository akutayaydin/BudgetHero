// client/src/components/category-badge.tsx
import React from "react";
import { cn } from "@/lib/utils";
import {
  Utensils,
  ShoppingCart,
  Car,
  Fuel,
  ShoppingBag,
  Film,
  Receipt,
  Stethoscope,
  Plane,
  Home,
  Book,
  Heart,
  Baby,
  Briefcase,
  PiggyBank,
  RotateCcw,
  Landmark,
  CreditCard,
  HelpCircle,
  type LucideIcon,
} from "lucide-react";

export const getCategoryIcon = (categoryName: string): LucideIcon => {
  const name = categoryName.toLowerCase();
  const iconMap: Record<string, LucideIcon> = {
    "food & dining": Utensils,
    groceries: ShoppingCart,
    transportation: Car,
    gas: Fuel,
    shopping: ShoppingBag,
    entertainment: Film,
    "bills & utilities": Receipt,
    healthcare: Stethoscope,
    travel: Plane,
    housing: Home,
    education: Book,
    "personal care": Heart,
    "family & kids": Baby,
    "business services": Briefcase,
    financial: PiggyBank,
    government: Landmark,
    "credit card payment": CreditCard,
    paycheck: Briefcase,
    dividend: PiggyBank,
    retirement: PiggyBank,
    "tax refund": RotateCcw,
    unemployment: RotateCcw,
    "other income": PiggyBank,
  };

  for (const [key, icon] of Object.entries(iconMap)) {
    if (name.includes(key)) return icon;
  }
  return HelpCircle;
};

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
