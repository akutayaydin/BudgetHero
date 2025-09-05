import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { Receipt, ArrowRight, Calendar, CreditCard } from "lucide-react";
import { Link } from "wouter";
import { formatCurrency } from "@/lib/financial-utils";

interface Transaction {
  id: string;
  description: string;
  amount: string;
  rawAmount: string;
  date: string;
  category: string;
  type: string;
  merchant: string;
  isPending?: boolean;
  ignoreType?: string;
  accountName?: string;
}

export function RecentTransactionsSection() {
  const { data: transactions = [] } = useQuery<Transaction[]>({
    queryKey: ['/api/transactions'],
  });

  // Get the 5 most recent transactions
  const recentTransactions = transactions
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      'Food & Drink': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      'Shopping': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      'Auto & Transport': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      'Entertainment': 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
      'Bills & Utilities': 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
      'Medical & Healthcare': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      'Income': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    };
    return colors[category] || 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
  };

  const MerchantLogo = ({ merchant, size = 8 }: { merchant?: string | null; size?: number }) => {
    const [imageError, setImageError] = useState(false);
    
    // Handle null/empty merchant names with generic icon
    if (!merchant || merchant.trim() === '') {
      return (
        <div className={`w-${size} h-${size} bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center`}>
          <Receipt className="w-4 h-4 text-gray-500" />
        </div>
      );
    }
    
    const cleanMerchant = merchant.toLowerCase().replace(/[^a-z0-9]/g, '');
    const logoUrl = `https://logo.clearbit.com/${cleanMerchant}.com`;
    
    // Generate fallback initials and color for valid merchant names
    const initials = merchant.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2);
    const colors = [
      'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-pink-500', 
      'bg-indigo-500', 'bg-yellow-500', 'bg-red-500', 'bg-teal-500'
    ];
    const colorIndex = merchant.length % colors.length;
    const bgColor = colors[colorIndex];
    
    if (imageError) {
      return (
        <div className={`w-${size} h-${size} ${bgColor} rounded-full flex items-center justify-center text-white text-xs font-semibold`}>
          {initials}
        </div>
      );
    }
    
    return (
      <img
        src={logoUrl}
        alt={`${merchant} logo`}
        className={`w-${size} h-${size} rounded-full object-cover border border-gray-200`}
        onError={() => setImageError(true)}
      />
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      {/* Recent Transactions */}
      <Card className="lg:col-span-2">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Receipt className="w-5 h-5" />
              Recent Transactions
            </CardTitle>
            <Link href="/transactions">
              <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700">
                See More
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {recentTransactions.length > 0 ? (
            recentTransactions.map((transaction) => {
              const isIncome = transaction.type === 'income';
              const isSpecialTransaction = transaction.ignoreType && transaction.ignoreType !== 'none';
              const isCreditCardPayment = transaction.category?.toLowerCase().includes('credit card');
              const isTransfer = transaction.category?.toLowerCase().includes('transfer');
              const shouldGrayAmount = isSpecialTransaction || isCreditCardPayment || isTransfer;
              const numericAmount = parseFloat(transaction.amount || '0');
              
              return (
                <div key={transaction.id} className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors">
                  <div className="flex items-center gap-4">
                    <MerchantLogo merchant={transaction.merchant || transaction.description} size={9} />
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-gray-900 dark:text-white">
                          {transaction.merchant || transaction.description}
                        </h4>
                        {transaction.isPending && (
                          <span className="text-xs text-gray-500 dark:text-gray-400">| Pending</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <Calendar className="w-3 h-3" />
                        <span>{formatDate(transaction.date)}</span>
                        {transaction.accountName && (
                          <>
                            <span>•</span>
                            <span>{transaction.accountName}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${
                      shouldGrayAmount 
                        ? 'text-gray-400 dark:text-gray-500'
                        : isIncome 
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-black dark:text-white'
                    }`}>
                      {isIncome ? '+' : ''}{formatCurrency(numericAmount)}
                    </p>
                    <Badge variant="secondary" className={`text-xs ${getCategoryColor(transaction.category)}`}>
                      {transaction.category}
                    </Badge>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <Receipt className="w-8 h-8 text-gray-400" />
              </div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                No Transactions Yet
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Connect your accounts to see transactions appear here
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Category Review */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
            Review Latest Transactions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center py-6">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-950/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <Receipt className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">
              Category Review
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Review and categorize your latest transactions to improve spending insights
            </p>
            <Link href="/transactions?filter=uncategorized">
              <Button className="w-full">
                Review Transactions
              </Button>
            </Link>
          </div>

          {/* Quick Stats */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-3">
            <h5 className="font-medium text-gray-900 dark:text-white text-sm">
              This Week
            </h5>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Uncategorized</span>
                <Badge variant="outline" className="text-xs">
                  {transactions.filter(t => !t.category || t.category === 'Uncategorized').length}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Total Transactions</span>
                <Badge variant="secondary" className="text-xs">
                  {transactions.length}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}