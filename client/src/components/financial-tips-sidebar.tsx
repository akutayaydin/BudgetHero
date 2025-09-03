import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  PiggyBank, 
  AlertTriangle, 
  Lightbulb,
  Calendar,
  Target,
  ChevronRight,
  ChevronDown,
  X,
  Heart,
  Shield,
  CheckCircle,
  XCircle,
  Clock,
  Smartphone
} from "lucide-react";

interface FinancialTip {
  id: string;
  type: 'insight' | 'warning' | 'opportunity' | 'achievement';
  title: string;
  description: string;
  actionable: boolean;
  priority: 'high' | 'medium' | 'low';
  category: string;
  amount?: number;
  percentage?: number;
  createdAt: string;
}

interface FinancialTipsResponse {
  dailyInsights: FinancialTip[];
  weeklyTrends: FinancialTip[];
  budgetAlerts: FinancialTip[];
  savingsOpportunities: FinancialTip[];
  lastUpdated: string;
}

interface FinancialHealthData {
  score: number;
  grade: string;
  factors: Array<{
    name: string;
    status: 'good' | 'warning' | 'critical';
    message: string;
  }>;
}

interface ReviewTransaction {
  id: string;
  merchant: string;
  amount: string;
  suggestedCategory: string;
  confidence: number;
}

