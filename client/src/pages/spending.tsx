import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { TrendingDown, TrendingUp, PieChart, BarChart3, Calendar, ArrowLeft, DollarSign, CreditCard, ChevronDown, Repeat, ShoppingBag, AlertCircle } from "lucide-react";
import { Link, useLocation } from "wouter";
import { ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";

interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: string;
  category: string;
  type: string;
  merchant?: string;
}

interface SpendingData {
  category: string;
  amount: number;
  color: string;
  percentage: number;
}

export default function SpendingPage() {
  const [activeTab, setActiveTab] = useState<'week' | 'month' | 'year'>('month');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [, setLocation] = useLocation();
  
  const { data: transactions } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions"],
  });

  // Enhanced category emoji mapping for Gen Alpha visual appeal
  const getCategoryEmoji = (category: string) => {
    const emojiMap: Record<string, string> = {
      'Dining': '🍽️',
      'Food': '🍕',
      'Transport': '🚗',
      'Entertainment': '🎮',
      'Shopping': '🛍️',
      'Housing': '🏠',
      'Health': '💊',
      'Travel': '✈️',
      'Bills': '📄',
      'Subscriptions': '📱',
      'Gas': '⛽',
      'Groceries': '🛒',
      'Coffee': '☕',
      'Fitness': '💪',
      'Education': '📚',
      'Insurance': '🛡️',
      'Banking': '🏦',
      'Investment': '📈',
      'Other': '💳'
    };
    return emojiMap[category] || '💰';
  };

  // Calculate financial data based on time period
  const getFinancialData = (period: 'week' | 'month' | 'year') => {
    if (!transactions) return { incomeTotal: 0, spendTotal: 0, netIncome: 0, categories: [], incomeTransactions: [] };

    const now = new Date();
    let currentStart: Date, currentEnd: Date;

    switch (period) {
      case 'week':
        const currentWeekStart = new Date(now);
        currentWeekStart.setDate(now.getDate() - now.getDay()); // Start of current week
        currentStart = currentWeekStart;
        currentEnd = new Date(currentWeekStart);
        currentEnd.setDate(currentWeekStart.getDate() + 6); // End of current week
        break;
        
      case 'month':
        currentStart = new Date(now.getFullYear(), now.getMonth(), 1);
        currentEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        break;
        
      case 'year':
        currentStart = new Date(now.getFullYear(), 0, 1);
        currentEnd = new Date(now.getFullYear(), 11, 31);
        break;
    }

    const currentTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.date);
      return transactionDate >= currentStart && transactionDate <= currentEnd;
    });

    const incomeTransactions = currentTransactions.filter(t => t.type === 'income');
    const expenseTransactions = currentTransactions.filter(t => t.type === 'expense');
    
    const incomeTotal = incomeTransactions.reduce((sum, t) => sum + Math.abs(parseFloat(t.amount)), 0);
    const spendTotal = expenseTransactions.reduce((sum, t) => sum + Math.abs(parseFloat(t.amount)), 0);
    const netIncome = incomeTotal - spendTotal;

    // Group expenses by category
    const categorySpending = expenseTransactions.reduce((acc, transaction) => {
      const category = transaction.category || 'Other';
      const amount = Math.abs(parseFloat(transaction.amount));
      acc[category] = (acc[category] || 0) + amount;
      return acc;
    }, {} as Record<string, number>);

    // Gen Alpha friendly vibrant colors with gradients
    const colors = ['#8B5CF6', '#06B6D4', '#10B981', '#F59E0B', '#EF4444', '#6B7280', '#FF6B6B', '#4ECDC4', '#FF69B4', '#00CED1'];
    const categories = Object.entries(categorySpending)
      .map(([category, amount], index) => ({
        category,
        amount: Math.round(amount),
        color: colors[index % colors.length],
        percentage: spendTotal > 0 ? Math.round((amount / spendTotal) * 100) : 0
      }))
      .sort((a, b) => b.amount - a.amount);

    return {
      incomeTotal: Math.round(incomeTotal),
      spendTotal: Math.round(spendTotal),
      netIncome: Math.round(netIncome),
      categories,
      incomeTransactions
    };
  };

  const financialData = getFinancialData(activeTab);

  const getPeriodLabel = (period: 'week' | 'month' | 'year') => {
    switch (period) {
      case 'week': return 'This Week';
      case 'month': return 'This Month';
      case 'year': return 'This Year';
    }
  };

  // Generate comparison bar chart data for the selected period
  const getComparisonData = () => {
    if (!transactions) return [];
    
    const now = new Date();
    const periods: { 
      name: string; 
      income: number; 
      spending: number; 
      periodStart: Date; 
      periodEnd: Date;
      incomeTransactions: Transaction[];
      spendingTransactions: Transaction[];
    }[] = [];
    
    for (let i = 7; i >= 0; i--) {
      let periodStart: Date, periodEnd: Date, name: string;
      
      switch (activeTab) {
        case 'week':
          periodStart = new Date(now);
          periodStart.setDate(now.getDate() - (i * 7) - now.getDay());
          periodEnd = new Date(periodStart);
          periodEnd.setDate(periodStart.getDate() + 6);
          // Format as M/d for week labels (e.g., 7/21, 7/28)
          name = `${periodStart.getMonth() + 1}/${periodStart.getDate()}`;
          break;
          
        case 'month':
          periodStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
          periodEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
          name = periodStart.toLocaleDateString('en-US', { month: 'short' });
          break;
          
        case 'year':
          periodStart = new Date(now.getFullYear() - i, 0, 1);
          periodEnd = new Date(now.getFullYear() - i, 11, 31);
          name = periodStart.getFullYear().toString();
          break;
      }
      
      const periodTransactions = transactions.filter(t => {
        const transactionDate = new Date(t.date);
        return transactionDate >= periodStart && transactionDate <= periodEnd;
      });
      
      const incomeTransactions = periodTransactions.filter(t => t.type === 'income');
      const spendingTransactions = periodTransactions.filter(t => t.type === 'expense');
      
      const income = incomeTransactions.reduce((sum, t) => sum + Math.abs(parseFloat(t.amount)), 0);
      const spending = spendingTransactions.reduce((sum, t) => sum + Math.abs(parseFloat(t.amount)), 0);
      
      periods.push({ 
        name, 
        income: Math.round(income), 
        spending: Math.round(spending),
        periodStart,
        periodEnd,
        incomeTransactions,
        spendingTransactions
      });
    }
    
    return periods;
  };

  const comparisonData = getComparisonData();

  // Get all expense transactions for analysis
  const allExpenseTransactions = transactions?.filter(t => t.type === 'expense') || [];
  
  // Calculate frequent spends
  const getFrequentSpends = () => {
    const merchantCounts = allExpenseTransactions.reduce((acc, transaction) => {
      const merchant = transaction.merchant || transaction.description;
      if (!acc[merchant]) {
        acc[merchant] = { count: 0, totalAmount: 0, category: transaction.category };
      }
      acc[merchant].count++;
      acc[merchant].totalAmount += Math.abs(parseFloat(transaction.amount));
      return acc;
    }, {} as Record<string, { count: number; totalAmount: number; category: string }>);

    return Object.entries(merchantCounts)
      .map(([merchant, data]) => ({ merchant, ...data }))
      .filter(item => item.count > 1) // Only show merchants with multiple purchases
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  };

  // Calculate largest purchases
  const getLargestPurchases = () => {
    return allExpenseTransactions
      .map(t => ({ ...t, numericAmount: Math.abs(parseFloat(t.amount)) }))
      .sort((a, b) => b.numericAmount - a.numericAmount)
      .slice(0, 10);
  };

  // Get uncategorized transactions
  const getUncategorizedTransactions = () => {
    return allExpenseTransactions.filter(t => !t.category || t.category === 'Other');
  };

  const frequentSpends = getFrequentSpends();
  const largestPurchases = getLargestPurchases();
  const uncategorizedTransactions = getUncategorizedTransactions();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-700">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Enhanced Header with Gen Alpha styling */}
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 p-6 rounded-2xl border-2 border-purple-100 dark:border-purple-700 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm" className="text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/30 rounded-xl transition-all duration-200">
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Back to Dashboard
                </Button>
              </Link>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent flex items-center gap-3">
                  📊 Spending Analysis
                </h1>
                <p className="text-gray-600 dark:text-gray-400 text-lg mt-1">
                  Track and analyze your spending patterns across different time periods ✨
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Time Period Tabs with Gen Alpha styling */}
        <Card className="mb-8 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border-2 border-blue-100 dark:border-blue-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
              <Calendar className="h-6 w-6 text-blue-600" />
              📅 Time Period
            </CardTitle>
            <p className="text-sm text-gray-600 dark:text-gray-400">Choose your timeframe to analyze spending patterns</p>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'week' | 'month' | 'year')}>
              <TabsList className="grid w-full grid-cols-3 bg-white dark:bg-gray-800 rounded-xl p-1">
                <TabsTrigger value="week" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white rounded-lg transition-all duration-200">
                  <Calendar className="h-4 w-4" />
                  📅 Week
                </TabsTrigger>
                <TabsTrigger value="month" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white rounded-lg transition-all duration-200">
                  <Calendar className="h-4 w-4" />
                  🗓️ Month
                </TabsTrigger>
                <TabsTrigger value="year" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white rounded-lg transition-all duration-200">
                  <Calendar className="h-4 w-4" />
                  📆 Year
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </CardContent>
        </Card>

        {/* Financial Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Enhanced Income Card */}
          <Card 
            className="bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 border-2 border-green-200 dark:border-green-700 cursor-pointer hover:shadow-xl hover:scale-105 transition-all duration-300 hover:border-green-300"
            onClick={() => setLocation('/earnings')}
          >
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                <span className="text-2xl">💰</span>
                Income
              </CardTitle>
              <p className="text-sm text-gray-600 dark:text-gray-400">Click to explore earnings! 🎯</p>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                ${(financialData.incomeTotal || 0).toLocaleString()}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {getPeriodLabel(activeTab)}
              </p>
            </CardContent>
          </Card>

          {/* Enhanced Total Spend Card */}
          <Card 
            className="bg-gradient-to-br from-red-50 to-pink-100 dark:from-red-900/30 dark:to-pink-900/30 border-2 border-red-200 dark:border-red-700 cursor-pointer hover:shadow-xl hover:scale-105 transition-all duration-300 hover:border-red-300"
            onClick={() => setLocation('/spending-categories')}
          >
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-xl font-bold bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent">
                <span className="text-2xl">💳</span>
                Total Spend
              </CardTitle>
              <p className="text-sm text-gray-600 dark:text-gray-400">Click to explore categories! 🔍</p>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                ${(financialData.spendTotal || 0).toLocaleString()}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {getPeriodLabel(activeTab)}
              </p>
            </CardContent>
          </Card>

          {/* Enhanced Net Income Card */}
          <Card className="bg-gradient-to-br from-blue-50 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30 border-2 border-blue-200 dark:border-blue-700 hover:shadow-xl transition-all duration-300">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                <span className="text-2xl">📈</span>
                Net Income
              </CardTitle>
              <p className="text-sm text-gray-600 dark:text-gray-400">Your financial balance ⚖️</p>
            </CardHeader>
            <CardContent>
              <p className={`text-3xl font-bold ${
                financialData.netIncome >= 0 
                  ? 'text-green-600 dark:text-green-400' 
                  : 'text-red-600 dark:text-red-400'
              }`}>
                {(financialData.netIncome || 0) >= 0 ? '+' : ''}${(financialData.netIncome || 0).toLocaleString()}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {getPeriodLabel(activeTab)}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Income vs Spending Comparison Chart */}
        <Card className="mb-8 bg-white dark:bg-gray-800">
          <CardContent className="pt-6">
            {/* Custom Legend */}
            <div className="flex items-center justify-center gap-8 mb-6">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-500 rounded"></div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Income</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-red-500 rounded"></div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Total Spend</span>
              </div>
            </div>
            
            <div className="h-80" style={{ backgroundColor: 'white' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  data={comparisonData} 
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  style={{ backgroundColor: 'white' }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#6B7280', fontSize: 12 }}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#6B7280', fontSize: 12 }}
                    tickFormatter={(value) => `$${(value/1000).toFixed(0)}k`}
                  />
                  <Tooltip 
                    formatter={(value: any, name: string) => [`$${(typeof value === 'number' ? value : parseFloat(value) || 0).toLocaleString()}`, name === 'income' ? 'Income' : 'Total Spend']}
                    labelStyle={{ color: '#374151' }}
                    contentStyle={{ 
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '6px'
                    }}
                  />
                  <Bar 
                    dataKey="income" 
                    fill="#10B981"
                    name="income"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar 
                    dataKey="spending" 
                    fill="#EF4444"
                    name="spending"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Interactive Spending Pie Chart - Gen Alpha Style */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <Card className="bg-gradient-to-br from-white to-purple-50 dark:from-gray-800 dark:to-purple-900/20 border-2 border-purple-100 dark:border-purple-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                <PieChart className="h-6 w-6 text-purple-600" />
                Spending by Category
              </CardTitle>
              <p className="text-sm text-gray-600 dark:text-gray-400">Click any slice to see details! ✨</p>
            </CardHeader>
            <CardContent>
              {financialData.categories.length > 0 ? (
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={financialData.categories}
                        cx="50%"
                        cy="50%"
                        outerRadius={120}
                        innerRadius={40}
                        paddingAngle={4}
                        dataKey="amount"
                        onClick={(data) => setSelectedCategory(data.category)}
                        className="cursor-pointer transition-all duration-300 hover:scale-105"
                      >
                        {financialData.categories.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={selectedCategory === entry.category ? '#6366F1' : entry.color}
                            stroke={selectedCategory === entry.category ? '#4F46E5' : 'transparent'}
                            strokeWidth={selectedCategory === entry.category ? 3 : 0}
                          />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: any) => [`$${(typeof value === 'number' ? value : parseFloat(value) || 0).toLocaleString()}`, 'Amount']}
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

          {/* Category Details - Enhanced */}
          <Card className="bg-gradient-to-br from-white to-blue-50 dark:from-gray-800 dark:to-blue-900/20 border-2 border-blue-100 dark:border-blue-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl font-bold">
                {selectedCategory ? (
                  <>
                    <span className="text-2xl">{getCategoryEmoji(selectedCategory)}</span>
                    <span className="bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                      {selectedCategory} Transactions
                    </span>
                  </>
                ) : (
                  <span className="bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                    🎯 Category Details
                  </span>
                )}
              </CardTitle>
              {!selectedCategory && (
                <p className="text-sm text-gray-600 dark:text-gray-400">Click a category in the chart to explore! 🔍</p>
              )}
            </CardHeader>
            <CardContent>
              {selectedCategory ? (
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {allExpenseTransactions
                    .filter(t => t.category === selectedCategory)
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .map((transaction) => (
                      <div key={transaction.id} className="flex items-center justify-between p-4 bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 rounded-xl border-2 border-red-200 dark:border-red-700 hover:shadow-lg transition-all duration-200 hover:scale-102">
                        <div>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {transaction.description}
                          </span>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {new Date(transaction.date).toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric',
                              year: 'numeric' 
                            })}
                          </p>
                        </div>
                        <span className="text-sm font-semibold text-red-600 dark:text-red-400">
                          -${Math.abs(parseFloat(transaction.amount)).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setSelectedCategory(null)}
                    className="w-full mt-4"
                  >
                    View All Categories
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    Click on a category in the pie chart to view detailed transactions
                  </p>
                  {financialData.categories.slice(0, 6).map((category) => (
                    <div 
                      key={category.category} 
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                      onClick={() => setSelectedCategory(category.category)}
                    >
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
                          {category.percentage}%
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Frequent Spends Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Repeat className="h-5 w-5 text-purple-600" />
              Frequent Spends
            </CardTitle>
          </CardHeader>
          <CardContent>
            {frequentSpends.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {frequentSpends.map((item) => (
                  <div key={item.merchant} className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-700">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-gray-900 dark:text-white truncate">
                        {item.merchant}
                      </h4>
                      <span className="text-xs bg-purple-100 dark:bg-purple-800 text-purple-700 dark:text-purple-300 px-2 py-1 rounded">
                        {item.category}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {item.count} purchases
                      </span>
                      <span className="text-lg font-bold text-purple-600 dark:text-purple-400">
                        ${item.totalAmount.toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                No frequent spending patterns found
              </div>
            )}
          </CardContent>
        </Card>

        {/* Largest Purchases Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingBag className="h-5 w-5 text-orange-600" />
              Largest Purchases
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {largestPurchases.map((transaction, index) => (
                <div key={transaction.id} className="flex items-center justify-between p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-700">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center justify-center w-8 h-8 bg-orange-100 dark:bg-orange-800 text-orange-600 dark:text-orange-400 rounded-full text-sm font-bold">
                      #{index + 1}
                    </span>
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">
                        {transaction.description}
                      </h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {new Date(transaction.date).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric',
                          year: 'numeric' 
                        })} • {transaction.category}
                      </p>
                    </div>
                  </div>
                  <span className="text-xl font-bold text-orange-600 dark:text-orange-400">
                    ${transaction.numericAmount.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Uncategorized Transactions */}
        {uncategorizedTransactions.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-yellow-600" />
                Needs Categorization ({uncategorizedTransactions.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {uncategorizedTransactions.slice(0, 5).map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-700">
                    <div>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {transaction.description}
                      </span>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(transaction.date).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric',
                          year: 'numeric' 
                        })}
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-yellow-600 dark:text-yellow-400">
                      ${Math.abs(parseFloat(transaction.amount)).toLocaleString()}
                    </span>
                  </div>
                ))}
                {uncategorizedTransactions.length > 5 && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 text-center pt-2">
                    ... and {uncategorizedTransactions.length - 5} more transactions
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}


      </div>
    </div>
  );
}