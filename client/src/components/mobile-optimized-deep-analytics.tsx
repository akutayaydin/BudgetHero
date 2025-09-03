import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  PieChart, 
  BarChart3,
  Target,
  AlertTriangle,
  CheckCircle,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Zap,
  Brain,
  Calendar,
  Filter
} from "lucide-react";
import { formatCurrency } from "@/lib/financial-utils";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Cell,
  BarChart,
  Bar,
  AreaChart,
  Area,
  Pie
} from "recharts";
import type { Transaction, Account } from "@shared/schema";

const COLORS = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'];

interface MobileOptimizedDeepAnalyticsProps {
  className?: string;
}

export default function MobileOptimizedDeepAnalytics({ className }: MobileOptimizedDeepAnalyticsProps) {
  const [timeRange, setTimeRange] = useState<'3m' | '6m' | '12m'>('6m');
  const [activeView, setActiveView] = useState<'trends' | 'patterns' | 'insights'>('trends');

  // Fetch data
  const { data: transactions = [], isLoading: transactionsLoading } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions"],
  });

  const { data: accounts = [] } = useQuery<Account[]>({
    queryKey: ["/api/accounts"],
  });

  // Calculate time range for filtering
  const now = new Date();
  const timeRangeDate = new Date();
  timeRangeDate.setMonth(now.getMonth() - (timeRange === '3m' ? 3 : timeRange === '6m' ? 6 : 12));
  
  const filteredTransactions = transactions.filter(t => {
    const transactionDate = new Date(t.date);
    return transactionDate >= timeRangeDate;
  });

  // Calculate key metrics
  const metrics = {
    totalIncome: filteredTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0),
    totalExpenses: filteredTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Math.abs(parseFloat(t.amount)), 0),
    transactionCount: filteredTransactions.length,
    avgTransactionSize: filteredTransactions.length > 0 ? 
      filteredTransactions.reduce((sum, t) => sum + Math.abs(parseFloat(t.amount)), 0) / filteredTransactions.length : 0
  };

  const netCashFlow = metrics.totalIncome - metrics.totalExpenses;
  const savingsRate = metrics.totalIncome > 0 ? (netCashFlow / metrics.totalIncome) * 100 : 0;

  // Monthly trend data
  const monthlyTrends = Array.from({ length: 6 }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    return date;
  }).reverse().map(month => {
    const monthTransactions = filteredTransactions.filter(t => {
      const transactionDate = new Date(t.date);
      return transactionDate.getMonth() === month.getMonth() && 
             transactionDate.getFullYear() === month.getFullYear();
    });

    const income = monthTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);
    
    const expenses = monthTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Math.abs(parseFloat(t.amount)), 0);

    return {
      month: month.toLocaleDateString('en-US', { month: 'short' }),
      income,
      expenses,
      net: income - expenses,
      transactionCount: monthTransactions.length
    };
  });

  // Category analysis
  const categoryAnalysis = filteredTransactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => {
      const category = t.category || 'Other';
      if (!acc[category]) {
        acc[category] = { total: 0, count: 0, transactions: [] };
      }
      acc[category].total += Math.abs(parseFloat(t.amount));
      acc[category].count += 1;
      acc[category].transactions.push(t);
      return acc;
    }, {} as Record<string, { total: number, count: number, transactions: Transaction[] }>);

  const topCategories = Object.entries(categoryAnalysis)
    .map(([category, data]) => ({
      category,
      amount: data.total,
      count: data.count,
      avgAmount: data.total / data.count
    }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 6);

  // Spending patterns
  const spendingPatterns = {
    weekdayVsWeekend: filteredTransactions.reduce((acc, t) => {
      if (t.type !== 'expense') return acc;
      const date = new Date(t.date);
      const dayOfWeek = date.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const key = isWeekend ? 'weekend' : 'weekday';
      acc[key] += Math.abs(parseFloat(t.amount));
      return acc;
    }, { weekday: 0, weekend: 0 }),
    
    timeOfMonth: filteredTransactions.reduce((acc, t) => {
      if (t.type !== 'expense') return acc;
      const date = new Date(t.date);
      const dayOfMonth = date.getDate();
      const period = dayOfMonth <= 10 ? 'early' : dayOfMonth <= 20 ? 'mid' : 'late';
      acc[period] += Math.abs(parseFloat(t.amount));
      return acc;
    }, { early: 0, mid: 0, late: 0 })
  };

  // Smart insights
  const generateInsights = () => {
    const insights = [];

    // Savings rate insight
    if (savingsRate > 25) {
      insights.push({
        type: 'positive',
        title: 'Excellent Savings Rate',
        description: `You're saving ${savingsRate.toFixed(1)}% of your income - well above average!`,
        icon: CheckCircle,
        color: 'text-green-600',
        bgColor: 'bg-green-50'
      });
    } else if (savingsRate < 5) {
      insights.push({
        type: 'warning',
        title: 'Low Savings Rate',
        description: `Consider increasing your savings rate from ${savingsRate.toFixed(1)}% to at least 20%`,
        icon: AlertTriangle,
        color: 'text-orange-600',
        bgColor: 'bg-orange-50'
      });
    }

    // Top category insight
    if (topCategories.length > 0) {
      const topCategory = topCategories[0];
      const percentage = (topCategory.amount / metrics.totalExpenses) * 100;
      insights.push({
        type: 'info',
        title: 'Top Spending Category',
        description: `${topCategory.category} represents ${percentage.toFixed(1)}% of your total expenses`,
        icon: PieChart,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50'
      });
    }

    // Spending pattern insight
    const { weekday, weekend } = spendingPatterns.weekdayVsWeekend;
    if (weekend > weekday * 0.4) {
      insights.push({
        type: 'neutral',
        title: 'Weekend Spending',
        description: 'You spend significantly more on weekends than weekdays',
        icon: Calendar,
        color: 'text-purple-600',
        bgColor: 'bg-purple-50'
      });
    }

    return insights;
  };

  const insights = generateInsights();

  if (transactionsLoading) {
    return (
      <div className="space-y-4 p-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-32 bg-slate-100 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (filteredTransactions.length === 0) {
    return (
      <Card className="text-center py-12">
        <CardContent>
          <Brain className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Data for Analytics</h3>
          <p className="text-gray-500">
            Add more transactions to see deep insights and patterns in your spending.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`max-w-7xl mx-auto ${className}`}>
      <div className="space-y-6 p-4 sm:p-6">
        {/* Header with Controls */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Brain className="h-6 w-6" />
              Deep Analytics
            </h2>
            <p className="text-gray-600">AI-powered insights into your financial patterns</p>
          </div>
          <div className="flex gap-2">
            <Select value={timeRange} onValueChange={(value: '3m' | '6m' | '12m') => setTimeRange(value)}>
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
        </div>

      {/* Key Metrics Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700">Savings Rate</p>
                <p className="text-xl font-bold text-blue-900">{savingsRate.toFixed(1)}%</p>
              </div>
              <Target className="h-6 w-6 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-700">Net Cash Flow</p>
                <p className="text-xl font-bold text-green-900">{formatCurrency(netCashFlow)}</p>
              </div>
              {netCashFlow >= 0 ? 
                <ArrowUpRight className="h-6 w-6 text-green-600" /> : 
                <ArrowDownRight className="h-6 w-6 text-red-600" />
              }
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-700">Transactions</p>
                <p className="text-xl font-bold text-purple-900">{metrics.transactionCount}</p>
              </div>
              <Activity className="h-6 w-6 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-700">Avg Transaction</p>
                <p className="text-xl font-bold text-orange-900">{formatCurrency(metrics.avgTransactionSize)}</p>
              </div>
              <DollarSign className="h-6 w-6 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Smart Insights */}
      {insights.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Smart Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {insights.map((insight, index) => (
                <div key={index} className={`flex items-start gap-3 p-4 rounded-lg ${insight.bgColor}`}>
                  <insight.icon className={`h-5 w-5 mt-0.5 ${insight.color}`} />
                  <div>
                    <h4 className="font-medium text-gray-900">{insight.title}</h4>
                    <p className="text-sm text-gray-600 mt-1">{insight.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Analytics Tabs */}
      <Tabs value={activeView} onValueChange={setActiveView}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="patterns">Patterns</TabsTrigger>
          <TabsTrigger value="insights">Categories</TabsTrigger>
        </TabsList>

        <TabsContent value="trends" className="space-y-4">
          {/* TERTIARY CHART: Account Balance History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Cash Flow Analysis ({timeRange.toUpperCase()})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 sm:h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis tickFormatter={(value) => formatCurrency(value)} />
                    <Tooltip formatter={(value) => formatCurrency(value as number)} />
                    <Line 
                      type="monotone" 
                      dataKey="income" 
                      stroke="#10B981" 
                      strokeWidth={3}
                      name="Income"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="expenses" 
                      stroke="#EF4444" 
                      strokeWidth={3}
                      name="Expenses"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="net" 
                      stroke="#3B82F6" 
                      strokeWidth={4}
                      name="Net Cash Flow"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Account Balance Trends - New tertiary chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Account Balance History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis tickFormatter={(value) => formatCurrency(value)} />
                    <Tooltip formatter={(value) => formatCurrency(value as number)} />
                    <Area 
                      type="monotone" 
                      dataKey="net" 
                      stroke="#3B82F6" 
                      fill="#3B82F6"
                      fillOpacity={0.3}
                      name="Net Worth Change"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="patterns" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Weekday vs Weekend Spending</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded">
                    <span className="font-medium">Weekday Spending</span>
                    <span className="font-bold">{formatCurrency(spendingPatterns.weekdayVsWeekend.weekday)}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-purple-50 rounded">
                    <span className="font-medium">Weekend Spending</span>
                    <span className="font-bold">{formatCurrency(spendingPatterns.weekdayVsWeekend.weekend)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Spending by Month Period</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded">
                    <span className="font-medium">Early Month (1-10)</span>
                    <span className="font-bold">{formatCurrency(spendingPatterns.timeOfMonth.early)}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-yellow-50 rounded">
                    <span className="font-medium">Mid Month (11-20)</span>
                    <span className="font-bold">{formatCurrency(spendingPatterns.timeOfMonth.mid)}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-red-50 rounded">
                    <span className="font-medium">Late Month (21-31)</span>
                    <span className="font-bold">{formatCurrency(spendingPatterns.timeOfMonth.late)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5" />
                Top Spending Categories
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={topCategories}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={120}
                        dataKey="amount"
                        nameKey="category"
                      >
                        {topCategories.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatCurrency(value as number)} />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-3">
                  {topCategories.map((category, index) => (
                    <div key={category.category} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-4 h-4 rounded-full" 
                          style={{ backgroundColor: COLORS[index] }}
                        />
                        <div>
                          <span className="font-medium">{category.category}</span>
                          <p className="text-xs text-gray-500">{category.count} transactions</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{formatCurrency(category.amount)}</p>
                        <p className="text-xs text-gray-500">avg {formatCurrency(category.avgAmount)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </div>
    </div>
  );
}