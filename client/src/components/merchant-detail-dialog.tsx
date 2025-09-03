import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/financial-utils";
import { Building2, Calendar, DollarSign, TrendingUp, TrendingDown, Repeat, BarChart3, MapPin } from 'lucide-react';
import { MerchantSparkline } from './merchant-sparkline';

interface MerchantDetailDialogProps {
  merchant: string;
  children: React.ReactNode;
}

export function MerchantDetailDialog({ merchant, children }: MerchantDetailDialogProps) {
  const [open, setOpen] = useState(false);

  // Fetch comprehensive merchant data
  const { data: merchantData, isLoading } = useQuery<any>({
    queryKey: ['/api/transactions/merchant-details', merchant],
    queryFn: async () => {
      if (!merchant) return null;
      
      const response = await fetch(`/api/transactions?merchant=${encodeURIComponent(merchant)}&limit=200`);
      if (!response.ok) return null;
      
      const transactions = await response.json();
      if (!transactions.length) return null;
      
      // Sort transactions by date (newest first)
      const sortedTransactions = transactions.sort((a: any, b: any) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      
      // Calculate comprehensive analytics
      const amounts = transactions.map((t: any) => parseFloat(t.amount));
      const totalSpent = amounts.reduce((sum: number, amt: number) => sum + amt, 0);
      const avgSpend = totalSpent / transactions.length;
      const minSpend = Math.min(...amounts);
      const maxSpend = Math.max(...amounts);
      
      // Monthly breakdown
      const monthlyBreakdown = transactions.reduce((acc: any, txn: any) => {
        const date = new Date(txn.date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        if (!acc[monthKey]) {
          acc[monthKey] = { total: 0, count: 0, transactions: [], month: monthKey };
        }
        
        acc[monthKey].total += parseFloat(txn.amount);
        acc[monthKey].count += 1;
        acc[monthKey].transactions.push(txn);
        
        return acc;
      }, {});
      
      const monthlyData = Object.values(monthlyBreakdown)
        .sort((a: any, b: any) => b.month.localeCompare(a.month));
      
      // Calculate frequency pattern
      const daysBetweenTransactions = [];
      for (let i = 1; i < sortedTransactions.length; i++) {
        const diff = Math.abs(new Date(sortedTransactions[i-1].date).getTime() - new Date(sortedTransactions[i].date).getTime());
        daysBetweenTransactions.push(Math.round(diff / (1000 * 60 * 60 * 24)));
      }
      
      const avgDaysBetween = daysBetweenTransactions.length > 0 ? 
        daysBetweenTransactions.reduce((sum, days) => sum + days, 0) / daysBetweenTransactions.length : 0;
      
      // Determine frequency pattern
      let frequencyPattern = 'Irregular';
      if (avgDaysBetween >= 28 && avgDaysBetween <= 35) frequencyPattern = 'Monthly';
      else if (avgDaysBetween >= 6 && avgDaysBetween <= 8) frequencyPattern = 'Weekly';
      else if (avgDaysBetween >= 13 && avgDaysBetween <= 16) frequencyPattern = 'Bi-weekly';
      else if (avgDaysBetween >= 85 && avgDaysBetween <= 95) frequencyPattern = 'Quarterly';
      
      // Category analysis
      const categories = Array.from(new Set(transactions.map((t: any) => t.category)));
      
      return {
        transactions: sortedTransactions,
        totalSpent,
        avgSpend,
        minSpend,
        maxSpend,
        transactionCount: transactions.length,
        monthlyData,
        frequencyPattern,
        avgDaysBetween: Math.round(avgDaysBetween),
        categories,
        firstTransaction: sortedTransactions[sortedTransactions.length - 1],
        lastTransaction: sortedTransactions[0]
      };
    },
    enabled: open && !!merchant
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>
        <span className="cursor-pointer">
          {children}
        </span>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Building2 className="w-6 h-6 text-blue-600" />
            <div>
              <div className="text-xl font-bold">{merchant}</div>
              <div className="text-sm text-muted-foreground font-normal">
                Merchant Analytics & History
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : merchantData ? (
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <div className="flex items-center gap-2 text-blue-600 mb-1">
                  <DollarSign className="w-4 h-4" />
                  <span className="text-sm font-medium">Total Spent</span>
                </div>
                <div className="text-2xl font-bold">{formatCurrency(merchantData.totalSpent)}</div>
              </div>
              
              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                <div className="flex items-center gap-2 text-green-600 mb-1">
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-sm font-medium">Avg Spend</span>
                </div>
                <div className="text-2xl font-bold">{formatCurrency(merchantData.avgSpend)}</div>
              </div>
              
              <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                <div className="flex items-center gap-2 text-purple-600 mb-1">
                  <BarChart3 className="w-4 h-4" />
                  <span className="text-sm font-medium">Transactions</span>
                </div>
                <div className="text-2xl font-bold">{merchantData.transactionCount}</div>
              </div>
              
              <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
                <div className="flex items-center gap-2 text-orange-600 mb-1">
                  <Repeat className="w-4 h-4" />
                  <span className="text-sm font-medium">Pattern</span>
                </div>
                <div className="text-sm font-bold">{merchantData.frequencyPattern}</div>
                <div className="text-xs text-muted-foreground">
                  ~{merchantData.avgDaysBetween} days between
                </div>
              </div>
            </div>

            {/* Spending Trend */}
            <div className="bg-gray-50 dark:bg-gray-900/20 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-5 h-5" />
                <span className="font-semibold">6-Month Spending Trend</span>
              </div>
              <MerchantSparkline 
                merchant={merchant}
                currentAmount={merchantData.lastTransaction.amount}
                transactionDate={merchantData.lastTransaction.date}
              />
            </div>

            {/* Monthly Breakdown */}
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Monthly Breakdown
              </h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {merchantData.monthlyData.map((month: any) => (
                  <div key={month.month} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900/20 rounded-lg">
                    <div>
                      <div className="font-medium">
                        {new Date(month.month + '-01').toLocaleDateString('en-US', { 
                          month: 'long', 
                          year: 'numeric' 
                        })}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {month.count} transaction{month.count !== 1 ? 's' : ''}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-lg">{formatCurrency(month.total)}</div>
                      <div className="text-sm text-muted-foreground">
                        Avg: {formatCurrency(month.total / month.count)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Transactions */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Recent Transactions</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {merchantData.transactions.slice(0, 10).map((transaction: any) => (
                  <div key={transaction.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">{transaction.description}</div>
                      <div className="text-sm text-muted-foreground flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        {formatDate(new Date(transaction.date))}
                        <Badge variant="outline" className="text-xs">
                          {transaction.category}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-lg font-bold">
                      {formatCurrency(parseFloat(transaction.amount))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Summary Info */}
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">First Transaction:</span> {formatDate(new Date(merchantData.firstTransaction.date))}
                </div>
                <div>
                  <span className="font-medium">Last Transaction:</span> {formatDate(new Date(merchantData.lastTransaction.date))}
                </div>
                <div>
                  <span className="font-medium">Min Amount:</span> {formatCurrency(merchantData.minSpend)}
                </div>
                <div>
                  <span className="font-medium">Max Amount:</span> {formatCurrency(merchantData.maxSpend)}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center p-8 text-muted-foreground">
            No transaction data available for this merchant.
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}