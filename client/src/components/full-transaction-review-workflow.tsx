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
  Plus,
  Filter
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

export function FullTransactionReviewWorkflow() {
  const [selectedTransaction, setSelectedTransaction] = useState<ReviewTransaction | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [subcategoryName, setSubcategoryName] = useState<string>("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [confidenceFilter, setConfidenceFilter] = useState<string>("all");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get transactions needing review
  const { data: reviewTransactions = [], isLoading: reviewLoading, refetch } = useQuery({
    queryKey: ["/api/transactions/review"],
  });

  // Get admin categories
  const { data: adminCategories = [] } = useQuery<AdminCategory[]>({
    queryKey: ["/api/admin/categories"],
  });

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
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update category",
        variant: "destructive",
      });
    },
  });

  const handleQuickFix = (transaction: ReviewTransaction, categoryId: string, subcategoryName?: string) => {
    applyFixMutation.mutate({
      transactionId: transaction.transaction.id,
      adminCategoryId: categoryId,
      subcategoryName,
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

  // Filter transactions by confidence
  const filteredTransactions = reviewTransactions.filter((item: ReviewTransaction) => {
    const confidence = parseFloat(item.meta.confidence);
    if (confidenceFilter === "low") return confidence < 0.4;
    if (confidenceFilter === "medium") return confidence >= 0.4 && confidence < 0.7;
    if (confidenceFilter === "high") return confidence >= 0.7;
    return true;
  });

  const parentCategories = adminCategories.filter(cat => !cat.parentId);

  if (reviewLoading) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="text-center">
            <Clock className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p>Loading transactions that need review...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
                Transaction Review Workflow
                <Badge variant="secondary">{filteredTransactions.length}</Badge>
              </CardTitle>
              <p className="text-sm text-gray-600 mt-2">
                Review and correct transaction categorizations with confidence scores below 0.70
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <Select value={confidenceFilter} onValueChange={setConfidenceFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="low">Low (&lt;0.4)</SelectItem>
                  <SelectItem value="medium">Medium (0.4-0.7)</SelectItem>
                  <SelectItem value="high">High (&ge;0.7)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Transaction List */}
      {filteredTransactions.length === 0 ? (
        <Card>
          <CardContent className="p-8">
            <div className="text-center">
              <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
              <h3 className="text-lg font-medium mb-2">All Caught Up!</h3>
              <p className="text-gray-600">
                No transactions need review. All categorizations have confidence scores above 0.70.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredTransactions.map((item: ReviewTransaction) => (
            <Card key={item.transaction.id} className="border-l-4 border-l-amber-500">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-medium">{item.transaction.description}</h4>
                      {item.transaction.merchant && (
                        <Badge variant="outline" className="text-xs">
                          {item.transaction.merchant}
                        </Badge>
                      )}
                      <Badge 
                        variant="secondary" 
                        className="text-xs"
                        style={{ 
                          backgroundColor: item.adminCategory ? `${item.adminCategory.color}20` : '#f3f4f620',
                          borderColor: item.adminCategory?.color || '#e5e7eb',
                          color: item.adminCategory?.color || '#6b7280'
                        }}
                      >
                        Confidence: {Math.round(parseFloat(item.meta.confidence) * 100)}%
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span>{formatCurrency(parseFloat(item.transaction.amount))}</span>
                      <span>{formatDate(item.transaction.date)}</span>
                      <span className="flex items-center gap-1">
                        <Tag className="h-3 w-3" />
                        Current: {item.adminCategory ? getCategoryDisplayName(item.adminCategory.id, adminCategories) : "Other"}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {/* Quick fix buttons for common categories */}
                    <div className="flex gap-1">
                      {parentCategories.slice(0, 3).map((category) => (
                        <Button
                          key={category.id}
                          size="sm"
                          variant="outline"
                          onClick={() => handleQuickFix(item, category.id)}
                          disabled={applyFixMutation.isPending}
                          className="text-xs"
                        >
                          <Zap className="h-3 w-3 mr-1" />
                          {category.name}
                        </Button>
                      ))}
                    </div>
                    
                    {/* Detailed fix button */}
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
                        <Button size="sm" variant="default">
                          <Plus className="h-4 w-4 mr-1" />
                          Custom Fix
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md">
                        <DialogHeader>
                          <DialogTitle>Fix Transaction Category</DialogTitle>
                        </DialogHeader>
                        
                        <div className="space-y-4">
                          <div className="p-3 bg-gray-50 rounded-lg">
                            <p className="font-medium">{item.transaction.description}</p>
                            <p className="text-sm text-gray-600">
                              {formatCurrency(parseFloat(item.transaction.amount))} • {formatDate(item.transaction.date)}
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
                              This will be saved as your personal preference for similar transactions
                            </p>
                          </div>
                          
                          <div className="flex justify-end gap-2">
                            <Button 
                              variant="outline" 
                              onClick={() => setIsDialogOpen(false)}
                            >
                              Cancel
                            </Button>
                            <Button 
                              onClick={handleDetailedFix}
                              disabled={!selectedCategoryId || applyFixMutation.isPending}
                            >
                              {applyFixMutation.isPending ? "Applying..." : "Apply Fix"}
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}