import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  X, 
  TrendingUp, 
  TrendingDown, 
  AlertCircle, 
  Lightbulb,
  DollarSign,
  Target,
  PieChart,
  ArrowRight,
  Minimize2,
  Maximize2
} from 'lucide-react';
import { formatCurrency } from '@/lib/financial-utils';

interface FinancialTip {
  id: string;
  type: 'insight' | 'warning' | 'opportunity' | 'achievement';
  title: string;
  description: string;
  amount?: number;
  category?: string;
  priority: 'high' | 'medium' | 'low';
}

const STORAGE_KEY = 'financial-insights-popup-state';

interface PopupState {
  closed: boolean;
  minimized: boolean;
}

export default function FinancialInsightsPopup() {
  const [popupState, setPopupState] = useState<PopupState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : { closed: false, minimized: false };
    } catch {
      return { closed: false, minimized: false };
    }
  });

  // Fetch financial tips data
  const { data: tipsData } = useQuery({
    queryKey: ['/api/financial-tips'],
  });

  // Get real insights from the tips data
  const insights: FinancialTip[] = [
    ...((tipsData as any)?.dailyInsights || []).map((insight: any) => ({
      id: `daily-${insight.id || Math.random()}`,
      type: 'insight' as const,
      title: insight.title || 'Daily Insight',
      description: insight.message || insight.description || '',
      priority: insight.priority || 'medium' as const,
    })),
    ...((tipsData as any)?.weeklyTrends || []).map((trend: any) => ({
      id: `trend-${trend.category || Math.random()}`,
      type: trend.direction === 'up' ? 'warning' as const : 'opportunity' as const,
      title: `${trend.category} Trend`,
      description: `${trend.direction === 'up' ? 'Increased' : 'Decreased'} spending by ${formatCurrency(Math.abs(trend.change))}`,
      amount: Math.abs(trend.change),
      category: trend.category,
      priority: Math.abs(trend.change) > 100 ? 'high' as const : 'medium' as const,
    })),
  ];

  // Save state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(popupState));
  }, [popupState]);

  const handleClose = () => {
    setPopupState(prev => ({ ...prev, closed: true }));
  };

  const handleMinimize = () => {
    setPopupState(prev => ({ ...prev, minimized: !prev.minimized }));
  };

  const getInsightIcon = (type: FinancialTip['type']) => {
    switch (type) {
      case 'insight': return <Lightbulb className="h-4 w-4 text-blue-500" />;
      case 'warning': return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'opportunity': return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'achievement': return <Target className="h-4 w-4 text-purple-500" />;
      default: return <PieChart className="h-4 w-4 text-gray-500" />;
    }
  };

  const getInsightColor = (type: FinancialTip['type']) => {
    switch (type) {
      case 'insight': return 'bg-blue-50 border-blue-200 text-blue-800';
      case 'warning': return 'bg-red-50 border-red-200 text-red-800';
      case 'opportunity': return 'bg-green-50 border-green-200 text-green-800';
      case 'achievement': return 'bg-purple-50 border-purple-200 text-purple-800';
      default: return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  // Don't render if closed
  if (popupState.closed) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80 max-h-96 animate-in slide-in-from-bottom-2 slide-in-from-right-2 duration-300">
      <Card className="shadow-lg border-2 bg-white/95 backdrop-blur-sm">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              <CardTitle className="text-sm font-semibold">Financial Insights</CardTitle>
              {insights.length > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {insights.length}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMinimize}
                className="h-6 w-6 p-0 hover:bg-gray-100"
                aria-label={popupState.minimized ? "Expand insights" : "Minimize insights"}
              >
                {popupState.minimized ? (
                  <Maximize2 className="h-3 w-3" />
                ) : (
                  <Minimize2 className="h-3 w-3" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClose}
                className="h-6 w-6 p-0 hover:bg-gray-100"
                aria-label="Close insights"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </CardHeader>

        {!popupState.minimized && (
          <CardContent className="pt-0">
            {insights.length === 0 ? (
              <div className="text-center py-4 text-gray-500">
                <PieChart className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm">No new insights available</p>
                <p className="text-xs text-gray-400 mt-1">Check back later for financial tips</p>
              </div>
            ) : (
              <ScrollArea className="max-h-64">
                <div className="space-y-3">
                  {insights.slice(0, 3).map((insight) => (
                    <div
                      key={insight.id}
                      className={`p-3 rounded-lg border ${getInsightColor(insight.type)}`}
                    >
                      <div className="flex items-start gap-2">
                        {getInsightIcon(insight.type)}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate">
                            {insight.title}
                          </p>
                          <p className="text-xs mt-1 line-clamp-2">
                            {insight.description}
                          </p>
                          {insight.amount && (
                            <p className="text-xs font-semibold mt-1">
                              {formatCurrency(insight.amount)}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {insights.length > 3 && (
                    <div className="text-center pt-2">
                      <Button variant="ghost" size="sm" className="text-xs h-6">
                        View {insights.length - 3} more insights
                        <ArrowRight className="h-3 w-3 ml-1" />
                      </Button>
                    </div>
                  )}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        )}
      </Card>
    </div>
  );
}