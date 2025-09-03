import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { formatCurrency } from "@/lib/financial-utils";
import type { Transaction } from "@shared/schema";
import { Edit3, Save, X, Tag, Receipt, Calendar, DollarSign, Building2 } from "lucide-react";

interface TransactionEditModalProps {
  transaction: Transaction;
  children: React.ReactNode;
}

export function TransactionEditModal({ transaction, children }: TransactionEditModalProps) {
  const [open, setOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    description: transaction.description,
    merchant: transaction.merchant || '',
    category: transaction.category,
    amount: transaction.amount,
    date: new Date(transaction.date).toISOString().split('T')[0]
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch categories for dropdown
  const { data: categories = [] } = useQuery<string[]>({
    queryKey: ['/api/admin/categories'],
    enabled: open
  });

  // Update transaction mutation
  const updateMutation = useMutation({
    mutationFn: async (updatedTransaction: Partial<Transaction>) => {
      const response = await fetch(`/api/transactions/${transaction.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedTransaction),
      });

      if (!response.ok) {
        throw new Error('Failed to update transaction');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
      setOpen(false);
      toast({
        title: "Success",
        description: "Transaction updated successfully!"
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update transaction. Please try again.",
        variant: "destructive"
      });
    }
  });

  const handleSave = () => {
    updateMutation.mutate({
      description: editForm.description,
      merchant: editForm.merchant || null,
      category: editForm.category,
      amount: editForm.amount,
      date: editForm.date
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit3 className="w-5 h-5" />
            Edit Transaction
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Transaction Date */}
          <div className="space-y-2">
            <Label htmlFor="date" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Date
            </Label>
            <Input
              id="date"
              type="date"
              value={editForm.date}
              onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
            />
          </div>

          {/* Merchant Name */}
          <div className="space-y-2">
            <Label htmlFor="merchant" className="flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              Merchant
            </Label>
            <Input
              id="merchant"
              placeholder="Enter merchant name..."
              value={editForm.merchant}
              onChange={(e) => setEditForm({ ...editForm, merchant: e.target.value })}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="flex items-center gap-2">
              <Receipt className="w-4 h-4" />
              Description
            </Label>
            <Textarea
              id="description"
              placeholder="Enter transaction description..."
              value={editForm.description}
              onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
              className="min-h-[80px]"
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category" className="flex items-center gap-2">
              <Tag className="w-4 h-4" />
              Category
            </Label>
            <Select value={editForm.category} onValueChange={(value) => setEditForm({ ...editForm, category: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent className="max-h-60 overflow-y-auto">
                {categories.map((category: any) => (
                  <SelectItem key={category.id || category} value={category.name || category}>
                    {category.name || category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount" className="flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Amount
            </Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={editForm.amount}
                onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })}
                className="pl-10"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end space-x-2 pt-4">
          <Button variant="outline" onClick={() => setOpen(false)}>
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={updateMutation.isPending}>
            <Save className="w-4 h-4 mr-2" />
            {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}