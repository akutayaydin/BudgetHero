import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/theme-toggle";
import { AvatarSelection } from "@/components/avatar-selection";
import {
  Upload,
  BarChart3,
  List,
  PieChart,
  Target,
  FileText,
  Settings,
  TrendingUp,
  LogOut,
  Menu,
  X,
  Building,
  CreditCard,
  DollarSign,
  Zap,
  Home,
  ArrowRight,
  RefreshCw,
  User,
  Mail,
  Shield,
  Activity,
  Tag,
  Sparkles,
} from "lucide-react";
import { HeroShieldLogo } from "./hero-shield-logo";
import { useAuth } from "../hooks/useAuth";

const navigation = [
  {
    name: "Overview",
    href: "/dashboard",
    icon: Home,
    description: "Financial summary & insights",
  },
  {
    name: "Wealth Management",
    href: "/wealth-management",
    icon: TrendingUp,
    description: "Assets, liabilities, accounts & data upload",
  },
  {
    name: "Transactions",
    href: "/transactions",
    icon: DollarSign,
    description: "All transactions & categorization",
  },
  {
    name: "Budgets",
    href: "/budgets",
    icon: PieChart,
    description: "AI-generated personalized budgets",
  },
  {
    name: "Bills & Subscriptions",
    href: "/recurring",
    icon: Zap,
    description: "Recurring payments & subscriptions",
  },
  {
    name: "Categories, Tags & Rules",
    href: "/rules-automation", 
    icon: Settings,
    description: "Categories, tags, rules & transaction splits",
  },
  {
    name: "Financial Health",
    href: "/health",
    icon: Activity,
    description: "Complete financial wellness analysis",
  },

  {
    name: "Financial Goals",
    href: "/goals",
    icon: Target,
    description: "Savings & spending targets",
  },
  {
    name: "Categories",
    href: "/categories",
    icon: Tag,
    description: "Manage spending categories & preferences",
  },
  {
    name: "Reports",
    href: "/reports",
    icon: FileText,
    description: "Detailed analytics & exports",
  },
  {
    name: "Billing",
    href: "/billing",
    icon: CreditCard,
    description: "Subscription & payment settings",
  },
  {
    name: "Profile",
    href: "/profile",
    icon: Settings,
    description: "Personal information & preferences",
  },
];

const adminNavigation = [
  {
    name: "Admin Panel",
    href: "/admin",
    icon: Shield,
    description: "System administration & user management",
  },
];

interface SidebarProps {
  isMobileMenuOpen?: boolean;
  setIsMobileMenuOpen?: (open: boolean) => void;
}

