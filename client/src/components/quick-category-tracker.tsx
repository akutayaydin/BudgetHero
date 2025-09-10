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
}

interface PinnedCategory {
  id: string;
  categoryName: string;
  displayOrder: number;
  isActive: boolean;
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

  // Fetch pinned categories
  const { data: pinnedCategories = [] } = useQuery<PinnedCategory[]>({
    queryKey: ["/api/pinned-categories"],
  });

  // Fetch available categories
  const { data: allCategories = [] } = useQuery<{ name: string }[]>({
    queryKey: ["/api/categories"],
  });

  // Fetch category spending data
  const { data: categorySpending = [] } = useQuery<CategoryData[]>({
    queryKey: ["/api/analytics/categories", { type: "expense", period: timePeriod }],
  });

  // Fetch budget data
  const { data: budgets = [] } = useQuery<BudgetData[]>({
    queryKey: ["/api/budgets"],
  });

  // Pin category mutation
  const pinCategoryMutation = useMutation({
    mutationFn: async (categoryName: string) => {
      return await apiRequest("/api/pinned-categories", "POST", {
        categoryName,
        displayOrder: pinnedCategories.length,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pinned-categories"] });
      toast({
        title: "Category Pinned",
        description: "Category added to tracker successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to pin category. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Unpin category mutation
  const unpinCategoryMutation = useMutation({
    mutationFn: async (categoryId: string) => {
      return await apiRequest(`/api/pinned-categories/${categoryId}`, "DELETE");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pinned-categories"] });
      toast({
        title: "Category Unpinned",
        description: "Category removed from tracker.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to unpin category. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Calculate period multiplier for spending
  const periodMultiplier = useMemo(() => {
    if (timePeriod === 'week') {
      // Assuming monthly data, convert to weekly
      return 1 / 4.33; // Average weeks per month
    }
    return 1; // Monthly data as-is
  }, [timePeriod]);

  // Process tracked categories data
  const trackedCategoriesData = useMemo(() => {
    return pinnedCategories.map((pinned): TrackedCategoryData => {
      const spending = categorySpending.find(c => 
        c.category.toLowerCase() === pinned.categoryName.toLowerCase()
      );
      const budget = budgets.find(b => 
        b.category?.toLowerCase() === pinned.categoryName.toLowerCase()
      );

      const budgetLimit = budget ? parseFloat(budget.limit) * periodMultiplier : 0;
      const spent = spending ? spending.totalAmount * periodMultiplier : 0;
      const remaining = Math.max(0, budgetLimit - spent);
      const overspent = spent > budgetLimit;

      return {
        categoryName: pinned.categoryName,
        budgetLimit,
        spent,
        remaining,
        isPinned: true,
        overspent,
      };
    });
  }, [pinnedCategories, categorySpending, budgets, periodMultiplier]);

  // Get unpinned categories for the add dropdown
  const unpinnedCategories = useMemo(() => {
    const pinnedNames = pinnedCategories.map(p => p.categoryName.toLowerCase());
    return allCategories.filter(c => 
      !pinnedNames.includes(c.name.toLowerCase())
    );
  }, [allCategories, pinnedCategories]);

  const handlePinCategory = (categoryName: string) => {
    pinCategoryMutation.mutate(categoryName);
    setShowAddCategory(false);
  };

  const handleUnpinCategory = (categoryName: string) => {
    const pinned = pinnedCategories.find(p => p.categoryName === categoryName);
    if (pinned) {
      unpinCategoryMutation.mutate(pinned.id);
    }
  };

  return (
    <div className="space-y-4">
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
                <p className="text-xs max-w-48">
                  Pin categories to track your spending against budgets. 
                  Toggle between week and month views.
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
                Add Category
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {unpinnedCategories.length > 0 ? (
                unpinnedCategories.map((category) => {
                  const Icon = getCategoryIcon(category.name);
                  return (
                    <DropdownMenuItem
                      key={category.name}
                      onClick={() => handlePinCategory(category.name)}
                      className="flex items-center gap-2"
                      data-testid={`option-category-${category.name.toLowerCase().replace(/\s+/g, '-')}`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{category.name}</span>
                      <Pin className="w-3 h-3 ml-auto text-muted-foreground" />
                    </DropdownMenuItem>
                  );
                })
              ) : (
                <DropdownMenuItem disabled>
                  <span className="text-muted-foreground">All categories pinned</span>
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
                onClick={() => handleUnpinCategory(category.categoryName)}
                className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-muted rounded"
                title="Unpin category"
                data-testid={`button-unpin-${category.categoryName.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <X className="w-3 h-3 text-muted-foreground" />
              </button>
            </div>
          ))
        ) : (
          <div className="text-center py-6 text-muted-foreground">
            <Pin className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No categories pinned</p>
            <p className="text-xs">Add categories to track your spending</p>
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