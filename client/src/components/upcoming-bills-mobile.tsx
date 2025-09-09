import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, DollarSign } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

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
}

interface UpcomingBill {
  id: string;
  name: string;
  amount: number;
  daysUntilDue: number;
  category: string;
  color: string;
  merchantLogo?: string;
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

export function UpcomingBillsMobile() {
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
        merchantLogo: item.merchantLogo
      };
    })
    .sort((a, b) => a.daysUntilDue - b.daysUntilDue)
    .slice(0, 3); // Show max 3 bills on mobile

  return (
    <Card className="block md:hidden mb-4">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          UPCOMING
        </CardTitle>
      </CardHeader>
      <CardContent className="border-t border-border pt-6 space-y-2">
        {isLoading ? (
          <div className="flex items-center justify-center h-24">
            <div className="text-gray-500 dark:text-gray-400 text-sm">Loading...</div>
          </div>
        ) : upcomingBills.length === 0 ? (
          <div className="text-center text-gray-500 dark:text-gray-400 py-4">
            <p className="text-sm">No bills due soon</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {upcomingBills.map((bill) => (
            <div key={bill.id} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 text-center">
              <div className="w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-1 overflow-hidden bg-gray-100 dark:bg-gray-700">
                {bill.merchantLogo ? (
                  <img 
                    src={bill.merchantLogo} 
                    alt={`${bill.name} logo`}
                    className="w-7 h-7 object-contain"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const nextSibling = target.nextElementSibling as HTMLElement;
                      if (nextSibling) nextSibling.style.display = 'flex';
                    }}
                  />
                ) : null}
                <div className={`w-8 h-8 ${bill.color} rounded-full flex items-center justify-center ${bill.merchantLogo ? 'hidden' : ''}`}>
                  <span className="text-white text-xs font-bold">
                    {bill.name.charAt(0)}
                  </span>
                </div>
              </div>
              <p className="text-xs font-medium text-gray-900 dark:text-white truncate">
                {bill.name}
              </p>
              <p className="text-sm font-bold text-gray-900 dark:text-white">
                ${bill.amount}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                IN {bill.daysUntilDue} DAY{bill.daysUntilDue !== 1 ? 'S' : ''}
              </p>
            </div>
          ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}