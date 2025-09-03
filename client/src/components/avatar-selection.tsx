import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  Sparkles,
  Zap,
  Shuffle,
  Camera,
  Crown,
  Star,
  TrendingUp,
  Heart,
  Check,
  User,
  Gamepad2,
  Rocket,
  Bot,
  Search,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";

// Modern avatar collection with diverse styles
const AVATAR_CATEGORIES = {
  trending: {
    name: "Trending Now",
    icon: TrendingUp,
    color: "from-pink-500 to-violet-500",
    avatars: [
      {
        id: 'sigma-male',
        url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=SigmaMale&backgroundColor=3b82f6&accessories=wayfarers&accessoriesColor=262e33&clothing=hoodie&clothingColor=2563eb&eyes=happy&eyebrows=default&facialHair=beard&facialHairColor=724133&hair=shortWaved&hairColor=2c1b18&mouth=smile&skin=light',
        name: 'Sigma Energy',
        vibe: '💯 Alpha',
        trending: true
      },
      {
        id: 'npc-energy',
        url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=NPCEnergy&backgroundColor=ef4444&clothing=graphicShirt&clothingColor=65a30d&eyes=default&eyebrows=unibrow&hair=longButNotTooLong&hairColor=f59e0b&mouth=default&skin=yellow',
        name: 'NPC Vibes',
        vibe: '🤖 Basic',
        trending: true
      },
      {
        id: 'rizz-master',
        url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=RizzMaster&backgroundColor=8b5cf6&accessories=round&accessoriesColor=fbbf24&clothing=blazer&clothingColor=1f2937&eyes=wink&eyebrows=raised&hair=shortCurly&hairColor=0f172a&mouth=smile&skin=brown',
        name: 'Rizz Master',
        vibe: '😎 Charisma',
        trending: true
      }
    ]
  },
  aesthetic: {
    name: "Aesthetic Vibes",
    icon: Sparkles,
    color: "from-purple-500 to-pink-500",
    avatars: [
      {
        id: 'vaporwave',
        url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Vaporwave&backgroundColor=a855f7&clothing=overall&clothingColor=ec4899&eyes=hearts&eyebrows=default&hair=longStraight&hairColor=ec4899&mouth=smile&skin=light',
        name: 'Vaporwave',
        vibe: '🌈 Retro',
        aesthetic: true
      },
      {
        id: 'cyberpunk',
        url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Cyberpunk&backgroundColor=06b6d4&accessories=wayfarers&accessoriesColor=000000&clothing=hoodie&clothingColor=0f172a&eyes=squint&hair=shortFlat&hairColor=06b6d4&mouth=serious&skin=pale',
        name: 'Cyberpunk',
        vibe: '⚡ Future',
        aesthetic: true
      },
      {
        id: 'cottagecore',
        url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Cottagecore&backgroundColor=10b981&clothing=shirtScoopNeck&clothingColor=16a34a&eyes=happy&eyebrows=default&hair=longCurly&hairColor=a3a3a3&mouth=smile&skin=light',
        name: 'Cottagecore',
        vibe: '🌿 Natural',
        aesthetic: true
      }
    ]
  },
  gaming: {
    name: "Gaming Legends",
    icon: Gamepad2,
    color: "from-green-500 to-blue-500",
    avatars: [
      {
        id: 'gamer-chad',
        url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=GamerChad&backgroundColor=22c55e&accessories=round&accessoriesColor=000000&clothing=graphicShirt&clothingColor=1f2937&eyes=default&eyebrows=angry&hair=shortWaved&hairColor=0f172a&mouth=serious&skin=light',
        name: 'Gamer Chad',
        vibe: '🎮 Pro',
        gaming: true
      },
      {
        id: 'speedrunner',
        url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Speedrunner&backgroundColor=f59e0b&clothing=hoodie&clothingColor=dc2626&eyes=squint&eyebrows=raised&hair=shortFlat&hairColor=7c2d12&mouth=default&skin=brown',
        name: 'Speedrunner',
        vibe: '⚡ Fast',
        gaming: true
      }
    ]
  },
  ai: {
    name: "AI Generation",
    icon: Bot,
    color: "from-indigo-500 to-cyan-500",
    avatars: [
      {
        id: 'ai-generated',
        url: 'https://api.dicebear.com/7.x/bottts/svg?seed=AIGenerated&backgroundColor=6366f1&primaryColor=3b82f6',
        name: 'AI Bot',
        vibe: '🤖 Digital',
        ai: true
      },
      {
        id: 'neural-net',
        url: 'https://api.dicebear.com/7.x/bottts/svg?seed=NeuralNet&backgroundColor=8b5cf6&primaryColor=a855f7',
        name: 'Neural Net',
        vibe: '🧠 Smart',
        ai: true
      }
    ]
  }
};

