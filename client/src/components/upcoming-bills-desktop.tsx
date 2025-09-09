import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, DollarSign, TrendingUp, Building2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { formatCurrency } from "@/lib/financial-utils";

interface RecurringTransaction {
  id: string;
  name: string;
  merchant: string;
  category: string;
  amount: number;
  frequency: string;
  nextDueDate?: string;
  lastTransactionDate: string;
  isActive: boolean;
  autoDetected?: boolean;
  confidence: number;
  occurrences: number;
  avgAmount: number;
  amountVariance: number;
  dayOfMonth?: number;
  excludeFromBills?: boolean;
  merchantLogo?: string;
  linkedTransactionIds?: string[];
}

interface UpcomingBill {
  id: string;
  name: string;
  amount: number;
  daysUntilDue: number;
  category: string;
  color: string;
  merchantLogo?: string;
  frequency?: string;
  nextDueDate?: string;
  lastTransactionDate?: string;
  autoDetected?: boolean;
  confidence?: number;
  notes?: string;
  linkedTransactionIds?: string[];
}

function getCategoryColor(category: string): string {
  const categoryColors: Record<string, string> = {
    'Bills & Utilities': 'bg-blue-500',
    'Utilities': 'bg-blue-500',
    'Subscriptions & Entertainment': 'bg-red-500',
    'Entertainment': 'bg-red-500',
    'Credit Card Payments': 'bg-purple-500',
    'Fixed Expenses': 'bg-orange-500',
    'Insurance': 'bg-green-500',
    'Other': 'bg-gray-500'
  };
  
  for (const [cat, color] of Object.entries(categoryColors)) {
    if (category.toLowerCase().includes(cat.toLowerCase())) {
      return color;
    }
  }
  return 'bg-gray-500';
}

