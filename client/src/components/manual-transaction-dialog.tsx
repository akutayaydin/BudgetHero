import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { DollarSign, Calendar, Building, Tag, FileText, Hash } from "lucide-react";

const manualTransactionSchema = z.object({
  amount: z.string().min(1, "Amount is required").refine(
    (val) => !isNaN(parseFloat(val)) && parseFloat(val) !== 0,
    "Please enter a valid amount"
  ),
  description: z.string().min(1, "Merchant is required").max(255, "Merchant name too long"),
  date: z.string().min(1, "Date is required"),
  accountId: z.string().min(1, "Account is required").refine(
    (val) => val !== "none",
    "Please select an account"
  ),
  category: z.string().min(1, "Category is required"),
  type: z.enum(["income", "expense"], { required_error: "Transaction type is required" }),
  notes: z.string().max(500, "Notes too long").optional(),
  tags: z.string().optional(),
});

type ManualTransactionForm = z.infer<typeof manualTransactionSchema>;

interface ManualTransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ManualTransactionDialog({ open, onOpenChange }: ManualTransactionDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<ManualTransactionForm>({
    resolver: zodResolver(manualTransactionSchema),
    defaultValues: {
      amount: "",
      description: "",
      date: new Date().toISOString().split('T')[0], // Today's date
      accountId: "",
      category: "",
      type: "expense",
      notes: "",
      tags: "",
    },
  });

  // Get accounts for dropdown
  const { data: accounts = [] } = useQuery({
    queryKey: ["/api/accounts"],
  });

  // Get admin categories for dropdown
  const { data: adminCategories = [] } = useQuery({
    queryKey: ["/api/admin/categories"],
  });

  // Get existing merchants for dropdown
  const { data: existingMerchants = [] } = useQuery({
    queryKey: ["/api/transactions/merchants"],
  });

  const [customMerchant, setCustomMerchant] = useState("");

  const createTransactionMutation = useMutation({
    mutationFn: async (data: ManualTransactionForm) => {
      // Convert form data to the expected format
      const transactionData = {
        amount: parseFloat(data.amount),
        rawAmount: data.type === "expense" ? `-${data.amount}` : data.amount,
        description: data.description,
        merchant: data.description, // Use description as merchant for manual entries
        date: new Date(data.date),
        accountId: data.accountId,
        category: data.category,
        type: data.type,
        notes: data.notes || "",
        tags: data.tags ? data.tags.split(',').map(t => t.trim()).filter(t => t) : [],
        source: "manual", // Mark as manual transaction
        isPending: false,
      };
      
      return apiRequest("POST", "/api/transactions/manual", transactionData);
    },
    onSuccess: () => {
      // Refresh transaction lists
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions/review"] });
      queryClient.invalidateQueries({ queryKey: ["/api/financial-health"] });
      queryClient.invalidateQueries({ queryKey: ["/api/net-worth"] });
      
      toast({
        title: "Transaction Added! ✨",
        description: "Your manual transaction has been successfully created.",
      });
      
      // Reset form and close dialog
      form.reset();
      onOpenChange(false);
    },
    onError: (error: any) => {
      console.error("Failed to create transaction:", error);
      toast({
        title: "Error Creating Transaction",
        description: error.message || "Failed to create transaction. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ManualTransactionForm) => {
    createTransactionMutation.mutate(data);
  };

  // Format account options
  const accountOptions = accounts.map((account: any) => ({
    id: account.id,
    name: `${account.name} (${account.subtype || account.type})`,
  }));

  // Category options with emojis
  const getCategoryEmoji = (category: string) => {
    const emojiMap: Record<string, string> = {
      'Dining': '🍽️', 'Food': '🍕', 'Transport': '🚗', 'Entertainment': '🎮',
      'Shopping': '🛍️', 'Housing': '🏠', 'Health': '💊', 'Travel': '✈️',
      'Bills': '📄', 'Subscriptions': '📱', 'Gas': '⛽', 'Groceries': '🛒',
      'Coffee': '☕', 'Fitness': '💪', 'Education': '📚', 'Insurance': '🛡️',
      'Banking': '🏦', 'Investment': '📈', 'Other': '💰'
    };
    return emojiMap[category] || '💰';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            <DollarSign className="h-5 w-5 text-purple-600" />
            Add Manual Transaction
          </DialogTitle>
          <DialogDescription>
            Create a new transaction entry with all the details below.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Transaction Type */}
          <div className="space-y-2">
            <Label htmlFor="type" className="text-sm font-medium">Transaction Type *</Label>
            <Select
              value={form.watch("type")}
              onValueChange={(value: "income" | "expense") => form.setValue("type", value)}
            >
              <SelectTrigger data-testid="select-transaction-type">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="expense">💸 Expense (Money Out)</SelectItem>
                <SelectItem value="income">💰 Income (Money In)</SelectItem>
              </SelectContent>
            </Select>
            {form.formState.errors.type && (
              <p className="text-sm text-red-500">{form.formState.errors.type.message}</p>
            )}
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount" className="text-sm font-medium">Amount *</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                {...form.register("amount")}
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                className="pl-10"
                data-testid="input-amount"
              />
            </div>
            {form.formState.errors.amount && (
              <p className="text-sm text-red-500">{form.formState.errors.amount.message}</p>
            )}
          </div>

          {/* Merchant */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium">Merchant *</Label>
            <Select
              value={form.watch("description")}
              onValueChange={(value) => {
                if (value === "custom") {
                  form.setValue("description", "");
                  setCustomMerchant("");
                } else {
                  form.setValue("description", value);
                  setCustomMerchant("");
                }
              }}
            >
              <SelectTrigger data-testid="select-merchant">
                <SelectValue placeholder="Select merchant or create new" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="custom">
                  <div className="flex items-center gap-2">
                    <Tag className="w-4 h-4 text-purple-600" />
                    Create New Merchant
                  </div>
                </SelectItem>
                {existingMerchants.length > 0 && (
                  <>
                    {existingMerchants.map((merchant: string) => (
                      <SelectItem key={merchant} value={merchant}>
                        <div className="flex items-center gap-2">
                          <Building className="w-4 h-4 text-gray-400" />
                          <span className="truncate">{merchant}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </>
                )}
              </SelectContent>
            </Select>
            {form.watch("description") === "" && (
              <Input
                value={customMerchant}
                onChange={(e) => {
                  setCustomMerchant(e.target.value);
                  form.setValue("description", e.target.value);
                }}
                placeholder="Enter merchant name"
                className="mt-2"
                data-testid="input-merchant-name"
              />
            )}
            {form.formState.errors.description && (
              <p className="text-sm text-red-500">{form.formState.errors.description.message}</p>
            )}
          </div>

          {/* Date */}
          <div className="space-y-2">
            <Label htmlFor="date" className="text-sm font-medium">Date *</Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                {...form.register("date")}
                type="date"
                className="pl-10"
                data-testid="input-date"
              />
            </div>
            {form.formState.errors.date && (
              <p className="text-sm text-red-500">{form.formState.errors.date.message}</p>
            )}
          </div>

          {/* Account */}
          <div className="space-y-2">
            <Label htmlFor="accountId" className="text-sm font-medium">Account *</Label>
            <Select
              value={form.watch("accountId")}
              onValueChange={(value) => form.setValue("accountId", value)}
            >
              <SelectTrigger data-testid="select-account">
                <SelectValue placeholder="Select account" />
              </SelectTrigger>
              <SelectContent>
                {accountOptions.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    <div className="flex items-center gap-2">
                      <Building className="w-4 h-4 text-gray-400" />
                      {account.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.accountId && (
              <p className="text-sm text-red-500">{form.formState.errors.accountId.message}</p>
            )}
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category" className="text-sm font-medium">Category *</Label>
            <Select
              value={form.watch("category")}
              onValueChange={(value) => form.setValue("category", value)}
            >
              <SelectTrigger data-testid="select-category">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent className="max-h-[400px]">
                {/* Income Categories */}
                {adminCategories.filter((cat: any) => cat.ledgerType === "INCOME").length > 0 && (
                  <>
                    <div className="px-2 py-1.5 text-sm font-semibold text-green-700 bg-green-50 sticky top-0 z-50">
                      💰 Income
                    </div>
                    {adminCategories
                      .filter((cat: any) => cat.ledgerType === "INCOME")
                      .sort((a: any, b: any) => a.sortOrder - b.sortOrder)
                      .map((category: any) => (
                        <SelectItem key={category.id} value={category.name}>
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: category.color }}
                            />
                            {category.name}
                          </div>
                        </SelectItem>
                      ))}
                  </>
                )}

                {/* Expense Categories - Organized by subcategory groups */}
                {adminCategories.filter((cat: any) => cat.ledgerType === "EXPENSE").length > 0 && (
                  <>
                    <div className="px-2 py-1.5 text-sm font-semibold text-red-700 bg-red-50 sticky top-0 z-50">
                      💸 Expenses
                    </div>
                    
                    {/* Gifts & Donations */}
                    <div className="px-2 py-1 text-xs font-medium text-gray-600 bg-gray-50">
                      Gifts & Donations
                    </div>
                    {adminCategories
                      .filter((cat: any) => cat.ledgerType === "EXPENSE" && ["Charity", "Gifts"].includes(cat.name))
                      .sort((a: any, b: any) => a.sortOrder - b.sortOrder)
                      .map((category: any) => (
                        <SelectItem key={category.id} value={category.name}>
                          <div className="flex items-center gap-2 ml-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: category.color }} />
                            {category.name}
                          </div>
                        </SelectItem>
                      ))}

                    {/* Auto & Transport */}
                    <div className="px-2 py-1 text-xs font-medium text-gray-600 bg-gray-50">
                      Auto & Transport
                    </div>
                    {adminCategories
                      .filter((cat: any) => cat.ledgerType === "EXPENSE" && 
                        ["Auto Payment", "Public Transit", "Gas", "Auto Maintenance", "Parking & Tolls", "Taxi & Ride Shares"].includes(cat.name))
                      .sort((a: any, b: any) => a.sortOrder - b.sortOrder)
                      .map((category: any) => (
                        <SelectItem key={category.id} value={category.name}>
                          <div className="flex items-center gap-2 ml-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: category.color }} />
                            {category.name}
                          </div>
                        </SelectItem>
                      ))}

                    {/* Housing */}
                    <div className="px-2 py-1 text-xs font-medium text-gray-600 bg-gray-50">
                      Housing
                    </div>
                    {adminCategories
                      .filter((cat: any) => cat.ledgerType === "EXPENSE" && 
                        ["Mortgage", "Rent", "Home Improvement"].includes(cat.name))
                      .sort((a: any, b: any) => a.sortOrder - b.sortOrder)
                      .map((category: any) => (
                        <SelectItem key={category.id} value={category.name}>
                          <div className="flex items-center gap-2 ml-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: category.color }} />
                            {category.name}
                          </div>
                        </SelectItem>
                      ))}

                    {/* Bills & Utilities */}
                    <div className="px-2 py-1 text-xs font-medium text-gray-600 bg-gray-50">
                      Bills & Utilities
                    </div>
                    {adminCategories
                      .filter((cat: any) => cat.ledgerType === "EXPENSE" && 
                        ["Garbage", "Water", "Gas & Electric", "Internet & Cable", "Phone"].includes(cat.name))
                      .sort((a: any, b: any) => a.sortOrder - b.sortOrder)
                      .map((category: any) => (
                        <SelectItem key={category.id} value={category.name}>
                          <div className="flex items-center gap-2 ml-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: category.color }} />
                            {category.name}
                          </div>
                        </SelectItem>
                      ))}

                    {/* Food & Dining */}
                    <div className="px-2 py-1 text-xs font-medium text-gray-600 bg-gray-50">
                      Food & Dining
                    </div>
                    {adminCategories
                      .filter((cat: any) => cat.ledgerType === "EXPENSE" && 
                        ["Groceries", "Restaurants & Bars", "Coffee Shops"].includes(cat.name))
                      .sort((a: any, b: any) => a.sortOrder - b.sortOrder)
                      .map((category: any) => (
                        <SelectItem key={category.id} value={category.name}>
                          <div className="flex items-center gap-2 ml-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: category.color }} />
                            {category.name}
                          </div>
                        </SelectItem>
                      ))}

                    {/* Travel & Lifestyle */}
                    <div className="px-2 py-1 text-xs font-medium text-gray-600 bg-gray-50">
                      Travel & Lifestyle
                    </div>
                    {adminCategories
                      .filter((cat: any) => cat.ledgerType === "EXPENSE" && 
                        ["Travel & Vacation", "Entertainment & Recreation"].includes(cat.name))
                      .sort((a: any, b: any) => a.sortOrder - b.sortOrder)
                      .map((category: any) => (
                        <SelectItem key={category.id} value={category.name}>
                          <div className="flex items-center gap-2 ml-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: category.color }} />
                            {category.name}
                          </div>
                        </SelectItem>
                      ))}

                    {/* Personal */}
                    <div className="px-2 py-1 text-xs font-medium text-gray-600 bg-gray-50">
                      Personal
                    </div>
                    {adminCategories
                      .filter((cat: any) => cat.ledgerType === "EXPENSE" && 
                        ["Pets", "Fun Money"].includes(cat.name))
                      .sort((a: any, b: any) => a.sortOrder - b.sortOrder)
                      .map((category: any) => (
                        <SelectItem key={category.id} value={category.name}>
                          <div className="flex items-center gap-2 ml-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: category.color }} />
                            {category.name}
                          </div>
                        </SelectItem>
                      ))}

                    {/* Shopping */}
                    <div className="px-2 py-1 text-xs font-medium text-gray-600 bg-gray-50">
                      Shopping
                    </div>
                    {adminCategories
                      .filter((cat: any) => cat.ledgerType === "EXPENSE" && 
                        ["Clothing", "Furniture & Housewares", "Electronics"].includes(cat.name))
                      .sort((a: any, b: any) => a.sortOrder - b.sortOrder)
                      .map((category: any) => (
                        <SelectItem key={category.id} value={category.name}>
                          <div className="flex items-center gap-2 ml-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: category.color }} />
                            {category.name}
                          </div>
                        </SelectItem>
                      ))}

                    {/* Children */}
                    <div className="px-2 py-1 text-xs font-medium text-gray-600 bg-gray-50">
                      Children
                    </div>
                    {adminCategories
                      .filter((cat: any) => cat.ledgerType === "EXPENSE" && 
                        ["Child Care", "Child Activities", "Education", "Student Loans"].includes(cat.name))
                      .sort((a: any, b: any) => a.sortOrder - b.sortOrder)
                      .map((category: any) => (
                        <SelectItem key={category.id} value={category.name}>
                          <div className="flex items-center gap-2 ml-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: category.color }} />
                            {category.name}
                          </div>
                        </SelectItem>
                      ))}

                    {/* Health & Wellness */}
                    <div className="px-2 py-1 text-xs font-medium text-gray-600 bg-gray-50">
                      Health & Wellness
                    </div>
                    {adminCategories
                      .filter((cat: any) => cat.ledgerType === "EXPENSE" && 
                        ["Medical", "Dentist", "Fitness"].includes(cat.name))
                      .sort((a: any, b: any) => a.sortOrder - b.sortOrder)
                      .map((category: any) => (
                        <SelectItem key={category.id} value={category.name}>
                          <div className="flex items-center gap-2 ml-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: category.color }} />
                            {category.name}
                          </div>
                        </SelectItem>
                      ))}

                    {/* Financial */}
                    <div className="px-2 py-1 text-xs font-medium text-gray-600 bg-gray-50">
                      Financial
                    </div>
                    {adminCategories
                      .filter((cat: any) => cat.ledgerType === "EXPENSE" && 
                        ["Loan Repayment", "Financial & Legal Services", "Financial Fees", "Cash & ATM"].includes(cat.name))
                      .sort((a: any, b: any) => a.sortOrder - b.sortOrder)
                      .map((category: any) => (
                        <SelectItem key={category.id} value={category.name}>
                          <div className="flex items-center gap-2 ml-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: category.color }} />
                            {category.name}
                          </div>
                        </SelectItem>
                      ))}

                    {/* Insurance - Standalone */}
                    {adminCategories
                      .filter((cat: any) => cat.ledgerType === "EXPENSE" && cat.name === "Insurance")
                      .map((category: any) => (
                        <SelectItem key={category.id} value={category.name}>
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: category.color }} />
                            {category.name}
                          </div>
                        </SelectItem>
                      ))}

                    {/* Taxes - Standalone */}
                    {adminCategories
                      .filter((cat: any) => cat.ledgerType === "EXPENSE" && cat.name === "Taxes")
                      .map((category: any) => (
                        <SelectItem key={category.id} value={category.name}>
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: category.color }} />
                            {category.name}
                          </div>
                        </SelectItem>
                      ))}

                    {/* Other */}
                    <div className="px-2 py-1 text-xs font-medium text-gray-600 bg-gray-50">
                      Other
                    </div>
                    {adminCategories
                      .filter((cat: any) => cat.ledgerType === "EXPENSE" && 
                        ["Uncategorized", "Check", "Miscellaneous"].includes(cat.name))
                      .sort((a: any, b: any) => a.sortOrder - b.sortOrder)
                      .map((category: any) => (
                        <SelectItem key={category.id} value={category.name}>
                          <div className="flex items-center gap-2 ml-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: category.color }} />
                            {category.name}
                          </div>
                        </SelectItem>
                      ))}
                  </>
                )}

                {/* Business Categories */}
                {adminCategories.filter((cat: any) => cat.ledgerType === "EXPENSE" && cat.sortOrder >= 200 && cat.sortOrder < 300).length > 0 && (
                  <>
                    <div className="px-2 py-1.5 text-sm font-semibold text-purple-700 bg-purple-50 sticky top-0 z-50">
                      💼 Business
                    </div>
                    {adminCategories
                      .filter((cat: any) => cat.ledgerType === "EXPENSE" && cat.sortOrder >= 200 && cat.sortOrder < 300)
                      .sort((a: any, b: any) => a.sortOrder - b.sortOrder)
                      .map((category: any) => (
                        <SelectItem key={category.id} value={category.name}>
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: category.color }} />
                            {category.name}
                          </div>
                        </SelectItem>
                      ))}
                  </>
                )}

                {/* Transfer Categories */}
                {adminCategories.filter((cat: any) => cat.ledgerType === "TRANSFER" || cat.ledgerType === "ADJUSTMENT").length > 0 && (
                  <>
                    <div className="px-2 py-1.5 text-sm font-semibold text-blue-700 bg-blue-50 sticky top-0 z-50">
                      🔄 Transfers
                    </div>
                    {adminCategories
                      .filter((cat: any) => cat.ledgerType === "TRANSFER" || cat.ledgerType === "ADJUSTMENT")
                      .sort((a: any, b: any) => a.sortOrder - b.sortOrder)
                      .map((category: any) => (
                        <SelectItem key={category.id} value={category.name}>
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: category.color }} />
                            {category.name}
                          </div>
                        </SelectItem>
                      ))}
                  </>
                )}
              </SelectContent>
            </Select>
            {form.formState.errors.category && (
              <p className="text-sm text-red-500">{form.formState.errors.category.message}</p>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="text-sm font-medium">Notes (Optional)</Label>
            <div className="relative">
              <FileText className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <Textarea
                {...form.register("notes")}
                placeholder="Additional details about this transaction..."
                className="pl-10 min-h-[60px]"
                data-testid="textarea-notes"
              />
            </div>
            {form.formState.errors.notes && (
              <p className="text-sm text-red-500">{form.formState.errors.notes.message}</p>
            )}
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label htmlFor="tags" className="text-sm font-medium">Tags (Optional)</Label>
            <div className="relative">
              <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                {...form.register("tags")}
                placeholder="business, personal, vacation (comma-separated)"
                className="pl-10"
                data-testid="input-tags"
              />
            </div>
            <p className="text-xs text-gray-500">Separate multiple tags with commas</p>
            {form.formState.errors.tags && (
              <p className="text-sm text-red-500">{form.formState.errors.tags.message}</p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              data-testid="button-cancel"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={createTransactionMutation.isPending}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              data-testid="button-save-transaction"
            >
              {createTransactionMutation.isPending ? "Creating..." : "Add Transaction"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}