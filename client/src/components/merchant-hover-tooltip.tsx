import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { formatCurrency, formatDate } from "@/lib/financial-utils";
import { Calendar, DollarSign, TrendingUp, Repeat } from 'lucide-react';

interface MerchantHoverTooltipProps {
  merchant: string;
  children: React.ReactNode;
}

export function MerchantHoverTooltip({ merchant, children }: MerchantHoverTooltipProps) {
  // Fetch merchant analytics data
  const { data: merchantData } = useQuery<any>({
    queryKey: ['/api/transactions/merchant-analytics', merchant],
    queryFn: async () => {
      if (!merchant) return null;
      
      const response = await fetch(`/api/transactions?merchant=${encodeURIComponent(merchant)}&limit=100`);
      if (!response.ok) return null;
      
      const transactions = await response.json();
      if (!transactions.length) return null;
      
      // Calculate analytics
      const amounts = transactions.map((t: any) => parseFloat(t.amount));
      const totalSpent = amounts.reduce((sum: number, amt: number) => sum + amt, 0);
      const avgSpend = totalSpent / transactions.length;
      
      // Find most recent transaction
      const sortedTransactions = transactions.sort((a: any, b: any) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      const lastTransaction = sortedTransactions[0];
      
      // Calculate monthly budget percentage (assuming $3000 monthly budget)
      const monthlyBudget = 3000;
      const currentMonth = new Date().toISOString().slice(0, 7);
      const thisMonthTransactions = transactions.filter((t: any) => 
        t.date.startsWith(currentMonth)
      );
      const thisMonthSpent = thisMonthTransactions.reduce((sum: number, t: any) => 
        sum + parseFloat(t.amount), 0
      );
      const budgetPercent = (thisMonthSpent / monthlyBudget) * 100;
      
      // Check for recurring pattern (transactions in multiple months)
      const monthsWithTransactions = new Set(
        transactions.map((t: any) => t.date.slice(0, 7))
      ).size;
      const isRecurring = monthsWithTransactions >= 2;
      
      // Find last recurring date (most recent transaction if recurring)
      const lastRecurringDate = isRecurring ? lastTransaction.date : null;
      
      return {
        totalSpent,
        avgSpend,
        transactionCount: transactions.length,
        budgetPercent,
        lastRecurringDate,
        isRecurring,
        lastTransactionDate: lastTransaction.date,
        monthsActive: monthsWithTransactions
      };
    },
    enabled: !!merchant
  });

  if (!merchant || !merchantData) {
    return <>{children}</>;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {children}
        </TooltipTrigger>
        <TooltipContent side="top" className="w-72 p-4">
          <div className="space-y-3">
            {/* Header */}
            <div className="font-semibold text-sm border-b pb-2">
              {merchant} Analytics
            </div>
            
            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="space-y-1">
                <div className="flex items-center gap-1 text-muted-foreground">
                  <DollarSign className="w-3 h-3" />
                  Avg Spend
                </div>
                <div className="font-semibold">{formatCurrency(merchantData.avgSpend)}</div>
              </div>
              
              <div className="space-y-1">
                <div className="flex items-center gap-1 text-muted-foreground">
                  <TrendingUp className="w-3 h-3" />
                  Total Spent
                </div>
                <div className="font-semibold">{formatCurrency(merchantData.totalSpent)}</div>
              </div>
              
              <div className="space-y-1">
                <div className="text-muted-foreground">Monthly Budget</div>
                <div className="font-semibold">
                  {merchantData.budgetPercent.toFixed(1)}%
                  <div className="w-full bg-gray-200 rounded-full h-1 mt-1">
                    <div 
                      className={`h-1 rounded-full ${
                        merchantData.budgetPercent > 50 ? 'bg-red-500' : 
                        merchantData.budgetPercent > 25 ? 'bg-yellow-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${Math.min(merchantData.budgetPercent, 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-1">
                <div className="text-muted-foreground">Transactions</div>
                <div className="font-semibold">{merchantData.transactionCount}</div>
              </div>
            </div>
            
            {/* Recurring Info */}
            {merchantData.isRecurring && (
              <div className="border-t pt-2">
                <div className="flex items-center gap-2 text-xs">
                  <Repeat className="w-3 h-3 text-blue-500" />
                  <div>
                    <div className="font-medium text-blue-600">Recurring Merchant</div>
                    <div className="text-muted-foreground">
                      Active in {merchantData.monthsActive} months
                    </div>
                    {merchantData.lastRecurringDate && (
                      <div className="flex items-center gap-1 mt-1">
                        <Calendar className="w-3 h-3" />
                        <span>Last: {formatDate(new Date(merchantData.lastRecurringDate))}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}