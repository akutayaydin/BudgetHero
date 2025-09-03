import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Check, Sparkles, Zap, Camera, Shuffle, RefreshCw } from "lucide-react";

// Gen Alpha themed avatars
const GEN_ALPHA_AVATARS = [
  {
    id: 'sigma-blue',
    url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sigma&backgroundColor=3b82f6&accessories=sunglasses&clothingGraphic=skull',
    name: 'Sigma Blue',
    vibe: '🔥 Fire',
    popular: true
  },
  {
    id: 'chad-red',
    url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Chad&backgroundColor=ef4444&accessories=wayfarers&clothingGraphic=bear',
    name: 'Chad Energy',
    vibe: '💪 Strong',
    popular: true
  },
  {
    id: 'rizz-purple',
    url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Rizz&backgroundColor=8b5cf6&accessories=round&clothingGraphic=diamond',
    name: 'Rizz Master',
    vibe: '✨ Charisma',
    popular: true
  },
  {
    id: 'goat-green',
    url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=GOAT&backgroundColor=10b981&clothingGraphic=pizza',
    name: 'GOAT Status',
    vibe: '🐐 Legend',
    popular: false
  },
  {
    id: 'slay-pink',
    url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Slay&backgroundColor=ec4899&accessories=prescription02&clothingGraphic=selena',
    name: 'Slay Queen',
    vibe: '💅 Iconic',
    popular: false
  },
  {
    id: 'based-orange',
    url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Based&backgroundColor=f59e0b&clothingGraphic=resist',
    name: 'Based',
    vibe: '🧠 Smart',
    popular: false
  },
  {
    id: 'no-cap-cyan',
    url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=NoCap&backgroundColor=06b6d4&accessories=kurt&clothingGraphic=cumbia',
    name: 'No Cap',
    vibe: '💯 Real',
    popular: true
  },
  {
    id: 'bussin-yellow',
    url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Bussin&backgroundColor=eab308&clothingGraphic=hola',
    name: 'Bussin',
    vibe: '🔥 Hot',
    popular: false
  },
  {
    id: 'sus-red',
    url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sus&backgroundColor=dc2626&accessories=eyepatch&clothingGraphic=skull',
    name: 'Sus Mode',
    vibe: '👀 Mystery',
    popular: false
  },
  {
    id: 'mid-gray',
    url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mid&backgroundColor=6b7280&clothingGraphic=bat',
    name: 'Mid (Ironic)',
    vibe: '😎 Cool',
    popular: false
  },
  {
    id: 'lowkey-indigo',
    url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Lowkey&backgroundColor=6366f1&clothingGraphic=deer',
    name: 'Lowkey Fire',
    vibe: '🤫 Subtle',
    popular: true
  },
  {
    id: 'highkey-lime',
    url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Highkey&backgroundColor=84cc16&clothingGraphic=zombie',
    name: 'Highkey Goated',
    vibe: '📢 Loud',
    popular: false
  },
  {
    id: 'robot-blue',
    url: 'https://api.dicebear.com/7.x/bottts/svg?seed=AlphaBot&backgroundColor=3b82f6',
    name: 'AI Sigma',
    vibe: '🤖 Future',
    popular: true
  },
  {
    id: 'robot-neon',
    url: 'https://api.dicebear.com/7.x/bottts/svg?seed=NeonBot&backgroundColor=a855f7',
    name: 'Neon Vibes',
    vibe: '🌈 Electric',
    popular: false
  }
];

interface ProfileAvatarSelectorProps {
  currentAvatar?: string;
  userInitials: string;
  userName?: string;
  onAvatarChange?: (avatarUrl: string) => void;
  trigger?: React.ReactNode;
}

