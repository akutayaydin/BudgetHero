import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  CreditCard, 
  PieChart, 
  BarChart3,
  Calendar,
  Target,
  AlertTriangle,
  CheckCircle,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Zap,
  Percent,
  Calculator,
  Brain,
  Users,
  TrendingUp as Growth
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/financial-utils";
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
  Area,
  AreaChart,
  Pie,
  ScatterChart,
  Scatter,
  RadialBarChart,
  RadialBar,
  ComposedChart,
  Treemap
} from "recharts";
import type { Transaction, Account } from "@shared/schema";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#FF6B6B', '#4ECDC4'];

interface DeepAnalyticsProps {
  className?: string;
}

export default function DeepAnalytics({ className }: DeepAnalyticsProps) {
  const [timeRange, setTimeRange] = useState<'3m' | '6m' | '12m' | 'all'>('6m');
  const [analysisType, setAnalysisType] = useState<'spending' | 'income' | 'cashflow' | 'patterns'>('spending');

  // Fetch data
  const { data: transactions = [], isLoading: transactionsLoading } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions"],
  });

  const { data: accounts = [] } = useQuery<Account[]>({
    queryKey: ["/api/accounts"],
  });

  // Filter transactions by time range
  const getFilteredTransactions = () => {
    if (timeRange === 'all') return transactions;
    
    const now = new Date();
    const cutoffDate = new Date();
    
    switch (timeRange) {
      case '3m':
        cutoffDate.setMonth(now.getMonth() - 3);
        break;
      case '6m':
        cutoffDate.setMonth(now.getMonth() - 6);
        break;
      case '12m':
        cutoffDate.setFullYear(now.getFullYear() - 1);
        break;
    }
    
    return transactions.filter(t => new Date(t.date) >= cutoffDate);
  };

  const filteredTransactions = getFilteredTransactions();

  // Advanced Analytics Calculations
  
  // 1. Spending Velocity (transactions per day)
  const spendingVelocity = () => {
    if (filteredTransactions.length === 0) return 0;
    
    const expenses = filteredTransactions.filter(t => t.type === 'expense');
    const dateRange = timeRange === 'all' ? 365 : parseInt(timeRange) * 30;
    return expenses.length / dateRange;
  };

  // 2. Category Diversity Index (how spread spending is across categories)
  const categoryDiversityIndex = () => {
    const categoryAmounts = filteredTransactions
      .filter(t => t.type === 'expense')
      .reduce((acc, t) => {
        const category = t.category || 'Other';
        acc[category] = (acc[category] || 0) + Math.abs(parseFloat(t.amount));
        return acc;
      }, {} as Record<string, number>);

    const totalSpending = Object.values(categoryAmounts).reduce((a, b) => a + b, 0);
    if (totalSpending === 0) return 0;

    // Calculate Shannon Diversity Index
    const diversity = Object.values(categoryAmounts).reduce((acc, amount) => {
      const proportion = amount / totalSpending;
      return acc - (proportion * Math.log2(proportion));
    }, 0);

    return Math.min(diversity / Math.log2(Object.keys(categoryAmounts).length || 1), 1) * 100;
  };

  // 3. Spending Concentration (top 3 categories as % of total)
  const spendingConcentration = () => {
    const categoryAmounts = filteredTransactions
      .filter(t => t.type === 'expense')
      .reduce((acc, t) => {
        const category = t.category || 'Other';
        acc[category] = (acc[category] || 0) + Math.abs(parseFloat(t.amount));
        return acc;
      }, {} as Record<string, number>);

    const totalSpending = Object.values(categoryAmounts).reduce((a, b) => a + b, 0);
    if (totalSpending === 0) return 0;

    const topThree = Object.values(categoryAmounts)
      .sort((a, b) => b - a)
      .slice(0, 3)
      .reduce((a, b) => a + b, 0);

    return (topThree / totalSpending) * 100;
  };

  // 4. Cash Flow Volatility
  const cashFlowVolatility = () => {
    const monthlyFlows = Array.from({ length: 6 }, (_, i) => {
      const date = new Date();
      date.setMonth(date.getMonth() - (5 - i));
      
      const monthTransactions = filteredTransactions.filter(t => {
        const tDate = new Date(t.date);
        return tDate.getMonth() === date.getMonth() && tDate.getFullYear() === date.getFullYear();
      });

      const income = monthTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);
      
      const expenses = monthTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + Math.abs(parseFloat(t.amount)), 0);

      return income - expenses;
    });

    const avgFlow = monthlyFlows.reduce((a, b) => a + b, 0) / monthlyFlows.length;
    const variance = monthlyFlows.reduce((acc, flow) => acc + Math.pow(flow - avgFlow, 2), 0) / monthlyFlows.length;
    return Math.sqrt(variance);
  };

  // 5. Weekly Spending Pattern Analysis
  const weeklySpendingPattern = () => {
    const weeklyData = Array(7).fill(0).map((_, day) => ({
      day: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][day],
      amount: 0,
      count: 0
    }));

    filteredTransactions
      .filter(t => t.type === 'expense')
      .forEach(t => {
        const dayOfWeek = new Date(t.date).getDay();
        weeklyData[dayOfWeek].amount += Math.abs(parseFloat(t.amount));
        weeklyData[dayOfWeek].count += 1;
      });

    return weeklyData;
  };

  // 6. Transaction Size Distribution
  const transactionSizeDistribution = () => {
    const expenses = filteredTransactions
      .filter(t => t.type === 'expense')
      .map(t => Math.abs(parseFloat(t.amount)));

    const buckets = [
      { range: '$0-25', min: 0, max: 25, count: 0, total: 0 },
      { range: '$25-100', min: 25, max: 100, count: 0, total: 0 },
      { range: '$100-500', min: 100, max: 500, count: 0, total: 0 },
      { range: '$500-1000', min: 500, max: 1000, count: 0, total: 0 },
      { range: '$1000+', min: 1000, max: Infinity, count: 0, total: 0 }
    ];

    expenses.forEach(amount => {
      const bucket = buckets.find(b => amount >= b.min && amount < b.max);
      if (bucket) {
        bucket.count += 1;
        bucket.total += amount;
      }
    });

    return buckets;
  };

  // 7. Account Balance Trends
  const accountBalanceTrends = () => {
    return accounts.map(account => ({
      name: account.name,
      type: account.type,
      balance: parseFloat(account.balance || '0'),
      institution: account.institution,
      transactionCount: filteredTransactions.filter(t => t.accountId === account.id).length
    }));
  };

  // 8. Merchant Analysis
  const topMerchants = () => {
    const merchantSpending = filteredTransactions
      .filter(t => t.type === 'expense' && t.description)
      .reduce((acc, t) => {
        const merchant = t.description.split(' ')[0]; // Simple merchant extraction
        acc[merchant] = (acc[merchant] || 0) + Math.abs(parseFloat(t.amount));
        return acc;
      }, {} as Record<string, number>);

    return Object.entries(merchantSpending)
      .map(([merchant, amount]) => ({ merchant, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10);
  };

  // 9. Income Stability Score
  const incomeStabilityScore = () => {
    const monthlyIncomes = Array.from({ length: 6 }, (_, i) => {
      const date = new Date();
      date.setMonth(date.getMonth() - (5 - i));
      
      return filteredTransactions
        .filter(t => {
          const tDate = new Date(t.date);
          return t.type === 'income' && 
                 tDate.getMonth() === date.getMonth() && 
                 tDate.getFullYear() === date.getFullYear();
        })
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);
    });

    const avgIncome = monthlyIncomes.reduce((a, b) => a + b, 0) / monthlyIncomes.length;
    if (avgIncome === 0) return 0;

    const coefficientOfVariation = Math.sqrt(
      monthlyIncomes.reduce((acc, income) => acc + Math.pow(income - avgIncome, 2), 0) / monthlyIncomes.length
    ) / avgIncome;

    return Math.max(0, (1 - coefficientOfVariation) * 100);
  };

  // 10. Savings Rate Trend
  const savingsRateTrend = () => {
    return Array.from({ length: 6 }, (_, i) => {
      const date = new Date();
      date.setMonth(date.getMonth() - (5 - i));
      
      const monthTransactions = filteredTransactions.filter(t => {
        const tDate = new Date(t.date);
        return tDate.getMonth() === date.getMonth() && tDate.getFullYear() === date.getFullYear();
      });

      const income = monthTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);
      
      const expenses = monthTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + Math.abs(parseFloat(t.amount)), 0);

      const savingsRate = income > 0 ? ((income - expenses) / income) * 100 : 0;

      return {
        month: date.toLocaleDateString('en-US', { month: 'short' }),
        savingsRate: Math.round(savingsRate),
        income,
        expenses,
        savings: income - expenses
      };
    });
  };

  if (transactionsLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[...Array(6)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="h-48 bg-slate-100 rounded animate-pulse"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Deep Analytics</h2>
          <p className="text-gray-600 mt-1">Advanced financial insights and pattern analysis</p>
        </div>
        
        <div className="flex gap-3">
          <Select value={timeRange} onValueChange={(value: any) => setTimeRange(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3m">Last 3M</SelectItem>
              <SelectItem value="6m">Last 6M</SelectItem>
              <SelectItem value="12m">Last 12M</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs value={analysisType} onValueChange={(value: any) => setAnalysisType(value)}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="spending">Spending Analysis</TabsTrigger>
          <TabsTrigger value="income">Income Insights</TabsTrigger>
          <TabsTrigger value="cashflow">Cash Flow</TabsTrigger>
          <TabsTrigger value="patterns">Behavioral Patterns</TabsTrigger>
        </TabsList>

        <TabsContent value="spending" className="space-y-6">
          {/* Advanced Spending Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <Activity className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="ml-3 flex-1">
                    <p className="text-sm font-medium text-gray-600">Spending Velocity</p>
                    <p className="text-lg font-bold text-gray-900">
                      {spendingVelocity().toFixed(1)} tx/day
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <PieChart className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="ml-3 flex-1">
                    <p className="text-sm font-medium text-gray-600">Diversity Index</p>
                    <p className="text-lg font-bold text-gray-900">
                      {categoryDiversityIndex().toFixed(0)}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                    <Target className="h-4 w-4 text-orange-600" />
                  </div>
                  <div className="ml-3 flex-1">
                    <p className="text-sm font-medium text-gray-600">Top 3 Concentration</p>
                    <p className="text-lg font-bold text-gray-900">
                      {spendingConcentration().toFixed(0)}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <Zap className="h-4 w-4 text-purple-600" />
                  </div>
                  <div className="ml-3 flex-1">
                    <p className="text-sm font-medium text-gray-600">Cash Flow Volatility</p>
                    <p className="text-lg font-bold text-gray-900">
                      {formatCurrency(cashFlowVolatility())}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Transaction Size Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Transaction Size Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={transactionSizeDistribution()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="range" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`${value} transactions`, 'Count']} />
                    <Bar dataKey="count" fill="#3B82F6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Weekly Spending Pattern
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={weeklySpendingPattern()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis tickFormatter={(value) => formatCurrency(value)} />
                    <Tooltip formatter={(value) => [formatCurrency(value as number), 'Amount']} />
                    <Bar dataKey="amount" fill="#10B981" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Top Merchants */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Top Merchants
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-64">
                <div className="space-y-3">
                  {topMerchants().map((merchant, index) => (
                    <div key={merchant.merchant} className="flex items-center justify-between p-3 border rounded">
                      <div className="flex items-center gap-3">
                        <div className="text-sm text-gray-500 w-6">#{index + 1}</div>
                        <div className="font-medium">{merchant.merchant}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">{formatCurrency(merchant.amount)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="income" className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="ml-3 flex-1">
                    <p className="text-sm font-medium text-gray-600">Income Stability Score</p>
                    <p className="text-lg font-bold text-gray-900">
                      {incomeStabilityScore().toFixed(0)}%
                    </p>
                    <p className="text-xs text-gray-500">Higher is more stable</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <Growth className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="ml-3 flex-1">
                    <p className="text-sm font-medium text-gray-600">Avg Savings Rate</p>
                    <p className="text-lg font-bold text-gray-900">
                      {savingsRateTrend().reduce((acc, month) => acc + month.savingsRate, 0) / savingsRateTrend().length}%
                    </p>
                    <p className="text-xs text-gray-500">Income minus expenses</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="cashflow" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Savings Rate Trend
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={savingsRateTrend()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis yAxisId="left" tickFormatter={(value) => `${value}%`} />
                  <YAxis yAxisId="right" orientation="right" tickFormatter={(value) => formatCurrency(value)} />
                  <Tooltip 
                    formatter={(value, name) => {
                      if (name === 'savingsRate') return [`${value}%`, 'Savings Rate'];
                      return [formatCurrency(value as number), name];
                    }}
                  />
                  <Bar yAxisId="right" dataKey="income" fill="#10B981" name="Income" />
                  <Bar yAxisId="right" dataKey="expenses" fill="#EF4444" name="Expenses" />
                  <Line yAxisId="left" type="monotone" dataKey="savingsRate" stroke="#3B82F6" strokeWidth={3} name="Savings Rate" />
                </ComposedChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="patterns" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                Account Activity Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {accountBalanceTrends().map(account => (
                  <div key={account.name} className="flex items-center justify-between p-4 border rounded">
                    <div>
                      <div className="font-medium">{account.name}</div>
                      <div className="text-sm text-gray-500">{account.institution} • {account.type}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">{formatCurrency(account.balance)}</div>
                      <div className="text-sm text-gray-500">{account.transactionCount} transactions</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}