export default function Sidebar({
  isMobileMenuOpen = false,
  setIsMobileMenuOpen,
}: SidebarProps) {
  const [location] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch current user data
  const { data: user } = useQuery<{
    id: string;
    email: string;
    name?: string;
    avatar?: string;
    isAdmin?: boolean;
  }>({
    queryKey: ["/api/auth/user"],
  });

  const handleLogout = async () => {
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });

      if (response.ok) {
        // Clear cache and redirect to landing page
        window.location.href = "/";
      } else {
        console.error("Logout failed");
      }
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  // Quick action handlers
  const syncAllMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/accounts/sync-all", {
        method: "POST",
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to sync accounts");
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Accounts Synced",
        description: `Updated ${data.syncedAccounts} accounts with latest transactions.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/accounts"] });
    },
    onError: () => {
      toast({
        title: "Sync Failed",
        description: "Unable to sync accounts. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleMobileMenuToggle = () => {
    if (setIsMobileMenuOpen) {
      setIsMobileMenuOpen(!isMobileMenuOpen);
    }
  };

  // Sidebar content
  const SidebarContent = () => (
    <>
      {/* User Profile Section */}
      <div className="p-4 sm:p-6 border-b border-border bg-gradient-to-r from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10">
        <div className="mb-4">
          <Link
            href="/dashboard"
            className="inline-block hover:opacity-80 transition-opacity cursor-pointer"
            onClick={() => setIsMobileMenuOpen?.(false)}
          >
            <HeroShieldLogo size="md" showText={true} showTagline={true} />
          </Link>
        </div>

        {/* User Profile Card */}
        {user && (
          <div className="bg-card rounded-lg p-3 shadow-sm border border-border">
            <div className="flex items-center space-x-3">
              <AvatarSelection
                currentAvatar={user.avatar}
                userInitials={
                  user.name
                    ? user.name
                        .split(" ")
                        .map((n: string) => n[0])
                        .join("")
                        .toUpperCase()
                    : user.email
                      ? user.email[0].toUpperCase()
                      : "U"
                }
                userName={user.name}
                compact={true}
              />
              <div className="flex-1 min-w-0">
                <Link
                  href="/profile"
                  className="text-sm font-medium text-card-foreground truncate hover:opacity-75 transition-opacity cursor-pointer"
                  onClick={() => setIsMobileMenuOpen?.(false)}
                >
                  {user.name || "Profile"}
                </Link>
              </div>
              <ThemeToggle />
            </div>
          </div>
        )}
      </div>

      <nav className="flex-1 p-3 sm:p-4 overflow-y-auto bg-card">
        <ul className="space-y-1">
          {navigation.map((item) => {
            const isActive =
              location === item.href ||
              (location === "/" && item.href === "/dashboard");
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-start space-x-3 px-3 py-2.5 sm:py-3 rounded-lg transition-all duration-200 group touch-manipulation",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-card-foreground hover:bg-accent hover:text-accent-foreground hover:shadow-sm active:bg-accent/80",
                  )}
                  onClick={() => setIsMobileMenuOpen?.(false)}
                >
                  <item.icon className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium truncate">
                        {item.name}
                      </span>
                    </div>
                    <p
                      className={cn(
                        "text-xs mt-0.5 truncate hidden sm:block",
                        isActive
                          ? "text-primary-foreground/80"
                          : "text-muted-foreground",
                      )}
                    >
                      {item.description}
                    </p>
                  </div>
                </Link>
              </li>
            );
          })}

          {/* Admin Navigation - Only for admin users */}
          {user?.isAdmin &&
            adminNavigation.map((item) => {
              const isActive = location === item.href;
              return (
                <li
                  key={item.name}
                  className="border-t border-border pt-2 mt-2"
                >
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-start space-x-3 px-3 py-2.5 sm:py-3 rounded-lg transition-all duration-200 group touch-manipulation",
                      isActive
                        ? "bg-destructive text-destructive-foreground shadow-sm"
                        : "text-card-foreground hover:bg-destructive/10 hover:text-destructive hover:shadow-sm active:bg-destructive/20",
                    )}
                    onClick={() => setIsMobileMenuOpen?.(false)}
                  >
                    <item.icon className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium truncate">
                          {item.name}
                        </span>
                      </div>
                      <p
                        className={cn(
                          "text-xs mt-0.5 truncate hidden sm:block",
                          isActive
                            ? "text-destructive-foreground/80"
                            : "text-muted-foreground",
                        )}
                      >
                        {item.description}
                      </p>
                    </div>
                  </Link>
                </li>
              );
            })}
        </ul>

        {/* Quick Actions */}
        <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-border">
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3 px-1">
            Quick Actions
          </h3>
          <div className="space-y-1.5">
            <button
              onClick={() => syncAllMutation.mutate()}
              disabled={syncAllMutation.isPending}
              className="flex items-center space-x-2 px-3 py-2.5 text-xs sm:text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors w-full text-left disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
            >
              <RefreshCw
                className={cn(
                  "w-4 h-4",
                  syncAllMutation.isPending && "animate-spin",
                )}
              />
              <span>
                {syncAllMutation.isPending ? "Syncing..." : "Sync All Accounts"}
              </span>
            </button>
          </div>
        </div>

        {/* User Actions at Bottom */}
        <div className="mt-4 pt-4 border-t border-border">
          <div className="space-y-1.5">
            <Link
              href="/settings"
              className="flex items-center space-x-2 px-3 py-2.5 text-xs sm:text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground rounded-lg transition-colors w-full text-left touch-manipulation"
              onClick={() => setIsMobileMenuOpen?.(false)}
            >
              <Settings className="w-4 h-4" />
              <span>Settings</span>
            </Link>

            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 px-3 py-2.5 text-xs sm:text-sm text-muted-foreground hover:bg-destructive/10 hover:text-destructive rounded-lg transition-colors w-full text-left font-medium touch-manipulation"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </nav>
    </>
  );

  return (
    <>
      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 dark:bg-black dark:bg-opacity-70 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen?.(false)}
        />
      )}

      {/* Desktop sidebar */}
      <div className="hidden md:flex bg-card w-64 lg:w-72 border-r border-border flex-col min-h-screen dark:shadow-2xl">
        <SidebarContent />
      </div>

      {/* Mobile sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-72 sm:w-80 bg-card border-r border-border flex flex-col transform transition-transform duration-300 ease-in-out md:hidden shadow-xl dark:shadow-2xl",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <SidebarContent />
      </div>
    </>
  );
}
