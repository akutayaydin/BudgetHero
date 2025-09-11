import { useState } from "react";
import { Receipt } from "lucide-react";
import { getClearbitLogoUrl, getMerchantInitials } from "@/lib/merchant-logo";
import { cn } from "@/lib/utils";

interface MerchantLogoProps {
  merchant?: string | null;
  size?: number;
  fallbackColor?: string;
  className?: string;
  showBorder?: boolean;
}

export function MerchantLogo({
  merchant,
  size = 8,
  fallbackColor,
  className,
  showBorder = true,
}: MerchantLogoProps) {
  const [error, setError] = useState(false);

  if (!merchant || merchant.trim() === "") {
    return (
      <div
        className={cn(
          `w-${size} h-${size}`,
          "bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center",
          showBorder && "border border-gray-200",
          className
        )}
      >
        <Receipt className="w-4 h-4 text-gray-500" />
      </div>
    );
  }

  const logoUrl = getClearbitLogoUrl(merchant);
  const initials = getMerchantInitials(merchant);

  const colors = [
    "bg-blue-500",
    "bg-green-500",
    "bg-purple-500",
    "bg-pink-500",
    "bg-indigo-500",
    "bg-yellow-500",
    "bg-red-500",
    "bg-teal-500",
  ];
  const bgColor = fallbackColor || (error ? colors[merchant.length % colors.length] : "");

  return (
    <div
      className={cn(
        `w-${size} h-${size}`,
        "rounded-full flex items-center justify-center overflow-hidden",
        showBorder && "border border-gray-200",
        bgColor,
        className
      )}
    >
      {!error ? (
        <img
          src={logoUrl}
          alt={`${merchant} logo`}
          className="w-full h-full object-cover"
          onError={() => setError(true)}
        />
      ) : (
        <span className="text-white text-xs font-semibold">{initials}</span>
      )}
    </div>
  );
}