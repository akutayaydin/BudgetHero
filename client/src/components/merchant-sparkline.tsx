import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { formatCurrency, formatDate } from "@/lib/financial-utils";

interface MerchantSparklineProps {
  merchant: string;
  currentAmount: string;
  transactionDate: string;
}

export function MerchantSparkline({ merchant, currentAmount, transactionDate }: MerchantSparklineProps) {
  // Fetch merchant transaction history for sparkline
  const { data: merchantHistory = [] } = useQuery<any[]>({
    queryKey: ['/api/transactions', 'merchant-history', merchant],
    queryFn: async () => {
      if (!merchant) return [];
      
      const response = await fetch(`/api/transactions?merchant=${encodeURIComponent(merchant)}&limit=50`);
      if (!response.ok) return [];
      
      const transactions = await response.json();
      
      // Group by month and calculate totals
      const monthlyData = transactions.reduce((acc: any, txn: any) => {
        const date = new Date(txn.date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        if (!acc[monthKey]) {
          acc[monthKey] = { total: 0, count: 0, month: monthKey };
        }
        
        acc[monthKey].total += parseFloat(txn.amount);
        acc[monthKey].count += 1;
        
        return acc;
      }, {});
      
      // Convert to array and sort by month
      return Object.values(monthlyData)
        .sort((a: any, b: any) => a.month.localeCompare(b.month))
        .slice(-6); // Last 6 months
    },
    enabled: !!merchant
  });

  // Calculate sparkline path
  const sparklinePath = useMemo(() => {
    if (!merchantHistory.length || merchantHistory.length < 2) return '';
    
    const width = 60;
    const height = 20;
    const padding = 2;
    
    const amounts = merchantHistory.map((d: any) => d.total);
    const minAmount = Math.min(...amounts);
    const maxAmount = Math.max(...amounts);
    const range = maxAmount - minAmount || 1;
    
    const points = merchantHistory.map((d: any, i: number) => {
      const x = padding + (i * (width - 2 * padding)) / (merchantHistory.length - 1);
      const y = height - padding - ((d.total - minAmount) / range) * (height - 2 * padding);
      return `${x},${y}`;
    });
    
    return `M ${points.join(' L ')}`;
  }, [merchantHistory]);

  // Calculate trend
  const trend = useMemo(() => {
    if (merchantHistory.length < 2) return 'neutral';
    
    const recent = merchantHistory.slice(-2);
    const change = recent[1].total - recent[0].total;
    
    return change > 0 ? 'up' : change < 0 ? 'down' : 'neutral';
  }, [merchantHistory]);

  // Calculate merchant statistics
  const merchantStats = useMemo(() => {
    if (!merchantHistory.length) return null;
    
    const totalSpent = merchantHistory.reduce((sum: number, d: any) => sum + d.total, 0);
    const avgSpend = totalSpent / merchantHistory.length;
    const lastMonth = merchantHistory[merchantHistory.length - 1];
    
    return {
      avgSpend,
      totalSpent,
      lastAmount: lastMonth?.total || 0,
      transactionCount: merchantHistory.reduce((sum: number, d: any) => sum + d.count, 0),
      months: merchantHistory.length
    };
  }, [merchantHistory]);

  if (!merchant || !merchantHistory.length) {
    return (
      <div className="w-16 h-5 flex items-center justify-center">
        <div className="w-12 h-1 bg-gray-200 rounded"></div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="hidden sm:flex items-center cursor-pointer group w-20 h-8 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-1 hover:shadow-sm transition-all duration-300">
            <div className="relative w-full h-full">
              <svg width="100%" height="100%" viewBox="0 0 60 20" className="overflow-visible">
                {/* Background gradient */}
                <defs>
                  <linearGradient id={`gradient-${merchant.replace(/\s+/g, '')}`} x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor={trend === 'up' ? '#22c55e' : trend === 'down' ? '#ef4444' : '#6b7280'} stopOpacity="0.3" />
                    <stop offset="100%" stopColor={trend === 'up' ? '#22c55e' : trend === 'down' ? '#ef4444' : '#6b7280'} stopOpacity="0.05" />
                  </linearGradient>
                </defs>
                
                {/* Area fill */}
                {sparklinePath && (
                  <path
                    d={`${sparklinePath} L 60,18 L 2,18 Z`}
                    fill={`url(#gradient-${merchant.replace(/\s+/g, '')})`}
                    className="transition-all duration-300"
                  />
                )}
                
                {/* Main line */}
                <path
                  d={sparklinePath}
                  fill="none"
                  stroke={trend === 'up' ? '#22c55e' : trend === 'down' ? '#ef4444' : '#6b7280'}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="group-hover:stroke-width-3 transition-all duration-300 drop-shadow-sm"
                />
                
                {/* Data points */}
                {merchantHistory.map((_, i) => {
                  const x = 2 + (i * (60 - 4)) / Math.max(merchantHistory.length - 1, 1);
                  const amounts = merchantHistory.map((d: any) => d.total);
                  const minAmount = Math.min(...amounts);
                  const maxAmount = Math.max(...amounts);
                  const range = maxAmount - minAmount || 1;
                  const y = 18 - 2 - ((merchantHistory[i].total - minAmount) / range) * (18 - 4);
                  
                  return (
                    <circle
                      key={i}
                      cx={x}
                      cy={y}
                      r="1.5"
                      fill={trend === 'up' ? '#22c55e' : trend === 'down' ? '#ef4444' : '#6b7280'}
                      className="opacity-0 group-hover:opacity-100 transition-all duration-300"
                    />
                  );
                })}
              </svg>
              
              {/* Trend indicator */}
              {trend !== 'neutral' && (
                <div className="absolute -top-1 -right-1">
                  {trend === 'up' ? (
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-sm" />
                  ) : (
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-sm" />
                  )}
                </div>
              )}
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="w-64 p-3">
          <div className="space-y-2">
            <div className="font-semibold text-sm">{merchant} - 6 Month Trend</div>
            
            {merchantStats && (
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Avg Monthly:</span>
                  <span className="font-medium">{formatCurrency(merchantStats.avgSpend)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Spent:</span>
                  <span className="font-medium">{formatCurrency(merchantStats.totalSpent)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Transactions:</span>
                  <span className="font-medium">{merchantStats.transactionCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Period:</span>
                  <span className="font-medium">{merchantStats.months} months</span>
                </div>
              </div>
            )}
            
            {merchantHistory.length > 0 && (
              <div className="border-t pt-2 mt-2">
                <div className="text-xs text-muted-foreground mb-1">Recent Activity:</div>
                <div className="space-y-1">
                  {merchantHistory.slice(-3).reverse().map((d: any) => (
                    <div key={d.month} className="flex justify-between text-xs">
                      <span>{new Date(d.month + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
                      <span className="font-medium">{formatCurrency(d.total)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}