import { Shield, Star, Zap } from "lucide-react";

interface HeroShieldLogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  showTagline?: boolean;
  className?: string;
}

export function HeroShieldLogo({ 
  size = "md", 
  showText = true, 
  showTagline = false,
  className = "" 
}: HeroShieldLogoProps) {
  const sizeClasses = {
    sm: {
      container: "w-7 h-7",
      shield: "w-4 h-4",
      star: "w-1.5 h-1.5",
      zap: "w-2 h-2",
      text: "text-lg",
      tagline: "text-xs"
    },
    md: {
      container: "w-8 h-8",
      shield: "w-5 h-5",
      star: "w-2 h-2",
      zap: "w-2.5 h-2.5",
      text: "text-xl",
      tagline: "text-sm"
    },
    lg: {
      container: "w-12 h-12",
      shield: "w-7 h-7",
      star: "w-3 h-3",
      zap: "w-3.5 h-3.5",
      text: "text-3xl",
      tagline: "text-base"
    }
  };

  const classes = sizeClasses[size];

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {/* Enhanced Hero Shield Logo */}
      <div className="relative">
        {/* Main Shield Container */}
        <div className={`${classes.container} bg-gradient-to-br from-purple-500 via-purple-600 to-pink-600 rounded-lg flex items-center justify-center relative overflow-hidden shadow-lg`}>
          {/* Heroic Glow Effect */}
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent rounded-lg"></div>
          
          {/* Main Shield Icon */}
          <Shield className={`${classes.shield} text-white relative z-10`} />
          
          {/* Hero Elements */}
          {/* Power Star - top right */}
          <div className="absolute -top-0.5 -right-0.5 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full p-0.5 shadow-sm">
            <Star className={`${classes.star} text-white fill-current`} />
          </div>
          
          {/* Lightning Bolt - bottom left for energy/power */}
          <div className="absolute -bottom-0.5 -left-0.5 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full p-0.5 shadow-sm">
            <Zap className={`${classes.zap} text-white fill-current`} />
          </div>
        </div>

        {/* Subtle Outer Glow */}
        <div className={`absolute inset-0 ${classes.container} bg-gradient-to-br from-purple-500/30 to-pink-600/30 rounded-lg blur-sm -z-10`}></div>
      </div>

      {/* Text Content */}
      {showText && (
        <div>
          <h1 className={`${classes.text} font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent`}>
            BudgetHero
          </h1>
          {showTagline && (
            <p className={`${classes.tagline} text-muted-foreground font-medium`}>
              Level Up Your Money
            </p>
          )}
        </div>
      )}
    </div>
  );
}