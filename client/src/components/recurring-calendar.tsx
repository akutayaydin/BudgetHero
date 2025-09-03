import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Calendar, DollarSign, X, TrendingUp, Building2 } from "lucide-react";
import { formatCurrency } from "@/lib/financial-utils";

interface RecurringTransaction {
  id: string;
  name: string;
  amount: number;
  nextDueDate?: string;
  frequency: string;
  category: string;
  merchantLogo?: string;
  lastTransactionDate?: string;
  confidence?: number;
  autoDetected?: boolean;
  notes?: string;
  linkedTransactionIds?: string[];
}

interface ManualSubscription {
  id: string;
  name: string;
  amount: number | string;
  frequency: string;
  startDate: string;
  category: string;
}

interface RecurringCalendarProps {
  recurringTransactions: RecurringTransaction[];
  manualSubscriptions?: ManualSubscription[];
}

export default function RecurringCalendar({ recurringTransactions, manualSubscriptions = [] }: RecurringCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedBill, setSelectedBill] = useState<RecurringTransaction | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const firstDayOfCalendar = new Date(firstDayOfMonth);
  firstDayOfCalendar.setDate(firstDayOfCalendar.getDate() - firstDayOfCalendar.getDay());
  
  const daysInCalendar = [];
  const currentCalendarDate = new Date(firstDayOfCalendar);
  
  for (let i = 0; i < 42; i++) { // 6 weeks * 7 days
    daysInCalendar.push(new Date(currentCalendarDate));
    currentCalendarDate.setDate(currentCalendarDate.getDate() + 1);
  }
  
  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    newDate.setMonth(month + (direction === 'next' ? 1 : -1));
    setCurrentDate(newDate);
  };
  
  // Helper function to calculate next due date for manual subscriptions
  const calculateNextDueDate = (startDate: string, frequency: string): Date => {
    const start = new Date(startDate);
    const today = new Date();
    let nextDue = new Date(start);
    
    // If start date is in the future, return it
    if (start > today) return start;
    
    // Calculate next occurrence
    while (nextDue <= today) {
      switch (frequency.toLowerCase()) {
        case 'weekly':
          nextDue.setDate(nextDue.getDate() + 7);
          break;
        case 'biweekly':
          nextDue.setDate(nextDue.getDate() + 14);
          break;
        case 'monthly':
          nextDue.setMonth(nextDue.getMonth() + 1);
          break;
        case 'quarterly':
          nextDue.setMonth(nextDue.getMonth() + 3);
          break;
        case 'yearly':
          nextDue.setFullYear(nextDue.getFullYear() + 1);
          break;
        default:
          return start;
      }
    }
    
    return nextDue;
  };

  const getBillsForDate = (date: Date) => {
    // All bills are now in recurringTransactions - no need to check manualSubscriptions
    console.log(`Calendar: Checking ${date.toDateString()} against ${recurringTransactions.length} transactions`);
    
    const allBills = recurringTransactions.filter(bill => {
      if (!bill.nextDueDate) {
        console.log(`Calendar: ${bill.name} has no due date`);
        return false;
      }
      // Handle timezone properly - treat as local date
      const billDate = new Date(bill.nextDueDate);
      // Reset to local date to avoid timezone shifting
      const localBillDate = new Date(billDate.getFullYear(), billDate.getMonth(), billDate.getDate());
      const localCheckDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      
      const matches = localBillDate.getTime() === localCheckDate.getTime();
      console.log(`Calendar: ${bill.name} due ${billDate.toDateString()} -> local: ${localBillDate.toDateString()} vs ${localCheckDate.toDateString()} = ${matches}`);
      return matches;
    });
    
    if (allBills.length > 0) {
      console.log(`Calendar: ${allBills.length} total bills for ${date.toDateString()}:`, allBills.map(b => `${b.name} ($${b.amount})`));
    }
    return allBills;
  };

  const handleBillClick = (bill: RecurringTransaction) => {
    setSelectedBill(bill);
    setIsDialogOpen(true);
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

  const formatDateForDialog = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  
  const today = new Date();
  
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Upcoming Bills
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => navigateMonth('prev')}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="font-medium min-w-[120px] text-center">
              {currentDate.toLocaleDateString('en', { month: 'long', year: 'numeric' })}
            </span>
            <Button variant="outline" size="sm" onClick={() => navigateMonth('next')}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-center text-xs font-medium text-muted-foreground p-2">
              {day}
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-7 gap-1">
          {daysInCalendar.map((date, index) => {
            const isCurrentMonth = date.getMonth() === month;
            const isToday = date.toDateString() === today.toDateString();
            const bills = getBillsForDate(date);
            const totalAmount = bills.reduce((sum, bill) => {
              const amount = typeof bill.amount === 'string' ? parseFloat(bill.amount) : bill.amount;
              return sum + (isNaN(amount) ? 0 : amount);
            }, 0);
            
            return (
              <div
                key={index}
                className={`min-h-[80px] p-1 border border-gray-100 dark:border-gray-800 ${
                  !isCurrentMonth ? 'opacity-30' : ''
                } ${isToday ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700' : ''}`}
              >
                <div className={`text-xs ${isToday ? 'font-bold text-blue-600 dark:text-blue-400' : ''}`}>
                  {date.getDate()}
                </div>
                
                {bills.length > 0 && (
                  <div className="mt-1 space-y-1">
                    {bills.slice(0, 2).map(bill => (
                      <div
                        key={bill.id}
                        onClick={() => handleBillClick(bill)}
                        className={`text-xs p-1 rounded text-white truncate cursor-pointer hover:opacity-80 transition-opacity flex items-center gap-1 ${
                          bill.category.toLowerCase().includes('subscription') ? 'bg-purple-500' :
                          bill.category.toLowerCase().includes('utilities') ? 'bg-blue-500' :
                          'bg-orange-500'
                        }`}
                        title={`${bill.name} - ${formatCurrency(bill.amount)} (click for details)`}
                        data-testid={`calendar-bill-${bill.id}`}
                      >
                        {bill.merchantLogo ? (
                          <img 
                            src={bill.merchantLogo} 
                            alt={`${bill.name} logo`}
                            className="w-3 h-3 object-contain flex-shrink-0"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="w-3 h-3 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                            <DollarSign className="w-2 h-2" />
                          </div>
                        )}
                        <span className="truncate">{bill.name.substring(0, 6)}</span>
                      </div>
                    ))}
                    {bills.length > 2 && (
                      <div 
                        className="text-xs text-muted-foreground cursor-pointer hover:text-gray-600 dark:hover:text-gray-300"
                        onClick={() => bills.length > 2 && handleBillClick(bills[2])}
                        title="Click to see more bills"
                      >
                        +{bills.length - 2} more
                      </div>
                    )}
                    {totalAmount > 0 && (
                      <div className="text-xs font-bold text-gray-700 dark:text-gray-300">
                        {formatCurrency(totalAmount)}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>

      {/* Bill Details Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]" data-testid="bill-details-dialog">
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
                {selectedBill?.nextDueDate ? (() => {
                  const daysUntil = Math.ceil((new Date(selectedBill.nextDueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                  return daysUntil > 0 ? `Due in ${daysUntil} days` : daysUntil === 0 ? 'Due today' : `${Math.abs(daysUntil)} days overdue`;
                })() : 'Due date not set'}
              </div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white">
                {selectedBill && formatCurrency(selectedBill.amount)}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Next {selectedBill?.frequency} payment
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

            {/* Upcoming Payment Info */}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 dark:text-blue-200 mb-2">Upcoming Payment</h4>
              <div className="text-sm text-blue-800 dark:text-blue-300">
                This {selectedBill?.frequency} payment of <strong>{selectedBill && formatCurrency(selectedBill.amount)}</strong> is scheduled for <strong>{formatDateForDialog(selectedBill?.nextDueDate)}</strong>
              </div>
              {selectedBill?.notes && (
                <div className="mt-2 text-xs text-blue-700 dark:text-blue-400">
                  Notes: {selectedBill.notes}
                </div>
              )}
            </div>

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
              data-testid="close-dialog-button"
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}