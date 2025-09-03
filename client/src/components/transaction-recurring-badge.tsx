import React, { useState } from 'react';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { RefreshCcwIcon, CheckCircleIcon, XCircleIcon, AlertTriangleIcon, RotateCcwIcon } from 'lucide-react';
import { RecurringReviewModal } from './recurring-review-modal';
import { useCreateRecurringOverride, useClassifyTransaction } from '../hooks/use-recurring-overrides';
import { useToast } from '../hooks/use-toast';

interface Transaction {
  id: string;
  description: string;
  merchant?: string;
  amount: string;
  date: string;
}

interface TransactionRecurringBadgeProps {
  transaction: Transaction;
  isRecurring?: boolean;
  recurringConfidence?: number;
  onUpdate?: () => void;
}

export function TransactionRecurringBadge({
  transaction,
  isRecurring,
  recurringConfidence = 0,
  onUpdate
}: TransactionRecurringBadgeProps) {
  const [showReviewModal, setShowReviewModal] = useState(false);
  const { toast } = useToast();
  
  const createOverrideMutation = useCreateRecurringOverride();
  const classifyMutation = useClassifyTransaction();

  const merchantName = transaction.merchant || transaction.description;
  const isHighConfidence = recurringConfidence > 0.7;
  const isLowConfidence = recurringConfidence < 0.5 && recurringConfidence > 0;

  const handleQuickMark = async (status: 'recurring' | 'non-recurring') => {
    try {
      await createOverrideMutation.mutateAsync({
        merchantName,
        originalMerchant: merchantName,
        recurringStatus: status,
        applyToAll: true,
        triggerTransactionId: transaction.id
      });

      toast({
        title: 'Override created',
        description: `Marked "${merchantName}" as ${status}`,
      });

      onUpdate?.();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create override',
        variant: 'destructive'
      });
    }
  };

  const handleReclassify = async () => {
    try {
      await classifyMutation.mutateAsync(transaction.id);
      toast({
        title: 'Transaction reclassified',
        description: 'Updated recurring status based on current rules',
      });
      onUpdate?.();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to reclassify transaction',
        variant: 'destructive'
      });
    }
  };

  const handleReviewComplete = () => {
    toast({
      title: 'Review completed',
      description: 'Recurring override saved successfully',
    });
    onUpdate?.();
  };

  // Determine badge appearance based on recurring status and confidence
  const getBadgeProps = () => {
    if (isRecurring === undefined) {
      return {
        variant: 'outline' as const,
        className: 'text-muted-foreground border-muted-foreground',
        icon: <AlertTriangleIcon className="h-3 w-3" />,
        text: 'Unknown'
      };
    }

    if (isRecurring) {
      const variant = isHighConfidence ? 'default' : 'secondary';
      return {
        variant: variant as 'default' | 'secondary',
        className: isHighConfidence 
          ? 'bg-green-100 text-green-800 border-green-300 dark:bg-green-900 dark:text-green-100' 
          : 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300',
        icon: <RefreshCcwIcon className="h-3 w-3" />,
        text: isHighConfidence ? 'Recurring' : 'Likely Recurring'
      };
    } else {
      return {
        variant: 'outline' as const,
        className: 'text-gray-600 border-gray-300 dark:text-gray-400 dark:border-gray-600',
        icon: <XCircleIcon className="h-3 w-3" />,
        text: 'One-time'
      };
    }
  };

  const badgeProps = getBadgeProps();

  return (
    <div className="flex items-center gap-2" data-testid={`recurring-badge-${transaction.id}`}>
      <Badge 
        variant={badgeProps.variant}
        className={`flex items-center gap-1 ${badgeProps.className}`}
      >
        {badgeProps.icon}
        <span>{badgeProps.text}</span>
        {recurringConfidence > 0 && (
          <span className="ml-1 text-xs opacity-70">
            ({Math.round(recurringConfidence * 100)}%)
          </span>
        )}
      </Badge>

      {/* Show action buttons for uncertain classifications or low confidence */}
      {(isLowConfidence || isRecurring === undefined) && (
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowReviewModal(true)}
            className="h-6 px-2 text-xs"
            data-testid={`button-review-${transaction.id}`}
          >
            Review
          </Button>
          
          {/* Quick mark buttons for undefined status */}
          {isRecurring === undefined && (
            <>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleQuickMark('recurring')}
                disabled={createOverrideMutation.isPending}
                className="h-6 px-2 text-xs text-green-600 hover:bg-green-50"
                data-testid={`button-mark-recurring-${transaction.id}`}
              >
                <CheckCircleIcon className="h-3 w-3" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleQuickMark('non-recurring')}
                disabled={createOverrideMutation.isPending}
                className="h-6 px-2 text-xs text-red-600 hover:bg-red-50"
                data-testid={`button-mark-non-recurring-${transaction.id}`}
              >
                <XCircleIcon className="h-3 w-3" />
              </Button>
            </>
          )}

          <Button
            size="sm"
            variant="ghost"
            onClick={handleReclassify}
            disabled={classifyMutation.isPending}
            className="h-6 px-2 text-xs"
            title="Reclassify with current rules"
            data-testid={`button-reclassify-${transaction.id}`}
          >
            <RotateCcwIcon className="h-3 w-3" />
          </Button>
        </div>
      )}

      {/* Review Modal */}
      <RecurringReviewModal
        open={showReviewModal}
        onOpenChange={setShowReviewModal}
        merchantName={merchantName}
        triggerTransactionId={transaction.id}
        onComplete={handleReviewComplete}
      />
    </div>
  );
}

export default TransactionRecurringBadge;