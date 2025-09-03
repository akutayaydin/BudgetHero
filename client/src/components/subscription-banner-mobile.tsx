import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, ArrowRight, Crown, Target, Shield, Clock } from "lucide-react";
import { Link } from "wouter";

interface SubscriptionBannerMobileProps {
  subscriptionStatus: {
    subscriptionPlan: string;
    trialEndsAt: string | null;
  };
  user: {
    firstName?: string;
    username?: string;
  } | null;
}

export function SubscriptionBannerMobile({ subscriptionStatus, user }: SubscriptionBannerMobileProps) {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible || !subscriptionStatus.trialEndsAt || subscriptionStatus.subscriptionPlan !== 'trial') {
    return null;
  }

  const trialEndDate = new Date(subscriptionStatus.trialEndsAt);
  const now = new Date();
  const timeLeft = Math.max(0, Math.ceil((trialEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
  const hoursLeft = Math.max(0, Math.ceil((trialEndDate.getTime() - now.getTime()) / (1000 * 60 * 60)));
  
  const displayTime = timeLeft > 0 ? `${timeLeft} day${timeLeft !== 1 ? 's' : ''}` : `${hoursLeft} hour${hoursLeft !== 1 ? 's' : ''}`;
  const displayName = user?.firstName || user?.username || 'there';
  const isUrgent = timeLeft <= 1;

  return (
    <div className="block md:hidden space-y-3 mb-4">
      {/* Top Alert Banner */}
      <div className={`w-full text-center py-2 px-4 ${isUrgent ? 'bg-red-100 dark:bg-red-900/30' : 'bg-yellow-100 dark:bg-yellow-900/30'} relative`}>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsVisible(false)}
          className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-700 hover:text-gray-900 p-1"
        >
          <X className="w-3 h-3" />
        </Button>
        
        <p className="text-sm font-medium text-gray-800">
          Your Premium access ends in {displayTime}
        </p>
      </div>

      {/* Main CTA Card */}
      <Card className="bg-gradient-to-br from-purple-500 to-indigo-600 text-white">
        <CardContent className="p-4">
          <div className="text-center space-y-3">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto">
              <Crown className="w-6 h-6 text-white" />
            </div>
            
            <div>
              <h3 className="text-lg font-bold mb-1">
                {isUrgent ? `⚡ Hey ${displayName}!` : `👑 Hey ${displayName}!`}
              </h3>
              <p className="text-purple-100 text-sm">
                {isUrgent ? 'Your trial expires soon!' : 'Keep your premium features'}
              </p>
            </div>

            <div className="flex items-center justify-center gap-2">
              <Badge variant="secondary" className="bg-white/20 text-white border-none text-xs">
                <Clock className="w-3 h-3 mr-1" />
                {displayTime} left
              </Badge>
            </div>

            <Link href="/subscription/plans">
              <Button 
                size="lg"
                className="w-full bg-white text-purple-600 hover:bg-gray-100 font-semibold"
              >
                <Crown className="w-4 h-4 mr-2" />
                Continue Premium - $9.99/mo
              </Button>
            </Link>
            
            <p className="text-xs text-purple-100">
              Cancel anytime • Keep all features
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Quick Features */}
      <Card>
        <CardContent className="p-3">
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-950/30 rounded-lg flex items-center justify-center mx-auto mb-1">
                <Shield className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">Unlimited</p>
              <p className="text-xs text-gray-500 dark:text-gray-500">Accounts</p>
            </div>
            <div>
              <div className="w-8 h-8 bg-green-100 dark:bg-green-950/30 rounded-lg flex items-center justify-center mx-auto mb-1">
                <Target className="w-4 h-4 text-green-600 dark:text-green-400" />
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">Smart</p>
              <p className="text-xs text-gray-500 dark:text-gray-500">Goals</p>
            </div>
            <div>
              <div className="w-8 h-8 bg-purple-100 dark:bg-purple-950/30 rounded-lg flex items-center justify-center mx-auto mb-1">
                <Crown className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">AI</p>
              <p className="text-xs text-gray-500 dark:text-gray-500">Insights</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}