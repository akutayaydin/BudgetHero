import React, { useState, useMemo } from "react";
import { Plus, Pin } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { getCategoryIcon } from "@/lib/category-icons";

interface BudgetData {
  id: string;
  name: string;
  category: string;
  limit: string;
  spent: string;
  isPinned?: boolean;
}

interface PinBudgetButtonProps {
  className?: string;
}

export const PinBudgetButton: React.FC<PinBudgetButtonProps> = ({ className }) => {
  const [showAddCategory, setShowAddCategory] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Fetch budget data
  const { data: budgets = [] } = useQuery<BudgetData[]>({
    queryKey: ["/api/budgets"],
  });
  
  // Calculate current pinned count
  const pinnedCount = budgets.filter(budget => budget.isPinned).length;
  
  // Custom category structure for Quick Category Tracker
  const categoryStructure = useMemo(() => {
    const pinnedCategoryNames = new Set(
      budgets
        .filter(budget => budget.isPinned)
        .map(budget => (budget.name || budget.category || '').toLowerCase())
    );
    
    const allCategoryNames = [
      // Recommended categories
      "Groceries", "Auto & Transport", "Food & Drink", "Shopping",
      // Less frequent categories
      "Medical & Healthcare", "Health & Wellness", "Family Care", "Entertainment", 
      "Travel & Vacation", "Home & Garden", "Personal Care", "Gifts", 
      "General Services", "Pets", "Software & Tech", "Bank Fees", "Government & Non-Profit"
    ];
    
    const availableCategories = allCategoryNames
      .filter(name => !pinnedCategoryNames.has(name.toLowerCase()))
      .map(name => ({ name, id: name.toLowerCase().replace(/\s+/g, '-') }));
    
    return {
      recommended: availableCategories.filter(cat => 
        ["Groceries", "Auto & Transport", "Food & Drink", "Shopping"].includes(cat.name)
      ),
      lessFrequent: availableCategories.filter(cat => 
        !["Groceries", "Auto & Transport", "Food & Drink", "Shopping"].includes(cat.name)
      )
    };
  }, [budgets]);
  
  // Pin budget mutation
  const pinBudgetMutation = useMutation({
    mutationFn: async (budgetId: string) => {
      const res = await fetch(`/api/budgets/${budgetId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ isPinned: true })
      });
      if (!res.ok) throw new Error("Failed to pin budget");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/budgets"] });
      toast({
        title: "Category Pinned",
        description: "Budget added to tracker.",
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
  
  // Create and pin budget mutation
  const createAndPinBudgetMutation = useMutation({
    mutationFn: async (budgetData: { name: string; limit: string; category: string; isPinned: boolean }) => {
      const res = await fetch("/api/budgets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(budgetData)
      });
      if (!res.ok) throw new Error("Failed to create budget");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/budgets"] });
      toast({
        title: "Category Pinned",
        description: "Budget created and added to tracker with $100 default limit.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create and pin budget. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  const handlePinCategory = (categoryName: string) => {
    // Check 5-category limit
    if (pinnedCount >= 5) {
      toast({
        title: "Limit Reached",
        description: "You can only pin up to 5 categories. Unpin one first.",
        variant: "destructive",
      });
      setShowAddCategory(false);
      return;
    }

    // Check if budget already exists for this category
    const existingBudget = budgets.find(b => 
      (b.name || b.category || '').toLowerCase() === categoryName.toLowerCase()
    );

    if (existingBudget) {
      // Pin existing budget
      pinBudgetMutation.mutate(existingBudget.id);
    } else {
      // Create new budget with default $100 limit and pin it
      createAndPinBudgetMutation.mutate({
        name: categoryName,
        limit: "100.00",
        category: categoryName,
        isPinned: true
      });
    }
    
    setShowAddCategory(false);
  };
  
  return (
    <DropdownMenu open={showAddCategory} onOpenChange={setShowAddCategory}>
      <DropdownMenuTrigger asChild>
        <button 
          className={className || "text-xs px-2 py-1 rounded-md border border-border"}
          disabled={pinnedCount >= 5}
          data-testid="button-add-category"
        >
          + Pin Budget ({pinnedCount}/5)
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64 max-h-80 overflow-y-auto">
        {pinnedCount >= 5 ? (
          <DropdownMenuItem disabled>
            <span className="text-muted-foreground">Limit reached (5/5)</span>
          </DropdownMenuItem>
        ) : (
          <>
            {/* Recommended Section */}
            <div className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Recommended
            </div>
            {categoryStructure.recommended.map((category) => {
              const categoryName = category.name;
              const Icon = getCategoryIcon(categoryName);
              return (
                <DropdownMenuItem
                  key={category.id}
                  onClick={() => handlePinCategory(categoryName)}
                  className="flex items-center gap-2"
                  data-testid={`option-category-${categoryName.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="truncate">{categoryName}</span>
                  <Pin className="w-3 h-3 ml-auto text-muted-foreground shrink-0" />
                </DropdownMenuItem>
              );
            })}
            
            {categoryStructure.lessFrequent.length > 0 && (
              <>
                <DropdownMenuSeparator />
                <div className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Less Frequent Categories
                </div>
                {categoryStructure.lessFrequent.map((category) => {
                  const categoryName = category.name;
                  const Icon = getCategoryIcon(categoryName);
                  return (
                    <DropdownMenuItem
                      key={category.id}
                      onClick={() => handlePinCategory(categoryName)}
                      className="flex items-center gap-2"
                      data-testid={`option-category-${categoryName.toLowerCase().replace(/\s+/g, '-')}`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="truncate">{categoryName}</span>
                      <Pin className="w-3 h-3 ml-auto text-muted-foreground shrink-0" />
                    </DropdownMenuItem>
                  );
                })}
              </>
            )}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};