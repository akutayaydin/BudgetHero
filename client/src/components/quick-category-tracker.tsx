import React, { useState, useMemo } from "react";
import { 
  Plus, 
  Pin, 
  Star, 
  Calendar, 
  ChevronDown,
  X,
  Info
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { getCategoryIcon, getCategoryColor } from "@/lib/category-icons";

interface CategoryData {
  category: string;
  totalAmount: number;
  transactionCount: number;
}

interface BudgetData {
  id: string;
  name: string;
  category: string;
  limit: string;
  spent: string;
  isPinned?: boolean;
}


interface TrackedCategoryData {
  categoryName: string;
  budgetLimit: number;
  spent: number;
  remaining: number;
  isPinned: boolean;
  overspent: boolean;
}

interface EnhancedProgressBarProps {
  spent: number;
  budget: number;
  categoryName: string;
  className?: string;
}

// Enhanced Progress Bar Component
const EnhancedProgressBar: React.FC<EnhancedProgressBarProps> = ({ 
  spent, 
  budget, 
  categoryName,
  className 
}) => {
  const percentage = budget > 0 ? (spent / budget) * 100 : 0;
  const isOverspent = spent > budget;
  const displayPercentage = Math.min(percentage, 100);
  const overspentAmount = isOverspent ? spent - budget : 0;

  return (
    <div className={cn("space-y-1", className)}>
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium">{categoryName}</span>
        <span className={cn("font-mono", isOverspent ? "text-red-600" : "text-muted-foreground")}>
          ${spent.toFixed(0)} / ${budget.toFixed(0)}
        </span>
      </div>
      
      <div className="relative">
        {/* Base progress track */}
        <div className="w-full h-3 bg-muted rounded-full shadow-inner overflow-hidden">
          {/* Gradient fill */}
          <div 
            className="h-full bg-gradient-to-r from-blue-500 to-green-500 rounded-full transition-all duration-500 ease-out relative"
            style={{ width: `${displayPercentage}%` }}
          >
            {/* Animated striped pattern for real-time feedback */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse rounded-full" />
          </div>
          
          {/* Overspend indicator */}
          {isOverspent && (
            <div 
              className="absolute top-0 h-full bg-red-500 rounded-r-full"
              style={{ 
                left: '100%', 
                width: `${Math.min((overspentAmount / budget) * 100, 50)}%` 
              }}
            />
          )}
        </div>
        
        {/* Overspend warning cap */}
        {isOverspent && (
          <div className="absolute -top-1 left-full w-2 h-5 bg-red-500 rounded-r-md transform -translate-x-1" />
        )}
      </div>
      
      {/* Remaining amount */}
      <div className="text-xs text-right">
        <span className={cn(
          "font-mono",
          isOverspent ? "text-red-600" : spent > budget * 0.8 ? "text-amber-600" : "text-green-600"
        )}>
          {isOverspent ? `Over by $${overspentAmount.toFixed(0)}` : `$${(budget - spent).toFixed(0)} left`}
        </span>
      </div>
    </div>
  );
};

// Time Period Toggle Component
const TimePeriodToggle: React.FC<{
  period: 'week' | 'month';
  onChange: (period: 'week' | 'month') => void;
}> = ({ period, onChange }) => {
  return (
    <div className="flex rounded-full bg-muted p-1">
      <button
        onClick={() => onChange('week')}
        className={cn(
          "px-3 py-1 text-xs font-medium rounded-full transition-all duration-200",
          period === 'week' 
            ? "bg-background text-foreground shadow-sm" 
            : "text-muted-foreground hover:text-foreground"
        )}
        data-testid="toggle-week"
      >
        Week
      </button>
      <button
        onClick={() => onChange('month')}
        className={cn(
          "px-3 py-1 text-xs font-medium rounded-full transition-all duration-200",
          period === 'month' 
            ? "bg-background text-foreground shadow-sm" 
            : "text-muted-foreground hover:text-foreground"
        )}
        data-testid="toggle-month"
      >
        Month
      </button>
    </div>
  );
};

// Main Quick Category Tracker Component
const QuickCategoryTracker: React.FC<{ onRemove?: () => void }> = ({ onRemove }) => {
  const [timePeriod, setTimePeriod] = useState<'week' | 'month'>('week');
  const [showAddCategory, setShowAddCategory] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();



  // Get current date range for spending calculation and period context
  const { startDate, endDate, periodContext, weeklyBudgetMultiplier } = useMemo(() => {
    const now = new Date();
    
    if (timePeriod === 'week') {
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      
      // Calculate actual days in current week that fall within the month
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      
      // Adjust week boundaries to stay within month
      const adjustedStart = new Date(Math.max(startOfWeek.getTime(), startOfMonth.getTime()));
      const adjustedEnd = new Date(Math.min(endOfWeek.getTime(), endOfMonth.getTime()));
      
      // Calculate days in this week within the month
      const daysInWeekWithinMonth = Math.ceil((adjustedEnd.getTime() - adjustedStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      const daysInMonth = endOfMonth.getDate();
      
      // Weekly budget multiplier: (monthly budget ÷ days in month) × days in week
      const weeklyMultiplier = daysInWeekWithinMonth / daysInMonth;
      
      // Format date range for display
      const formatDate = (date: Date) => {
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      };
      
      const yearSuffix = adjustedStart.getFullYear() !== now.getFullYear() ? `, ${adjustedStart.getFullYear()}` : '';
      const periodContext = `${formatDate(adjustedStart)} – ${formatDate(adjustedEnd)}${yearSuffix}`;
      
      return {
        startDate: adjustedStart.toISOString().slice(0, 10),
        endDate: adjustedEnd.toISOString().slice(0, 10),
        periodContext,
        weeklyBudgetMultiplier: weeklyMultiplier
      };
    } else {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      
      const monthName = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      
      return {
        startDate: startOfMonth.toISOString().slice(0, 10),
        endDate: endOfMonth.toISOString().slice(0, 10),
        periodContext: monthName,
        weeklyBudgetMultiplier: 1 // Full monthly budget
      };
    }
  }, [timePeriod]);

  // Fetch transactions for the period to calculate actual spending
  const { data: transactions = [] } = useQuery({
    queryKey: ["/api/transactions", { startDate, endDate }],
    queryFn: async () => {
      const res = await fetch(`/api/transactions?startDate=${startDate}&endDate=${endDate}`, {
        credentials: "include"
      });
      if (!res.ok) throw new Error("Failed to fetch transactions");
      return res.json();
    }
  });

  // Fetch budget data
  const { data: budgets = [] } = useQuery<BudgetData[]>({
    queryKey: ["/api/budgets"],
  });

  // Pin budget mutation
  const pinBudgetMutation = useMutation({
    mutationFn: async (budgetId: string) => {
      return await apiRequest(`/api/budgets/${budgetId}`, "PATCH", {
        isPinned: true
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/budgets"] });
      toast({
        title: "Budget Pinned",
        description: "Budget added to tracker successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to pin budget. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Unpin budget mutation
  const unpinBudgetMutation = useMutation({
    mutationFn: async (budgetId: string) => {
      return await apiRequest(`/api/budgets/${budgetId}`, "PATCH", {
        isPinned: false
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/budgets"] });
      toast({
        title: "Budget Unpinned",
        description: "Budget removed from tracker.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to unpin budget. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Calculate spending by category for the selected period
  const spendingByCategory = useMemo(() => {
    const spending: Record<string, number> = {};
    
    transactions.forEach((transaction: any) => {
      if (transaction.type !== 'expense') return;
      
      const category = transaction.category?.toLowerCase() || '';
      const amount = parseFloat(transaction.amount) || 0;
      
      if (!spending[category]) {
        spending[category] = 0;
      }
      spending[category] += amount;
    });
    
    return spending;
  }, [transactions]);

  // Process tracked categories data from pinned budgets with weekly calculation
  const trackedCategoriesData = useMemo(() => {
    const pinnedBudgets = budgets.filter(budget => budget.isPinned);
    
    return pinnedBudgets.map((budget): TrackedCategoryData => {
      const categoryKey = (budget.name || budget.category || '').toLowerCase();
      const spent = spendingByCategory[categoryKey] || 0;
      const monthlyBudgetLimit = parseFloat(budget.limit) || 0;
      
      // Apply weekly calculation if in week view
      const displayBudgetLimit = timePeriod === 'week' 
        ? monthlyBudgetLimit * weeklyBudgetMultiplier
        : monthlyBudgetLimit;
      
      const remaining = Math.max(0, displayBudgetLimit - spent);
      const overspent = spent > displayBudgetLimit;

      return {
        categoryName: budget.name || budget.category || 'Unknown',
        budgetLimit: displayBudgetLimit,
        spent,
        remaining,
        isPinned: true,
        overspent,
      };
    });
  }, [budgets, spendingByCategory, timePeriod, weeklyBudgetMultiplier]);

  // Get unpinned budgets for the add dropdown
  const unpinnedBudgets = useMemo(() => {
    return budgets.filter(budget => !budget.isPinned);
  }, [budgets]);

  const handlePinBudget = (budgetId: string) => {
    pinBudgetMutation.mutate(budgetId);
    setShowAddCategory(false);
  };

  const handleUnpinBudget = (categoryName: string) => {
    const budget = budgets.find(b => (b.name || b.category) === categoryName);
    if (budget) {
      unpinBudgetMutation.mutate(budget.id);
    }
  };

  return (
    <div className="space-y-4">
      {/* Period Context Display */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium text-muted-foreground">
            {periodContext}
          </span>
        </div>
      </div>

      {/* Header with toggle and add button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <TimePeriodToggle period={timePeriod} onChange={setTimePeriod} />
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="w-4 h-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs max-w-64">
                  In Month view, budgets reflect your full monthly amount. In Week view, budgets are calculated daily × 7, and partial weeks (start/end of month) are prorated by the actual number of days. This keeps weekly totals aligned with your monthly budget.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <div className="flex items-center gap-2">
          <DropdownMenu open={showAddCategory} onOpenChange={setShowAddCategory}>
            <DropdownMenuTrigger asChild>
              <Button 
                size="sm" 
                variant="outline"
                data-testid="button-add-category"
              >
                <Plus className="w-4 h-4 mr-1" />
                Pin Budget
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {unpinnedBudgets.length > 0 ? (
                unpinnedBudgets.map((budget) => {
                  const budgetName = budget.name || budget.category || 'Unknown';
                  const Icon = getCategoryIcon(budgetName);
                  return (
                    <DropdownMenuItem
                      key={budget.id}
                      onClick={() => handlePinBudget(budget.id)}
                      className="flex items-center gap-2"
                      data-testid={`option-budget-${budgetName.toLowerCase().replace(/\s+/g, '-')}`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{budgetName}</span>
                      <Pin className="w-3 h-3 ml-auto text-muted-foreground" />
                    </DropdownMenuItem>
                  );
                })
              ) : (
                <DropdownMenuItem disabled>
                  <span className="text-muted-foreground">All budgets pinned</span>
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {onRemove && (
            <Button 
              size="sm" 
              variant="outline"
              onClick={onRemove}
              data-testid="button-remove-tracker"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Tracked Categories */}
      <div className="space-y-3">
        {trackedCategoriesData.length > 0 ? (
          trackedCategoriesData.map((category) => (
            <div key={category.categoryName} className="relative group">
              <EnhancedProgressBar
                spent={category.spent}
                budget={category.budgetLimit}
                categoryName={category.categoryName}
                className="pr-8"
              />
              
              {/* Unpin button */}
              <button
                onClick={() => handleUnpinBudget(category.categoryName)}
                className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-muted rounded"
                title="Unpin budget"
                data-testid={`button-unpin-${category.categoryName.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <X className="w-3 h-3 text-muted-foreground" />
              </button>
            </div>
          ))
        ) : (
          <div className="text-center py-6 text-muted-foreground">
            <Pin className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No budgets pinned</p>
            <p className="text-xs">Pin budgets from your Budget page to track spending</p>
          </div>
        )}
      </div>

      {/* Quick stats summary */}
      {trackedCategoriesData.length > 0 && (
        <div className="pt-3 border-t border-border">
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <div className="text-xs text-muted-foreground">Total Budget</div>
              <div className="text-sm font-mono">
                ${trackedCategoriesData.reduce((sum, cat) => sum + cat.budgetLimit, 0).toFixed(0)}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Total Spent</div>
              <div className="text-sm font-mono">
                ${trackedCategoriesData.reduce((sum, cat) => sum + cat.spent, 0).toFixed(0)}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Remaining</div>
              <div className="text-sm font-mono text-green-600">
                ${trackedCategoriesData.reduce((sum, cat) => sum + cat.remaining, 0).toFixed(0)}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuickCategoryTracker;