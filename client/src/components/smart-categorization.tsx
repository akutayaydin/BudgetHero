import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
// import { Progress } from "@/components/ui/progress"; // Component not available
import { Separator } from "@/components/ui/separator";
import { 
  Sparkles, 
  Zap, 
  CheckCircle, 
  Clock, 
  Target,
  TrendingUp,
  RefreshCw,
  MessageCircle
} from "lucide-react";
import { formatCurrency } from "@/lib/financial-utils";
import { useToast } from "@/hooks/use-toast";

interface CategorySuggestion {
  category: string;
  confidence: number;
  reason: string;
}

interface BulkCategorizeResult {
  categorized: number;
  total: number;
}

export function SmartCategorization() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get transactions data
  const { data: transactions = [], isLoading: transactionsLoading } = useQuery({
    queryKey: ["/api/transactions"],
  });

  // Calculate uncategorized transactions
  const uncategorizedTransactions = transactions.filter(tx => 
    !tx.category || tx.category === "Other" || tx.category === "Uncategorized"
  );

  const categorizedTransactions = transactions.filter(tx => 
    tx.category && tx.category !== "Other" && tx.category !== "Uncategorized"
  );

  const categorizationRate = transactions.length > 0 
    ? (categorizedTransactions.length / transactions.length) * 100 
    : 0;

  // Bulk categorization mutation
  const bulkCategorizeMutation = useMutation({
    mutationFn: async (): Promise<BulkCategorizeResult> => {
      const response = await fetch("/api/transactions/bulk-categorize", {
        method: "POST",
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Failed to categorize transactions");
      }
      return response.json();
    },
    onSuccess: (result) => {
      toast({
        title: "Smart Categorization Complete",
        description: `Successfully categorized ${result.categorized} out of ${result.total} transactions.`,
      });
      // Refresh transactions data
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
    },
    onError: (error) => {
      toast({
        title: "Categorization Failed",
        description: "Failed to categorize transactions. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleBulkCategorize = async () => {
    setIsProcessing(true);
    setProcessingProgress(0);

    // Simulate progress for UX
    const progressInterval = setInterval(() => {
      setProcessingProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return prev;
        }
        return prev + 10;
      });
    }, 200);

    try {
      await bulkCategorizeMutation.mutateAsync();
      setProcessingProgress(100);
    } finally {
      clearInterval(progressInterval);
      setTimeout(() => {
        setIsProcessing(false);
        setProcessingProgress(0);
      }, 1000);
    }
  };

  if (transactionsLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Loading transactions...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Smart Categorization Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl">Smart Category System</CardTitle>
                <p className="text-sm text-gray-600">AI-powered transaction categorization</p>
              </div>
            </div>
            <Badge variant="secondary" className="px-3 py-1">
              <Target className="h-3 w-3 mr-1" />
              {Math.round(categorizationRate)}% Complete
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Progress Overview */}
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Categorization Progress</span>
              <span className="font-medium">{categorizedTransactions.length} of {transactions.length}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                style={{ width: `${categorizationRate}%` }}
              />
            </div>
          </div>

          <Separator />

          {/* Statistics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center space-y-2">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="h-4 w-4 text-green-600" />
              </div>
              <div className="text-2xl font-bold text-green-600">{categorizedTransactions.length}</div>
              <div className="text-xs text-gray-600">Categorized</div>
            </div>
            
            <div className="text-center space-y-2">
              <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center mx-auto">
                <Clock className="h-4 w-4 text-orange-600" />
              </div>
              <div className="text-2xl font-bold text-orange-600">{uncategorizedTransactions.length}</div>
              <div className="text-xs text-gray-600">Needs Attention</div>
            </div>
            
            <div className="text-center space-y-2">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                <TrendingUp className="h-4 w-4 text-blue-600" />
              </div>
              <div className="text-2xl font-bold text-blue-600">{Math.round(categorizationRate)}%</div>
              <div className="text-xs text-gray-600">Accuracy</div>
            </div>
          </div>

          <Separator />

          {/* Action Section */}
          {uncategorizedTransactions.length > 0 ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Auto-Categorize Transactions</h4>
                  <p className="text-sm text-gray-600">
                    Use AI to automatically categorize {uncategorizedTransactions.length} uncategorized transactions
                  </p>
                </div>
                <Button 
                  onClick={handleBulkCategorize}
                  disabled={isProcessing || bulkCategorizeMutation.isPending}
                  className="min-w-[140px]"
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Zap className="h-4 w-4 mr-2" />
                      Start Auto-Categorization
                    </>
                  )}
                </Button>
              </div>

              {isProcessing && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Processing transactions...</span>
                    <span className="font-medium">{processingProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                      style={{ width: `${processingProgress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-6 space-y-3">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h4 className="font-medium text-green-800">All Transactions Categorized!</h4>
                <p className="text-sm text-gray-600">Your financial data is fully organized</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Category Insights */}
      {categorizationRate > 50 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Smart Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-800">
                  <strong>Great progress!</strong> Your transactions are {Math.round(categorizationRate)}% categorized. 
                  This will help you track spending patterns and identify savings opportunities.
                </p>
              </div>
              
              {categorizationRate >= 90 && (
                <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-sm text-green-800">
                    <strong>Excellent!</strong> With 90%+ categorization, you can now trust your spending analytics 
                    and budget insights. Consider setting up automated rules for future transactions.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}