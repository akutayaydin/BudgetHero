import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  Building2,
  CreditCard,
  Wallet,
  TrendingUp,
  TrendingDown,
  Eye,
  EyeOff,
  Filter,
  DollarSign,
  PieChart,
  BarChart3,
  Calendar,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";
import { SyncDigest } from "./sync-digest";
import { formatCurrency, formatDate } from "@/lib/financial-utils";
import { 
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LineChart,
  Line
} from "recharts";
import type { Account, Transaction } from "@shared/schema";

interface MintStyleOverviewProps {
  className?: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658'];

export default function MintStyleOverview({ className }: MintStyleOverviewProps) {
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [showBalances, setShowBalances] = useState(true);

  // Fetch accounts data
  const { data: accounts = [], isLoading: accountsLoading } = useQuery<Account[]>({
    queryKey: ["/api/accounts"],
  });

  // Fetch transactions data
  const { data: transactions = [], isLoading: transactionsLoading } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions"],
  });

  // Calculate account summaries by type (use subtype for depository accounts)
  const accountsByType = accounts.reduce((acc, account) => {
    // For depository accounts, use the subtype as the grouping key
    const groupKey = account.type === 'depository' 
      ? (account.subtype || 'checking') 
      : (account.type || 'checking');
    
    if (!acc[groupKey]) {
      acc[groupKey] = {
        accounts: [],
        total: 0,
        count: 0
      };
    }
    acc[groupKey].accounts.push(account);
    acc[groupKey].total += parseFloat(account.currentBalance || '0');
    acc[groupKey].count += 1;
    return acc;
  }, {} as Record<string, { accounts: Account[], total: number, count: number }>);

  // Calculate net worth using currentBalance field (from schema)
  const netWorth = accounts.reduce((total, account) => {
    // Use currentBalance field as defined in schema
    const balance = parseFloat(account.currentBalance || '0');
    
    // Credit cards and loans are liabilities (negative), all others are assets (positive)
    if (account.type === 'credit_card' || account.type === 'loan' || account.type === 'credit') {
      return total - Math.abs(balance); // Subtract debt
    } else {
      return total + balance; // Add assets
    }
  }, 0);

  // Filter transactions if account is selected
  const filteredTransactions = selectedAccountId 
    ? transactions.filter(t => t.accountId === selectedAccountId)
    : transactions;

  // Calculate data source breakdown
  const dataSourceBreakdown = transactions.reduce((acc, t) => {
    const source = t.source || 'manual';
    acc[source] = (acc[source] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const getSourceLabel = (source: string) => {
    switch (source) {
      case 'csv': return 'CSV Upload';
      case 'plaid': return 'Bank Import';
      case 'manual': 
      default: return 'Manual Entry';
    }
  };

  const getSourceColor = (source: string) => {
    switch (source) {
      case 'csv': return 'bg-blue-100 text-blue-800';
      case 'plaid': return 'bg-green-100 text-green-800';
      case 'manual':
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Get current month transactions
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const currentMonthTransactions = filteredTransactions.filter(t => {
    const transactionDate = new Date(t.date);
    return transactionDate.getMonth() === currentMonth && transactionDate.getFullYear() === currentYear;
  });

  // Calculate spending by category for current month
  const spendingByCategory = currentMonthTransactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => {
      const category = t.category || 'Other';
      acc[category] = (acc[category] || 0) + Math.abs(parseFloat(t.amount));
      return acc;
    }, {} as Record<string, number>);

  const categoryData = Object.entries(spendingByCategory)
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 8);

  // Calculate monthly trend (last 12 months for better historical view)
  const monthlyTrend = Array.from({ length: 12 }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - (11 - i));
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

    return {
      month: date.toLocaleDateString('en-US', { month: 'short' }),
      fullDate: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      income,
      expenses,
      net: income - expenses,
      transactionCount: monthTransactions.length
    };
  });

  // Historical comparisons
  const currentMonthData = monthlyTrend[monthlyTrend.length - 1];
  const previousMonthData = monthlyTrend[monthlyTrend.length - 2];
  const yearAgoData = monthlyTrend.length >= 12 ? monthlyTrend[monthlyTrend.length - 12] : null;

  // Calculate percentage changes
  const monthOverMonthChange = previousMonthData && previousMonthData.expenses > 0 
    ? ((currentMonthData.expenses - previousMonthData.expenses) / previousMonthData.expenses) * 100
    : 0;

  const yearOverYearChange = yearAgoData && yearAgoData.expenses > 0
    ? ((currentMonthData.expenses - yearAgoData.expenses) / yearAgoData.expenses) * 100
    : 0;

  // Top spending categories across all time
  const historicalSpendingByCategory = filteredTransactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => {
      const category = t.category || 'Other';
      acc[category] = (acc[category] || 0) + Math.abs(parseFloat(t.amount));
      return acc;
    }, {} as Record<string, number>);

  const topCategories = Object.entries(historicalSpendingByCategory)
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);

  // Average monthly spending
  const monthsWithData = monthlyTrend.filter(m => m.transactionCount > 0);
  const avgMonthlySpending = monthsWithData.length > 0 
    ? monthsWithData.reduce((sum, m) => sum + m.expenses, 0) / monthsWithData.length
    : 0;

  const getAccountIcon = (type: string) => {
    switch (type) {
      case 'checking':
      case 'savings':
      case 'cash management':
        return <Wallet className="h-4 w-4" />;
      case 'credit_card':
      case 'credit':
        return <CreditCard className="h-4 w-4" />;
      case 'investment':
        return <TrendingUp className="h-4 w-4" />;
      case 'loan':
        return <Building2 className="h-4 w-4" />;
      default:
        return <Building2 className="h-4 w-4" />;
    }
  };

  const getAccountTypeLabel = (type: string) => {
    switch (type) {
      case 'checking': return 'Checking';
      case 'savings': return 'Savings';
      case 'cash management': return 'Cash Management';
      case 'credit_card': 
      case 'credit': return 'Credit Cards';
      case 'investment': return 'Investments';
      case 'loan': return 'Loans';
      default: return 'Other';
    }
  };

  const getAccountTypeColor = (type: string) => {
    switch (type) {
      case 'checking': 
      case 'cash management': return 'bg-green-100 text-green-800';
      case 'savings': return 'bg-blue-100 text-blue-800';
      case 'credit_card': 
      case 'credit': return 'bg-red-100 text-red-800';
      case 'investment': return 'bg-purple-100 text-purple-800';
      case 'loan': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (accountsLoading || transactionsLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="h-24 bg-slate-100 rounded animate-pulse"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header with Net Worth and Data Sources */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Overview</h1>
          <p className="text-gray-600 mt-1">Your complete financial picture</p>
          
          {/* Data Source Summary */}
          <div className="flex flex-wrap items-center gap-2 mt-3">
            <span className="text-sm text-gray-500">Data Sources:</span>
            {Object.entries(dataSourceBreakdown).map(([source, count]) => (
              <Badge key={source} variant="secondary" className={getSourceColor(source)}>
                {getSourceLabel(source)}: {count}
              </Badge>
            ))}
          </div>
        </div>
        
        <Card className="px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="text-sm text-gray-600">Net Worth</div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowBalances(!showBalances)}
              className="p-1 h-auto"
            >
              {showBalances ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            </Button>
          </div>
          <div className="text-2xl font-bold text-gray-900 mt-1">
            {showBalances ? formatCurrency(netWorth) : '••••••'}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Column - Account Snapshots */}
        <div className="lg:col-span-1">
          <Card className="h-fit">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Accounts</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedAccountId(null)}
                  className={selectedAccountId ? "text-blue-600" : "text-gray-400"}
                >
                  <Filter className="h-4 w-4" />
                  {selectedAccountId ? "Clear" : "All"}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <ScrollArea className="max-h-96">
                <div className="space-y-4">
                  {/* Account Type Summaries */}
                  {Object.entries(accountsByType).map(([type, data]) => (
                    <div key={type} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getAccountIcon(type)}
                          <Badge variant="secondary" className={getAccountTypeColor(type)}>
                            {getAccountTypeLabel(type)}
                          </Badge>
                        </div>
                        <div className="text-sm font-medium">
                          {showBalances ? formatCurrency(data.total) : '••••'}
                        </div>
                      </div>
                      
                      {/* Individual Accounts */}
                      <div className="ml-6 space-y-1">
                        {data.accounts.map(account => (
                          <div 
                            key={account.id}
                            className={`flex items-center justify-between p-2 rounded cursor-pointer transition-colors ${
                              selectedAccountId === account.id 
                                ? 'bg-blue-100 border-blue-200' 
                                : 'hover:bg-gray-50'
                            }`}
                            onClick={() => setSelectedAccountId(
                              selectedAccountId === account.id ? null : account.id
                            )}
                          >
                            <div>
                              <div className="text-sm font-medium">{account.name}</div>
                              <div className="text-xs text-gray-500 flex items-center gap-2">
                                {account.mask ? `••••${account.mask}` : 'Manual Account'}
                                {account.plaidAccountId && (
                                  <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                                    Bank Connected
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <div className="text-sm">
                              {showBalances ? formatCurrency(parseFloat(account.currentBalance || '0')) : '••••'}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Area */}
        <div className="lg:col-span-3 space-y-6">
          {/* Historical Overview Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <Calendar className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="ml-3 flex-1">
                    <p className="text-sm font-medium text-gray-600">Avg Monthly Spending</p>
                    <p className="text-lg font-bold text-gray-900">
                      {formatCurrency(avgMonthlySpending)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                    {monthOverMonthChange >= 0 ? (
                      <TrendingUp className="h-4 w-4 text-orange-600" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-green-600" />
                    )}
                  </div>
                  <div className="ml-3 flex-1">
                    <p className="text-sm font-medium text-gray-600">vs Last Month</p>
                    <p className={`text-lg font-bold ${monthOverMonthChange >= 0 ? 'text-orange-600' : 'text-green-600'}`}>
                      {monthOverMonthChange >= 0 ? '+' : ''}{monthOverMonthChange.toFixed(1)}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    {yearOverYearChange >= 0 ? (
                      <TrendingUp className="h-4 w-4 text-purple-600" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-green-600" />
                    )}
                  </div>
                  <div className="ml-3 flex-1">
                    <p className="text-sm font-medium text-gray-600">vs Last Year</p>
                    <p className={`text-lg font-bold ${yearAgoData ? (yearOverYearChange >= 0 ? 'text-purple-600' : 'text-green-600') : 'text-gray-400'}`}>
                      {yearAgoData ? `${yearOverYearChange >= 0 ? '+' : ''}${yearOverYearChange.toFixed(1)}%` : 'No data'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                    <BarChart3 className="h-4 w-4 text-indigo-600" />
                  </div>
                  <div className="ml-3 flex-1">
                    <p className="text-sm font-medium text-gray-600">Active Months</p>
                    <p className="text-lg font-bold text-gray-900">
                      {monthsWithData.length} of 12
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Monthly Spending Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Spending This Month
                </CardTitle>
              </CardHeader>
              <CardContent>
                {categoryData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <RechartsPieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        dataKey="amount"
                        nameKey="category"
                      >
                        {categoryData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatCurrency(value as number)} />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-48 flex items-center justify-center text-gray-500">
                    No spending data this month
                  </div>
                )}
                
                {/* Category Legend */}
                <div className="mt-4 space-y-2">
                  {categoryData.slice(0, 5).map((item, index) => (
                    <div key={item.category} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: COLORS[index] }}
                        />
                        <span>{item.category}</span>
                      </div>
                      <span className="font-medium">{formatCurrency(item.amount)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  12-Month Historical Trend
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={monthlyTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="month" 
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis tickFormatter={(value) => formatCurrency(value)} />
                    <Tooltip 
                      formatter={(value) => formatCurrency(value as number)}
                      labelFormatter={(label, payload) => {
                        const data = payload?.[0]?.payload;
                        return data?.fullDate || label;
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="income" 
                      stroke="#10B981" 
                      strokeWidth={2}
                      name="Income"
                      dot={{ fill: '#10B981', strokeWidth: 2, r: 3 }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="expenses" 
                      stroke="#EF4444" 
                      strokeWidth={2}
                      name="Expenses"
                      dot={{ fill: '#EF4444', strokeWidth: 2, r: 3 }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="net" 
                      stroke="#3B82F6" 
                      strokeWidth={2}
                      name="Net Cash Flow"
                      dot={{ fill: '#3B82F6', strokeWidth: 2, r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Top Categories Over Time */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Top Spending Categories (All Time)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topCategories.map((item, index) => {
                  const percentage = historicalSpendingByCategory ? 
                    (item.amount / Object.values(historicalSpendingByCategory).reduce((a, b) => a + b, 0)) * 100 
                    : 0;
                  return (
                    <div key={item.category} className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="text-sm text-gray-500 w-4">#{index + 1}</div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">{item.category}</span>
                            <span className="text-sm text-gray-500">{percentage.toFixed(1)}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                            <div 
                              className="bg-blue-600 h-2 rounded-full" 
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                        <div className="text-sm font-medium text-right">
                          {formatCurrency(item.amount)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <ArrowUpRight className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="ml-3 flex-1">
                    <p className="text-sm font-medium text-gray-600">Monthly Income</p>
                    <p className="text-lg font-bold text-gray-900">
                      {formatCurrency(
                        currentMonthTransactions
                          .filter(t => t.type === 'income')
                          .reduce((sum, t) => sum + parseFloat(t.amount), 0)
                      )}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                    <ArrowDownRight className="h-4 w-4 text-red-600" />
                  </div>
                  <div className="ml-3 flex-1">
                    <p className="text-sm font-medium text-gray-600">Monthly Spending</p>
                    <p className="text-lg font-bold text-gray-900">
                      {formatCurrency(
                        currentMonthTransactions
                          .filter(t => t.type === 'expense')
                          .reduce((sum, t) => sum + Math.abs(parseFloat(t.amount)), 0)
                      )}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <DollarSign className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="ml-3 flex-1">
                    <p className="text-sm font-medium text-gray-600">Free to Spend</p>
                    <p className="text-lg font-bold text-gray-900">
                      {formatCurrency(
                        currentMonthTransactions
                          .filter(t => t.type === 'income')
                          .reduce((sum, t) => sum + parseFloat(t.amount), 0) -
                        currentMonthTransactions
                          .filter(t => t.type === 'expense')
                          .reduce((sum, t) => sum + Math.abs(parseFloat(t.amount)), 0)
                      )}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Sync Digest Section */}
      <div className="mt-8">
        <SyncDigest />
      </div>
    </div>
  );
}