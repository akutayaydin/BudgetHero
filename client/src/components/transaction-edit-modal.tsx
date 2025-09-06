import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";

import type { Transaction } from "@shared/schema";
import { Edit3, Save, X, Tag, Receipt } from "lucide-react";
import {
  InlineCategorySelector,
  findCategoryByName,
} from "./inline-category-selector";

interface TransactionEditModalProps {
  transaction: Transaction;
  children: React.ReactNode;
}

export function TransactionEditModal({
  transaction,
  children,
}: TransactionEditModalProps) {
  const [open, setOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    description: transaction.description,

    category: transaction.category,
    categoryId: transaction.categoryId || "",
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch categories for dropdown and matching
  const { data: categories = [] } = useQuery<any[]>({
    queryKey: ["/api/admin/categories"],
    enabled: open,
  });

  useEffect(() => {
    const match = findCategoryByName(categories as any[], transaction.category);
    if (match) {
      setEditForm((prev) => ({
        ...prev,
        categoryId: match.id,
        category: match.fullName,
      }));
    }
  }, [categories, transaction.category]);

  // Update transaction mutation
  const updateMutation = useMutation({
    mutationFn: async (updatedTransaction: Partial<Transaction>) => {
      const response = await fetch(`/api/transactions/${transaction.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedTransaction),
      });

      if (!response.ok) {
        throw new Error("Failed to update transaction");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      setOpen(false);
      toast({
        title: "Success",
        description: "Transaction updated successfully!",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update transaction. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    updateMutation.mutate({
      description: editForm.description,

      category: editForm.category,
      categoryId: editForm.categoryId || null,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit3 className="w-5 h-5" />
            Edit Transaction
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
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
              onChange={(e) =>
                setEditForm({ ...editForm, description: e.target.value })
              }
              className="min-h-[80px]"
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category" className="flex items-center gap-2">
              <Tag className="w-4 h-4" />
              Category
            </Label>
            <InlineCategorySelector
              currentCategoryId={editForm.categoryId}
              currentCategoryName={editForm.category}
              onCategoryChange={(id, name) =>
                setEditForm({ ...editForm, categoryId: id, category: name })
              }
            />
          </div>
        </div>

        <div className="flex items-center justify-end space-x-2 pt-4">
          <Button variant="outline" onClick={() => setOpen(false)}>
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={updateMutation.isPending}>
            <Save className="w-4 h-4 mr-2" />
            {updateMutation.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
