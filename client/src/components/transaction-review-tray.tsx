import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { 
  AlertTriangle,
  CheckCircle,
  Clock,
  ArrowRight,
  Zap,
  Tag,
  Plus
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/financial-utils";
import { useToast } from "@/hooks/use-toast";
import { formatCategoryDisplay, getCategoryDisplayName } from "@/lib/category-display";

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
  adminCategory?: {
    id: string;
    name: string;
    color: string;
  } | null;
}

interface AdminCategory {
  id: string;
  name: string;
  parentId?: string;
  color: string;
  ledgerType: string;
}

export function TransactionReviewTray() {
  const [selectedTransaction, setSelectedTransaction] = useState<ReviewTransaction | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [subcategoryName, setSubcategoryName] = useState<string>("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get transactions needing review (limit to 3 for compact tray)
  const { data: reviewTransactions = [], isLoading: reviewLoading, refetch } = useQuery<ReviewTransaction[]>({
    queryKey: ["/api/transactions/review"],
  });

  // Get admin categories for the dropdown
  const { data: adminCategories = [] } = useQuery<AdminCategory[]>({
    queryKey: ["/api/admin/categories"],
  });

  // Limit to first 2 transactions for even more compact display
  const lowConfidenceTransactions = reviewTransactions.slice(0, 2);

  // Apply category fix mutation
  const applyFixMutation = useMutation({
    mutationFn: async (data: {
      transactionId: string;
      adminCategoryId: string;
      subcategoryName?: string;
    }) => {
      const response = await fetch("/api/transactions/apply-category-fix", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error("Failed to apply category fix");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Category Updated",
        description: "Transaction category has been updated and saved as your preference.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions/review"] });
      setIsDialogOpen(false);
      setSelectedTransaction(null);
      setSelectedCategoryId("");
      setSubcategoryName("");
      refetch();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update category",
        variant: "destructive",
      });
    },
  });

  const handleQuickFix = (transaction: ReviewTransaction, categoryId: string) => {
    applyFixMutation.mutate({
      transactionId: transaction.transaction.id,
      adminCategoryId: categoryId,
    });
  };

  const handleDetailedFix = () => {
    if (!selectedTransaction || !selectedCategoryId) return;
    
    applyFixMutation.mutate({
      transactionId: selectedTransaction.transaction.id,
      adminCategoryId: selectedCategoryId,
      subcategoryName: subcategoryName.trim() || undefined,
    });
  };

  const parentCategories = adminCategories.filter(cat => !cat.parentId);

  if (reviewLoading) {
    return (
      <Card className="border-l-4 border-l-amber-500">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <Clock className="h-5 w-5 text-amber-600" />
            <span>Checking for transactions to review...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (lowConfidenceTransactions.length === 0) {
    return (
      <Card className="border-l-4 border-l-green-500">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <div>
              <p className="font-medium">All Categories Look Good!</p>
              <p className="text-sm text-gray-600">No transactions need review right now.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-l-4 border-l-amber-500">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            Review New Transactions
            <Badge variant="secondary">{reviewTransactions.length}</Badge>
          </div>
          {reviewTransactions.length > 3 && (
            <Button size="sm" variant="ghost" className="text-xs text-muted-foreground">
              View All ({reviewTransactions.length})
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="pt-0 space-y-2">
        {lowConfidenceTransactions.map((item: ReviewTransaction) => (
          <div key={item.transaction.id} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-md">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium truncate text-sm">{item.transaction.description}</p>
                  <Badge variant="outline" className="text-xs px-1 py-0">
                    {Math.round(parseFloat(item.meta.confidence) * 100)}%
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <span>{formatCurrency(parseFloat(item.transaction.amount))}</span>
                  <span className="flex items-center gap-1">
                    <Tag className="h-3 w-3" />
                    {item.adminCategory ? getCategoryDisplayName(item.adminCategory.id, adminCategories) : "Other"}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-1 ml-2">
              {/* Quick fix for most common category */}
              {parentCategories[0] && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleQuickFix(item, parentCategories[0].id)}
                  disabled={applyFixMutation.isPending}
                  className="text-xs h-7 px-2"
                >
                  <Zap className="h-3 w-3 mr-1" />
                  {parentCategories[0].name}
                </Button>
              )}
              
              {/* Custom fix dialog */}
              <Dialog open={isDialogOpen && selectedTransaction?.transaction.id === item.transaction.id} 
                      onOpenChange={(open) => {
                        setIsDialogOpen(open);
                        if (open) {
                          setSelectedTransaction(item);
                          setSelectedCategoryId(item.adminCategory?.id || "");
                        } else {
                          setSelectedTransaction(null);
                          setSelectedCategoryId("");
                          setSubcategoryName("");
                        }
                      }}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="default" className="text-xs h-7 px-2">
                    <Plus className="h-3 w-3 mr-1" />
                    Fix
                  </Button>
                </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Fix Category</DialogTitle>
                    </DialogHeader>
                    
                    <div className="space-y-4">
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="font-medium">{item.transaction.description}</p>
                        <p className="text-sm text-gray-600">
                          {formatCurrency(parseFloat(item.transaction.amount))}
                        </p>
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium mb-2 block">Select Category</label>
                        <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId}>
                          <SelectTrigger>
                            <SelectValue placeholder="Choose category" />
                          </SelectTrigger>
                          <SelectContent>
                            {parentCategories.map((category) => (
                              <SelectItem key={category.id} value={category.id}>
                                {category.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium mb-2 block">
                          Subcategory (Optional)
                        </label>
                        <Input
                          placeholder="e.g., Coffee shops, Gas stations..."
                          value={subcategoryName}
                          onChange={(e) => setSubcategoryName(e.target.value)}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          This will be saved as your preference for similar merchants
                        </p>
                      </div>
                      
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button 
                          onClick={handleDetailedFix}
                          disabled={!selectedCategoryId || applyFixMutation.isPending}
                        >
                          {applyFixMutation.isPending ? "Applying..." : "Apply"}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          ))}
        
        {reviewTransactions.length > 2 && (
          <div className="mt-3 pt-3 border-t">
            <Button asChild size="sm" variant="outline" className="w-full">
              <a href="/transactions?tab=review">
                View All {reviewTransactions.length} Transactions
                <ArrowRight className="h-3 w-3 ml-1" />
              </a>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}