export default function FinancialTipsSidebar() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isMinimized, setIsMinimized] = useState(true); // Start minimized by default
  const [isClosed, setIsClosed] = useState(true); // Start closed, show only as icon
  const [activeTab, setActiveTab] = useState<'daily' | 'weekly' | 'budget' | 'savings' | 'health' | 'review'>('daily');

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      // Already minimized by default for all devices
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const { data: tips, isLoading } = useQuery<FinancialTipsResponse>({
    queryKey: ["/api/financial-tips"],
    refetchInterval: 1000 * 60 * 30, // Refresh every 30 minutes
  });

  const { data: healthData } = useQuery<FinancialHealthData>({
    queryKey: ["/api/financial-health"],
  });

  const { data: reviewTransactions = [] } = useQuery<ReviewTransaction[]>({
    queryKey: ["/api/transactions/review"],
  });

  const getTipIcon = (type: FinancialTip['type']) => {
    switch (type) {
      case 'insight':
        return <Lightbulb className="h-4 w-4 text-blue-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'opportunity':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'achievement':
        return <Target className="h-4 w-4 text-purple-500" />;
      default:
        return <DollarSign className="h-4 w-4 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority: FinancialTip['priority']) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getCurrentTips = () => {
    if (!tips) return [];
    
    switch (activeTab) {
      case 'daily':
        return tips.dailyInsights;
      case 'weekly':
        return tips.weeklyTrends;
      case 'budget':
        return tips.budgetAlerts;
      case 'savings':
        return tips.savingsOpportunities;
      default:
        return tips.dailyInsights;
    }
  };

  const getHealthStatusIcon = (status: string) => {
    switch (status) {
      case 'good':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'critical':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className={`fixed ${isMobile ? 'bottom-4 left-4 right-4' : 'right-4 top-20'} z-40`}>
        <Card className={`shadow-lg border border-gray-200 dark:border-gray-700 ${isMobile ? 'w-full' : 'w-80'}`}>
          <CardContent className="p-4">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Mobile minimized view - enhanced floating button
  if (isMobile && isMinimized) {
    return (
      <div className="fixed bottom-20 right-4 z-40">
        <div className="relative group">
          {/* Animated pulse ring for mobile */}
          <div className="absolute inset-0 w-12 h-12 rounded-full bg-gradient-to-r from-green-400 to-blue-500 opacity-75 animate-ping"></div>
          <div className="absolute inset-0 w-12 h-12 rounded-full bg-gradient-to-r from-green-400 to-blue-500 opacity-50 animate-pulse"></div>
          
          {/* Main mobile button */}
          <Button
            onClick={() => setIsMinimized(false)}
            className="relative w-12 h-12 rounded-full shadow-xl bg-gradient-to-br from-emerald-500 via-blue-500 to-purple-600 hover:from-emerald-400 hover:via-blue-400 hover:to-purple-500 text-white border-2 border-white/20 backdrop-blur-sm transition-all duration-300 hover:scale-110 hover:shadow-2xl active:scale-95"
            title="Open Financial Tips"
          >
            {/* Animated background gradient */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-yellow-400/20 via-transparent to-green-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            
            {/* Icon with rotation animation */}
            <div className="relative z-10 transform group-hover:rotate-12 transition-transform duration-300">
              <Lightbulb className="h-5 w-5 drop-shadow-sm" />
            </div>
            
            {/* Sparkle effects */}
            <div className="absolute top-0.5 right-0.5 w-1.5 h-1.5 bg-yellow-300 rounded-full opacity-0 group-hover:opacity-100 animate-pulse"></div>
            <div className="absolute bottom-0.5 left-0.5 w-1 h-1 bg-white rounded-full opacity-0 group-hover:opacity-100 animate-pulse delay-100"></div>
          </Button>
          
          {/* Notification badge for mobile */}
          {(tips?.dailyInsights?.length || 0) > 0 || (tips?.weeklyTrends?.length || 0) > 0 ? (
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold animate-bounce shadow-lg">
              <span className="text-[10px]">{(tips?.dailyInsights?.length || 0) + (tips?.weeklyTrends?.length || 0)}</span>
            </div>
          ) : null}
        </div>
      </div>
    );
  }

  // If completely closed, show a small floating button to reopen
  if (isClosed) {
    return (
      <div className="fixed right-4 top-20 z-40">
        <div className="relative group">
          {/* Animated pulse ring */}
          <div className="absolute inset-0 w-14 h-14 rounded-full bg-gradient-to-r from-green-400 to-blue-500 opacity-75 animate-ping"></div>
          <div className="absolute inset-0 w-14 h-14 rounded-full bg-gradient-to-r from-green-400 to-blue-500 opacity-50 animate-pulse"></div>
          
          {/* Main button */}
          <Button
            onClick={() => setIsClosed(false)}
            className="relative w-14 h-14 rounded-full shadow-xl bg-gradient-to-br from-emerald-500 via-blue-500 to-purple-600 hover:from-emerald-400 hover:via-blue-400 hover:to-purple-500 text-white border-2 border-white/20 backdrop-blur-sm transition-all duration-300 hover:scale-110 hover:shadow-2xl group-hover:shadow-emerald-500/25"
            title="Open Financial Insights & Tips"
          >
            {/* Animated background gradient */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-yellow-400/20 via-transparent to-green-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            
            {/* Icon with rotation animation */}
            <div className="relative z-10 transform group-hover:rotate-12 transition-transform duration-300">
              <Lightbulb className="h-6 w-6 drop-shadow-sm" />
            </div>
            
            {/* Sparkle effect */}
            <div className="absolute top-1 right-1 w-2 h-2 bg-yellow-300 rounded-full opacity-0 group-hover:opacity-100 animate-pulse"></div>
            <div className="absolute bottom-1 left-1 w-1.5 h-1.5 bg-white rounded-full opacity-0 group-hover:opacity-100 animate-pulse delay-100"></div>
          </Button>
          
          {/* Tooltip */}
          <div className="absolute right-16 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0 pointer-events-none">
            <div className="bg-gray-900/90 text-white text-xs font-medium px-3 py-2 rounded-lg shadow-lg backdrop-blur-sm border border-white/10">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-3 w-3 text-green-400" />
                <span>Smart Financial Tips</span>
              </div>
              <div className="text-gray-300 text-xs mt-1">Click for insights & recommendations</div>
              {/* Arrow */}
              <div className="absolute top-1/2 -right-1 transform -translate-y-1/2 w-2 h-2 bg-gray-900/90 rotate-45 border-r border-b border-white/10"></div>
            </div>
          </div>
          
          {/* Notification badge for important tips */}
          {((tips?.dailyInsights?.length || 0) > 0 || (tips?.weeklyTrends?.length || 0) > 0) && (
            <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold animate-bounce shadow-lg">
              <span>{(tips?.dailyInsights?.length || 0) + (tips?.weeklyTrends?.length || 0)}</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`fixed ${isMobile ? 'bottom-0 left-0 right-0' : 'right-4 top-20'} z-40`}>
      <Card className={`shadow-lg border border-gray-200 dark:border-gray-700 transition-all duration-300 ${
        isMobile 
          ? 'w-full rounded-t-xl rounded-b-none max-h-[70vh]' 
          : isExpanded ? 'w-96' : 'w-80'
      }`}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <PiggyBank className="h-5 w-5 text-blue-500" />
              <CardTitle className={`${isMobile ? 'text-base' : 'text-lg'}`}>Financial Insights</CardTitle>
              {isMobile && <Smartphone className="h-4 w-4 text-gray-400" />}
            </div>
            <div className="flex items-center gap-2">
              {/* Close button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsClosed(true)}
                className="h-6 w-6 p-0"
                title="Close sidebar"
              >
                <X className="h-4 w-4" />
              </Button>
              
              {isMobile && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsMinimized(true)}
                  className="h-6 w-6 p-0"
                  title="Minimize to bottom"
                >
                  <ChevronDown className="h-4 w-4" />
                </Button>
              )}
              {!isMobile && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="h-6 w-6 p-0"
                  title={isExpanded ? "Shrink sidebar" : "Expand sidebar"}
                >
                  <ChevronRight className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                </Button>
              )}
            </div>
          </div>
          
          {tips?.lastUpdated && (
            <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
              <Calendar className="h-3 w-3" />
              Updated {new Date(tips.lastUpdated).toLocaleTimeString()}
            </div>
          )}
        </CardHeader>

        <CardContent className="pt-0">
          {/* Tab Navigation */}
          <div className={`grid gap-1 mb-4 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg ${isMobile ? 'grid-cols-3' : 'grid-cols-2'}`}>
            {[
              { key: 'daily', label: isMobile ? 'Daily' : 'Daily', icon: Calendar, count: tips?.dailyInsights.length || 0 },
              { key: 'weekly', label: isMobile ? 'Weekly' : 'Weekly', icon: TrendingUp, count: tips?.weeklyTrends.length || 0 },
              { key: 'budget', label: isMobile ? 'Budget' : 'Budget', icon: Target, count: tips?.budgetAlerts.length || 0 },
              { key: 'savings', label: isMobile ? 'Save' : 'Save', icon: PiggyBank, count: tips?.savingsOpportunities.length || 0 },
              { key: 'health', label: isMobile ? 'Health' : 'Health', icon: Heart, count: healthData ? 1 : 0 },
              { key: 'review', label: isMobile ? 'Review' : 'Review', icon: CheckCircle, count: reviewTransactions.length },
            ].map((tab) => (
              <Button
                key={tab.key}
                variant={activeTab === tab.key ? "default" : "ghost"}
                size="sm"
                onClick={() => setActiveTab(tab.key as any)}
                className={`flex items-center justify-center gap-1 text-xs relative ${isMobile ? 'flex-col p-2 h-auto' : 'flex-row'}`}
              >
                <tab.icon className="h-3 w-3" />
                <span className={isMobile ? 'text-xs' : ''}>{tab.label}</span>
                {tab.count > 0 && (
                  <Badge variant="secondary" className={`text-xs px-1 min-w-0 h-4 ${isMobile ? 'absolute -top-1 -right-1' : 'ml-1'}`}>
                    {tab.count}
                  </Badge>
                )}
              </Button>
            ))}
          </div>

          {/* Content based on active tab */}
          <ScrollArea className={`${isMobile ? 'h-64' : isExpanded ? 'h-96' : 'h-80'}`}>
            <div className="space-y-3">
              {/* Financial Health Score */}
              {activeTab === 'health' && (
                <div className="space-y-3">
                  {healthData ? (
                    <div className="space-y-3">
                  <div className="p-4 rounded-lg border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800">
                    <div className="flex items-center gap-3 mb-3">
                      <Heart className="h-5 w-5 text-red-500" />
                      <div>
                        <h3 className="font-semibold text-sm">Financial Health Score</h3>
                        <p className="text-xs text-gray-500">Grade: {healthData.grade}</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Score: {healthData.score}/100</span>
                        <span className={`font-medium ${
                          healthData.score >= 80 ? 'text-green-600' : 
                          healthData.score >= 60 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {healthData.grade}
                        </span>
                      </div>
                      <Progress value={healthData.score} className="h-2" />
                    </div>
                  </div>
                  
                  {healthData.factors.map((factor, index) => (
                    <div key={index} className="p-3 rounded-lg border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800">
                      <div className="flex items-start gap-3">
                        {getHealthStatusIcon(factor.status)}
                        <div className="flex-1">
                          <h4 className="font-medium text-sm text-gray-900 dark:text-gray-100">
                            {factor.name}
                          </h4>
                          <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                            {factor.message}
                          </p>
                        </div>
                      </div>
                    </div>
                    ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      <Heart className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Financial health score unavailable</p>
                      <p className="text-xs mt-1">Add more transactions to see your score</p>
                    </div>
                  )}
                </div>
              )}

              {/* Transaction Review */}
              {activeTab === 'review' && (
                <div className="space-y-3">
                  {reviewTransactions.length > 0 ? (
                    reviewTransactions.map((transaction) => (
                      <div key={transaction.id} className="p-3 rounded-lg border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800">
                        <div className="flex items-start gap-3">
                          <AlertTriangle className="h-4 w-4 text-yellow-500 mt-1" />
                          <div className="flex-1">
                            <h4 className="font-medium text-sm text-gray-900 dark:text-gray-100">
                              Review: {transaction.merchant}
                            </h4>
                            <p className="text-xs text-gray-600 dark:text-gray-300 mb-2">
                              Amount: {formatAmount(parseFloat(transaction.amount))}
                            </p>
                            <div className="flex items-center justify-between">
                              <div className="text-xs">
                                <span className="text-gray-500">Suggested: </span>
                                <span className="font-medium">{transaction.suggestedCategory}</span>
                                <span className="text-green-600 ml-1">({transaction.confidence}% confident)</span>
                              </div>
                              <Button variant="outline" size="sm" className="text-xs h-6 px-2">
                                Review
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      <CheckCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">All transactions categorized</p>
                      <p className="text-xs mt-1">Great job keeping up with your finances!</p>
                    </div>
                  )}
                </div>
              )}

              {/* Regular Tips */}
              {activeTab !== 'health' && activeTab !== 'review' && (
                <>
                  {getCurrentTips().length > 0 ? (
                    getCurrentTips().map((tip) => (
                  <div
                    key={tip.id}
                    className="p-3 rounded-lg border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-1">
                        {getTipIcon(tip.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">
                            {tip.title}
                          </h4>
                          <Badge className={`text-xs ${getPriorityColor(tip.priority)}`}>
                            {tip.priority}
                          </Badge>
                        </div>
                        
                        <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed mb-2">
                          {tip.description}
                        </p>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                            <span className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                              {tip.category}
                            </span>
                            {tip.amount && (
                              <span className="font-medium text-green-600 dark:text-green-400">
                                {formatAmount(tip.amount)}
                              </span>
                            )}
                            {tip.percentage && (
                              <span className="font-medium text-blue-600 dark:text-blue-400">
                                {tip.percentage > 0 ? '+' : ''}{tip.percentage.toFixed(1)}%
                              </span>
                            )}
                          </div>
                          
                          {tip.actionable && (
                            <Button variant="outline" size="sm" className="text-xs h-6 px-2">
                              Action
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      <PiggyBank className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No {activeTab} insights available</p>
                      <p className="text-xs mt-1">Check back later for personalized tips</p>
                    </div>
                  )}
                </>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}