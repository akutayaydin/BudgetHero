import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Home,
  List,
  ChartPie,
  Wallet,
  Gauge,
  Receipt,
  Goal,
  Sparkles,
  Settings,
  RefreshCw,
  LogOut,
  Building,
  TrendingUp,
  Bell,
  User,
  Tag,
  CreditCard,
  Upload,
  Shield,
  DollarSign,
  PieChart,
  Zap,
  MoreHorizontal,
  Menu,
  X,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { HeroShieldLogo } from "./hero-shield-logo";

// Card components for the modern design
const Card = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={cn("bg-card border border-border rounded-xl shadow-sm", className)}>
    {children}
  </div>
);

const CardBody = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={cn("p-4", className)}>
    {children}
  </div>
);

// MenuItem component matching the overview dashboard design
const MenuItem = ({
  icon: Icon,
  label,
  active = false,
  href,
  onClick,
}: {
  icon: React.ComponentType<any>;
  label: string;
  active?: boolean;
  href?: string;
  onClick?: () => void;
}) => {
  const content = (
    <div 
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all cursor-pointer",
        active 
          ? "bg-primary text-primary-foreground font-medium" 
          : "text-foreground hover:bg-accent hover:text-accent-foreground"
      )}
      onClick={onClick}
    >
      <Icon className="w-4 h-4" />
      <span className="text-sm">{label}</span>
    </div>
  );

  if (href) {
    return (
      <Link href={href}>
        {content}
      </Link>
    );
  }

  return content;
};

const navigation = [
  {
    name: "Dashboard",
    href: "/overview",
    icon: Home,
  },
  {
    name: "Transactions",
    href: "/transactions",
    icon: List,
  },
  {
    name: "Spending",
    href: "/spending",
    icon: ChartPie,
  },
  {
    name: "Budgets",
    href: "/budgets",
    icon: Wallet,
  },
  {
    name: "Cash Flow",
    href: "/wealth-management",
    icon: Gauge,
  },
  {
    name: "Bills & Subscriptions",
    href: "/recurring",
    icon: Receipt,
  },
  {
    name: "Goals & Reports",
    href: "/reports",
    icon: Goal,
  },
  {
    name: "Insights (AI Coach)",
    href: "/health",
    icon: Sparkles,
  },
];

const moreNavigation = [
  {
    name: "Profile & Preferences",
    href: "/settings",
    icon: User,
  },
  {
    name: "Linked Accounts",
    href: "/accounts",
    icon: Building,
  },
  {
    name: "Categories & Tags",
    href: "/categories",
    icon: Tag,
  },
  {
    name: "Transaction Rules",
    href: "/rules-automation",
    icon: Settings,
  },
  {
    name: "Notifications & Alerts",
    href: "/notifications",
    icon: Bell,
  },
  {
    name: "Premium Upgrade",
    href: "/subscription/plans",
    icon: CreditCard,
  },
  {
    name: "Data Backup / Export",
    href: "/reports",
    icon: Upload,
  },
];

const adminNavigation = [
  {
    name: "Admin Panel",
    href: "/admin",
    icon: Shield,
  },
];

interface ModernSidebarProps {
  isMobileMenuOpen?: boolean;
  setIsMobileMenuOpen?: (open: boolean) => void;
}

export default function ModernSidebar({
  isMobileMenuOpen = false,
  setIsMobileMenuOpen,
}: ModernSidebarProps) {
  const [location] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showMoreMenu, setShowMoreMenu] = useState(false);

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

  const SidebarContent = () => (
    <Card className="h-full flex flex-col">
      {/* Header with logo and theme toggle */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <Link
            href="/overview"
            className="inline-block hover:opacity-80 transition-opacity cursor-pointer"
            onClick={() => setIsMobileMenuOpen?.(false)}
          >
            <HeroShieldLogo size="sm" showText={true} showTagline={false} />
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* User Profile */}
        {user && (
          <div className="flex items-center gap-3 p-2 rounded-lg bg-accent/50">
            <Avatar className="w-8 h-8">
              <AvatarImage src={user.avatar} />
              <AvatarFallback>
                {user.name
                  ? user.name
                      .split(" ")
                      .map((n: string) => n[0])
                      .join("")
                      .toUpperCase()
                  : user.email
                  ? user.email[0].toUpperCase()
                  : "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <Link
                href="/settings"
                className="text-sm font-medium text-foreground truncate hover:opacity-75 transition-opacity cursor-pointer block"
                onClick={() => setIsMobileMenuOpen?.(false)}
              >
                {user.name || "Profile"}
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <CardBody className="flex-1 overflow-auto">
        <nav className="space-y-1">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground px-2 mb-3">Menu</div>
          
          {navigation.map((item) => {
            const isActive =
              location === item.href ||
              (location === "/" && item.href === "/overview");
            return (
              <MenuItem
                key={item.name}
                icon={item.icon}
                label={item.name}
                active={isActive}
                href={item.href}
                onClick={() => setIsMobileMenuOpen?.(false)}
              />
            );
          })}

          {/* More menu with dropdown */}
          <div className="pt-2 border-t border-border mt-2">
            <DropdownMenu open={showMoreMenu} onOpenChange={setShowMoreMenu}>
              <DropdownMenuTrigger asChild>
                <div>
                  <MenuItem
                    icon={Settings}
                    label="More ▾"
                    onClick={() => setShowMoreMenu(!showMoreMenu)}
                  />
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="right" align="start" className="w-56">
                {moreNavigation.map((item) => (
                  <DropdownMenuItem key={item.name} asChild>
                    <Link href={item.href} onClick={() => setIsMobileMenuOpen?.(false)}>
                      <item.icon className="w-4 h-4 mr-2" />
                      {item.name}
                    </Link>
                  </DropdownMenuItem>
                ))}
                
                {user?.isAdmin && (
                  <>
                    <div className="h-px bg-border my-1" />
                    {adminNavigation.map((item) => (
                      <DropdownMenuItem key={item.name} asChild>
                        <Link href={item.href} onClick={() => setIsMobileMenuOpen?.(false)}>
                          <item.icon className="w-4 h-4 mr-2" />
                          {item.name}
                        </Link>
                      </DropdownMenuItem>
                    ))}
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </nav>
      </CardBody>

      {/* Footer with quick actions and logout */}
      <div className="p-4 border-t border-border space-y-2">
        <button
          onClick={() => syncAllMutation.mutate()}
          disabled={syncAllMutation.isPending}
          className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground rounded-lg transition-colors w-full text-left disabled:opacity-50"
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

        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:bg-destructive/10 hover:text-destructive rounded-lg transition-colors w-full text-left"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </Card>
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
      <div className="hidden md:block w-64 lg:w-72 h-screen sticky top-0">
        <SidebarContent />
      </div>

      {/* Mobile sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-72 sm:w-80 transform transition-transform duration-300 ease-in-out md:hidden shadow-xl",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <SidebarContent />
      </div>
    </>
  );
}