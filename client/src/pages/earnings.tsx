import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DollarSign, ArrowLeft, TrendingUp, Calendar } from "lucide-react";
import { Link } from "wouter";

interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: string;
  category: string;
  type: string;
  merchant?: string;
}

export default function EarningsPage() {
  const { data: transactions } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions"],
  });

  // Filter income transactions
  const incomeTransactions = transactions?.filter(t => t.type === 'income') || [];
  
  // Calculate total income
  const totalIncome = incomeTransactions.reduce((sum, t) => sum + Math.abs(parseFloat(t.amount)), 0);

  // Group by month for trend analysis
  const monthlyIncome = incomeTransactions.reduce((acc, transaction) => {
    const date = new Date(transaction.date);
    const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
    const monthName = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    
    if (!acc[monthKey]) {
      acc[monthKey] = { name: monthName, total: 0, transactions: [] };
    }
    
    acc[monthKey].total += Math.abs(parseFloat(transaction.amount));
    acc[monthKey].transactions.push(transaction);
    
    return acc;
  }, {} as Record<string, { name: string; total: number; transactions: Transaction[] }>);

  const sortedMonths = Object.values(monthlyIncome).sort((a, b) => 
    new Date(b.transactions[0].date).getTime() - new Date(a.transactions[0].date).getTime()
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-700">
      <div className="container mx-auto px-4 py-8 max-w-7xl">

        {/* Total Income Overview */}
        <Card className="mb-8 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-400">
              <TrendingUp className="h-5 w-5" />
              Total Income
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-4xl font-bold text-gray-900 dark:text-white">
                  ${totalIncome.toLocaleString()}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  All time total • {incomeTransactions.length} transactions
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Monthly Income Breakdown */}
        <div className="space-y-6">
          {sortedMonths.length > 0 ? (
            sortedMonths.map((month) => (
              <Card key={month.name} className="bg-white dark:bg-gray-800">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-green-600" />
                      {month.name}
                    </div>
                    <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                      ${month.total.toLocaleString()}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {month.transactions.map((transaction) => (
                      <div 
                        key={transaction.id} 
                        className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-700"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-green-100 dark:bg-green-800 rounded-full flex items-center justify-center">
                            <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white">
                              {transaction.description}
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {new Date(transaction.date).toLocaleDateString('en-US', {
                                weekday: 'short',
                                month: 'short',
                                day: 'numeric'
                              })} • {transaction.category}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-xl font-bold text-green-600 dark:text-green-400">
                            +${Math.abs(parseFloat(transaction.amount)).toLocaleString()}
                          </span>
                          {transaction.merchant && (
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {transaction.merchant}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="bg-white dark:bg-gray-800">
              <CardContent className="text-center py-12">
                <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  No Income Transactions
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Connect your accounts or add transactions to see your income here.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}