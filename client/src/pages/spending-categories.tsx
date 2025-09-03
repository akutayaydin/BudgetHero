import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PieChart, ArrowLeft, CreditCard, TrendingDown } from "lucide-react";
import { Link } from "wouter";
import { ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell, Tooltip } from "recharts";

interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: string;
  category: string;
  type: string;
  merchant?: string;
}

interface CategoryData {
  category: string;
  amount: number;
  color: string;
  percentage: number;
  transactions: Transaction[];
}

export default function SpendingCategoriesPage() {
  const { data: transactions } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions"],
  });

  // Filter expense transactions
  const expenseTransactions = transactions?.filter(t => t.type === 'expense') || [];
  
  // Calculate total spending
  const totalSpending = expenseTransactions.reduce((sum, t) => sum + Math.abs(parseFloat(t.amount)), 0);

  // Group by category
  const categoryData = expenseTransactions.reduce((acc, transaction) => {
    const category = transaction.category || 'Other';
    const amount = Math.abs(parseFloat(transaction.amount));
    
    if (!acc[category]) {
      acc[category] = {
        category,
        amount: 0,
        transactions: [],
        color: '',
        percentage: 0
      };
    }
    
    acc[category].amount += amount;
    acc[category].transactions.push(transaction);
    
    return acc;
  }, {} as Record<string, CategoryData>);

  // Add colors and percentages
  const colors = ['#8B5CF6', '#06B6D4', '#10B981', '#F59E0B', '#EF4444', '#6B7280', '#FF6B6B', '#4ECDC4', '#845EC2', '#FF8066'];
  const categoriesArray = Object.values(categoryData).map((cat, index) => ({
    ...cat,
    color: colors[index % colors.length],
    percentage: totalSpending > 0 ? Math.round((cat.amount / totalSpending) * 100) : 0
  })).sort((a, b) => b.amount - a.amount);

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-700">
      <div className="container mx-auto px-4 py-8 max-w-7xl">

        {/* Total Spending Overview */}
        <Card className="mb-8 bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 border border-red-200 dark:border-red-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700 dark:text-red-400">
              <TrendingDown className="h-5 w-5" />
              Total Spending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-4xl font-bold text-gray-900 dark:text-white">
                  ${totalSpending.toLocaleString()}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  All time total • {expenseTransactions.length} transactions • {categoriesArray.length} categories
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Pie Chart */}
          <Card className="bg-white dark:bg-gray-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5 text-red-600" />
                Category Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              {categoriesArray.length > 0 ? (
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={categoriesArray}
                        cx="50%"
                        cy="50%"
                        outerRadius={120}
                        paddingAngle={2}
                        dataKey="amount"
                      >
                        {categoriesArray.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: any) => [`$${value.toLocaleString()}`, 'Amount']}
                        labelStyle={{ color: '#374151' }}
                      />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-80 flex items-center justify-center text-gray-500 dark:text-gray-400">
                  No spending data available
                </div>
              )}
            </CardContent>
          </Card>

          {/* Category Summary */}
          <Card className="bg-white dark:bg-gray-800">
            <CardHeader>
              <CardTitle>Category Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-80 overflow-y-auto">
                {categoriesArray.map((category) => (
                  <div key={category.category} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: category.color }}
                      />
                      <span className="font-medium text-gray-900 dark:text-white">
                        {category.category}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-bold text-gray-900 dark:text-white">
                        ${category.amount.toLocaleString()}
                      </span>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {category.percentage}% • {category.transactions.length} transactions
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Category Breakdown */}
        <div className="space-y-6">
          {categoriesArray.map((category) => (
            <Card key={category.category} className="bg-white dark:bg-gray-800">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-6 h-6 rounded-full"
                      style={{ backgroundColor: category.color }}
                    />
                    {category.category}
                  </div>
                  <span className="text-2xl font-bold text-red-600 dark:text-red-400">
                    ${category.amount.toLocaleString()}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {category.transactions
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .map((transaction) => (
                    <div 
                      key={transaction.id} 
                      className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-700"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-red-100 dark:bg-red-800 rounded-full flex items-center justify-center">
                          <CreditCard className="h-5 w-5 text-red-600 dark:text-red-400" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-white">
                            {transaction.description}
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {new Date(transaction.date).toLocaleDateString('en-US', {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xl font-bold text-red-600 dark:text-red-400">
                          -${Math.abs(parseFloat(transaction.amount)).toLocaleString()}
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
          ))}
        </div>

        {categoriesArray.length === 0 && (
          <Card className="bg-white dark:bg-gray-800">
            <CardContent className="text-center py-12">
              <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                No Spending Categories
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                Connect your accounts or add transactions to see your spending breakdown here.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}