import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  TrendingUp,
  TrendingDown,
  Eye,
  EyeOff,
  DollarSign,
  PieChart,
  BarChart3,
  ChevronDown,
  ChevronUp,
  CreditCard,
  Wallet,
  Building2,
  Zap,
  Target,
  Calendar,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  ExternalLink,
  Percent,
  Clock,
  Home,
  Car,
  Coins,
  Briefcase,
  Package,
  Landmark,
  Truck,
  AlertTriangle
} from "lucide-react";
import { SyncDigest } from "./sync-digest";
import { TransactionReviewTray } from "./transaction-review-tray";
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
  Pie,
  Cell,
  AreaChart,
  Area
} from "recharts";
import type { Account, Transaction } from "@shared/schema";

interface ReviewTransaction {
  transaction: {
    id: string;
    description: string;
    merchant?: string;
    amount: string;
    date: string;
    category: string;
  };
  meta: {
    confidence: string;
    needsReview: boolean;
  };
  adminCategory: {
    id: string;
    name: string;
    color: string;
  };
}

const COLORS = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'];

interface ProgressiveDisclosureOverviewProps {
  className?: string;
}

export default function ProgressiveDisclosureOverview({ className }: ProgressiveDisclosureOverviewProps) {
  const [showBalances, setShowBalances] = useState(true);
  const [expandedSections, setExpandedSections] = useState({
    netWorth: true,
    cashFlow: false,
    savings: true,
    transactions: true,
    budget: false
  });

  // Data fetching
  const { data: accounts = [], isLoading: accountsLoading } = useQuery<Account[]>({
    queryKey: ["/api/accounts"],
  });

  const { data: transactions = [], isLoading: transactionsLoading } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions"],
  });

  const { data: budgets = [] } = useQuery<any[]>({
    queryKey: ["/api/budgets"],
  });

  const { data: reviewTransactions = [] } = useQuery<ReviewTransaction[]>({
    queryKey: ["/api/transactions/review"],
  });

  // Assets and Liabilities data
  const { data: netWorthData } = useQuery({
    queryKey: ["/api/net-worth"],
  });

  const { data: assets = [] } = useQuery({
    queryKey: ["/api/assets"],
  });

  const { data: liabilities = [] } = useQuery({
    queryKey: ["/api/liabilities"],
  });

  // Calculate net worth from accounts (banking net worth)
  const bankingNetWorth = accounts.reduce((total, account) => {
    const balance = parseFloat(account.currentBalance || '0');
    if (account.type === 'credit_card' || account.type === 'loan' || account.type === 'credit') {
      return total - Math.abs(balance);
    } else {
      return total + balance;
    }
  }, 0);

  // Total net worth including assets and liabilities
  const totalNetWorth = (netWorthData as any)?.totalNetWorth || 0;
  const totalAssets = ((netWorthData as any)?.totalAssets || 0) + Math.max(bankingNetWorth, 0);
  const totalLiabilities = ((netWorthData as any)?.totalLiabilities || 0) + Math.abs(Math.min(bankingNetWorth, 0));

  // Most recent month calculations (fall back to most recent month with data)
  const getRecentMonthTransactions = () => {
    if (transactions.length === 0) return [];
    
    // Try current month first
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    let monthTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.date);
      return transactionDate.getMonth() === currentMonth && transactionDate.getFullYear() === currentYear;
    });

    // If no current month data, find the most recent month with data
    if (monthTransactions.length === 0) {
      const sortedTransactions = [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      if (sortedTransactions.length > 0) {
        const mostRecentDate = new Date(sortedTransactions[0].date);
        const mostRecentMonth = mostRecentDate.getMonth();
        const mostRecentYear = mostRecentDate.getFullYear();
        
        monthTransactions = transactions.filter(t => {
          const transactionDate = new Date(t.date);
          return transactionDate.getMonth() === mostRecentMonth && transactionDate.getFullYear() === mostRecentYear;
        });
      }
    }
    
    return monthTransactions;
  };

  const currentMonthTransactions = getRecentMonthTransactions();

  const monthlyIncome = currentMonthTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + parseFloat(t.amount), 0);

  const monthlyExpenses = currentMonthTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + Math.abs(parseFloat(t.amount)), 0);

  const freeToSpend = monthlyIncome - monthlyExpenses;

  // Recent transactions (last 5)
  const recentTransactions = transactions
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  // Group accounts by type for overview
  const accountsByType = accounts.reduce((acc, account) => {
    const type = account.type;
    if (!acc[type]) {
      acc[type] = { count: 0, total: 0 };
    }
    acc[type].count++;
    const balance = parseFloat(account.currentBalance || '0');
    if (type === 'credit_card' || type === 'loan' || type === 'credit') {
      acc[type].total -= Math.abs(balance);
    } else {
      acc[type].total += balance;
    }
    return acc;
  }, {} as Record<string, { count: number; total: number }>);

  // Category spending for current month
  const categorySpending = currentMonthTransactions
    .filter(t => t.type === 'expense')
    .reduce((acc, transaction) => {
      const category = transaction.category || 'Other';
      acc[category] = (acc[category] || 0) + Math.abs(parseFloat(transaction.amount));
      return acc;
    }, {} as Record<string, number>);

  const categoryChartData = Object.entries(categorySpending)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const getAccountIcon = (account: Account) => {
    // For depository accounts, use subtype for icon selection
    if (account.type === 'depository') {
      switch (account.subtype) {
        case 'checking': return <Wallet className="h-4 w-4 text-green-600" />;
        case 'savings': return <Building2 className="h-4 w-4 text-blue-600" />;
        case 'cash management': return <Wallet className="h-4 w-4 text-green-600" />;
        default: return <Wallet className="h-4 w-4 text-gray-600" />;
      }
    }
    
    // For non-depository accounts, use type
    switch (account.type) {
      case 'checking': return <Wallet className="h-4 w-4 text-green-600" />;
      case 'savings': return <Building2 className="h-4 w-4 text-blue-600" />;
      case 'credit_card': return <CreditCard className="h-4 w-4 text-red-600" />;
      case 'investment': return <TrendingUp className="h-4 w-4 text-purple-600" />;
      default: return <Wallet className="h-4 w-4 text-gray-600" />;
    }
  };

  const getAssetIcon = (type: string) => {
    switch (type) {
      case 'real_estate': return <Home className="h-5 w-5 text-blue-600" />;
      case 'vehicle': return <Car className="h-5 w-5 text-green-600" />;
      case 'cash_equivalents': return <Coins className="h-5 w-5 text-yellow-600" />;
      case 'investment': return <Briefcase className="h-5 w-5 text-purple-600" />;
      case 'personal_property': return <Package className="h-5 w-5 text-gray-600" />;
      default: return <Wallet className="h-5 w-5 text-gray-600" />;
    }
  };

  const getLiabilityIcon = (type: string) => {
    switch (type) {
      case 'mortgage': return <Home className="h-5 w-5 text-red-600" />;
      case 'auto_loan': return <Car className="h-5 w-5 text-orange-600" />;
      case 'credit_card': return <CreditCard className="h-5 w-5 text-red-600" />;
      case 'personal_loan': return <Landmark className="h-5 w-5 text-red-500" />;
      case 'student_loan': return <Building2 className="h-5 w-5 text-blue-500" />;
      case 'other': return <AlertTriangle className="h-5 w-5 text-gray-600" />;
      default: return <CreditCard className="h-5 w-5 text-red-600" />;
    }
  };

  if (accountsLoading || transactionsLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 p-4 sm:p-6" role="status" aria-label="Loading financial overview">
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-slate-200 rounded-full"></div>
                    <div className="space-y-2">
                      <div className="h-5 w-32 bg-slate-200 rounded"></div>
                      <div className="h-3 w-24 bg-slate-100 rounded"></div>
                    </div>
                  </div>
                  <div className="h-8 w-20 bg-slate-200 rounded"></div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[...Array(3)].map((_, j) => (
                    <div key={j} className="h-20 bg-slate-100 rounded"></div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <span className="sr-only">Loading your financial overview...</span>
      </div>
    );
  }

  return (
    <div className={`max-w-4xl mx-auto ${className}`}>
      <div className="h-[calc(100vh-120px)] overflow-y-auto scroll-smooth">
        <div className="space-y-6 p-4 sm:p-6">
          {/* Transaction Review Tray - Only show if there are items to review */}
          {reviewTransactions.length > 0 && <TransactionReviewTray />}
          
          {/* 1. NET WORTH & BALANCES - Collapsible */}
          <Collapsible 
            open={expandedSections.netWorth} 
            onOpenChange={() => toggleSection('netWorth')}
          >
            <CollapsibleTrigger asChild>
              <Card className="cursor-pointer hover:shadow-lg transition-all duration-200 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2" 
                    role="button" 
                    tabIndex={0}
                    aria-expanded={expandedSections.netWorth}
                    aria-label="Toggle Net Worth & Balances section">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <DollarSign className="h-6 w-6 text-blue-600" aria-hidden="true" />
                      <div>
                        <CardTitle className="text-blue-900 dark:text-blue-100">Net Worth & Balances</CardTitle>
                        <p className="text-sm text-blue-700 dark:text-blue-300">Your complete financial position</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-3xl font-bold text-blue-900 dark:text-blue-100" 
                           aria-label={`Total net worth: ${showBalances ? formatCurrency(totalAssets - totalLiabilities) : 'Hidden'}`}>
                          {showBalances ? formatCurrency(totalAssets - totalLiabilities) : '••••••'}
                        </p>
                        <div className="flex items-center gap-2">
                          <p className="text-sm text-blue-700 dark:text-blue-300">
                            {accounts.length + (assets as any[]).length + (liabilities as any[]).length} items
                          </p>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowBalances(!showBalances);
                            }}
                            className="p-1 h-auto hover:bg-blue-200 dark:hover:bg-blue-800"
                            aria-label={showBalances ? "Hide balances" : "Show balances"}
                          >
                            {showBalances ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-200 dark:bg-blue-800">
                        {expandedSections.netWorth ? 
                          <ChevronUp className="h-5 w-5 text-blue-600" aria-hidden="true" /> : 
                          <ChevronDown className="h-5 w-5 text-blue-600" aria-hidden="true" />
                        }
                      </div>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            </CollapsibleTrigger>

            <CollapsibleContent className="space-y-4 mt-4" role="region" aria-label="Net Worth & Balances details">
              <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200">
                <CardContent className="pt-4">
              <div className="space-y-6">
                {/* Banking Accounts */}
                <div>
                  <h3 className="text-lg font-semibold mb-3 text-blue-800 flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Banking Accounts
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {accounts.map((account) => (
                      <Card key={account.id} className="bg-white/60 dark:bg-gray-800/60">
                        <CardContent className="p-3">
                          <div className="flex items-center gap-2 mb-2">
                            {getAccountIcon(account)}
                            <div className="flex flex-col">
                              <span className="font-medium text-sm">{account.name}</span>
                              {account.mask && (
                                <span className="text-xs text-gray-500">••••{account.mask}</span>
                              )}
                            </div>
                          </div>
                          <p className="text-lg font-bold">
                            {showBalances ? formatCurrency(parseFloat(account.currentBalance || '0')) : '••••'}
                          </p>
                          <p className="text-xs text-gray-500 capitalize">
                            {account.type === 'depository' ? (account.subtype || 'Bank Account') : account.type.replace('_', ' ')}
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                {/* Assets & Liabilities Summary */}
                {(totalAssets > 0 || totalLiabilities > 0) && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3 text-green-800 flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Assets & Liabilities Overview
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {/* Total Assets */}
                      <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-green-700">Total Assets</p>
                              <p className="text-xl font-bold text-green-900">
                                {showBalances ? formatCurrency(totalAssets) : '••••••'}
                              </p>
                              <p className="text-xs text-green-600 mt-1">
                                {(assets as any[]).length} items + accounts
                              </p>
                            </div>
                            <TrendingUp className="h-8 w-8 text-green-600" />
                          </div>
                        </CardContent>
                      </Card>

                      {/* Total Liabilities */}
                      <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-red-700">Total Liabilities</p>
                              <p className="text-xl font-bold text-red-900">
                                {showBalances ? formatCurrency(totalLiabilities) : '••••••'}
                              </p>
                              <p className="text-xs text-red-600 mt-1">
                                {(liabilities as any[]).length} debts + loans
                              </p>
                            </div>
                            <TrendingDown className="h-8 w-8 text-red-600" />
                          </div>
                        </CardContent>
                      </Card>

                      {/* Net Worth */}
                      <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-purple-700">Total Net Worth</p>
                              <p className="text-xl font-bold text-purple-900">
                                {showBalances ? formatCurrency(totalAssets - totalLiabilities) : '••••••'}
                              </p>
                              <p className="text-xs text-purple-600 mt-1">
                                Complete financial picture
                              </p>
                            </div>
                            <DollarSign className="h-8 w-8 text-purple-600" />
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Quick Preview of Assets and Liabilities */}
                    {((assets as any[]).length > 0 || (liabilities as any[]).length > 0) && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        {/* Assets Preview */}
                        {(assets as any[]).length > 0 && (
                          <Card>
                            <CardHeader className="pb-2">
                              <CardTitle className="text-sm flex items-center gap-2">
                                <Briefcase className="h-4 w-4 text-green-600" />
                                Recent Assets
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-0">
                              <div className="space-y-2">
                                {(assets as any[]).slice(0, 3).map((asset: any) => (
                                  <div key={asset.id} className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      {getAssetIcon(asset.type)}
                                      <span className="text-sm font-medium">{asset.name}</span>
                                    </div>
                                    <span className="text-sm font-bold text-green-600">
                                      {showBalances ? formatCurrency(parseFloat(asset.currentValue)) : '••••'}
                                    </span>
                                  </div>
                                ))}
                                {(assets as any[]).length > 3 && (
                                  <p className="text-xs text-gray-500 text-center pt-2">
                                    +{(assets as any[]).length - 3} more assets
                                  </p>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        )}

                        {/* Liabilities Preview */}
                        {(liabilities as any[]).length > 0 && (
                          <Card>
                            <CardHeader className="pb-2">
                              <CardTitle className="text-sm flex items-center gap-2">
                                <AlertTriangle className="h-4 w-4 text-red-600" />
                                Recent Liabilities
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-0">
                              <div className="space-y-2">
                                {(liabilities as any[]).slice(0, 3).map((liability: any) => (
                                  <div key={liability.id} className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      {getLiabilityIcon(liability.type)}
                                      <span className="text-sm font-medium">{liability.name}</span>
                                    </div>
                                    <span className="text-sm font-bold text-red-600">
                                      {showBalances ? formatCurrency(parseFloat(liability.currentBalance)) : '••••'}
                                    </span>
                                  </div>
                                ))}
                                {(liabilities as any[]).length > 3 && (
                                  <p className="text-xs text-gray-500 text-center pt-2">
                                    +{(liabilities as any[]).length - 3} more liabilities
                                  </p>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Call to Action for Assets & Liabilities */}
                {totalAssets === 0 && totalLiabilities === 0 && (
                  <Card className="bg-gradient-to-r from-emerald-50 to-blue-50 border-emerald-200">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                          <TrendingUp className="h-6 w-6 text-emerald-600" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-emerald-900">Track Your Complete Net Worth</h3>
                          <p className="text-sm text-emerald-700">Add your assets and liabilities to get a complete financial picture</p>
                        </div>
                        <Button 
                          size="sm" 
                          className="bg-emerald-600 hover:bg-emerald-700"
                          onClick={() => window.location.href = '/assets-liabilities'}
                        >
                          Get Started
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </CardContent>
          </Card>
        </CollapsibleContent>
      </Collapsible>

          {/* 2. MONTHLY CASH FLOW */}
          <Collapsible 
            open={expandedSections.cashFlow} 
            onOpenChange={() => toggleSection('cashFlow')}
          >
            <CollapsibleTrigger asChild>
              <Card className="cursor-pointer hover:shadow-lg transition-all duration-200 focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2" 
                    role="button" 
                    tabIndex={0}
                    aria-expanded={expandedSections.cashFlow}
                    aria-label="Toggle Monthly Cash Flow section">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Activity className="h-6 w-6 text-green-600" aria-hidden="true" />
                      <div>
                        <CardTitle>Monthly Cash Flow</CardTitle>
                        <p className="text-sm text-gray-600">Most recent month with data</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className={`text-xl sm:text-2xl font-bold ${freeToSpend >= 0 ? 'text-green-600' : 'text-red-600'}`}
                           aria-label={`Free to spend: ${showBalances ? formatCurrency(freeToSpend) : 'Hidden'}`}>
                          {showBalances ? formatCurrency(freeToSpend) : '••••••'}
                        </p>
                        <p className="text-sm text-gray-500">Available funds</p>
                      </div>
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-100 dark:bg-green-900">
                        {expandedSections.cashFlow ? 
                          <ChevronUp className="h-5 w-5 text-green-600" aria-hidden="true" /> : 
                          <ChevronDown className="h-5 w-5 text-green-600" aria-hidden="true" />
                        }
                      </div>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            </CollapsibleTrigger>

            <CollapsibleContent className="space-y-4 mt-4" role="region" aria-label="Monthly Cash Flow details">
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-green-700">Monthly Income</p>
                        <p className="text-xl font-bold text-green-900" 
                           aria-label={`Monthly income: ${showBalances ? formatCurrency(monthlyIncome) : 'Hidden'}`}>
                          {showBalances ? formatCurrency(monthlyIncome) : '••••••'}
                        </p>
                        <p className="text-xs text-green-600 mt-1">Recent month</p>
                      </div>
                      <ArrowUpRight className="h-6 w-6 text-green-600" aria-hidden="true" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200 hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-red-700">Monthly Expenses</p>
                        <p className="text-xl font-bold text-red-900"
                           aria-label={`Monthly expenses: ${showBalances ? formatCurrency(monthlyExpenses) : 'Hidden'}`}>
                          {showBalances ? formatCurrency(monthlyExpenses) : '••••••'}
                        </p>
                        <p className="text-xs text-red-600 mt-1">Recent month</p>
                      </div>
                      <ArrowDownRight className="h-6 w-6 text-red-600" aria-hidden="true" />
                    </div>
                  </CardContent>
                </Card>

                {/* Free to Spend Card for larger screens */}
                <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 hover:shadow-md transition-shadow hidden xl:block">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-purple-700">Free to Spend</p>
                        <p className={`text-xl font-bold ${freeToSpend >= 0 ? 'text-purple-900' : 'text-red-900'}`}
                           aria-label={`Free to spend: ${showBalances ? formatCurrency(freeToSpend) : 'Hidden'}`}>
                          {showBalances ? formatCurrency(freeToSpend) : '••••••'}
                        </p>
                        <p className="text-xs text-purple-600 mt-1">Remaining budget</p>
                      </div>
                      <DollarSign className="h-6 w-6 text-purple-600" aria-hidden="true" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {categoryChartData.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Spending by Category</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {categoryChartData.slice(0, 5).map((category, index) => (
                        <div key={category.name} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: COLORS[index % COLORS.length] }}
                            />
                            <span className="text-sm font-medium">{category.name}</span>
                          </div>
                          <span className="text-sm font-bold">
                            {showBalances ? formatCurrency(category.value) : '••••'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </CollapsibleContent>
          </Collapsible>

          {/* 3. SAVINGS OPPORTUNITIES */}
          <Collapsible 
            open={expandedSections.savings} 
            onOpenChange={() => toggleSection('savings')}
          >
            <CollapsibleTrigger asChild>
              <Card className="cursor-pointer hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Zap className="h-6 w-6 text-yellow-600" />
                      <div>
                        <CardTitle>Savings Opportunities</CardTitle>
                        <p className="text-sm text-gray-600">Ways to optimize your finances</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="bg-yellow-100 text-yellow-700">
                        Opportunities
                      </Badge>
                      {expandedSections.savings ? 
                        <ChevronUp className="h-5 w-5" /> : 
                        <ChevronDown className="h-5 w-5" />
                      }
                    </div>
                  </div>
                </CardHeader>
              </Card>
            </CollapsibleTrigger>

            <CollapsibleContent className="space-y-4 mt-4">
              <div className="grid grid-cols-1 gap-4">
                {/* High Spending Categories */}
                {categoryChartData.length > 0 && (
                  <Card className="border-yellow-200 bg-yellow-50/50">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-yellow-100 rounded-lg">
                          <TrendingDown className="h-4 w-4 text-yellow-600" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 mb-2">Top Spending Category</h3>
                          <p className="text-sm text-gray-600 mb-3">
                            Your highest expense category this month is <span className="font-medium text-gray-900">{categoryChartData[0]?.name}</span> 
                            {showBalances && ` at ${formatCurrency(categoryChartData[0]?.value || 0)}`}.
                          </p>
                          <div className="flex items-center gap-2 text-xs text-yellow-700 bg-yellow-100 px-2 py-1 rounded">
                            <Percent className="h-3 w-3" />
                            <span>Consider setting a budget for this category</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Account Optimization */}
                {accounts.some(acc => acc.type === 'checking' && parseFloat(acc.currentBalance || '0') > 10000) && (
                  <Card className="border-green-200 bg-green-50/50">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-green-100 rounded-lg">
                          <TrendingUp className="h-4 w-4 text-green-600" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 mb-2">High Checking Balance</h3>
                          <p className="text-sm text-gray-600 mb-3">
                            You have significant funds in checking accounts. Consider moving excess to high-yield savings.
                          </p>
                          <div className="flex items-center gap-2 text-xs text-green-700 bg-green-100 px-2 py-1 rounded">
                            <Building2 className="h-3 w-3" />
                            <span>Potential to earn more interest</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Monthly Cash Flow Insight */}
                {freeToSpend > 1000 && (
                  <Card className="border-blue-200 bg-blue-50/50">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Activity className="h-4 w-4 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 mb-2">Healthy Cash Flow</h3>
                          <p className="text-sm text-gray-600 mb-3">
                            {showBalances 
                              ? `You have ${formatCurrency(freeToSpend)} left after expenses this month.`
                              : 'You have positive cash flow this month.'
                            } Consider allocating some to savings or investments.
                          </p>
                          <div className="flex items-center gap-2 text-xs text-blue-700 bg-blue-100 px-2 py-1 rounded">
                            <Target className="h-3 w-3" />
                            <span>Great opportunity to build wealth</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Budget Recommendation */}
                {budgets.length === 0 && transactions.length > 10 && (
                  <Card className="border-purple-200 bg-purple-50/50">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-purple-100 rounded-lg">
                          <Target className="h-4 w-4 text-purple-600" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 mb-2">Create Your First Budget</h3>
                          <p className="text-sm text-gray-600 mb-3">
                            With {transactions.length} transactions, you have enough data to create meaningful budgets for better financial control.
                          </p>
                          <Button 
                            size="sm" 
                            onClick={() => window.location.href = '/budgets'}
                            className="bg-purple-600 hover:bg-purple-700 text-white"
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Set Up Budgets
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Emergency Fund Check */}
                {accounts.some(acc => acc.type === 'savings') && (
                  <Card className="border-indigo-200 bg-indigo-50/50">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-indigo-100 rounded-lg">
                          <Building2 className="h-4 w-4 text-indigo-600" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 mb-2">Emergency Fund Status</h3>
                          <p className="text-sm text-gray-600 mb-3">
                            Great job having savings accounts! Aim for 3-6 months of expenses in emergency savings.
                          </p>
                          <div className="flex items-center gap-2 text-xs text-indigo-700 bg-indigo-100 px-2 py-1 rounded">
                            <Calendar className="h-3 w-3" />
                            <span>Financial security foundation</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* APY Offers - High-Yield Savings Opportunities */}
                <Card className="border-emerald-200 bg-emerald-50/50">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-emerald-100 rounded-lg">
                        <Percent className="h-4 w-4 text-emerald-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-2">High-Yield Savings APY</h3>
                        <p className="text-sm text-gray-600 mb-3">
                          Current top savings rates are around 4.5-5.2% APY. Compare your current rates to maximize earnings.
                        </p>
                        <div className="space-y-2 mb-3">
                          <div className="flex items-center justify-between text-xs bg-white/60 px-2 py-1 rounded">
                            <span>Marcus by Goldman Sachs</span>
                            <span className="font-semibold text-emerald-700">5.15% APY</span>
                          </div>
                          <div className="flex items-center justify-between text-xs bg-white/60 px-2 py-1 rounded">
                            <span>Ally Online Savings</span>
                            <span className="font-semibold text-emerald-700">4.85% APY</span>
                          </div>
                          <div className="flex items-center justify-between text-xs bg-white/60 px-2 py-1 rounded">
                            <span>Capital One 360 Performance</span>
                            <span className="font-semibold text-emerald-700">4.75% APY</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-100 px-2 py-1 rounded">
                          <TrendingUp className="h-3 w-3" />
                          <span>Potential extra earnings: ${Math.round((accounts.reduce((sum, acc) => sum + parseFloat(acc.currentBalance || '0'), 0) * 0.04) / 12)}/month</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Bills & Subscriptions Analysis */}
                {transactions.some(t => t.description?.toLowerCase().includes('subscription') || 
                                      t.description?.toLowerCase().includes('monthly') ||
                                      t.description?.toLowerCase().includes('netflix') ||
                                      t.description?.toLowerCase().includes('spotify') ||
                                      t.description?.toLowerCase().includes('amazon')) && (
                  <Card className="border-orange-200 bg-orange-50/50">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-orange-100 rounded-lg">
                          <Clock className="h-4 w-4 text-orange-600" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 mb-2">Subscription & Bills Review</h3>
                          <p className="text-sm text-gray-600 mb-3">
                            Found recurring charges that might be subscriptions. Review these for potential savings:
                          </p>
                          <div className="space-y-2 mb-3">
                            {transactions
                              .filter(t => t.description?.toLowerCase().includes('subscription') || 
                                          t.description?.toLowerCase().includes('netflix') ||
                                          t.description?.toLowerCase().includes('spotify') ||
                                          t.description?.toLowerCase().includes('amazon'))
                              .slice(0, 3)
                              .map((transaction, index) => (
                                <div key={index} className="flex items-center justify-between text-xs bg-white/60 px-2 py-1 rounded">
                                  <span className="truncate">{transaction.description}</span>
                                  <span className="font-semibold text-orange-700 ml-2">
                                    {formatCurrency(Math.abs(parseFloat(transaction.amount)))}
                                  </span>
                                </div>
                              ))
                            }
                          </div>
                          <div className="flex items-center gap-2 text-xs text-orange-700 bg-orange-100 px-2 py-1 rounded">
                            <Target className="h-3 w-3" />
                            <span>Cancel unused services to save money</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Bill Negotiation Opportunities */}
                {transactions.some(t => t.description?.toLowerCase().includes('electric') || 
                                      t.description?.toLowerCase().includes('phone') ||
                                      t.description?.toLowerCase().includes('internet') ||
                                      t.description?.toLowerCase().includes('insurance')) && (
                  <Card className="border-cyan-200 bg-cyan-50/50">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-cyan-100 rounded-lg">
                          <Activity className="h-4 w-4 text-cyan-600" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 mb-2">Bill Negotiation Opportunities</h3>
                          <p className="text-sm text-gray-600 mb-3">
                            These recurring bills might have room for negotiation or better rates:
                          </p>
                          <div className="space-y-2 mb-3">
                            <div className="flex items-center gap-2 text-xs text-cyan-700 bg-white/60 px-2 py-1 rounded">
                              <span>📱 Phone/Internet Bills</span>
                              <span className="ml-auto">Call for promotional rates</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-cyan-700 bg-white/60 px-2 py-1 rounded">
                              <span>🏠 Insurance Policies</span>
                              <span className="ml-auto">Shop for better quotes</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-cyan-700 bg-white/60 px-2 py-1 rounded">
                              <span>⚡ Utility Bills</span>
                              <span className="ml-auto">Check energy plans</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-cyan-700 bg-cyan-100 px-2 py-1 rounded">
                            <ArrowDownRight className="h-3 w-3" />
                            <span>Potential savings: 10-30% on negotiated bills</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* 4. RECENT TRANSACTIONS */}
          <Collapsible 
            open={expandedSections.transactions} 
            onOpenChange={() => toggleSection('transactions')}
          >
            <CollapsibleTrigger asChild>
              <Card className="cursor-pointer hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Clock className="h-6 w-6 text-purple-600" />
                      <div>
                        <CardTitle>Recent Transactions</CardTitle>
                        <p className="text-sm text-gray-600">Your latest financial activity</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{recentTransactions.length} recent</Badge>
                      {expandedSections.transactions ? 
                        <ChevronUp className="h-5 w-5" /> : 
                        <ChevronDown className="h-5 w-5" />
                      }
                    </div>
                  </div>
                </CardHeader>
              </Card>
            </CollapsibleTrigger>

            <CollapsibleContent className="space-y-4 mt-4">
              <div className="space-y-3">
                {recentTransactions.map((transaction) => (
                  <Card key={transaction.id} className="bg-white/50">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{transaction.description}</p>
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <span>{transaction.category}</span>
                            <span>•</span>
                            <span>{formatDate(transaction.date)}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`font-bold ${
                            transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {transaction.type === 'income' ? '+' : '-'}{formatCurrency(Math.abs(parseFloat(transaction.amount)))}
                          </p>
                          <p className="text-xs text-gray-500">{transaction.source || 'manual'}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              
              <Button variant="outline" className="w-full" onClick={() => window.location.href = '/transactions'}>
                See All {transactions.length} Transactions
                <ExternalLink className="h-4 w-4 ml-2" />
              </Button>
            </CollapsibleContent>
          </Collapsible>

          {/* 5. BUDGET PROGRESS */}
          <Collapsible 
            open={expandedSections.budget} 
            onOpenChange={() => toggleSection('budget')}
          >
            <CollapsibleTrigger asChild>
              <Card className="cursor-pointer hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Target className="h-6 w-6 text-indigo-600" />
                      <div>
                        <CardTitle>Budget Progress</CardTitle>
                        <p className="text-sm text-gray-600">Track your spending against budgets</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{budgets.length || 0} budgets</Badge>
                      {expandedSections.budget ? 
                        <ChevronUp className="h-5 w-5" /> : 
                        <ChevronDown className="h-5 w-5" />
                      }
                    </div>
                  </div>
                </CardHeader>
              </Card>
            </CollapsibleTrigger>

            <CollapsibleContent className="space-y-4 mt-4">
              {budgets.length === 0 ? (
                <Card className="text-center py-8">
                  <CardContent>
                    <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Budgets Set</h3>
                    <p className="text-gray-500 mb-4">
                      Create budgets to track your spending and reach financial goals.
                    </p>
                    <Button onClick={() => window.location.href = '/budgets'}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Budget
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <Button variant="outline" className="w-full" onClick={() => window.location.href = '/budgets'}>
                  View Budget Details
                  <ExternalLink className="h-4 w-4 ml-2" />
                </Button>
              )}
            </CollapsibleContent>
          </Collapsible>
        </div>
      </div>
    </div>
  );
}