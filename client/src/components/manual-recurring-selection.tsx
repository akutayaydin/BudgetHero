import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/financial-utils";
import { useToast } from "@/hooks/use-toast";

interface Transaction {
  id: string;
  description: string;
  merchant?: string;
  amount: string;
  date: string;
  category: string;
}

interface ManualRecurringSelectionProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: Transaction[];
  merchant: string;
  onConfirm: (selectedTransactionIds: string[], applyToFuture: boolean) => void;
}

export function ManualRecurringSelection({
  isOpen,
  onClose,
  transactions,
  merchant,
  onConfirm
}: ManualRecurringSelectionProps) {
  const [selectedTransactionIds, setSelectedTransactionIds] = useState<string[]>([]);
  const [applyToFuture, setApplyToFuture] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  // Group transactions by amount for easier selection
  const transactionsByAmount = transactions.reduce((acc, transaction) => {
    const amount = transaction.amount;
    if (!acc[amount]) {
      acc[amount] = [];
    }
    acc[amount].push(transaction);
    return acc;
  }, {} as Record<string, Transaction[]>);

  // Debug logging to understand data
  console.log('ManualRecurringSelection - transactions count:', transactions.length);
  console.log('ManualRecurringSelection - transactionsByAmount:', transactionsByAmount);
  console.log('ManualRecurringSelection - Object.entries count:', Object.entries(transactionsByAmount).length);

  const handleSelectAll = () => {
    if (selectedTransactionIds.length === transactions.length) {
      setSelectedTransactionIds([]);
    } else {
      setSelectedTransactionIds(transactions.map(t => t.id));
    }
  };

  const handleSelectByAmount = (amount: string) => {
    const amountTransactions = transactionsByAmount[amount];
    const amountTransactionIds = amountTransactions.map(t => t.id);
    
    // Check if all transactions for this amount are already selected
    const allSelected = amountTransactionIds.every(id => selectedTransactionIds.includes(id));
    
    if (allSelected) {
      // Unselect all transactions for this amount
      setSelectedTransactionIds(prev => prev.filter(id => !amountTransactionIds.includes(id)));
    } else {
      // Select all transactions for this amount
      setSelectedTransactionIds(prev => {
        const combined = [...prev, ...amountTransactionIds];
        return Array.from(new Set(combined));
      });
    }
  };

  const handleTransactionToggle = (transactionId: string) => {
    setSelectedTransactionIds(prev => 
      prev.includes(transactionId)
        ? prev.filter(id => id !== transactionId)
        : [...prev, transactionId]
    );
  };

  const handleConfirm = async () => {
    if (selectedTransactionIds.length === 0) {
      toast({
        title: "No Selection",
        description: "Please select at least one transaction to mark as recurring.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await onConfirm(selectedTransactionIds, applyToFuture);
      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to apply recurring selection. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isAllSelected = selectedTransactionIds.length === transactions.length;
  const selectedCount = selectedTransactionIds.length;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col" data-testid="manual-recurring-selection-dialog">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-orange-500" />
            Select Recurring Transactions - {merchant}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col h-full space-y-4 overflow-hidden">
          <div className="text-sm text-muted-foreground flex-shrink-0">
            Found {transactions.length} related transactions for {merchant}. 
            Select which ones represent recurring payments:
          </div>

          {/* Selection Controls */}
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg flex-shrink-0">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectAll}
                data-testid="button-select-all"
              >
                {isAllSelected ? "Unselect All" : "Select All"}
              </Button>
              <span className="text-sm text-muted-foreground">
                {selectedCount} of {transactions.length} selected
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <Checkbox
                id="apply-to-future"
                checked={applyToFuture}
                onCheckedChange={(checked) => setApplyToFuture(checked === true)}
                data-testid="checkbox-apply-to-future"
              />
              <label 
                htmlFor="apply-to-future" 
                className="text-sm font-medium cursor-pointer"
              >
                Apply to future transactions
              </label>
            </div>
          </div>

          {/* Transactions grouped by amount - Scrollable */}
          <div className="flex-1 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="space-y-4 pr-4">
              {Object.entries(transactionsByAmount).map(([amount, amountTransactions]) => {
                const amountTransactionIds = amountTransactions.map(t => t.id);
                const amountSelectedCount = amountTransactionIds.filter(id => 
                  selectedTransactionIds.includes(id)
                ).length;
                const allAmountSelected = amountSelectedCount === amountTransactions.length;

                return (
                  <div key={amount} className="border rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{formatCurrency(parseFloat(amount))}</h4>
                        <Badge variant="outline">
                          {amountTransactions.length} transaction{amountTransactions.length > 1 ? 's' : ''}
                        </Badge>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSelectByAmount(amount)}
                        data-testid={`button-select-amount-${amount}`}
                      >
                        {allAmountSelected ? "Unselect Group" : "Select Group"}
                      </Button>
                    </div>

                    <div className="space-y-2">
                      {amountTransactions.map((transaction) => (
                        <div
                          key={transaction.id}
                          className={`flex items-center justify-between p-2 rounded border ${
                            selectedTransactionIds.includes(transaction.id)
                              ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800'
                              : 'bg-white dark:bg-gray-900'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <Checkbox
                              checked={selectedTransactionIds.includes(transaction.id)}
                              onCheckedChange={() => handleTransactionToggle(transaction.id)}
                              data-testid={`checkbox-transaction-${transaction.id}`}
                            />
                            <div>
                              <div className="font-medium text-sm">
                                {transaction.description}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {formatDate(transaction.date)} • {transaction.category}
                              </div>
                            </div>
                          </div>

                          {selectedTransactionIds.includes(transaction.id) && (
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
              </div>
            </ScrollArea>
          </div>

          {/* Future Application Notice */}
          {applyToFuture && selectedCount > 0 && (
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="text-sm text-blue-800 dark:text-blue-200">
                <strong>Smart Rules:</strong> Future {merchant} transactions will be automatically 
                classified based on your selections. You can modify these rules anytime in Settings.
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              data-testid="button-cancel"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={selectedCount === 0 || isSubmitting}
              data-testid="button-confirm-recurring"
            >
              {isSubmitting ? "Applying..." : `Confirm ${selectedCount} as Recurring`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}