export function UpcomingBillsDesktop() {
  const [selectedBill, setSelectedBill] = useState<UpcomingBill | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const { data: recurringTransactions = [], isLoading } = useQuery<RecurringTransaction[]>({
    queryKey: ["/api/recurring-transactions"],
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Calculate upcoming bills for next 7 days
  const upcomingBills: UpcomingBill[] = recurringTransactions
    .filter(item => {
      if (!item.nextDueDate || item.excludeFromBills) return false;
      const dueDate = new Date(item.nextDueDate);
      const today = new Date();
      const nextWeek = new Date();
      nextWeek.setDate(today.getDate() + 7);
      return dueDate >= today && dueDate <= nextWeek;
    })
    .map(item => {
      const dueDate = new Date(item.nextDueDate!);
      const today = new Date();
      const diffTime = dueDate.getTime() - today.getTime();
      const daysUntilDue = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      return {
        id: item.id,
        name: item.name,
        amount: item.amount,
        daysUntilDue,
        category: item.category,
        color: getCategoryColor(item.category),
        merchantLogo: item.merchantLogo,
        frequency: item.frequency,
        nextDueDate: item.nextDueDate,
        lastTransactionDate: item.lastTransactionDate,
        autoDetected: item.autoDetected,
        confidence: item.confidence,
        notes: `${item.frequency} subscription`,
        linkedTransactionIds: item.linkedTransactionIds
      };
    })
    .sort((a, b) => a.daysUntilDue - b.daysUntilDue)
    .slice(0, 4); // Show max 4 bills

  const handleBillClick = (bill: UpcomingBill) => {
    setSelectedBill(bill);
    setIsDialogOpen(true);
  };

  const formatDateForDialog = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Fetch transaction history for the selected bill
  const { data: transactionHistory = [] } = useQuery({
    queryKey: ["/api/transactions", selectedBill?.id],
    queryFn: async () => {
      if (!selectedBill?.linkedTransactionIds?.length) return [];
      const response = await fetch('/api/transactions');
      const allTransactions = await response.json();
      
      // Filter transactions that are linked to this recurring bill
      return allTransactions.filter((t: any) => 
        selectedBill.linkedTransactionIds?.includes(t.id)
      ).sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
    },
    enabled: !!selectedBill?.linkedTransactionIds?.length && isDialogOpen,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000,
  });

  // Calculate monthly payment breakdown
  const getMonthlyBreakdown = () => {
    const breakdown: { [key: string]: { amount: number; count: number } } = {};
    let totalSpent = 0;

    transactionHistory.forEach((transaction: any) => {
      const date = new Date(transaction.date);
      const monthKey = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
      const amount = parseFloat(transaction.amount);
      
      if (!breakdown[monthKey]) {
        breakdown[monthKey] = { amount: 0, count: 0 };
      }
      
      breakdown[monthKey].amount += amount;
      breakdown[monthKey].count += 1;
      totalSpent += amount;
    });

    return { breakdown, totalSpent };
  };

  return (
    <Card className="hidden md:block mb-6">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          UPCOMING BILLS
        </CardTitle>
      </CardHeader>
      <CardContent className="border-t border-border pt-6 space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="text-gray-500 dark:text-gray-400">Loading bills...</div>
          </div>
        ) : upcomingBills.length === 0 ? (
          <div className="text-center text-gray-500 dark:text-gray-400 py-8">
            <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No recurring charges soon</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {upcomingBills.map((bill) => (
            <div 
              key={bill.id} 
              onClick={() => handleBillClick(bill)}
              className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 text-center hover:shadow-md transition-shadow cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700/70"
              data-testid={`upcoming-bill-${bill.id}`}
            >
              <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 overflow-hidden bg-gray-100 dark:bg-gray-700">
                {bill.merchantLogo ? (
                  <img 
                    src={bill.merchantLogo} 
                    alt={`${bill.name} logo`}
                    className="w-10 h-10 object-contain"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const nextSibling = target.nextElementSibling as HTMLElement;
                      if (nextSibling) nextSibling.style.display = 'flex';
                    }}
                  />
                ) : null}
                <div className={`w-12 h-12 ${bill.color} rounded-full flex items-center justify-center ${bill.merchantLogo ? 'hidden' : ''}`}>
                  <DollarSign className="w-6 h-6 text-white" />
                </div>
              </div>
              <h4 className="font-medium text-gray-900 dark:text-white text-sm mb-1">
                {bill.name}
              </h4>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                ${bill.amount}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                IN {bill.daysUntilDue} DAY{bill.daysUntilDue !== 1 ? 'S' : ''}
              </p>
              <div className="mt-2">
                <span className="text-xs bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded-full">
                  {bill.category}
                </span>
              </div>
            </div>
          ))}
          </div>
        )}
      </CardContent>

      {/* Bill Details Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]" data-testid="upcoming-bill-details-dialog">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {selectedBill?.merchantLogo ? (
                  <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center overflow-hidden">
                    <img 
                      src={selectedBill.merchantLogo} 
                      alt={`${selectedBill.name} logo`}
                      className="w-10 h-10 object-contain"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const parent = target.parentElement;
                        if (parent) {
                          parent.innerHTML = `<div class="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center"><span class="text-white font-bold text-lg">${selectedBill?.name?.charAt(0) || 'B'}</span></div>`;
                        }
                      }}
                    />
                  </div>
                ) : (
                  <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center">
                    <span className="text-white font-bold text-lg">
                      {selectedBill?.name?.charAt(0) || 'B'}
                    </span>
                  </div>
                )}
                <div>
                  <DialogTitle className="text-lg font-semibold">
                    {selectedBill?.name}
                  </DialogTitle>
                  <Badge variant="outline" className="text-xs mt-1">
                    {selectedBill?.frequency?.toUpperCase()} SUBSCRIPTION
                  </Badge>
                </div>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Amount and Due Date */}
            <div className="text-center bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                Coming up in {selectedBill?.daysUntilDue || 0} days for
              </div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white">
                {selectedBill && formatCurrency(selectedBill.amount)}
              </div>
            </div>

            {/* Category */}
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600 dark:text-gray-400">Category</span>
              <Badge variant="secondary" className="ml-auto">
                {selectedBill?.category}
              </Badge>
            </div>

            {/* Due Date */}
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600 dark:text-gray-400">Next Due Date</span>
              <span className="ml-auto text-sm font-medium">
                {formatDateForDialog(selectedBill?.nextDueDate)}
              </span>
            </div>

            {/* Last Payment */}
            {selectedBill?.lastTransactionDate && (
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-600 dark:text-gray-400">Last Payment</span>
                <span className="ml-auto text-sm font-medium">
                  {formatDateForDialog(selectedBill.lastTransactionDate)}
                </span>
              </div>
            )}

            {/* Payment History */}
            {transactionHistory.length > 0 && (() => {
              const { breakdown, totalSpent } = getMonthlyBreakdown();
              const monthKeys = Object.keys(breakdown).slice(0, 7); // Show last 7 months
              
              return (
                <div className="space-y-4">
                  {/* Total Spent */}
                  <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 text-center">
                    <div className="text-sm text-purple-600 dark:text-purple-400 mb-1">
                      Total Spent (All Time)
                    </div>
                    <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                      {formatCurrency(totalSpent)}
                    </div>
                    <div className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                      {transactionHistory.length} payment{transactionHistory.length !== 1 ? 's' : ''}
                    </div>
                  </div>

                  {/* Monthly Breakdown */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                      Monthly Payment History
                    </h4>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {monthKeys.map(month => (
                        <div key={month} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800/50 rounded">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            <span className="text-sm text-gray-700 dark:text-gray-300">{month}</span>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {formatCurrency(breakdown[month].amount)}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {breakdown[month].count} payment{breakdown[month].count !== 1 ? 's' : ''}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Detection Info */}
            {selectedBill?.autoDetected && (
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                    Auto-detected with {selectedBill.confidence || 0}% confidence
                  </span>
                </div>
                {selectedBill.notes && (
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                    {selectedBill.notes}
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="flex justify-end">
            <Button 
              variant="outline" 
              onClick={() => setIsDialogOpen(false)}
              data-testid="close-upcoming-dialog-button"
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}