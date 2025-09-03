import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  CreditCard, 
  Calendar, 
  DollarSign, 
  TrendingUp, 
  CheckCircle, 
  AlertTriangle,
  Search,
  Filter,
  Plus,
  Edit3,
  Trash2
} from "lucide-react";
import TransactionsTable from "@/components/transactions-table";
import { formatCurrency, formatDate, formatDateOnly } from "@/lib/financial-utils";
import { getClearbitLogoUrl, getMerchantInitials } from "@/lib/merchant-logo";

interface Bill {
  id: string;
  name: string;
  amount: number;
  dueDate: string;
  category: string;
  payee: string;
  isEssential: boolean;
  isVariable: boolean;
  status: 'pending' | 'paid' | 'overdue';
  autoDetected?: boolean;
  merchantLogo?: string;
}

interface Subscription {
  id: string;
  name: string;
  amount: number;
  frequency: 'monthly' | 'yearly' | 'quarterly' | 'weekly';
  category: string;
  nextRenewal: string;
  isOptional: boolean;
  lastUsed?: string;
  status: 'active' | 'cancelled' | 'paused';
  autoDetected?: boolean;
  merchantLogo?: string;
}

export default function BillsPage() {
  const [activeTab, setActiveTab] = useState("overview");
  const [search, setSearch] = useState("");

  // Helper function to get frequency color
  const getFrequencyColor = (frequency: string) => {
    switch (frequency.toLowerCase()) {
      case 'monthly': return 'bg-blue-100 text-blue-800';
      case 'yearly': 
      case 'annual': return 'bg-purple-100 text-purple-800';
      case 'weekly': return 'bg-green-100 text-green-800';
      case 'quarterly': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const queryClient = useQueryClient();

  const { data: transactions = [], isLoading: transactionsLoading } = useQuery({
    queryKey: ["/api/transactions"],
  });

  const { data: budgets = [] } = useQuery({
    queryKey: ["/api/budgets"],
  });

  // Get real recurring transactions data
  const { data: recurringTransactions = [] } = useQuery({
    queryKey: ["/api/recurring-transactions"],
  });

  const { data: manualSubscriptions = [] } = useQuery({
    queryKey: ["/api/manual-subscriptions"],
  });

  // Auto-detect bills and subscriptions from transactions
  const detectBillsAndSubscriptions = () => {
    if (!Array.isArray(transactions)) return { bills: [], subscriptions: [] };

    // Look for recurring/bill-like transactions across all categories
    const subscriptionTransactions = transactions.filter((tx: any) => 
      tx.category === 'Subscriptions' || 
      tx.category === 'Utilities' ||
      tx.category === 'Insurance' ||
      tx.category === 'Rent' ||
      // Add common subscription patterns
      (tx.description && (
        tx.description.toLowerCase().includes('netflix') ||
        tx.description.toLowerCase().includes('spotify') ||
        tx.description.toLowerCase().includes('subscription') ||
        tx.description.toLowerCase().includes('monthly') ||
        tx.description.toLowerCase().includes('autopay') ||
        tx.description.toLowerCase().includes('premium') ||
        tx.description.toLowerCase().includes('hulu') ||
        tx.description.toLowerCase().includes('amazon prime') ||
        tx.description.toLowerCase().includes('youtube') ||
        tx.description.toLowerCase().includes('disney') ||
        tx.description.toLowerCase().includes('apple') ||
        tx.description.toLowerCase().includes('toyota') && tx.description.toLowerCase().includes('insurance')
      ))
    );

    // Group by similar descriptions to find recurring payments
    const groupedTransactions: { [key: string]: any[] } = {};
    
    subscriptionTransactions.forEach((tx: any) => {
      // Create a normalized description for grouping
      const normalizedDesc = tx.description
        .replace(/\d{4}-\d{2}-\d{2}|\d{2}\/\d{2}|\*+|\d+/g, '') // Remove dates and card numbers
        .replace(/\s+/g, ' ')
        .trim()
        .toLowerCase();
      
      if (!groupedTransactions[normalizedDesc]) {
        groupedTransactions[normalizedDesc] = [];
      }
      groupedTransactions[normalizedDesc].push(tx);
    });

    // Find recurring payments (2+ occurrences)
    const recurringPayments = Object.entries(groupedTransactions)
      .filter(([_, txs]) => txs.length >= 2)
      .map(([normalizedDesc, txs]) => {
        const latestTx = txs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
        const avgAmount = txs.reduce((sum, tx) => sum + Math.abs(parseFloat(tx.amount)), 0) / txs.length;
        
        // Estimate frequency based on transaction dates
        const dates = txs.map(tx => new Date(tx.date)).sort((a, b) => a.getTime() - b.getTime());
        const daysBetween = dates.length > 1 
          ? (dates[dates.length - 1].getTime() - dates[0].getTime()) / (1000 * 60 * 60 * 24) / (dates.length - 1)
          : 30;
        
        let frequency: 'monthly' | 'yearly' | 'quarterly' = 'monthly';
        if (daysBetween > 300) frequency = 'yearly';
        else if (daysBetween > 80) frequency = 'quarterly';

        // Calculate next due date
        const lastDate = new Date(latestTx.date);
        const nextDue = new Date(lastDate);
        if (frequency === 'monthly') nextDue.setMonth(nextDue.getMonth() + 1);
        else if (frequency === 'quarterly') nextDue.setMonth(nextDue.getMonth() + 3);
        else nextDue.setFullYear(nextDue.getFullYear() + 1);

        // Determine if it's a bill or subscription based on keywords and category
        const isBill = latestTx.category === 'Utilities' || 
                      latestTx.category === 'Insurance' || 
                      latestTx.category === 'Rent' ||
                      normalizedDesc.includes('insurance') ||
                      normalizedDesc.includes('utility') ||
                      normalizedDesc.includes('rent');

        if (isBill) {
          return {
            type: 'bill',
            data: {
              id: `bill-${normalizedDesc.replace(/\s/g, '-')}`,
              name: latestTx.description,
              amount: avgAmount,
              dueDate: nextDue.toISOString(),
              category: latestTx.category,
              payee: latestTx.merchant || latestTx.description,
              isEssential: true,
              isVariable: latestTx.category === 'Utilities',
              status: 'paid' as const,
              autoDetected: true
            }
          };
        } else {
          return {
            type: 'subscription',
            data: {
              id: `sub-${normalizedDesc.replace(/\s/g, '-')}`,
              name: latestTx.description,
              amount: avgAmount,
              frequency,
              category: latestTx.category,
              nextRenewal: nextDue.toISOString(),
              isOptional: true,
              status: 'active' as const,
              autoDetected: true
            }
          };
        }
      });

    const bills = recurringPayments.filter(item => item.type === 'bill').map(item => item.data);
    const subscriptions = recurringPayments.filter(item => item.type === 'subscription').map(item => item.data);

    return { bills, subscriptions };
  };

  const { bills: detectedBills, subscriptions: detectedSubscriptions } = detectBillsAndSubscriptions();

  // Combine real recurring data with detected data
  const allSubscriptions = [
    ...detectedSubscriptions,
    ...(Array.isArray(manualSubscriptions) ? manualSubscriptions : []).map((sub: any) => ({
      id: sub.id,
      name: sub.name,
      amount: parseFloat(sub.amount || 0),
      frequency: sub.frequency,
      category: sub.category,
      nextRenewal: sub.endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now if no end date
      isOptional: true,
      status: 'active' as const,
      autoDetected: false,
      merchantLogo: sub.merchantLogo
    })),
    ...(Array.isArray(recurringTransactions) ? recurringTransactions : []).filter((rt: any) => rt.category !== 'Utilities' && rt.category !== 'Insurance').map((rt: any) => ({
      id: rt.id,
      name: rt.name,
      amount: parseFloat(rt.amount || 0),
      frequency: rt.frequency,
      category: rt.category,
      nextRenewal: rt.nextDueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      isOptional: true,
      status: 'active' as const,
      autoDetected: rt.autoDetected || false,
      merchantLogo: rt.merchantLogo
    }))
  ];

  const allBills = [
    ...detectedBills,
    ...(Array.isArray(recurringTransactions) ? recurringTransactions : []).filter((rt: any) => rt.category === 'Utilities' || rt.category === 'Insurance').map((rt: any) => ({
      id: rt.id,
      name: rt.name,
      amount: parseFloat(rt.amount || 0),
      dueDate: rt.nextDueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      category: rt.category,
      payee: rt.merchant || rt.name,
      isEssential: true,
      isVariable: false,
      status: 'paid' as const,
      autoDetected: rt.autoDetected || false,
      merchantLogo: rt.merchantLogo
    }))
  ];

  // Get all bill-related transactions for the transactions tab - EXCLUDE INCOME
  const subscriptionTransactions = Array.isArray(transactions) ? transactions.filter((tx: any) => 
    // Only include expense transactions (exclude income and transfers)
    tx.type === 'expense' &&
    (tx.category === 'Subscriptions' || 
    tx.category === 'Utilities' ||
    tx.category === 'Insurance' ||
    tx.category === 'Rent' ||
    // Include transactions that match subscription patterns
    (tx.description && (
      tx.description.toLowerCase().includes('netflix') ||
      tx.description.toLowerCase().includes('spotify') ||
      tx.description.toLowerCase().includes('subscription') ||
      tx.description.toLowerCase().includes('monthly') ||
      tx.description.toLowerCase().includes('autopay') ||
      tx.description.toLowerCase().includes('premium') ||
      tx.description.toLowerCase().includes('hulu') ||
      tx.description.toLowerCase().includes('amazon prime') ||
      tx.description.toLowerCase().includes('youtube') ||
      tx.description.toLowerCase().includes('disney') ||
      tx.description.toLowerCase().includes('apple') ||
      (tx.description.toLowerCase().includes('toyota') && tx.description.toLowerCase().includes('insurance'))
    )))
  ).sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()) : [];



  const filteredSubscriptions = allSubscriptions.filter(sub =>
    search === "" || 
    sub.name.toLowerCase().includes(search.toLowerCase()) ||
    sub.category.toLowerCase().includes(search.toLowerCase())
  );

  // Calculate subscription metrics using filtered data to match display
  const monthlyTotal = filteredSubscriptions.reduce((sum, sub) => {
    if (sub.frequency === 'monthly') return sum + sub.amount;
    if (sub.frequency === 'quarterly') return sum + (sub.amount / 3);
    if (sub.frequency === 'yearly') return sum + (sub.amount / 12);
    if (sub.frequency === 'weekly') return sum + (sub.amount * 4.33); // average weeks per month
    return sum;
  }, 0);

  // Calculate bill metrics using real data
  const totalBillsAmount = allBills.reduce((sum, bill) => sum + bill.amount, 0);

  const annualTotal = monthlyTotal * 12;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'paused': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (transactionsLoading) {
    return (
      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 pt-16 md:pt-6">
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-32 bg-slate-100 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 pt-16 md:pt-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Bills & Subscriptions</h1>
        <p className="text-gray-600">
          Track and manage your recurring payments and subscriptions
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <CreditCard className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Active Bills</p>
                <p className="text-2xl font-bold text-gray-900">
                  {filteredSubscriptions.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Monthly Total</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(monthlyTotal)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Annual Total</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(annualTotal)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Calendar className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Due This Month</p>
                <p className="text-2xl font-bold text-gray-900">
                  {filteredSubscriptions.filter(sub => {
                    const dueDate = new Date(sub.nextRenewal);
                    const now = new Date();
                    return dueDate.getMonth() === now.getMonth() && dueDate.getFullYear() === now.getFullYear();
                  }).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="transactions">All Transactions</TabsTrigger>
          <TabsTrigger value="manage">Manage Bills</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Detected Subscriptions & Bills</CardTitle>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Input
                      placeholder="Search bills..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-10 w-64"
                    />
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {filteredSubscriptions.length === 0 ? (
                <div className="text-center py-12">
                  <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Bills Detected</h3>
                  <p className="text-gray-500">
                    Upload transaction data or connect your bank account to automatically detect recurring payments.
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto" data-testid="content-subscriptions-overview">
                  {filteredSubscriptions.map((subscription) => (
                    <div key={subscription.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center overflow-hidden">
                            {('merchantLogo' in subscription && subscription.merchantLogo) || getClearbitLogoUrl(subscription.name) ? (
                              <img 
                                src={('merchantLogo' in subscription && subscription.merchantLogo) || getClearbitLogoUrl(subscription.name)} 
                                alt={`${subscription.name} logo`}
                                className="w-8 h-8 object-contain"
                                onError={(e) => {
                                  // Fallback to initials on error
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                  const fallback = target.nextElementSibling as HTMLElement;
                                  if (fallback) {
                                    fallback.style.display = 'flex';
                                    fallback.textContent = getMerchantInitials(subscription.name);
                                  }
                                }}
                              />
                            ) : null}
                            <div className={`text-xs font-bold text-white ${('merchantLogo' in subscription && subscription.merchantLogo) || getClearbitLogoUrl(subscription.name) ? 'hidden' : 'flex'} items-center justify-center w-full h-full`}>
                              {getMerchantInitials(subscription.name)}
                            </div>
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900">{subscription.name}</h4>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="secondary" className={getStatusColor(subscription.status)}>
                                {subscription.status}
                              </Badge>
                              <Badge variant="secondary" className={getFrequencyColor(subscription.frequency || 'monthly')}>
                                {subscription.frequency || 'monthly'}
                              </Badge>
                              <Badge variant="secondary" className="bg-gray-100 text-gray-700">
                                {subscription.category}
                              </Badge>
                              {subscription.autoDetected && (
                                <Badge variant="secondary" className="bg-green-100 text-green-700">
                                  Auto-detected
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-semibold text-gray-900">
                            {formatCurrency(subscription.amount)}
                          </p>
                          <p className="text-sm text-gray-500">
                            Next: {formatDate(new Date(subscription.nextRenewal))}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Bills & Subscription Transactions</CardTitle>
              <p className="text-sm text-gray-600">
                Showing transactions from Subscriptions, Utilities, Insurance, and Rent categories
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {subscriptionTransactions.length === 0 ? (
                  <div className="text-center py-12">
                    <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Bill Transactions Found</h3>
                    <p className="text-gray-500">
                      No transactions found in bill-related categories (Subscriptions, Utilities, Insurance, Rent).
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="border-b border-gray-200">
                        <tr>
                          <th className="text-left py-3 px-4 font-medium text-gray-900">Date</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-900">Description</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-900">Category</th>
                          <th className="text-right py-3 px-4 font-medium text-gray-900">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {subscriptionTransactions.map((transaction: any) => (
                          <tr key={transaction.id} className="hover:bg-gray-50">
                            <td className="py-3 px-4 text-sm text-gray-600">
                              {formatDate(new Date(transaction.date))}
                            </td>
                            <td className="py-3 px-4">
                              <div>
                                <p className="font-medium text-gray-900">{transaction.description}</p>
                                {transaction.merchant && (
                                  <p className="text-sm text-gray-500">{transaction.merchant}</p>
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                                {transaction.category}
                              </Badge>
                            </td>
                            <td className="py-3 px-4 text-right font-medium">
                              <span className={transaction.type === 'expense' ? 'text-red-600' : 'text-green-600'}>
                                {transaction.type === 'expense' ? '-' : '+'}
                                {formatCurrency(Math.abs(parseFloat(transaction.amount)))}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="manage" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Manage Your Bills & Subscriptions</CardTitle>
                <Button 
                  className="bg-blue-600 hover:bg-blue-700"
                  onClick={() => window.alert('Add New Bill feature coming soon! You can currently manage bills through the Transactions page.')}
                  data-testid="button-add-new-bill"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add New Bill
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {detectedSubscriptions.length === 0 ? (
                  <div className="text-center py-12">
                    <Plus className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Bills to Manage</h3>
                    <p className="text-gray-500">
                      Add your first bill or connect your bank account to automatically detect recurring payments.
                    </p>
                    <Button 
                      className="mt-4"
                      onClick={() => window.alert('Add Bill feature coming soon! You can currently manage bills through the Transactions page.')}
                      data-testid="button-add-first-bill"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Your First Bill
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-96 overflow-y-auto" data-testid="content-bills-manage">
                    {detectedSubscriptions.map((subscription) => (
                      <div key={subscription.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center overflow-hidden">
                              <div className="text-xs font-bold text-white flex items-center justify-center w-full h-full">
                                {subscription.name.substring(0, 2).toUpperCase()}
                              </div>
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-900">{subscription.name}</h4>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="secondary" className={getFrequencyColor(subscription.frequency || 'monthly')}>
                                  {subscription.frequency || 'monthly'}
                                </Badge>
                                <Badge variant="secondary" className="bg-gray-100 text-gray-700">
                                  {subscription.category}
                                </Badge>
                                <span className="text-sm text-gray-500">
                                  Next: {formatDate(new Date(subscription.nextRenewal || ''))}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="text-right">
                              <p className="font-semibold text-gray-900">
                                {formatCurrency(subscription.amount)}
                              </p>
                              <p className="text-sm text-gray-500">per {subscription.frequency?.replace('ly', '') || 'month'}</p>
                            </div>
                            <Button variant="outline" size="sm">
                              <Edit3 className="h-4 w-4 mr-1" />
                              Edit
                            </Button>
                            <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300">
                              <Trash2 className="h-4 w-4 mr-1" />
                              Delete
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}