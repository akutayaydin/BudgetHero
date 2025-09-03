import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  TrendingUp,
  TrendingDown,
  Eye,
  EyeOff,
  DollarSign,
  PieChart,
  BarChart3,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  ChevronDown,
  ChevronUp,
  CreditCard,
  Wallet,
  Building2,
  Zap
} from "lucide-react";
import { SyncDigest } from "./sync-digest";
import { formatCurrency, formatDate } from "@/lib/financial-utils";
import { 
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from "recharts";
import type { Account, Transaction } from "@shared/schema";

interface MobileOptimizedOverviewProps {
  className?: string;
}

const COLORS = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'];

export default function MobileOptimizedOverview({ className }: MobileOptimizedOverviewProps) {
  const [showBalances, setShowBalances] = useState(true);
  const [activeTab, setActiveTab] = useState("summary");
  const [expandedSections, setExpandedSections] = useState({
    accounts: false,
    spending: true,
    trends: false,
  });

  // Data fetching
  const { data: accounts = [], isLoading: accountsLoading } = useQuery<Account[]>({
    queryKey: ["/api/accounts"],
  });

  const { data: transactions = [], isLoading: transactionsLoading } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions"],
  });

  // Key calculations
  const netWorth = accounts.reduce((total, account) => {
    const balance = parseFloat(account.currentBalance || '0');
    if (account.type === 'credit_card' || account.type === 'loan' || account.type === 'credit') {
      return total - Math.abs(balance);
    } else {
      return total + balance;
    }
  }, 0);

  // Current month calculations
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const currentMonthTransactions = transactions.filter(t => {
    const transactionDate = new Date(t.date);
    return transactionDate.getMonth() === currentMonth && transactionDate.getFullYear() === currentYear;
  });

  const monthlyIncome = currentMonthTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + parseFloat(t.amount), 0);

  const monthlyExpenses = currentMonthTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + Math.abs(parseFloat(t.amount)), 0);

  const freeToSpend = monthlyIncome - monthlyExpenses;

  // Category breakdown for current month
  const categoryData = currentMonthTransactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => {
      const category = t.category || 'Other';
      acc[category] = (acc[category] || 0) + Math.abs(parseFloat(t.amount));
      return acc;
    }, {} as Record<string, number>);

  const categoryChartData = Object.entries(categoryData)
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 6);

  // Account groups
  const accountsByType = accounts.reduce((acc, account) => {
    const type = account.type || 'checking';
    if (!acc[type]) {
      acc[type] = { accounts: [], total: 0, count: 0 };
    }
    acc[type].accounts.push(account);
    acc[type].total += parseFloat(account.currentBalance || '0');
    acc[type].count += 1;
    return acc;
  }, {} as Record<string, { accounts: Account[], total: number, count: number }>);

  // Monthly trend (last 6 months)
  const last6Months = Array.from({ length: 6 }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    return date;
  }).reverse();

  const trendData = last6Months.map(month => {
    const monthTransactions = transactions.filter(t => {
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
      net: income - expenses
    };
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const getAccountIcon = (type: string) => {
    switch (type) {
      case 'checking': return <Wallet className="h-4 w-4 text-green-600" />;
      case 'savings': return <Building2 className="h-4 w-4 text-blue-600" />;
      case 'credit_card': return <CreditCard className="h-4 w-4 text-red-600" />;
      case 'investment': return <TrendingUp className="h-4 w-4 text-purple-600" />;
      default: return <Wallet className="h-4 w-4 text-gray-600" />;
    }
  };

  const getAccountTypeLabel = (type: string) => {
    switch (type) {
      case 'checking': return 'Checking';
      case 'savings': return 'Savings';
      case 'credit_card': return 'Credit Cards';
      case 'investment': return 'Investments';
      default: return 'Other';
    }
  };

  if (accountsLoading || transactionsLoading) {
    return (
      <div className="space-y-4 p-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-20 bg-slate-100 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className={`space-y-4 p-4 max-w-4xl mx-auto ${className}`}>
      {/* Hero KPI Cards - Always Visible */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Net Worth */}
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Net Worth</p>
                <div className="flex items-center gap-2">
                  <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                    {showBalances ? formatCurrency(netWorth) : '••••••'}
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowBalances(!showBalances)}
                    className="p-1 h-auto"
                  >
                    {showBalances ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <DollarSign className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        {/* Monthly Income */}
        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-700 dark:text-green-300">This Month Income</p>
                <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                  {showBalances ? formatCurrency(monthlyIncome) : '••••••'}
                </p>
              </div>
              <ArrowUpRight className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        {/* Free to Spend */}
        <Card className={`bg-gradient-to-br ${freeToSpend >= 0 ? 'from-emerald-50 to-emerald-100 border-emerald-200' : 'from-red-50 to-red-100 border-red-200'} dark:from-opacity-20 dark:to-opacity-20`}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${freeToSpend >= 0 ? 'text-emerald-700 dark:text-emerald-300' : 'text-red-700 dark:text-red-300'}`}>
                  Free to Spend
                </p>
                <p className={`text-2xl font-bold ${freeToSpend >= 0 ? 'text-emerald-900 dark:text-emerald-100' : 'text-red-900 dark:text-red-100'}`}>
                  {showBalances ? formatCurrency(freeToSpend) : '••••••'}
                </p>
              </div>
              {freeToSpend >= 0 ? 
                <TrendingUp className="h-8 w-8 text-emerald-600" /> : 
                <TrendingDown className="h-8 w-8 text-red-600" />
              }
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabbed Interface for Detailed Views */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-4">
          <TabsTrigger value="summary" className="text-xs sm:text-sm">Summary</TabsTrigger>
          <TabsTrigger value="accounts" className="text-xs sm:text-sm">Accounts</TabsTrigger>
          <TabsTrigger value="spending" className="text-xs sm:text-sm">Spending</TabsTrigger>
          <TabsTrigger value="trends" className="text-xs sm:text-sm">Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="summary" className="space-y-4">
          {/* Quick Stats */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Quick Stats
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Monthly Expenses</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                    {formatCurrency(monthlyExpenses)}
                  </p>
                </div>
                <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Accounts</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                    {accounts.length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sync Digest - Compact for Mobile */}
          <SyncDigest />
        </TabsContent>

        <TabsContent value="accounts" className="space-y-4">
          {Object.entries(accountsByType).map(([type, data]) => (
            <Card key={type}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getAccountIcon(type)}
                    <CardTitle className="text-lg">{getAccountTypeLabel(type)}</CardTitle>
                    <Badge variant="secondary">{data.count}</Badge>
                  </div>
                  <p className="font-bold text-lg">
                    {showBalances ? formatCurrency(data.total) : '••••••'}
                  </p>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {data.accounts.map((account) => (
                    <div key={account.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                      <div>
                        <p className="font-medium text-sm">{account.name}</p>
                        <p className="text-xs text-gray-500">
                          {account.mask ? `••••${account.mask}` : 'Manual Entry'}
                        </p>
                      </div>
                      <p className="font-medium">
                        {showBalances ? formatCurrency(parseFloat(account.currentBalance || '0')) : '••••'}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="spending" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5" />
                This Month's Spending
              </CardTitle>
            </CardHeader>
            <CardContent>
              {categoryChartData.length > 0 ? (
                <>
                  <div className="h-64 mb-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPieChart>
                        <Pie
                          data={categoryChartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={80}
                          dataKey="amount"
                          nameKey="category"
                        >
                          {categoryChartData.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => formatCurrency(value as number)} />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-2">
                    {categoryChartData.map((item, index) => (
                      <div key={item.category} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: COLORS[index] }}
                          />
                          <span className="text-sm">{item.category}</span>
                        </div>
                        <span className="font-medium text-sm">{formatCurrency(item.amount)}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No spending data for this month
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                6-Month Trend
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tickFormatter={(value) => formatCurrency(value)} />
                    <Tooltip formatter={(value) => formatCurrency(value as number)} />
                    <Line 
                      type="monotone" 
                      dataKey="income" 
                      stroke="#10B981" 
                      strokeWidth={2}
                      name="Income"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="expenses" 
                      stroke="#EF4444" 
                      strokeWidth={2}
                      name="Expenses"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="net" 
                      stroke="#3B82F6" 
                      strokeWidth={2}
                      name="Net"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}