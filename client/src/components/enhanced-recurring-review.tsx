import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Clock, CheckCircle2 } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/financial-utils";
import { useToast } from "@/hooks/use-toast";
import { ManualRecurringSelection } from "./manual-recurring-selection";

interface Transaction {
  id: string;
  description: string;
  merchant?: string;
  amount: string;
  date: string;
  category: string;
}

interface RecurringReviewProps {
  isOpen: boolean;
  onClose: () => void;
  merchantName: string;
  transactionId: string;
}

export function EnhancedRecurringReview({
  isOpen,
  onClose,
  merchantName,
  transactionId
}: RecurringReviewProps) {
  const [showManualSelection, setShowManualSelection] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get related transactions for this merchant
  const { data: relatedData, isLoading } = useQuery<{
    merchant: string;
    transactions: Transaction[];
    summary: {
      totalCount: number;
      amountVariety: number;
      dateRange: string;
    };
  }>({
    queryKey: ["/api/user/recurring-overrides/related-transactions", merchantName],
    enabled: isOpen && !!merchantName,
  });

  // Apply manual selection mutation
  const applySelectionMutation = useMutation({
    mutationFn: async (data: {
      selectedTransactionIds: string[];
      applyToFuture: boolean;
    }) => {
      const response = await fetch("/api/user/recurring-overrides/manual-selection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          merchantName,
          selectedTransactionIds: data.selectedTransactionIds,
          applyToFuture: data.applyToFuture,
        }),
      });
      if (!response.ok) {
        throw new Error("Failed to apply selection");
      }
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Selection Applied",
        description: `Successfully processed ${data.result.selectedCount} transactions. ${
          data.result.rulesCreated ? "Smart rules created for future transactions." : ""
        }`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/recurring-overrides"] });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to apply selection",
        variant: "destructive",
      });
    },
  });

  // Handle traditional recurring confirmation (mark all as recurring)
  const confirmAllRecurringMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/user/recurring-overrides", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          merchantName,
          recurringStatus: "recurring",
          applyToAll: true,
          reason: "User confirmed all transactions as recurring",
          triggerTransactionId: transactionId,
        }),
      });
      if (!response.ok) {
        throw new Error("Failed to confirm recurring");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Confirmed Recurring",
        description: `All ${merchantName} transactions marked as recurring.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/recurring-overrides"] });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to confirm recurring",
        variant: "destructive",
      });
    },
  });

  const handleManualSelection = async (selectedTransactionIds: string[], applyToFuture: boolean) => {
    await applySelectionMutation.mutateAsync({
      selectedTransactionIds,
      applyToFuture,
    });
  };

  const transactions = relatedData?.transactions || [];
  const summary = relatedData?.summary;

  // Analyze transaction patterns for smart suggestions
  const hasVariedAmounts = summary && summary.amountVariety > 1;
  const hasMultipleTransactions = transactions.length > 1;

  return (
    <>
      <Dialog open={isOpen && !showManualSelection} onOpenChange={onClose}>
        <DialogContent className="max-w-lg" data-testid="enhanced-recurring-review-dialog">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-500" />
              Review Recurring Status - {merchantName}
            </DialogTitle>
          </DialogHeader>

          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading transaction history...
            </div>
          ) : (
            <div className="space-y-4">
              {/* Transaction Summary */}
              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Total Transactions:</span>
                    <div className="font-medium">{summary?.totalCount || 0}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Amount Variety:</span>
                    <div className="font-medium">{summary?.amountVariety || 0} different amounts</div>
                  </div>
                </div>
                {summary?.dateRange && (
                  <div className="mt-2 text-sm">
                    <span className="text-muted-foreground">Date Range:</span>
                    <span className="ml-2 font-medium">{summary.dateRange}</span>
                  </div>
                )}
              </div>

              {/* Smart Analysis */}
              {hasVariedAmounts && hasMultipleTransactions && (
                <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-orange-600 mt-0.5" />
                    <div className="text-sm">
                      <div className="font-medium text-orange-800 dark:text-orange-200">
                        Mixed Transaction Pattern Detected
                      </div>
                      <div className="text-orange-700 dark:text-orange-300 mt-1">
                        This merchant has {summary?.amountVariety} different amounts. You might want to manually 
                        select which transactions are truly recurring (like subscriptions) versus one-time purchases.
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Recent Transactions Preview */}
              <div>
                <h4 className="font-medium mb-2">Recent Transactions</h4>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {transactions.slice(0, 5).map((transaction) => (
                    <div
                      key={transaction.id}
                      className="flex items-center justify-between p-2 bg-white dark:bg-gray-900 rounded border"
                    >
                      <div className="text-sm">
                        <div className="font-medium">{transaction.description}</div>
                        <div className="text-muted-foreground">{formatDate(transaction.date)}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{formatCurrency(parseFloat(transaction.amount))}</div>
                        <Badge variant="outline" className="text-xs">
                          {transaction.category}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
                {transactions.length > 5 && (
                  <div className="text-xs text-muted-foreground mt-2">
                    And {transactions.length - 5} more transactions...
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-2 pt-4">
                {hasVariedAmounts && hasMultipleTransactions ? (
                  <>
                    {/* Recommended: Manual Selection */}
                    <Button
                      onClick={() => setShowManualSelection(true)}
                      className="w-full"
                      data-testid="button-manual-selection"
                    >
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Select Specific Transactions (Recommended)
                    </Button>
                    
                    {/* Alternative: Mark All */}
                    <Button
                      variant="outline"
                      onClick={() => confirmAllRecurringMutation.mutate()}
                      disabled={confirmAllRecurringMutation.isPending}
                      className="w-full"
                      data-testid="button-confirm-all-recurring"
                    >
                      Mark All as Recurring
                    </Button>
                  </>
                ) : (
                  <>
                    {/* Standard: Mark All */}
                    <Button
                      onClick={() => confirmAllRecurringMutation.mutate()}
                      disabled={confirmAllRecurringMutation.isPending}
                      className="w-full"
                      data-testid="button-confirm-all-recurring"
                    >
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Confirm as Recurring
                    </Button>
                    
                    {/* Alternative: Manual Selection */}
                    <Button
                      variant="outline"
                      onClick={() => setShowManualSelection(true)}
                      className="w-full"
                      data-testid="button-manual-selection"
                    >
                      Select Specific Transactions
                    </Button>
                  </>
                )}
                
                <Button
                  variant="ghost"
                  onClick={onClose}
                  data-testid="button-cancel"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Manual Selection Dialog */}
      <ManualRecurringSelection
        isOpen={showManualSelection}
        onClose={() => setShowManualSelection(false)}
        transactions={transactions}
        merchant={merchantName}
        onConfirm={handleManualSelection}
      />
    </>
  );
}