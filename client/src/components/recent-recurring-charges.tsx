import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { History, DollarSign, Building2 } from "lucide-react";
import { formatCurrency } from "@/lib/financial-utils";

interface Transaction {
  id: string;
  description: string;
  amount: number;
  date: string;
  merchant?: string;
  category?: string;
  type: string;
}

interface RecurringTransaction {
  id: string;
  name: string;
  merchant?: string;
  linkedTransactionIds: string[];
  merchantLogo?: string;
  amount: number;
  category: string;
  frequency: string;
}

export default function RecentRecurringCharges() {
  // Fetch transactions from the past 7 days
  const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const endDate = new Date().toISOString().split('T')[0];
  
  const { data: transactions = [], isLoading: transactionsLoading } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions", `startDate=${startDate}&endDate=${endDate}`],
    queryFn: () => fetch(`/api/transactions?startDate=${startDate}&endDate=${endDate}`).then(res => res.json()),
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000,
  });

  // Fetch recurring transactions to cross-reference
  const { data: recurringTransactions = [], isLoading: recurringLoading } = useQuery<RecurringTransaction[]>({
    queryKey: ["/api/recurring-transactions"],
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000,
  });

  const isLoading = transactionsLoading || recurringLoading;

  // Filter transactions that match recurring transactions by merchant/description and occurred in past 7 days
  const recentRecurringCharges = transactions.filter(transaction => {
    // Check if this transaction matches any recurring transaction by merchant or description
    const match = recurringTransactions.some(recurring => {
      const transactionMerchant = (transaction.merchant || transaction.description || '').toLowerCase().trim();
      const recurringMerchant = (recurring.merchant || recurring.name || '').toLowerCase().trim();
      
      // Skip if either merchant name is too short to be meaningful
      if (transactionMerchant.length < 3 || recurringMerchant.length < 3) return false;
      
      // Match by merchant name or if transaction description contains recurring name
      const merchantMatch = transactionMerchant.includes(recurringMerchant) || 
                           recurringMerchant.includes(transactionMerchant);
      const linkedMatch = recurring.linkedTransactionIds?.includes(transaction.id);
      
      return merchantMatch || linkedMatch;
    });
    
    // Debug log for the first few transactions
    if (transactions.indexOf(transaction) < 3) {
      console.log(`Recent Charges: ${transaction.merchant || transaction.description} (${transaction.date}) -> match: ${match}`);
    }
    
    return match;
  }).map(transaction => {
    // Find the matching recurring transaction for additional info
    const recurringMatch = recurringTransactions.find(recurring => {
      const transactionMerchant = (transaction.merchant || transaction.description || '').toLowerCase().trim();
      const recurringMerchant = (recurring.merchant || recurring.name || '').toLowerCase().trim();
      
      return transactionMerchant.includes(recurringMerchant) || 
             recurringMerchant.includes(transactionMerchant) ||
             (recurring.linkedTransactionIds?.includes(transaction.id));
    });
    
    return {
      ...transaction,
      recurringInfo: recurringMatch ? {
        merchantLogo: recurringMatch.merchantLogo,
        frequency: recurringMatch.frequency,
        recurringName: recurringMatch.name
      } : null
    };
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const formatDateForDisplay = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const diffTime = today.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <Card className="mb-6">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <History className="w-5 h-5" />
          RECENT CHARGES
          <Badge variant="secondary" className="text-xs ml-2">
            Past 7 Days
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="text-gray-500 dark:text-gray-400">Loading recent charges...</div>
          </div>
        ) : recentRecurringCharges.length === 0 ? (
          <div className="text-center text-gray-500 dark:text-gray-400 py-8">
            <History className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No recurring charges in the past 7 days</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentRecurringCharges.map((charge) => (
              <div
                key={charge.id}
                className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800/70 transition-colors"
                data-testid={`recent-charge-${charge.id}`}
              >
                <div className="flex items-center gap-3">
                  {/* Merchant Logo or Icon */}
                  <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {charge.recurringInfo?.merchantLogo ? (
                      <img 
                        src={charge.recurringInfo.merchantLogo} 
                        alt={`${charge.merchant || charge.description} logo`}
                        className="w-8 h-8 object-contain"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const parent = target.parentElement;
                          if (parent) {
                            const fallbackIcon = document.createElement('div');
                            fallbackIcon.className = 'w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center';
                            fallbackIcon.innerHTML = `<span class="text-white font-bold text-sm">${(charge.merchant || charge.description).charAt(0)}</span>`;
                            parent.appendChild(fallbackIcon);
                          }
                        }}
                      />
                    ) : (
                      <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-sm">
                          {(charge.merchant || charge.description).charAt(0)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Transaction Details */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-gray-900 dark:text-white truncate">
                        {charge.recurringInfo?.recurringName || charge.merchant || charge.description}
                      </h4>
                      {charge.recurringInfo && (
                        <Badge variant="outline" className="text-xs">
                          {charge.recurringInfo.frequency}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <Building2 className="w-3 h-3" />
                      <span>{charge.category || 'Uncategorized'}</span>
                      <span>•</span>
                      <span>{formatDateForDisplay(charge.date)}</span>
                    </div>
                  </div>
                </div>

                {/* Amount */}
                <div className="text-right">
                  <div className="text-lg font-bold text-gray-900 dark:text-white">
                    {formatCurrency(charge.amount)}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {charge.type === 'income' ? 'Income' : 'Expense'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}