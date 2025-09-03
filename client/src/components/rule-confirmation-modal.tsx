import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Target, Sparkles, Plus, Edit } from 'lucide-react';
import { formatCurrency } from '@/lib/financial-utils';
import type { Transaction } from '@shared/schema';

interface RuleConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaction | null;
  pendingChanges: Partial<Transaction> | undefined;
  onCreateRule: () => void;
  onUpdateOnly: () => void;
}

export function RuleConfirmationModal({
  isOpen,
  onClose,
  transaction,
  pendingChanges,
  onCreateRule,
  onUpdateOnly
}: RuleConfirmationModalProps) {
  if (!transaction || !pendingChanges) return null;

  const getChangeInfo = () => {
    if (pendingChanges.description) {
      return {
        type: 'Description',
        icon: <Target className="h-5 w-5 text-blue-600" />,
        oldValue: transaction.description || '',
        newValue: pendingChanges.description,
        color: 'blue'
      };
    } else if (pendingChanges.category) {
      return {
        type: 'Category',
        icon: <Sparkles className="h-5 w-5 text-purple-600" />,
        oldValue: transaction.category,
        newValue: pendingChanges.category,
        color: 'purple'
      };
    }
    return null;
  };

  const changeInfo = getChangeInfo();
  if (!changeInfo) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {changeInfo.icon}
            Updated {changeInfo.type}
            <Badge 
              variant="outline" 
              className="bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700 border-blue-200"
            >
              Rule Creation
            </Badge>
          </DialogTitle>
          <div className="text-sm text-muted-foreground">
            Choose how to apply this change
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Change Summary */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="text-sm">
              <p className="font-medium mb-2">Transaction:</p>
              <div className="bg-white dark:bg-gray-800 rounded p-2 border">
                <p className="font-medium">{transaction.description}</p>
                {transaction.merchant && (
                  <p className="text-muted-foreground text-xs">Merchant: {transaction.merchant}</p>
                )}
                <p className="text-muted-foreground text-xs">Amount: {formatCurrency(parseFloat(transaction.amount))}</p>
              </div>
            </div>
            <div className="mt-3 text-sm">
              <p className="font-medium mb-1">Change:</p>
              <div className="flex items-center gap-2 text-xs">
                <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">{changeInfo.oldValue}</Badge>
                <span>→</span>
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">{changeInfo.newValue}</Badge>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2">
            <Button 
              onClick={onCreateRule}
              className="w-full flex items-center justify-center gap-2 bg-black text-white hover:bg-gray-800"
              data-testid="button-create-rule"
            >
              <Plus className="h-4 w-4" />
              Create Rule for Similar Transactions
            </Button>
            
            <Button 
              onClick={onUpdateOnly}
              variant="outline"
              className="w-full flex items-center justify-center gap-2 border-gray-300"
              data-testid="button-update-only"
            >
              <Edit className="h-4 w-4" />
              Update This Transaction Only
            </Button>
          </div>

          <div className="text-xs text-muted-foreground text-center bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded p-2">
            💡 Creating a rule will automatically apply the change to similar transactions
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}