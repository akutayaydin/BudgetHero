import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Filter } from "lucide-react";
import { formatCurrency, formatDateOnly } from "@/lib/financial-utils";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";

interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  merchant?: string;
  category: string;
  accountId?: string;
  source: string;
}

export default function RecentCharges() {
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [amountFilter, setAmountFilter] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);

  const { data: recentTransactions = [] } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions"],
    refetchOnWindowFocus: false,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // Filter to show only recent charges (expenses) from last 7 days
  const recentCharges = recentTransactions
    .filter(transaction => {
      const transactionDate = new Date(transaction.date);
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      return transactionDate >= sevenDaysAgo && transaction.amount > 0; // Positive amount indicates expense
    })
    .filter(transaction => {
      // Category filter
      if (categoryFilter !== "all" && transaction.category !== categoryFilter) {
        return false;
      }
      
      // Amount filter
      if (amountFilter === "under50" && transaction.amount >= 50) return false;
      if (amountFilter === "50to200" && (transaction.amount < 50 || transaction.amount > 200)) return false;
      if (amountFilter === "over200" && transaction.amount <= 200) return false;
      
      return true;
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 10);

  // Get unique categories for filter
  const uniqueCategories = Array.from(new Set(recentTransactions.map(t => t.category)));

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'restaurants & bars': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      'coffee shops': 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
      'groceries': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      'gas stations': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      'shopping': 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
      'utilities': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    };
    return colors[category.toLowerCase()] || 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Clock className="h-4 w-4 text-blue-500" />
            Recent Charges
          </CardTitle>
          <Popover open={showFilters} onOpenChange={setShowFilters}>
            <PopoverTrigger asChild>
              <Button 
                variant="outline" 
                size="sm"
                className={categoryFilter !== "all" || amountFilter !== "all" ? "bg-blue-50 border-blue-300" : ""}
                data-testid="button-filter-charges"
              >
                <Filter className="h-4 w-4 mr-2" />
                Filter
                {(categoryFilter !== "all" || amountFilter !== "all") && (
                  <span className="ml-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                    {[categoryFilter !== "all" ? "Category" : "", amountFilter !== "all" ? "Amount" : ""].filter(Boolean).length}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" data-testid="popover-filter-options">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Category</label>
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger data-testid="select-category-filter">
                      <SelectValue placeholder="All categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All categories</SelectItem>
                      {uniqueCategories.map(category => (
                        <SelectItem key={category} value={category}>{category}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Amount Range</label>
                  <Select value={amountFilter} onValueChange={setAmountFilter}>
                    <SelectTrigger data-testid="select-amount-filter">
                      <SelectValue placeholder="All amounts" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All amounts</SelectItem>
                      <SelectItem value="under50">Under $50</SelectItem>
                      <SelectItem value="50to200">$50 - $200</SelectItem>
                      <SelectItem value="over200">Over $200</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex justify-between">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => {
                      setCategoryFilter("all");
                      setAmountFilter("all");
                    }}
                    data-testid="button-clear-filters"
                  >
                    Clear All
                  </Button>
                  <Button 
                    size="sm" 
                    onClick={() => setShowFilters(false)}
                    data-testid="button-apply-filters"
                  >
                    Apply
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
        <p className="text-sm text-muted-foreground">
          Last 7 days across all accounts
        </p>
      </CardHeader>
      <CardContent className="space-y-3 max-h-96 overflow-y-auto" data-testid="content-recent-charges">
        {recentCharges.map((transaction) => (
          <div key={transaction.id} className="flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center overflow-hidden ${
                transaction.merchant?.toLowerCase().includes('starbucks') ? 'bg-green-600' :
                transaction.merchant?.toLowerCase().includes('mcdonalds') ? 'bg-yellow-600' :
                transaction.merchant?.toLowerCase().includes('uber') ? 'bg-black' :
                transaction.category.toLowerCase().includes('restaurants') ? 'bg-orange-500' :
                transaction.category.toLowerCase().includes('coffee') ? 'bg-amber-600' :
                transaction.category.toLowerCase().includes('groceries') ? 'bg-green-500' :
                transaction.category.toLowerCase().includes('gas') ? 'bg-blue-500' :
                'bg-gray-500'
              }`}>
                {(transaction.merchant || transaction.description).substring(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-medium truncate">
                  {transaction.merchant || transaction.description}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    {formatDateOnly(new Date(transaction.date))}
                  </span>
                  <Badge variant="secondary" className={`${getCategoryColor(transaction.category)} text-xs`}>
                    {transaction.category}
                  </Badge>
                </div>
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <div className="font-bold">{formatCurrency(transaction.amount)}</div>
              {transaction.source === 'plaid' && (
                <div className="text-xs text-muted-foreground">Auto</div>
              )}
            </div>
          </div>
        ))}
        
        {recentCharges.length === 0 && (
          <div className="text-center py-6 text-muted-foreground">
            <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <div>No recent charges</div>
            <div className="text-sm">Transactions from the last 7 days will appear here</div>
          </div>
        )}
        
        {recentCharges.length > 0 && (
          <div className="text-center pt-2">
            <Button variant="ghost" size="sm" className="text-xs">
              View all recent transactions
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}