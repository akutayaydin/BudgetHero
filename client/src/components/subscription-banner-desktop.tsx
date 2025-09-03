import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, ArrowRight, Crown, Target, Shield, Clock, Sparkles, TrendingUp, Zap } from "lucide-react";
import { Link } from "wouter";

interface SubscriptionBannerDesktopProps {
  subscriptionStatus: {
    subscriptionPlan: string;
    trialEndsAt: string | null;
  };
  user: {
    firstName?: string;
    username?: string;
  } | null;
}

function getUrgencyLevel(trialEndsAt: string | null): string {
  if (!trialEndsAt) return 'info';
  const trialEndDate = new Date(trialEndsAt);
  const now = new Date();
  const hoursLeft = (trialEndDate.getTime() - now.getTime()) / (1000 * 60 * 60);
  
  if (hoursLeft <= 24) return 'critical';
  if (hoursLeft <= 72) return 'warning';
  return 'info';
}

function getTimeLeft(trialEndsAt: string | null): string {
  if (!trialEndsAt) return '';
  const trialEndDate = new Date(trialEndsAt);
  const now = new Date();
  const timeLeft = Math.max(0, Math.ceil((trialEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
  const hoursLeft = Math.max(0, Math.ceil((trialEndDate.getTime() - now.getTime()) / (1000 * 60 * 60)));
  
  return timeLeft > 0 ? `${timeLeft} day${timeLeft !== 1 ? 's' : ''}` : `${hoursLeft} hour${hoursLeft !== 1 ? 's' : ''}`;
}

export function SubscriptionBannerDesktop({ subscriptionStatus, user }: SubscriptionBannerDesktopProps) {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible || !subscriptionStatus.trialEndsAt || subscriptionStatus.subscriptionPlan !== 'trial') {
    return null;
  }

  const displayName = user?.firstName || user?.username || 'there';
  const urgencyLevel = getUrgencyLevel(subscriptionStatus.trialEndsAt);
  const timeLeft = getTimeLeft(subscriptionStatus.trialEndsAt);
  const isUrgent = urgencyLevel === 'critical' || urgencyLevel === 'warning';

  return (
    <div className="hidden md:block space-y-4 mb-6">
      {/* Top Banner */}
      <div className={`w-full text-center py-3 px-4 relative rounded-lg ${
        urgencyLevel === 'critical' ? 'bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800' :
        'bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800'
      }`}>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsVisible(false)}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-700 hover:text-gray-900"
        >
          <X className="w-4 h-4" />
        </Button>
        
        <div className="flex items-center justify-center gap-2">
          <span className="font-semibold text-gray-800">
            Your Premium access ends in {timeLeft}
          </span>
          <Link href="/subscription/plans">
            <ArrowRight className="w-4 h-4 text-gray-700 hover:text-gray-900 cursor-pointer" />
          </Link>
        </div>
      </div>

      {/* Main Feature Card */}
      <Card className="border-2 border-purple-200 dark:border-purple-700 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950/30 dark:to-indigo-950/30">
        <CardContent className="p-6">
          <div className="grid md:grid-cols-3 gap-6 items-center">
            {/* Left: Hero Content */}
            <div className="md:col-span-2 space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center">
                  {isUrgent ? <Zap className="w-8 h-8 text-white" /> : <Crown className="w-8 h-8 text-white" />}
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                    {isUrgent ? `⚡ Hey ${displayName}!` : `👑 Hey ${displayName}!`}
                  </h3>
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary" className="bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200">
                      <Sparkles className="w-3 h-3 mr-1" />
                      Premium Trial Active
                    </Badge>
                    <Badge variant={urgencyLevel === 'critical' ? 'destructive' : 'outline'} className="animate-pulse">
                      <Clock className="w-3 h-3 mr-1" />
                      {timeLeft} left
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                  {isUrgent ? "Don't lose your premium features!" : "Keep unlimited access to premium features"}
                </h4>
                <p className="text-gray-600 dark:text-gray-400">
                  Continue with unlimited bank connections, AI insights, smart budgeting tools, and advanced analytics for just{' '}
                  <span className="font-semibold text-green-600">$9.99/month</span>
                </p>
              </div>

              {/* Feature Grid */}
              <div className="grid grid-cols-3 gap-6 py-4">
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-950/30 rounded-lg flex items-center justify-center mx-auto mb-2">
                    <TrendingUp className="w-6 h-6 text-blue-500" />
                  </div>
                  <h5 className="font-medium text-gray-900 dark:text-white text-sm">AI Insights</h5>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Smart spending analysis</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-green-100 dark:bg-green-950/30 rounded-lg flex items-center justify-center mx-auto mb-2">
                    <Shield className="w-6 h-6 text-green-500" />
                  </div>
                  <h5 className="font-medium text-gray-900 dark:text-white text-sm">Unlimited Accounts</h5>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Connect all your banks</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-purple-100 dark:bg-purple-950/30 rounded-lg flex items-center justify-center mx-auto mb-2">
                    <Target className="w-6 h-6 text-purple-500" />
                  </div>
                  <h5 className="font-medium text-gray-900 dark:text-white text-sm">Smart Goals</h5>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Automated savings</p>
                </div>
              </div>
            </div>

            {/* Right: Action */}
            <div className="text-center space-y-4">
              <Link href="/subscription/plans">
                <Button 
                  size="lg"
                  className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold px-8 py-4 text-lg shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <Crown className="w-5 h-5 mr-2" />
                  {isUrgent ? 'Upgrade Now!' : 'Continue Premium'}
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  $9.99/month
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Cancel anytime • No hidden fees
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Setup Progress Card */}
      <Card className="border border-gray-200 dark:border-gray-700">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
              COMPLETE SETUP ({urgencyLevel === 'critical' ? '3/3' : '2/3'})
            </h3>
            <div className="w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${
                  urgencyLevel === 'critical' ? 'bg-red-500 w-full' : 'bg-blue-500 w-2/3'
                }`}
              />
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center">
                  <Crown className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white text-sm">
                    Reactivate Premium
                  </h4>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Ends in {timeLeft}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                <Target className="w-5 h-5 text-white" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white text-sm">
                  Start saving with Goals
                </h4>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Set up automatic savings
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-full flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white text-sm">
                  Connect more accounts
                </h4>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Get complete picture
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}