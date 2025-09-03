import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/theme-toggle";
import { AvatarSelection } from "@/components/avatar-selection";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Menu,
  User,
  Settings,
  LogOut,
  TrendingUp,
  Bell,
  ChevronDown,
  Sparkles,
  Shield
} from "lucide-react";
import { HeroShieldLogo } from "./hero-shield-logo";

interface MobileTopNavProps {
  onMenuClick: () => void;
  showMenuButton?: boolean;
}

export default function MobileTopNav({ onMenuClick, showMenuButton = true }: MobileTopNavProps) {
  // Fetch current user data
  const { data: user } = useQuery<{
    id: string;
    email: string;
    name?: string;
    avatar?: string;
  }>({
    queryKey: ["/api/auth/user"],
  });

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
      
      if (response.ok) {
        window.location.href = '/';
      } else {
        console.error('Logout failed');
      }
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const getUserInitials = () => {
    if (user?.name) {
      return user.name.split(' ').map(n => n[0]).join('').toUpperCase();
    }
    if (user?.email) {
      return user.email[0].toUpperCase();
    }
    return 'U';
  };

  return (
    <div className="md:hidden bg-background border-b border-border px-4 py-3 flex items-center justify-between sticky top-0 z-30 backdrop-blur-lg">
      {/* Left side - Menu button and Logo */}
      <div className="flex items-center space-x-3">
        {showMenuButton && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onMenuClick}
            className="p-2"
          >
            <Menu className="h-5 w-5" />
          </Button>
        )}
        
        <HeroShieldLogo size="sm" showText={true} showTagline={false} />
      </div>

      {/* Right side - User profile and notifications */}
      <div className="flex items-center space-x-3">
        {/* Theme Toggle */}
        <ThemeToggle />
        
        {/* Notifications */}
        <Button variant="ghost" size="sm" className="p-2 relative">
          <Bell className="h-5 w-5 text-muted-foreground" />
          <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 text-xs bg-red-500 text-white">
            2
          </Badge>
        </Button>

        {/* User Profile Avatar Selector */}
        {user ? (
          <AvatarSelection
            currentAvatar={user.avatar}
            userInitials={getUserInitials()}
            userName={user.name}
            compact={true}
          />
        ) : (
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-muted text-muted-foreground">
              <User className="h-4 w-4" />
            </AvatarFallback>
          </Avatar>
        )}

        {/* Settings Menu */}
        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="p-2">
                <Settings className="h-5 w-5 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onClick={() => window.location.href = '/profile'}>
                <User className="mr-2 h-4 w-4" />
                <div>
                  <p className="font-medium">{user.name || 'Profile'}</p>
                  <p className="text-xs text-muted-foreground">View and edit profile</p>
                </div>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => window.location.href = '/settings'}>
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>

              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => window.location.href = '/api/switch-account'} className="text-blue-600">
                <User className="mr-2 h-4 w-4" />
                Switch Account
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
}