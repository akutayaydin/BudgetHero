import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { 
  CreditCard, 
  Calendar, 
  DollarSign, 
  TrendingUp,
  Search,
  Plus,
  Edit3,
  Trash2
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/financial-utils";

export default function BillsPage() {
  const [activeTab, setActiveTab] = useState("overview");
  const [search, setSearch] = useState("");

  const { data: transactions = [], isLoading: transactionsLoading } = useQuery({
    queryKey: ["/api/transactions"],
  });

  // Get all bill and subscription related transactions
  const billTransactions = Array.isArray(transactions) ? transactions.filter((tx: any) => 
    tx.category === 'Subscriptions' || 
    tx.category === 'Utilities' ||
    tx.category === 'Insurance' ||
    tx.category === 'Rent' ||
    // Include transactions that match bill/subscription patterns
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
    ))
  ).sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()) : [];

  // Calculate totals
  const monthlyTotal = billTransactions.reduce((sum, tx: any) => sum + Math.abs(parseFloat(tx.amount)), 0);
  const annualTotal = monthlyTotal * 12;

  if (transactionsLoading) {
    return (
      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 pt-16 md:pt-6">
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-32 bg-muted rounded"></div>
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
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Bills & Subscriptions</h1>
        <p className="text-muted-foreground">
          Track and manage your recurring payments and subscriptions
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                <CreditCard className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Bills</p>
                <p className="text-2xl font-bold text-foreground">
                  {billTransactions.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Monthly Total</p>
                <p className="text-2xl font-bold text-foreground">
                  {formatCurrency(monthlyTotal)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Annual Total</p>
                <p className="text-2xl font-bold text-foreground">
                  {formatCurrency(annualTotal)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center">
                <Calendar className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Categories</p>
                <p className="text-2xl font-bold text-foreground">
                  {new Set(billTransactions.map((tx: any) => tx.category)).size}
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
              <CardTitle>Bills & Subscriptions Overview</CardTitle>
            </CardHeader>
            <CardContent>
              {billTransactions.length === 0 ? (
                <div className="text-center py-12">
                  <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">No Bills Found</h3>
                  <p className="text-muted-foreground">
                    No bill or subscription transactions found. Connect your bank account or add transactions manually.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-muted-foreground">
                    Found {billTransactions.length} bill and subscription related transactions across your account.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Array.from(new Set(billTransactions.map((tx: any) => tx.category))).map((category) => {
                      const categoryTransactions = billTransactions.filter((tx: any) => tx.category === category);
                      const categoryTotal = categoryTransactions.reduce((sum, tx: any) => sum + Math.abs(parseFloat(tx.amount)), 0);
                      
                      return (
                        <div key={category} className="p-4 border rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium text-foreground">{category}</h4>
                            <Badge variant="secondary">{categoryTransactions.length} items</Badge>
                          </div>
                          <p className="text-2xl font-bold text-foreground">{formatCurrency(categoryTotal)}</p>
                          <p className="text-sm text-muted-foreground">Total spent</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Bills & Subscription Transactions</CardTitle>
              <p className="text-sm text-muted-foreground">
                Showing transactions from Subscriptions, Utilities, Insurance, and Rent categories
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {billTransactions.length === 0 ? (
                  <div className="text-center py-12">
                    <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-foreground mb-2">No Bill Transactions Found</h3>
                    <p className="text-muted-foreground">
                      No transactions found in bill-related categories (Subscriptions, Utilities, Insurance, Rent).
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="border-b border-border">
                        <tr>
                          <th className="text-left py-3 px-4 font-medium text-foreground">Date</th>
                          <th className="text-left py-3 px-4 font-medium text-foreground">Description</th>
                          <th className="text-left py-3 px-4 font-medium text-foreground">Category</th>
                          <th className="text-right py-3 px-4 font-medium text-foreground">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {billTransactions.map((transaction: any) => (
                          <tr key={transaction.id} className="hover:bg-muted/50">
                            <td className="py-3 px-4 text-sm text-muted-foreground">
                              {formatDate(new Date(transaction.date))}
                            </td>
                            <td className="py-3 px-4">
                              <div>
                                <p className="font-medium text-foreground">{transaction.description}</p>
                                {transaction.merchant && (
                                  <p className="text-sm text-muted-foreground">{transaction.merchant}</p>
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <Badge variant="secondary" className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
                                {transaction.category}
                              </Badge>
                            </td>
                            <td className="py-3 px-4 text-right font-medium">
                              <span className={transaction.type === 'expense' ? 'text-financial-expense' : 'text-financial-income'}>
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
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Add New Bill
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {billTransactions.length === 0 ? (
                  <div className="text-center py-12">
                    <Plus className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-foreground mb-2">No Bills to Manage</h3>
                    <p className="text-muted-foreground">
                      Add your first bill or connect your bank account to automatically detect recurring payments.
                    </p>
                    <Button className="mt-4">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Your First Bill
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {billTransactions.slice(0, 10).map((transaction: any) => (
                      <div key={transaction.id} className="border border-border rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                              <CreditCard className="h-5 w-5 text-white" />
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-900">{transaction.description}</h4>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                                  {transaction.category}
                                </Badge>
                                <span className="text-sm text-gray-500">
                                  Last: {formatDate(new Date(transaction.date))}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="text-right">
                              <p className="font-semibold text-gray-900">
                                {formatCurrency(Math.abs(parseFloat(transaction.amount)))}
                              </p>
                              <p className="text-sm text-gray-500">per occurrence</p>
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