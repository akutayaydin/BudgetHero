import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/financial-utils";
import { calculateProfitLoss, defaultCategories } from "@/lib/transaction-classifier";
import {
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  TrendingUp,
  AlertCircle,
  Activity,
  Wallet
} from "lucide-react";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ComposedChart
} from "recharts";
import { format, parseISO, subDays, subMonths, startOfMonth, endOfMonth, eachMonthOfInterval } from "date-fns";

const CHART_COLORS = [
  "#3B82F6", "#EF4444", "#10B981", "#F59E0B", "#8B5CF6", 
  "#EC4899", "#14B8A6", "#F97316", "#6366F1", "#84CC16"
];

export default function OverviewDashboard() {
  const [timeRange, setTimeRange] = useState("6m");
  const [activeMetric, setActiveMetric] = useState("spending");

  const { data: transactions = [], isLoading: transactionsLoading, error: transactionsError } = useQuery({
    queryKey: ["/api/transactions"],
  });

  const { data: budgets = [], isLoading: budgetsLoading } = useQuery({
    queryKey: ["/api/budgets"],
  });

  const { data: accounts = [], isLoading: accountsLoading } = useQuery({
    queryKey: ["/api/accounts"],
  });

  // ALL HOOKS MUST BE CALLED BEFORE ANY CONDITIONAL RETURNS

  // Calculate key metrics
  const { totalIncome, totalExpenses, netIncome } = useMemo(() => {
    if (!transactions || (transactions as any[]).length === 0) {
      return { totalIncome: 0, totalExpenses: 0, netIncome: 0 };
    }
    return calculateProfitLoss(transactions as any[], defaultCategories);
  }, [transactions]);

  // Time series data for trends
  const timeSeriesData = useMemo(() => {
    if (!transactions || (transactions as any[]).length === 0) return [];

    const now = new Date();
    const months = timeRange === "3m" ? 3 : timeRange === "6m" ? 6 : 12;
    const startDate = subMonths(now, months);

    const monthlyData = eachMonthOfInterval({
      start: startDate,
      end: now
    }).map(month => {
      const monthStart = startOfMonth(month);
      const monthEnd = endOfMonth(month);

      const monthTransactions = (transactions as any[]).filter(t => {
        try {
          let transactionDate;
          if (t.date?.includes('-')) {
            transactionDate = parseISO(t.date);
          } else if (t.date?.includes('/')) {
            const [month, day, year] = t.date.split('/');
            transactionDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
          } else {
            return false;
          }
          return transactionDate >= monthStart && transactionDate <= monthEnd;
        } catch (error) {
          return false;
        }
      });

      const monthMetrics = calculateProfitLoss(monthTransactions, defaultCategories);

      return {
        month: format(month, "MMM yyyy"),
        income: monthMetrics.totalIncome,
        expenses: Math.abs(monthMetrics.totalExpenses),
        net: monthMetrics.netIncome,
        date: month
      };
    });

    return monthlyData;
  }, [transactions, timeRange]);

  // Category breakdown for pie chart
  const categoryData = useMemo(() => {
    if (!transactions || (transactions as any[]).length === 0) return [];

    const categoryTotals = (transactions as any[]).reduce((acc: any, transaction: any) => {
      if (!transaction.category) return acc;

      // Use rawAmount for proper negative/positive detection, amount field is always positive
      const rawAmount = parseFloat(transaction.rawAmount || 0);
      const amount = Math.abs(rawAmount);
      const isExpense = rawAmount < 0 || transaction.type === 'expense';
      if (!isExpense) return acc;

      acc[transaction.category] = (acc[transaction.category] || 0) + amount;
      return acc;
    }, {});

    return Object.entries(categoryTotals)
      .map(([category, amount]) => ({
        name: category,
        value: amount as number
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [transactions]);

  // Budget vs actual comparison
  const budgetComparison = useMemo(() => {
    if (!transactions || !budgets || (transactions as any[]).length === 0) return [];

    const currentMonth = startOfMonth(new Date());
    const nextMonth = endOfMonth(new Date());

    const currentMonthTransactions = (transactions as any[]).filter(t => {
      try {
        let transactionDate;
        if (t.date?.includes('-')) {
          transactionDate = parseISO(t.date);
        } else if (t.date?.includes('/')) {
          const [month, day, year] = t.date.split('/');
          transactionDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        } else {
          return false;
        }
        return transactionDate >= currentMonth && transactionDate <= nextMonth;
      } catch (error) {
        return false;
      }
    });

    return (budgets as any[]).map(budget => {
      const spent = currentMonthTransactions
        .filter(t => t.category === budget.category && (parseFloat(t.rawAmount || 0) < 0 || t.type === 'expense'))
        .reduce((sum, t) => sum + Math.abs(parseFloat(t.rawAmount || 0)), 0);

      const percentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;
      const status = percentage > 100 ? "over" : percentage > 80 ? "warning" : "good";

      return {
        ...budget,
        spent,
        remaining: Math.max(0, budget.amount - spent),
        percentage: Math.min(100, percentage),
        status
      };
    }).filter(b => b.amount > 0);
  }, [transactions, budgets]);

  // Quick stats
  const quickStats = useMemo(() => {
    if (!transactions || (transactions as any[]).length === 0) {
      return {
        thisMonthSpending: 0,
        spendingChange: 0,
        transactionsCount: 0,
        avgDailySpending: 0,
        topCategory: {}
      };
    }

    const now = new Date();
    const lastMonth = subMonths(now, 1);

    const thisMonthTransactions = (transactions as any[]).filter(t => {
      try {
        let transactionDate;
        if (t.date?.includes('-')) {
          transactionDate = parseISO(t.date);
        } else if (t.date?.includes('/')) {
          const [month, day, year] = t.date.split('/');
          transactionDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        } else {
          return false;
        }
        return transactionDate >= startOfMonth(now);
      } catch (error) {
        return false;
      }
    });

    const lastMonthTransactions = (transactions as any[]).filter(t => {
      try {
        let transactionDate;
        if (t.date?.includes('-')) {
          transactionDate = parseISO(t.date);
        } else if (t.date?.includes('/')) {
          const [month, day, year] = t.date.split('/');
          transactionDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        } else {
          return false;
        }
        return transactionDate >= startOfMonth(lastMonth) && transactionDate < startOfMonth(now);
      } catch (error) {
        return false;
      }
    });

    const thisMonthSpending = thisMonthTransactions
      .filter(t => parseFloat(t.rawAmount || 0) < 0 || t.type === 'expense')
      .reduce((sum, t) => sum + Math.abs(parseFloat(t.rawAmount || 0)), 0);

    const lastMonthSpending = lastMonthTransactions
      .filter(t => parseFloat(t.rawAmount || 0) < 0 || t.type === 'expense')
      .reduce((sum, t) => sum + Math.abs(parseFloat(t.rawAmount || 0)), 0);

    const spendingChange = lastMonthSpending > 0 ? 
      ((thisMonthSpending - lastMonthSpending) / lastMonthSpending) * 100 : 0;

    return {
      thisMonthSpending,
      spendingChange,
      transactionsCount: thisMonthTransactions.length,
      avgDailySpending: thisMonthSpending / new Date().getDate(),
      topCategory: thisMonthTransactions
        .filter(t => parseFloat(t.rawAmount || 0) < 0 || t.type === 'expense')
        .reduce((acc: any, t) => {
          acc[t.category] = (acc[t.category] || 0) + Math.abs(parseFloat(t.rawAmount || 0));
          return acc;
        }, {})
    };
  }, [transactions]);

  // Recent insights
  const recentInsights = useMemo(() => {
    if (!transactions || (transactions as any[]).length === 0) return [];

    const recentTransactions = (transactions as any[])
      .sort((a, b) => {
        try {
          let dateA, dateB;

          if (a.date?.includes('-')) {
            dateA = parseISO(a.date);
          } else if (a.date?.includes('/')) {
            const [monthA, dayA, yearA] = a.date.split('/');
            dateA = new Date(parseInt(yearA), parseInt(monthA) - 1, parseInt(dayA));
          } else {
            return 0;
          }

          if (b.date?.includes('-')) {
            dateB = parseISO(b.date);
          } else if (b.date?.includes('/')) {
            const [monthB, dayB, yearB] = b.date.split('/');
            dateB = new Date(parseInt(yearB), parseInt(monthB) - 1, parseInt(dayB));
          } else {
            return 0;
          }

          return dateB.getTime() - dateA.getTime();
        } catch (error) {
          return 0;
        }
      })
      .slice(0, 50);

    const insights = [];

    // Large expense alert - use rawAmount for proper expense detection
    const expenseTransactions = recentTransactions.filter(t => parseFloat(t.rawAmount || 0) < 0 || t.type === 'expense');
    const avgExpense = expenseTransactions.length > 0 
      ? expenseTransactions.reduce((sum, t) => sum + Math.abs(parseFloat(t.rawAmount || 0)), 0) / expenseTransactions.length 
      : 0;

    const largeExpenses = expenseTransactions
      .filter(t => Math.abs(parseFloat(t.rawAmount || 0)) > avgExpense * 2)
      .slice(0, 3);

    if (largeExpenses.length > 0) {
      insights.push({
        type: "warning",
        title: "Unusual Large Expenses",
        description: `${largeExpenses.length} transactions significantly above your average`,
        amount: largeExpenses.reduce((sum, t) => sum + Math.abs(parseFloat(t.rawAmount || 0)), 0),
        icon: AlertCircle
      });
    }

    // Income spike - use rawAmount for proper income detection
    const recentIncome = recentTransactions
      .filter(t => parseFloat(t.rawAmount || 0) > 0 || t.type === 'income')
      .slice(0, 5);

    if (recentIncome.length > 0) {
      insights.push({
        type: "positive",
        title: "Recent Income",
        description: `${recentIncome.length} income transactions in the last 50 activities`,
        amount: recentIncome.reduce((sum, t) => sum + Math.abs(parseFloat(t.rawAmount || 0)), 0),
        icon: TrendingUp
      });
    }

    return insights.slice(0, 3);
  }, [transactions]);

  // Calculate top category
  const topCategory = useMemo(() => {
    return Object.entries(quickStats.topCategory || {})
      .sort(([,a], [,b]) => (b as number) - (a as number))[0];
  }, [quickStats]);

  // Enhanced debug logging
  console.log("Overview Dashboard Debug:", {
    transactionsCount: (transactions as any[]).length,
    transactionsLoading,
    transactionsError: transactionsError?.message,
    sampleTransactions: (transactions as any[]).slice(0, 3),
    calculatedMetrics: { totalIncome, totalExpenses, netIncome },
    categoryDataLength: categoryData.length,
    timeSeriesLength: timeSeriesData.length,
    quickStats
  });

  // NOW WE CAN HAVE CONDITIONAL RETURNS AFTER ALL HOOKS

  // Early loading state
  if (transactionsLoading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <div className="text-lg font-medium text-gray-600">Loading your financial data...</div>
        </div>
      </div>
    );
  }

  // Error state
  if (transactionsError) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <div className="text-lg font-medium text-red-600">Unable to load transaction data</div>
          <div className="text-sm text-gray-500 mt-2">
            {transactionsError instanceof Error ? transactionsError.message : "Please try logging in again"}
          </div>
        </div>
      </div>
    );
  }

  // No data state
  if (!transactions || (transactions as any[]).length === 0) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <div className="text-lg font-medium text-gray-600">No transaction data found</div>
          <div className="text-sm text-gray-500 mt-2">Upload your CSV files to see insights here</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with time range selector */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Financial Overview</h2>
          <p className="text-slate-600">Your complete financial picture at a glance</p>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="3m">3 Months</SelectItem>
            <SelectItem value="6m">6 Months</SelectItem>
            <SelectItem value="12m">12 Months</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Net Worth Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">
              {formatCurrency(Math.abs(netIncome))}
            </div>
            <div className="flex items-center gap-1 mt-1">
              {netIncome >= 0 ? (
                <ArrowUpRight className="h-4 w-4 text-green-600" />
              ) : (
                <ArrowDownRight className="h-4 w-4 text-red-600" />
              )}
              <span className={`text-sm ${netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {netIncome >= 0 ? 'Positive' : 'Negative'}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              This Month
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">
              {formatCurrency(quickStats.thisMonthSpending)}
            </div>
            <div className="flex items-center gap-1 mt-1">
              {quickStats.spendingChange >= 0 ? (
                <ArrowUpRight className="h-4 w-4 text-red-600" />
              ) : (
                <ArrowDownRight className="h-4 w-4 text-green-600" />
              )}
              <span className={`text-sm ${quickStats.spendingChange >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                {Math.abs(quickStats.spendingChange).toFixed(1)}% vs last month
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Daily Average
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">
              {formatCurrency(quickStats.avgDailySpending)}
            </div>
            <div className="text-sm text-slate-600 mt-1">
              {quickStats.transactionsCount} transactions this month
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
              <Wallet className="h-4 w-4" />
              Top Category
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">
              {topCategory ? formatCurrency(topCategory[1] as number) : '$0'}
            </div>
            <div className="text-sm text-slate-600 mt-1">
              {topCategory ? topCategory[0] : 'No data'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Income vs Expenses Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Income vs Expenses Trend
            </CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={timeSeriesData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="month" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip 
                  formatter={(value: any, name: string) => [
                    formatCurrency(value), 
                    name === 'income' ? 'Income' : name === 'expenses' ? 'Expenses' : 'Net Income'
                  ]}
                />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="income" 
                  stackId="1" 
                  fill="#10B981" 
                  fillOpacity={0.3}
                  stroke="#10B981"
                  name="Income"
                />
                <Area 
                  type="monotone" 
                  dataKey="expenses" 
                  stackId="2" 
                  fill="#EF4444" 
                  fillOpacity={0.3}
                  stroke="#EF4444"
                  name="Expenses"
                />
                <Line 
                  type="monotone" 
                  dataKey="net" 
                  stroke="#3B82F6" 
                  strokeWidth={3}
                  name="Net Income"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Spending by Category */}
        <Card>
          <CardHeader>
            <CardTitle>Spending by Category</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: any) => formatCurrency(value)} />
                </RechartsPieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-500">
                No spending data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Smart Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Smart Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentInsights.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recentInsights.map((insight, index) => {
                const Icon = insight.icon;
                return (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border ${
                      insight.type === 'warning' ? 'border-yellow-200 bg-yellow-50' : 
                      insight.type === 'positive' ? 'border-green-200 bg-green-50' : 'border-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Icon className={`h-5 w-5 ${
                        insight.type === 'warning' ? 'text-yellow-600' : 
                        insight.type === 'positive' ? 'text-green-600' : 'text-slate-600'
                      }`} />
                      <h4 className="font-semibold text-slate-900">{insight.title}</h4>
                    </div>
                    <p className="text-sm text-slate-600 mb-2">{insight.description}</p>
                    <div className="font-bold text-slate-900">{formatCurrency(insight.amount)}</div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500">
              No insights available yet. More data will enable smarter analysis.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}