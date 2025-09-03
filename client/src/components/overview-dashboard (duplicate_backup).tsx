import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { formatCurrency } from "@/lib/financial-utils";
import { calculateProfitLoss, defaultCategories } from "@/lib/transaction-classifier";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Target, 
  AlertCircle,
  CheckCircle,
  Calendar,
  PieChart,
  BarChart3,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  Clock,
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

  // Calculate key metrics (always call this hook)
  const { totalIncome, totalExpenses, netIncome } = useMemo(() => {
    if (!transactions || (transactions as any[]).length === 0) {
      return { totalIncome: 0, totalExpenses: 0, netIncome: 0 };
    }
    return calculateProfitLoss(transactions as any[], defaultCategories);
  }, [transactions]);

  // Time series data for trends
  const timeSeriesData = useMemo(() => {
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
          // Handle different date formats - try ISO format first, then MM/dd/yyyy
          let transactionDate;
          if (t.date.includes('-')) {
            transactionDate = parseISO(t.date);
          } else {
            // Handle MM/dd/yyyy format
            const [month, day, year] = t.date.split('/');
            transactionDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
          }
          return transactionDate >= monthStart && transactionDate <= monthEnd;
        } catch (error) {
          console.warn("Date parsing error for transaction:", t.date);
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
    const categoryTotals = (transactions as any[]).reduce((acc: any, transaction: any) => {
      if (!transaction.category) return acc;
      
      // Only include expenses (negative amounts) for spending breakdown
      const amount = Math.abs(parseFloat(transaction.amount || transaction.rawAmount || 0));
      
      // Check if it's an expense (negative amount)
      const isExpense = parseFloat(transaction.amount || transaction.rawAmount || 0) < 0;
      if (!isExpense) return acc;
      
      acc[transaction.category] = (acc[transaction.category] || 0) + amount;
      return acc;
    }, {});

    const result = Object.entries(categoryTotals)
      .map(([category, amount]) => ({
        name: category,
        value: amount as number
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
    
    if (result.length > 0) {
      console.log("Category data for pie chart:", result);
    }
    return result;
  }, [transactions]);

  // Budget vs actual comparison
  const budgetComparison = useMemo(() => {
    const currentMonth = startOfMonth(new Date());
    const nextMonth = endOfMonth(new Date());
    
    const currentMonthTransactions = (transactions as any[]).filter(t => {
      try {
        let transactionDate;
        if (t.date.includes('-')) {
          transactionDate = parseISO(t.date);
        } else {
          const [month, day, year] = t.date.split('/');
          transactionDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        }
        return transactionDate >= currentMonth && transactionDate <= nextMonth;
      } catch (error) {
        return false;
      }
    });

    return (budgets as any[]).map(budget => {
      const spent = currentMonthTransactions
        .filter(t => t.category === budget.category && parseFloat(t.amount) < 0)
        .reduce((sum, t) => sum + Math.abs(parseFloat(t.amount)), 0);
      
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

  // Recent activity insights
  const recentInsights = useMemo(() => {
    const recentTransactions = (transactions as any[])
      .sort((a, b) => {
        try {
          let dateA, dateB;
          
          // Handle date format for a
          if (a.date.includes('-')) {
            dateA = parseISO(a.date);
          } else {
            const [monthA, dayA, yearA] = a.date.split('/');
            dateA = new Date(parseInt(yearA), parseInt(monthA) - 1, parseInt(dayA));
          }
          
          // Handle date format for b
          if (b.date.includes('-')) {
            dateB = parseISO(b.date);
          } else {
            const [monthB, dayB, yearB] = b.date.split('/');
            dateB = new Date(parseInt(yearB), parseInt(monthB) - 1, parseInt(dayB));
          }
          
          return dateB.getTime() - dateA.getTime();
        } catch (error) {
          return 0;
        }
      })
      .slice(0, 50);
    
    const insights = [];
    
    // Large expense alert
    const avgExpense = recentTransactions
      .filter(t => parseFloat(t.amount) < 0)
      .reduce((sum, t) => sum + Math.abs(parseFloat(t.amount)), 0) / Math.max(1, recentTransactions.filter(t => parseFloat(t.amount) < 0).length);
    
    const largeExpenses = recentTransactions
      .filter(t => parseFloat(t.amount) < 0 && Math.abs(parseFloat(t.amount)) > avgExpense * 2)
      .slice(0, 3);

    if (largeExpenses.length > 0) {
      insights.push({
        type: "warning",
        title: "Unusual Large Expenses",
        description: `${largeExpenses.length} transactions significantly above your average`,
        amount: largeExpenses.reduce((sum, t) => sum + Math.abs(parseFloat(t.amount)), 0),
        icon: AlertCircle
      });
    }

    // Income spike
    const recentIncome = recentTransactions
      .filter(t => parseFloat(t.amount) > 0)
      .slice(0, 5);
    
    if (recentIncome.length > 0) {
      insights.push({
        type: "positive",
        title: "Recent Income",
        description: `${recentIncome.length} income transactions in the last 50 activities`,
        amount: recentIncome.reduce((sum, t) => sum + parseFloat(t.amount), 0),
        icon: TrendingUp
      });
    }

    return insights.slice(0, 3);
  }, [transactions]);

  // Quick stats
  const quickStats = useMemo(() => {
    const now = new Date();
    const lastMonth = subMonths(now, 1);
    
    const thisMonthTransactions = (transactions as any[]).filter(t => {
      try {
        let transactionDate;
        if (t.date.includes('-')) {
          transactionDate = parseISO(t.date);
        } else {
          const [month, day, year] = t.date.split('/');
          transactionDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        }
        return transactionDate >= startOfMonth(now);
      } catch (error) {
        return false;
      }
    });
    const lastMonthTransactions = (transactions as any[]).filter(t => {
      try {
        let transactionDate;
        if (t.date.includes('-')) {
          transactionDate = parseISO(t.date);
        } else {
          const [month, day, year] = t.date.split('/');
          transactionDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        }
        return transactionDate >= startOfMonth(lastMonth) && transactionDate < startOfMonth(now);
      } catch (error) {
        return false;
      }
    });

    const thisMonthSpending = thisMonthTransactions
      .filter(t => parseFloat(t.amount) < 0)
      .reduce((sum, t) => sum + Math.abs(parseFloat(t.amount)), 0);
    
    const lastMonthSpending = lastMonthTransactions
      .filter(t => parseFloat(t.amount) < 0)
      .reduce((sum, t) => sum + Math.abs(parseFloat(t.amount)), 0);
    
    const spendingChange = lastMonthSpending > 0 ? 
      ((thisMonthSpending - lastMonthSpending) / lastMonthSpending) * 100 : 0;

    return {
      thisMonthSpending,
      spendingChange,
      transactionsCount: thisMonthTransactions.length,
      avgDailySpending: thisMonthSpending / new Date().getDate(),
      topCategory: thisMonthTransactions
        .filter(t => parseFloat(t.amount) < 0)
        .reduce((acc: any, t) => {
          acc[t.category] = (acc[t.category] || 0) + Math.abs(parseFloat(t.amount));
          return acc;
        }, {})
    };
  }, [transactions]);

  const topCategory = Object.entries(quickStats.topCategory || {})
    .sort(([,a], [,b]) => (b as number) - (a as number))[0];

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
              <Eye className="h-4 w-4" />
              Daily Average
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">
              {formatCurrency(quickStats.avgDailySpending)}
            </div>
            <div className="text-sm text-slate-500 mt-1">
              {quickStats.transactionsCount} transactions this month
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
              <Target className="h-4 w-4" />
              Top Category
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">
              {topCategory ? formatCurrency(topCategory[1] as number) : "$0"}
            </div>
            <div className="text-sm text-slate-500 mt-1">
              {topCategory ? topCategory[0] : "No data"}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Income vs Expenses Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Income vs Expenses Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={timeSeriesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip 
                  formatter={(value: number) => formatCurrency(value)}
                  labelFormatter={(label) => `Month: ${label}`}
                />
                <Legend />
                <Bar dataKey="income" fill="#10B981" name="Income" />
                <Bar dataKey="expenses" fill="#EF4444" name="Expenses" />
                <Line type="monotone" dataKey="net" stroke="#3B82F6" strokeWidth={3} name="Net Income" />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Category Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Spending by Category
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RechartsPieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={120}
                  paddingAngle={5}
                  dataKey="value"
                  label={(entry: any) => `${entry.name}: ${formatCurrency(entry.value)}`}
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
              </RechartsPieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Budget vs Actual */}
      {budgetComparison.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Budget Performance This Month
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {budgetComparison.map((budget) => (
                <div key={budget.id} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{budget.category}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-slate-600">
                        {formatCurrency(budget.spent)} / {formatCurrency(budget.amount)}
                      </span>
                      <Badge variant={
                        budget.status === "over" ? "destructive" : 
                        budget.status === "warning" ? "secondary" : "default"
                      }>
                        {budget.percentage.toFixed(0)}%
                      </Badge>
                    </div>
                  </div>
                  <Progress 
                    value={budget.percentage} 
                    className={`h-2 ${
                      budget.status === "over" ? "bg-red-100" : 
                      budget.status === "warning" ? "bg-yellow-100" : "bg-green-100"
                    }`}
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Insights and Alerts */}
      {recentInsights.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Smart Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentInsights.map((insight, index) => (
                <div key={index} className={`flex items-start gap-3 p-3 rounded-lg ${
                  insight.type === "warning" ? "bg-yellow-50 border border-yellow-200" :
                  insight.type === "positive" ? "bg-green-50 border border-green-200" :
                  "bg-blue-50 border border-blue-200"
                }`}>
                  <insight.icon className={`h-5 w-5 mt-0.5 ${
                    insight.type === "warning" ? "text-yellow-600" :
                    insight.type === "positive" ? "text-green-600" :
                    "text-blue-600"
                  }`} />
                  <div className="flex-1">
                    <h4 className="font-medium text-slate-900">{insight.title}</h4>
                    <p className="text-sm text-slate-600">{insight.description}</p>
                  </div>
                  <div className="text-right">
                    <span className="font-semibold">{formatCurrency(insight.amount)}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Account Summary */}
      {(accounts as any[]).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              Connected Accounts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {(accounts as any[]).map((account: any) => (
                <div key={account.id} className="p-4 border rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-medium">{account.name}</h4>
                      <p className="text-sm text-slate-500">{account.type}</p>
                    </div>
                    <Badge variant={account.plaidAccountId ? "default" : "secondary"}>
                      {account.plaidAccountId ? "Synced" : "Manual"}
                    </Badge>
                  </div>
                  <div className="text-lg font-semibold">
                    {formatCurrency(account.balance || 0)}
                  </div>
                  {account.lastSynced && (
                    <p className="text-xs text-slate-500 mt-1">
                      Last synced: {format(parseISO(account.lastSynced), "MMM dd, yyyy")}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}