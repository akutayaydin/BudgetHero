import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { AvatarSelection } from "@/components/avatar-selection";
import { Sparkles, X } from "lucide-react";

export function FloatingAvatarHint() {
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

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

  useEffect(() => {
    // Check if user has dismissed the hint from localStorage
    const dismissed = localStorage.getItem('avatar-hint-dismissed');
    if (dismissed) {
      setIsDismissed(true);
      return;
    }

    // Show hint after 3 seconds if user doesn't have a custom avatar
    const timer = setTimeout(() => {
      if (!user?.avatar || user.avatar === '') {
        setIsVisible(true);
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [user?.avatar]);

  const handleDismiss = () => {
    setIsVisible(false);
    setIsDismissed(true);
    localStorage.setItem('avatar-hint-dismissed', 'true');
  };

  if (!user || isDismissed || !isVisible) {
    return null;
  }

  return (
    <div className="floating-avatar-hint md:hidden">
      <div className="relative">
        {/* Close button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDismiss}
          className="absolute -top-2 -right-2 w-6 h-6 p-0 bg-red-500 hover:bg-red-600 text-white rounded-full z-10"
        >
          <X className="h-3 w-3" />
        </Button>
        
        {/* Avatar Selection Trigger */}
        <AvatarSelection
          currentAvatar={user.avatar}
          userInitials={getUserInitials()}
          userName={user.name}
          trigger={
            <Button
              variant="ghost"
              className="relative group p-3 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <div className="relative">
                <Sparkles className="h-8 w-8 text-white sparkle-animate" />
                <div className="absolute inset-0 bg-white/20 rounded-full animate-ping" />
              </div>
            </Button>
          }
        />
        
        {/* Tooltip */}
        <div className="absolute bottom-full right-0 mb-2 w-48 bg-card border border-border rounded-lg p-3 shadow-lg">
          <div className="text-sm font-medium text-card-foreground">
            ✨ Customize Your Vibe!
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            Tap to choose a Gen Alpha avatar that matches your energy! 💯
          </div>
          <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-border" />
        </div>
      </div>
    </div>
  );
}