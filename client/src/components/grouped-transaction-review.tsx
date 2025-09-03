import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { 
  Repeat, 
  ShoppingCart, 
  AlertTriangle, 
  CheckCircle2, 
  X,
  Calendar,
  DollarSign
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/financial-utils";
import { useToast } from "@/hooks/use-toast";
import { useGroupedRelatedTransactions } from "@/hooks/use-recurring-overrides";
import { apiRequest } from "@/lib/queryClient";

interface GroupedTransactionReviewProps {
  merchantName: string;
  onComplete?: () => void;
  onCancel?: () => void;
}

export function GroupedTransactionReview({ 
  merchantName, 
  onComplete, 
  onCancel 
}: GroupedTransactionReviewProps) {
  const [selectedDecisions, setSelectedDecisions] = useState<{
    recurring?: 'recurring' | 'non-recurring';
    oneTime?: 'recurring' | 'non-recurring';
    unclear?: 'recurring' | 'non-recurring';
  }>({});
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: groupedData, isLoading } = useGroupedRelatedTransactions(merchantName);

  // Apply decision mutation
  const applyDecisionMutation = useMutation({
    mutationFn: async (data: {
      merchantName: string;
      recurringStatus: 'recurring' | 'non-recurring';
      reason: string;
      transactionIds?: string[];
    }) => {
      return await apiRequest('/api/user/recurring-overrides', 'POST', data);
    },
    onSuccess: () => {
      toast({
        title: "Decision Applied",
        description: "Transaction pattern has been saved successfully."
      });
      queryClient.invalidateQueries({ queryKey: ['/api/user/recurring-overrides'] });
      onComplete?.();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to apply decision. Please try again.",
        variant: "destructive"
      });
    }
  });

  const handleGroupDecision = (
    group: 'recurring' | 'oneTime' | 'unclear',
    decision: 'recurring' | 'non-recurring'
  ) => {
    setSelectedDecisions(prev => ({
      ...prev,
      [group]: decision
    }));
  };

  const handleApplyDecisions = () => {
    const decisions = Object.entries(selectedDecisions).filter(([_, decision]) => decision);
    
    if (decisions.length === 0) {
      toast({
        title: "No Decisions Made",
        description: "Please select whether each group should be recurring or non-recurring.",
        variant: "destructive"
      });
      return;
    }

    // Apply decisions for each group
    decisions.forEach(([group, decision]) => {
      let reason = '';
      let transactionIds: string[] = [];
      
      switch (group) {
        case 'recurring':
          reason = `User confirmed ${groupedData?.recurring.length} transactions as ${decision}`;
          transactionIds = groupedData?.recurring.map(tx => tx.id) || [];
          break;
        case 'oneTime':
          reason = `User marked ${groupedData?.oneTime.length} one-time purchases as ${decision}`;
          transactionIds = groupedData?.oneTime.map(tx => tx.id) || [];
          break;
        case 'unclear':
          reason = `User classified ${groupedData?.unclear.length} unclear transactions as ${decision}`;
          transactionIds = groupedData?.unclear.map(tx => tx.id) || [];
          break;
      }

      applyDecisionMutation.mutate({
        merchantName,
        recurringStatus: decision,
        reason,
        transactionIds
      });
    });
  };

  if (isLoading) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            <span className="ml-3 text-gray-600">Analyzing transaction patterns...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!groupedData) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="p-6">
          <div className="text-center py-8">
            <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">Unable to load transaction data for {merchantName}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const TransactionGroup = ({ 
    title, 
    icon: Icon, 
    transactions, 
    description, 
    groupKey,
    suggestedDecision 
  }: {
    title: string;
    icon: any;
    transactions: any[];
    description: string;
    groupKey: 'recurring' | 'oneTime' | 'unclear';
    suggestedDecision?: 'recurring' | 'non-recurring';
  }) => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Icon className="h-5 w-5 text-purple-600" />
          <h3 className="font-semibold text-gray-900">{title}</h3>
          <Badge variant="secondary">{transactions.length} transactions</Badge>
        </div>
        <div className="flex space-x-2">
          <Button
            size="sm"
            variant={selectedDecisions[groupKey] === 'recurring' ? 'default' : 'outline'}
            onClick={() => handleGroupDecision(groupKey, 'recurring')}
            data-testid={`button-mark-recurring-${groupKey}`}
          >
            <Repeat className="h-4 w-4 mr-1" />
            Recurring
          </Button>
          <Button
            size="sm"
            variant={selectedDecisions[groupKey] === 'non-recurring' ? 'default' : 'outline'}
            onClick={() => handleGroupDecision(groupKey, 'non-recurring')}
            data-testid={`button-mark-one-time-${groupKey}`}
          >
            <ShoppingCart className="h-4 w-4 mr-1" />
            One-time
          </Button>
        </div>
      </div>
      
      <p className="text-sm text-gray-600">{description}</p>
      {suggestedDecision && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-sm text-blue-800">
            💡 <strong>Suggestion:</strong> These appear to be {suggestedDecision} payments based on the pattern analysis.
          </p>
        </div>
      )}
      
      <div className="bg-gray-50 rounded-lg p-4 max-h-60 overflow-y-auto">
        <div className="space-y-2">
          {transactions.slice(0, 5).map((transaction) => (
            <div key={transaction.id} className="flex justify-between items-center py-2 border-b border-gray-200 last:border-0">
              <div className="flex-1">
                <p className="font-medium text-sm text-gray-900">{transaction.description}</p>
                <div className="flex items-center space-x-4 text-xs text-gray-500 mt-1">
                  <span className="flex items-center">
                    <Calendar className="h-3 w-3 mr-1" />
                    {formatDate(transaction.date)}
                  </span>
                  <span className="flex items-center">
                    <DollarSign className="h-3 w-3 mr-1" />
                    {formatCurrency(parseFloat(transaction.amount))}
                  </span>
                </div>
              </div>
            </div>
          ))}
          {transactions.length > 5 && (
            <p className="text-xs text-gray-500 text-center pt-2">
              ...and {transactions.length - 5} more transactions
            </p>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <Card className="w-full max-w-4xl mx-auto" data-testid="grouped-transaction-review">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <span>Review {merchantName} Transactions</span>
          <Badge variant="outline">{groupedData.summary.total} total</Badge>
        </CardTitle>
        <p className="text-gray-600">
          We've analyzed your {merchantName} transactions and grouped them by pattern. 
          Please review each group and decide whether they should be treated as recurring or one-time payments.
        </p>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-green-700">{groupedData.summary.recurringCount}</div>
            <div className="text-sm text-green-600">Likely Recurring</div>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-blue-700">{groupedData.summary.oneTimeCount}</div>
            <div className="text-sm text-blue-600">Likely One-time</div>
          </div>
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-orange-700">{groupedData.summary.unclearCount}</div>
            <div className="text-sm text-orange-600">Needs Review</div>
          </div>
        </div>

        {/* Transaction Groups */}
        <div className="space-y-8">
          {groupedData.recurring.length > 0 && (
            <>
              <TransactionGroup
                title="Likely Recurring Payments"
                icon={Repeat}
                transactions={groupedData.recurring}
                description="These transactions appear to be subscription or recurring payments based on consistent amounts and timing patterns."
                groupKey="recurring"
                suggestedDecision="recurring"
              />
              <Separator />
            </>
          )}

          {groupedData.oneTime.length > 0 && (
            <>
              <TransactionGroup
                title="Likely One-time Purchases"
                icon={ShoppingCart}
                transactions={groupedData.oneTime}
                description="These appear to be individual purchases with varying amounts and irregular timing."
                groupKey="oneTime"
                suggestedDecision="non-recurring"
              />
              <Separator />
            </>
          )}

          {groupedData.unclear.length > 0 && (
            <TransactionGroup
              title="Needs Your Decision"
              icon={AlertTriangle}
              transactions={groupedData.unclear}
              description="These transactions have mixed patterns. Please decide how they should be classified."
              groupKey="unclear"
            />
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between pt-6 border-t">
          <Button 
            variant="outline" 
            onClick={onCancel}
            data-testid="button-cancel-review"
          >
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button 
            onClick={handleApplyDecisions}
            disabled={applyDecisionMutation.isPending || Object.keys(selectedDecisions).length === 0}
            data-testid="button-apply-decisions"
          >
            <CheckCircle2 className="h-4 w-4 mr-2" />
            {applyDecisionMutation.isPending ? 'Applying...' : 'Apply Decisions'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}