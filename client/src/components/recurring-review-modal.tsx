import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Checkbox } from './ui/checkbox';
import { CalendarIcon, DollarSignIcon, CheckCircleIcon, XCircleIcon, AlertTriangleIcon } from 'lucide-react';
import { format } from 'date-fns';

interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: string;
  category?: string;
  merchant?: string;
}

interface RecurringReviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  merchantName: string;
  triggerTransactionId?: string;
  onComplete?: (result: { status: 'recurring' | 'non-recurring'; applyToAll: boolean; reason?: string }) => void;
}

export function RecurringReviewModal({
  open,
  onOpenChange,
  merchantName,
  triggerTransactionId,
  onComplete
}: RecurringReviewModalProps) {
  const [recurringStatus, setRecurringStatus] = useState<'recurring' | 'non-recurring'>('recurring');
  const [applyToAll, setApplyToAll] = useState(true);
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch related transactions for the merchant
  const { data: relatedData, isLoading } = useQuery({
    queryKey: ['/api/user/recurring-overrides/related-transactions', merchantName],
    queryFn: async () => {
      const response = await fetch(`/api/user/recurring-overrides/related-transactions?merchant=${encodeURIComponent(merchantName)}`);
      if (!response.ok) throw new Error('Failed to fetch related transactions');
      return response.json();
    },
    enabled: open && !!merchantName,
  });

  const relatedTransactions: Transaction[] = relatedData?.transactions || [];
  const totalAmount = relatedTransactions.reduce((sum, tx) => sum + parseFloat(tx.amount), 0);
  const avgAmount = relatedTransactions.length > 0 ? totalAmount / relatedTransactions.length : 0;

  const handleSubmit = async () => {
    if (!merchantName) return;
    
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/user/recurring-overrides', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          merchantName,
          originalMerchant: merchantName,
          recurringStatus,
          applyToAll,
          reason: reason.trim() || undefined,
          triggerTransactionId
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create override');
      }

      onComplete?.({ 
        status: recurringStatus, 
        applyToAll, 
        reason: reason.trim() || undefined 
      });
      
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating override:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getFrequencyInfo = () => {
    if (relatedTransactions.length < 2) return null;
    
    const sortedTx = relatedTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const daysBetween = (new Date(sortedTx[0].date).getTime() - new Date(sortedTx[sortedTx.length - 1].date).getTime()) / (1000 * 60 * 60 * 24);
    const avgDaysBetween = daysBetween / (sortedTx.length - 1);
    
    if (avgDaysBetween <= 35) return 'Monthly';
    if (avgDaysBetween <= 95) return 'Quarterly';
    if (avgDaysBetween <= 190) return 'Semi-Annually';
    return 'Annually';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col" data-testid="recurring-review-modal">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangleIcon className="h-5 w-5 text-amber-500" />
            Review Recurring Transaction Pattern
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
            {/* Left Panel - Transaction Summary */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    {merchantName}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-muted rounded-lg">
                      <div className="text-2xl font-bold text-primary">
                        {relatedTransactions.length}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Total Transactions
                      </div>
                    </div>
                    <div className="text-center p-3 bg-muted rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        ${avgAmount.toFixed(2)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Average Amount
                      </div>
                    </div>
                  </div>

                  {getFrequencyInfo() && (
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="px-3 py-1">
                        {getFrequencyInfo()}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        Detected Pattern
                      </span>
                    </div>
                  )}

                  <Separator />
                  
                  <div className="space-y-2">
                    <h4 className="font-medium">Recent Transactions</h4>
                    <ScrollArea className="h-40">
                      <div className="space-y-2">
                        {isLoading ? (
                          <div className="text-center text-muted-foreground py-4">
                            Loading transactions...
                          </div>
                        ) : relatedTransactions.length === 0 ? (
                          <div className="text-center text-muted-foreground py-4">
                            No transactions found
                          </div>
                        ) : (
                          relatedTransactions.slice(0, 10).map((transaction) => (
                            <div
                              key={transaction.id}
                              className={`flex items-center justify-between p-2 rounded border ${
                                transaction.id === triggerTransactionId 
                                  ? 'border-primary bg-primary/5' 
                                  : 'border-muted'
                              }`}
                              data-testid={`transaction-${transaction.id}`}
                            >
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <CalendarIcon className="h-3 w-3 text-muted-foreground" />
                                  <span className="text-sm">
                                    {format(new Date(transaction.date), 'MMM d, yyyy')}
                                  </span>
                                </div>
                                <div className="text-xs text-muted-foreground truncate">
                                  {transaction.description}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <DollarSignIcon className="h-3 w-3 text-green-600" />
                                <span className="font-medium">
                                  ${parseFloat(transaction.amount).toFixed(2)}
                                </span>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </ScrollArea>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Panel - Decision Form */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    Mark as Recurring?
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <RadioGroup 
                    value={recurringStatus} 
                    onValueChange={(value) => setRecurringStatus(value as 'recurring' | 'non-recurring')}
                  >
                    <div className="flex items-center space-x-2 p-3 rounded-lg border border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
                      <RadioGroupItem value="recurring" id="recurring" data-testid="radio-recurring" />
                      <Label htmlFor="recurring" className="flex-1 cursor-pointer">
                        <div className="flex items-center gap-2">
                          <CheckCircleIcon className="h-4 w-4 text-green-600" />
                          <span className="font-medium">Yes, this is recurring</span>
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          This merchant charges regularly (subscriptions, bills, etc.)
                        </div>
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2 p-3 rounded-lg border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
                      <RadioGroupItem value="non-recurring" id="non-recurring" data-testid="radio-non-recurring" />
                      <Label htmlFor="non-recurring" className="flex-1 cursor-pointer">
                        <div className="flex items-center gap-2">
                          <XCircleIcon className="h-4 w-4 text-red-600" />
                          <span className="font-medium">No, this is not recurring</span>
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          These are one-time or irregular purchases
                        </div>
                      </Label>
                    </div>
                  </RadioGroup>

                  <Separator />

                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="applyToAll"
                        checked={applyToAll}
                        onCheckedChange={(checked) => setApplyToAll(checked === true)}
                        data-testid="checkbox-apply-to-all"
                      />
                      <Label htmlFor="applyToAll" className="text-sm font-medium">
                        Apply to all {relatedTransactions.length} transactions from this merchant
                      </Label>
                    </div>
                    <p className="text-xs text-muted-foreground ml-6">
                      {applyToAll 
                        ? `This decision will affect all transactions from "${merchantName}"`
                        : 'This decision will only apply to the selected transaction'
                      }
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="reason" className="text-sm font-medium">
                      Reason (Optional)
                    </Label>
                    <Textarea
                      id="reason"
                      placeholder="Why did you make this decision?"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      className="h-20"
                      data-testid="textarea-reason"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
            data-testid="button-cancel"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={isSubmitting}
            data-testid="button-save"
          >
            {isSubmitting ? 'Saving...' : 'Save Decision'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default RecurringReviewModal;