export function ProfileAvatarSelector({ 
  currentAvatar, 
  userInitials, 
  userName, 
  onAvatarChange, 
  trigger 
}: ProfileAvatarSelectorProps) {
  const [selectedAvatar, setSelectedAvatar] = useState(currentAvatar || '');
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateAvatarMutation = useMutation({
    mutationFn: async (avatarUrl: string) => {
      return await apiRequest('/api/user/avatar', 'PATCH', { profileImageUrl: avatarUrl });
    },
    onSuccess: () => {
      toast({
        title: "Avatar updated! 🔥",
        description: "Your new look is absolutely fire!"
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      onAvatarChange?.(selectedAvatar);
      setIsOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Couldn't update avatar",
        description: "Something went wrong, try again!",
        variant: "destructive"
      });
    }
  });

  const handleAvatarSelect = (avatar: typeof GEN_ALPHA_AVATARS[0]) => {
    setSelectedAvatar(avatar.url);
  };

  const handleSave = () => {
    if (selectedAvatar && selectedAvatar !== currentAvatar) {
      updateAvatarMutation.mutate(selectedAvatar);
    }
  };

  const generateRandomAvatar = () => {
    const seeds = ['Alpha', 'Sigma', 'Chad', 'Rizz', 'GOAT', 'Slay', 'Based', 'NoCap', 'Fire', 'Iconic'];
    const colors = ['3b82f6', 'ef4444', '10b981', 'f59e0b', '8b5cf6', 'ec4899', '06b6d4'];
    const randomSeed = seeds[Math.floor(Math.random() * seeds.length)] + Math.random().toString(36).substring(2, 5);
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    const customUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(randomSeed)}&backgroundColor=${randomColor}`;
    setSelectedAvatar(customUrl);
  };

  const generateInitialsAvatar = () => {
    const colors = ['3b82f6', 'ef4444', '10b981', 'f59e0b', '8b5cf6', 'ec4899'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    const initialsUrl = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(userInitials)}&backgroundColor=${randomColor}`;
    setSelectedAvatar(initialsUrl);
  };

  const popularAvatars = GEN_ALPHA_AVATARS.filter(avatar => avatar.popular);
  const allAvatars = GEN_ALPHA_AVATARS.filter(avatar => !avatar.popular);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button 
            variant="ghost" 
            className="relative p-0 h-auto rounded-full hover:scale-105 transition-transform duration-200"
          >
            <Avatar className="h-10 w-10 border-2 border-primary/20 hover:border-primary/60 transition-colors">
              <AvatarImage src={currentAvatar} alt={userName || "Profile"} />
              <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-bold">
                {userInitials}
              </AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-primary rounded-full flex items-center justify-center">
              <Camera className="h-2.5 w-2.5 text-primary-foreground" />
            </div>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <Sparkles className="h-5 w-5 text-primary" />
            Choose Your Vibe ✨
          </DialogTitle>
          <p className="text-muted-foreground">Pick an avatar that matches your energy!</p>
        </DialogHeader>

        <div className="space-y-6 overflow-y-auto pr-2">
          {/* Current Avatar Preview */}
          <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
            <div className="relative">
              <Avatar className="h-16 w-16 border-4 border-primary/20">
                <AvatarImage src={selectedAvatar || currentAvatar} alt="Current" />
                <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-bold text-lg">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
              {selectedAvatar && selectedAvatar !== currentAvatar && (
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center animate-pulse">
                  <Check className="h-4 w-4 text-white" />
                </div>
              )}
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-foreground">Current Look</h4>
              <p className="text-sm text-muted-foreground">
                {selectedAvatar || currentAvatar ? 'Custom avatar selected' : 'Using your initials'}
              </p>
            </div>
          </div>

          {/* Popular Picks */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Zap className="h-4 w-4 text-yellow-500" />
              <h3 className="font-semibold text-foreground">Most Popular 🔥</h3>
            </div>
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
              {popularAvatars.map((avatar) => (
                <div key={avatar.id} className="text-center">
                  <button
                    onClick={() => handleAvatarSelect(avatar)}
                    className={`relative p-1 rounded-xl border-3 transition-all duration-200 hover:scale-110 ${
                      selectedAvatar === avatar.url
                        ? 'border-primary bg-primary/10 shadow-lg'
                        : 'border-transparent hover:border-primary/30'
                    }`}
                  >
                    <Avatar className="w-full aspect-square">
                      <AvatarImage src={avatar.url} alt={avatar.name} />
                      <AvatarFallback>{userInitials}</AvatarFallback>
                    </Avatar>
                    {selectedAvatar === avatar.url && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                        <Check className="h-3 w-3 text-primary-foreground" />
                      </div>
                    )}
                    <Badge 
                      variant="secondary" 
                      className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-xs px-1 py-0 bg-primary/20 text-primary border-0"
                    >
                      🔥
                    </Badge>
                  </button>
                  <p className="text-xs font-medium mt-1 truncate">{avatar.name}</p>
                  <p className="text-xs text-muted-foreground">{avatar.vibe}</p>
                </div>
              ))}
            </div>
          </div>

          {/* All Avatars */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="h-4 w-4 text-purple-500" />
              <h3 className="font-semibold text-foreground">More Vibes ✨</h3>
            </div>
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
              {allAvatars.map((avatar) => (
                <div key={avatar.id} className="text-center">
                  <button
                    onClick={() => handleAvatarSelect(avatar)}
                    className={`relative p-1 rounded-xl border-3 transition-all duration-200 hover:scale-110 ${
                      selectedAvatar === avatar.url
                        ? 'border-primary bg-primary/10 shadow-lg'
                        : 'border-transparent hover:border-primary/30'
                    }`}
                  >
                    <Avatar className="w-full aspect-square">
                      <AvatarImage src={avatar.url} alt={avatar.name} />
                      <AvatarFallback>{userInitials}</AvatarFallback>
                    </Avatar>
                    {selectedAvatar === avatar.url && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                        <Check className="h-3 w-3 text-primary-foreground" />
                      </div>
                    )}
                  </button>
                  <p className="text-xs font-medium mt-1 truncate">{avatar.name}</p>
                  <p className="text-xs text-muted-foreground">{avatar.vibe}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Custom Generation */}
          <div className="p-4 bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-lg border border-primary/20">
            <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
              <Shuffle className="h-4 w-4" />
              Create Custom Avatar
            </h4>
            <p className="text-sm text-muted-foreground mb-3">Generate something unique just for you!</p>
            <div className="flex gap-2 flex-wrap">
              <Button 
                variant="outline" 
                size="sm"
                onClick={generateInitialsAvatar}
                className="border-primary/30 hover:bg-primary/10"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Use My Initials
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={generateRandomAvatar}
                className="border-primary/30 hover:bg-primary/10"
              >
                <Shuffle className="h-3 w-3 mr-1" />
                Random Gen
              </Button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between items-center pt-4 border-t">
            <Button 
              variant="outline" 
              onClick={() => {
                setSelectedAvatar('');
                updateAvatarMutation.mutate('');
              }}
              disabled={updateAvatarMutation.isPending}
              className="text-muted-foreground hover:text-foreground"
            >
              Remove Avatar
            </Button>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setSelectedAvatar(currentAvatar || '')}
                disabled={selectedAvatar === (currentAvatar || '')}
              >
                Reset
              </Button>
              <Button
                onClick={handleSave}
                disabled={selectedAvatar === (currentAvatar || '') || updateAvatarMutation.isPending}
                className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 font-semibold"
              >
                {updateAvatarMutation.isPending ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Lock In This Look
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}