interface AvatarSelectionProps {
  currentAvatar?: string;
  userInitials: string;
  userName?: string;
  onAvatarChange?: (avatarUrl: string) => void;
  trigger?: React.ReactNode;
  compact?: boolean;
}

export function AvatarSelection({ 
  currentAvatar, 
  userInitials, 
  userName, 
  onAvatarChange,
  trigger,
  compact = false
}: AvatarSelectionProps) {
  const [selectedAvatar, setSelectedAvatar] = useState(currentAvatar || '');
  const [isOpen, setIsOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState('trending');
  const [showMoreAvatars, setShowMoreAvatars] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateAvatarMutation = useMutation({
    mutationFn: async (avatarUrl: string) => {
      console.log('Attempting to save avatar:', avatarUrl);
      try {
        const result = await apiRequest('PATCH', '/api/user/avatar', { profileImageUrl: avatarUrl });
        console.log('Avatar save successful:', result);
        return result;
      } catch (error) {
        console.error('Avatar save failed:', error);
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log('Avatar update mutation successful:', data);
      toast({
        title: "Avatar updated!",
        description: "Your new look has been saved successfully!"
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      onAvatarChange?.(selectedAvatar);
      setIsOpen(false);
    },
    onError: (error: any) => {
      console.error('Avatar update mutation error:', error);
      const errorMessage = error?.message || error?.toString() || "Something went wrong";
      toast({
        title: "Couldn't update avatar",
        description: errorMessage,
        variant: "destructive"
      });
    }
  });

  const handleAvatarSelect = (avatar: any) => {
    setSelectedAvatar(avatar.url);
  };

  const handleSave = () => {
    console.log('Save button clicked:', {
      selectedAvatar,
      currentAvatar,
      hasSelectedAvatar: !!selectedAvatar,
      isDifferent: selectedAvatar !== currentAvatar
    });
    
    if (selectedAvatar && selectedAvatar !== currentAvatar) {
      console.log('Starting avatar update mutation...');
      updateAvatarMutation.mutate(selectedAvatar);
    } else {
      console.log('Save conditions not met:', {
        noSelectedAvatar: !selectedAvatar,
        sameAsCurrentAvatar: selectedAvatar === currentAvatar
      });
      toast({
        title: "No changes to save",
        description: "Please select a different avatar to save changes.",
        variant: "default"
      });
    }
  };

  const generateRandomAvatar = () => {
    const seeds = ['Alpha', 'Sigma', 'Chad', 'Rizz', 'GOAT', 'Slay', 'Based', 'NoCap', 'Fire', 'Iconic', 'Bussin', 'Periodt', 'Flex'];
    const colors = ['3b82f6', 'ef4444', '10b981', 'f59e0b', '8b5cf6', 'ec4899', '06b6d4', 'f97316'];
    const randomSeed = seeds[Math.floor(Math.random() * seeds.length)] + Math.random().toString(36).substring(2, 5);
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    const customUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(randomSeed)}&backgroundColor=${randomColor}`;
    setSelectedAvatar(customUrl);
  };

  const generateInitialsAvatar = () => {
    const colors = ['3b82f6', 'ef4444', '10b981', 'f59e0b', '8b5cf6', 'ec4899', '06b6d4', 'f97316'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    const initialsUrl = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(userInitials)}&backgroundColor=${randomColor}`;
    setSelectedAvatar(initialsUrl);
  };

  const performSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    try {
      // Generate search-based avatars using different styles and the search query as seed
      const searchResults = [];
      const styles = ['avataaars', 'adventurer', 'big-smile', 'bottts', 'fun-emoji', 'personas'];
      const colors = ['3b82f6', 'ef4444', '10b981', 'f59e0b', '8b5cf6', 'ec4899', '06b6d4', 'f97316'];
      
      // Create variations based on search query
      for (let i = 0; i < 12; i++) {
        const style = styles[i % styles.length];
        const color = colors[i % colors.length];
        const searchSeed = `${query}${i}`;
        
        searchResults.push({
          id: `search-${i}`,
          url: `https://api.dicebear.com/7.x/${style}/svg?seed=${encodeURIComponent(searchSeed)}&backgroundColor=${color}`,
          name: `${query} ${i + 1}`,
          style: style
        });
      }
      
      setSearchResults(searchResults);
    } catch (error) {
      console.error('Search failed:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    // Debounce search
    const timeoutId = setTimeout(() => {
      performSearch(query);
    }, 300);
    
    return () => clearTimeout(timeoutId);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setIsSearching(false);
  };

  const generateMoreAvatars = () => {
    const styles = ['avataaars', 'personas', 'fun-emoji', 'bottts', 'lorelei', 'notionists', 'adventurer'];
    const seeds = ['Creative', 'Professional', 'Artistic', 'Dynamic', 'Cool', 'Vibrant', 'Modern', 'Classic', 'Bold', 'Fresh'];
    const colors = ['3b82f6', 'ef4444', '10b981', 'f59e0b', '8b5cf6', 'ec4899', '06b6d4', 'f97316', '84cc16', 'f59e0b'];
    
    const newAvatars = [];
    for (let i = 0; i < 12; i++) {
      const randomStyle = styles[Math.floor(Math.random() * styles.length)];
      const randomSeed = seeds[Math.floor(Math.random() * seeds.length)] + Math.random().toString(36).substring(2, 4);
      const randomColor = colors[Math.floor(Math.random() * colors.length)];
      newAvatars.push({
        id: `generated-${i}`,
        url: `https://api.dicebear.com/7.x/${randomStyle}/svg?seed=${encodeURIComponent(randomSeed)}&backgroundColor=${randomColor}`,
        name: `Style ${i + 1}`,
        vibe: '🎨 Generated',
        generated: true
      });
    }
    return newAvatars;
  };

  const currentCategory = AVATAR_CATEGORIES[activeCategory as keyof typeof AVATAR_CATEGORIES];
  const CategoryIcon = currentCategory.icon;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" className="group relative p-2 hover:bg-primary/10 transition-all duration-300">
            <div className="relative">
              <Avatar className={cn(
                "border-2 border-primary/30 group-hover:border-primary transition-all duration-300 group-hover:scale-105",
                compact ? "h-8 w-8" : "h-10 w-10"
              )}>
                <AvatarImage src={currentAvatar} alt={userName || "Profile"} />
                <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-bold">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-gradient-to-r from-pink-500 to-violet-500 rounded-full flex items-center justify-center animate-pulse">
                <Sparkles className="h-2.5 w-2.5 text-white" />
              </div>
            </div>
            {!compact && (
              <div className="ml-2 text-left hidden sm:block">
                <div className="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                  Customize Look
                </div>
                <div className="text-[10px] text-primary">✨ Trendy Style</div>
              </div>
            )}
          </Button>
        )}
      </DialogTrigger>
      
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col bg-gradient-to-br from-background via-background to-primary/5">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-2xl font-bold bg-gradient-to-r from-primary to-pink-500 bg-clip-text text-transparent">
            <div className="w-8 h-8 bg-gradient-to-r from-primary to-pink-500 rounded-lg flex items-center justify-center animate-pulse">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            Choose Your Vibe ✨
          </DialogTitle>
          <p className="text-muted-foreground">Pick an avatar that matches your personality and style!</p>
        </DialogHeader>

        <div className="space-y-6 overflow-y-auto pr-2 flex-1 min-h-0">
          {/* Current Avatar Preview */}
          <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-primary/10 to-pink-500/10 rounded-xl border border-primary/20">
            <div className="relative">
              <Avatar className="h-16 w-16 border-4 border-primary/30 shadow-lg">
                <AvatarImage src={selectedAvatar || currentAvatar} alt="Current" />
                <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-bold text-lg">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
              {selectedAvatar && selectedAvatar !== currentAvatar && (
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center animate-bounce">
                  <Check className="h-4 w-4 text-white" />
                </div>
              )}
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-foreground">Current Look</h4>
              <p className="text-sm text-muted-foreground">
                {selectedAvatar && selectedAvatar !== currentAvatar ? "New selection ready!" : "Your current vibe"}
              </p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={generateRandomAvatar} className="gap-2">
                <Shuffle className="h-4 w-4" />
                Random
              </Button>
              <Button size="sm" variant="outline" onClick={generateInitialsAvatar} className="gap-2">
                <User className="h-4 w-4" />
                Initials
              </Button>
            </div>
          </div>

          {/* Search Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Search className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">Search Avatars</h3>
            </div>
            
            <div className="relative">
              <Input
                placeholder="Search for style, theme, or personality... (e.g., 'cool', 'professional', 'fun')"
                value={searchQuery}
                onChange={handleSearchChange}
                className="pl-10 pr-10 bg-background/50 border-primary/20 focus:border-primary/40"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearSearch}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-destructive/10"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* Search Results */}
            {searchQuery && (
              <div className="space-y-3">
                {isSearching ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                      <span>Finding perfect avatars for "{searchQuery}"...</span>
                    </div>
                  </div>
                ) : searchResults.length > 0 ? (
                  <>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="bg-primary/10 text-primary">
                        {searchResults.length} results for "{searchQuery}"
                      </Badge>
                    </div>
                    <div className="grid grid-cols-6 gap-3">
                      {searchResults.map((avatar) => (
                        <div key={avatar.id} className="relative group">
                          <button
                            onClick={() => handleAvatarSelect(avatar)}
                            className={cn(
                              "w-full aspect-square rounded-xl border-2 p-2 transition-all duration-300 hover:scale-105 hover:shadow-lg",
                              selectedAvatar === avatar.url
                                ? "border-primary bg-primary/10 shadow-lg scale-105"
                                : "border-primary/20 hover:border-primary/40 bg-background/50"
                            )}
                          >
                            <Avatar className="w-full h-full">
                              <AvatarImage src={avatar.url} alt={avatar.name} />
                              <AvatarFallback>{avatar.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            {selectedAvatar === avatar.url && (
                              <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                                <Check className="h-3 w-3 text-primary-foreground" />
                              </div>
                            )}
                          </button>
                          <div className="text-center mt-1">
                            <p className="text-xs text-muted-foreground truncate">{avatar.style}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="text-center py-6 text-muted-foreground">
                    <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No results found for "{searchQuery}"</p>
                    <p className="text-xs">Try searching for different keywords like 'robot', 'pixel', or 'cartoon'</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {!searchQuery && (
            <>
              {/* Category Tabs */}
              <div className="flex flex-wrap gap-2">
            {Object.entries(AVATAR_CATEGORIES).map(([key, category]) => {
              const Icon = category.icon;
              const isActive = activeCategory === key;
              return (
                <Button
                  key={key}
                  variant={isActive ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveCategory(key)}
                  className={cn(
                    "gap-2 transition-all duration-300",
                    isActive && `bg-gradient-to-r ${category.color} text-white border-0 shadow-lg`
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {category.name}
                </Button>
              );
            })}
          </div>

          {/* Avatar Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {currentCategory.avatars.map((avatar) => (
              <div
                key={avatar.id}
                className={cn(
                  "group relative p-4 bg-card rounded-xl border-2 cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-105",
                  selectedAvatar === avatar.url 
                    ? "border-primary shadow-lg bg-primary/5" 
                    : "border-border hover:border-primary/50"
                )}
                onClick={() => handleAvatarSelect(avatar)}
              >
                <div className="relative mb-3">
                  <Avatar className="h-16 w-16 mx-auto border-2 border-primary/20 group-hover:border-primary/50 transition-all">
                    <AvatarImage src={avatar.url} alt={avatar.name} />
                    <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10">
                      <User className="h-8 w-8 text-primary" />
                    </AvatarFallback>
                  </Avatar>
                  {selectedAvatar === avatar.url && (
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center animate-pulse">
                      <Check className="h-4 w-4 text-primary-foreground" />
                    </div>
                  )}
                  {('trending' in avatar && avatar.trending) && (
                    <Badge className="absolute -top-1 -left-1 text-xs bg-gradient-to-r from-pink-500 to-violet-500 border-0">
                      🔥
                    </Badge>
                  )}
                </div>
                <div className="text-center">
                  <h4 className="font-medium text-sm text-card-foreground group-hover:text-primary transition-colors">
                    {avatar.name}
                  </h4>
                  <p className="text-xs text-muted-foreground mt-1">{avatar.vibe}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Browse More Avatars Section */}
          {!showMoreAvatars ? (
            <div className="text-center py-6">
              <Button 
                onClick={() => setShowMoreAvatars(true)}
                className="gap-2 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white border-0"
              >
                <Rocket className="h-4 w-4" />
                Browse More Avatars
              </Button>
              <p className="text-xs text-muted-foreground mt-2">
                Discover more unique styles and designs
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-foreground">More Avatar Styles</h4>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => setShowMoreAvatars(false)}
                >
                  Show Less
                </Button>
              </div>
              <div className="max-h-96 overflow-y-auto pr-2">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {generateMoreAvatars().map((avatar) => (
                  <div
                    key={avatar.id}
                    className={cn(
                      "group relative p-4 bg-card rounded-xl border-2 cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-105",
                      selectedAvatar === avatar.url 
                        ? "border-primary shadow-lg bg-primary/5" 
                        : "border-border hover:border-primary/50"
                    )}
                    onClick={() => handleAvatarSelect(avatar)}
                  >
                    <div className="relative mb-3">
                      <Avatar className="h-16 w-16 mx-auto border-2 border-primary/20 group-hover:border-primary/50 transition-all">
                        <AvatarImage src={avatar.url} alt={avatar.name} />
                        <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10">
                          <User className="h-8 w-8 text-primary" />
                        </AvatarFallback>
                      </Avatar>
                      {selectedAvatar === avatar.url && (
                        <div className="absolute -top-2 -right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center animate-pulse">
                          <Check className="h-4 w-4 text-primary-foreground" />
                        </div>
                      )}
                      <Badge className="absolute -top-1 -left-1 text-xs bg-gradient-to-r from-blue-500 to-purple-500 border-0">
                        ✨
                      </Badge>
                    </div>
                    <div className="text-center">
                      <h4 className="font-medium text-sm text-card-foreground group-hover:text-primary transition-colors">
                        {avatar.name}
                      </h4>
                      <p className="text-xs text-muted-foreground mt-1">{avatar.vibe}</p>
                    </div>
                  </div>
                ))}
                </div>
              </div>
            </div>
          )}
            </>
          )}

          {/* Action Buttons */}
        </div>
        <div className="flex gap-3 pt-4 border-t mt-4 flex-shrink-0">
          <Button 
              onClick={handleSave} 
              disabled={!selectedAvatar || selectedAvatar === currentAvatar || updateAvatarMutation.isPending}
              className="flex-1 bg-gradient-to-r from-primary to-pink-500 hover:from-primary/90 hover:to-pink-500/90 text-white border-0"
            >
              {updateAvatarMutation.isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                  Updating...
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
          </Button>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}