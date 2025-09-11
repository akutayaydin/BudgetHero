import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { AvatarSelection } from "@/components/avatar-selection";
import { Menu, User } from "lucide-react";
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

      {/* Right side - User profile */}
      <div className="flex items-center">
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

        
      </div>
    </div>
  );
}