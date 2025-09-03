import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  X, 
  Plus, 
  Trash2, 
  Split,
  DollarSign,
  Receipt,
  Copy,
  Percent,
  ArrowLeft,
  Equal
} from "lucide-react";
import { formatCurrency } from "@/lib/financial-utils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface Transaction {
  id: string;
  description: string;
  merchant?: string;
  amount: string;
  type: 'income' | 'expense';
  category: string;
  categoryId?: string;
}

interface SplitItem {
  id: string;
  name: string;
  amount: number;
  category: string;
  categoryId?: string;
  percentage?: number;
}

interface TransactionSplitModalProps {
  transaction: Transaction | null;
  isOpen: boolean;
  onClose: () => void;
}

type SplitMethod = 'specific-amounts' | 'percentages' | 'equal-parts';

export function TransactionSplitModal({ transaction, isOpen, onClose }: TransactionSplitModalProps) {
  const [splitMethod, setSplitMethod] = useState<SplitMethod>('specific-amounts');
  const [splitItems, setSplitItems] = useState<SplitItem[]>([]);
  const [numberOfSplits, setNumberOfSplits] = useState(2);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get categories for dropdown
  const { data: categories = [] } = useQuery({
    queryKey: ["/api/admin/categories"],
  });

  const transactionAmount = transaction ? parseFloat(transaction.amount) : 0;

  // Initialize split items when modal opens
  useEffect(() => {
    if (transaction && isOpen) {
      const initialSplit: SplitItem = {
        id: '1',
        name: transaction.description,
        amount: transactionAmount / 2,
        category: transaction.category,
        categoryId: transaction.categoryId,
        percentage: 50
      };
      
      const secondSplit: SplitItem = {
        id: '2',
        name: transaction.description,
        amount: transactionAmount / 2,
        category: transaction.category,
        categoryId: transaction.categoryId,
        percentage: 50
      };
      
      setSplitItems([initialSplit, secondSplit]);
    }
  }, [transaction, isOpen, transactionAmount]);

  // Recalculate amounts when split method changes
  useEffect(() => {
    if (splitMethod === 'equal-parts') {
      const equalAmount = transactionAmount / splitItems.length;
      const equalPercentage = 100 / splitItems.length;
      
      setSplitItems(prev => prev.map(item => ({
        ...item,
        amount: equalAmount,
        percentage: equalPercentage
      })));
    }
  }, [splitMethod, splitItems.length, transactionAmount]);

  const addSplit = () => {
    const newSplit: SplitItem = {
      id: Date.now().toString(),
      name: transaction?.description || '',
      amount: 0,
      category: transaction?.category || '',
      categoryId: transaction?.categoryId,
      percentage: 0
    };
    
    setSplitItems(prev => [...prev, newSplit]);
    setNumberOfSplits(prev => prev + 1);
  };

  const removeSplit = (id: string) => {
    if (splitItems.length <= 2) {
      toast({
        title: "Cannot remove",
        description: "You need at least 2 splits",
        variant: "destructive"
      });
      return;
    }
    
    setSplitItems(prev => prev.filter(item => item.id !== id));
    setNumberOfSplits(prev => prev - 1);
  };

  const updateSplitItem = (id: string, updates: Partial<SplitItem>) => {
    setSplitItems(prev => prev.map(item => {
      if (item.id === id) {
        const updated = { ...item, ...updates };
        
        // Auto-calculate percentage when amount changes
        if (updates.amount !== undefined && splitMethod === 'specific-amounts') {
          updated.percentage = transactionAmount > 0 ? (updated.amount / transactionAmount) * 100 : 0;
        }
        
        // Auto-calculate amount when percentage changes
        if (updates.percentage !== undefined && splitMethod === 'percentages') {
          updated.amount = (transactionAmount * (updated.percentage || 0)) / 100;
        }
        
        return updated;
      }
      return item;
    }));
  };

  const totalAmount = splitItems.reduce((sum, item) => sum + item.amount, 0);
  const totalPercentage = splitItems.reduce((sum, item) => sum + (item.percentage || 0), 0);
  const isValidSplit = Math.abs(totalAmount - transactionAmount) < 0.01;

  // Create split transaction mutation
  const createSplit = useMutation({
    mutationFn: async (splitData: any) => {
      return apiRequest('/api/transactions/split', 'POST', {
        originalTransactionId: transaction?.id,
        splits: splitData
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
      toast({
        title: "Success",
        description: "Transaction split successfully!"
      });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to split transaction",
        variant: "destructive"
      });
    }
  });

  const handleSave = () => {
    if (!isValidSplit) {
      toast({
        title: "Invalid Split",
        description: "Split amounts must equal the original transaction amount",
        variant: "destructive"
      });
      return;
    }
    
    createSplit.mutate(splitItems);
  };

  if (!transaction) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="border-b pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost" 
                size="sm"
                onClick={onClose}
                className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-green-500 to-blue-500 flex items-center justify-center">
                <Split className="w-5 h-5 text-white" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold">Split Transaction</DialogTitle>
                <div className="text-sm text-gray-600 mt-1">
                  Divide this transaction into multiple categories
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Select value={splitMethod} onValueChange={(value: SplitMethod) => setSplitMethod(value)}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="specific-amounts">By Specific Amounts</SelectItem>
                  <SelectItem value="percentages">By Percentages</SelectItem>
                  <SelectItem value="equal-parts">Equal Parts</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Original Transaction */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Original Transaction</h3>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                      <Receipt className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-medium">{transaction.description}</div>
                      <Badge variant="outline" className="text-xs mt-1">
                        {transaction.category}
                      </Badge>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-green-600">
                      +{formatCurrency(transactionAmount)}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Split Transactions */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold">Split Transactions</h3>
              <Button variant="outline" size="sm" onClick={addSplit}>
                <Plus className="w-4 h-4 mr-2" />
                Add Split
              </Button>
            </div>
            
            <div className="space-y-3">
              {splitItems.map((split, index) => (
                <Card key={split.id}>
                  <CardContent className="p-4">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
                      {/* Split Number & Remove */}
                      <div className="lg:col-span-1 flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-xs font-bold">
                          {index + 1}
                        </div>
                        {splitItems.length > 2 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeSplit(split.id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        )}
                      </div>

                      {/* Split Name */}
                      <div className="lg:col-span-3">
                        <Label className="text-xs text-gray-500">Split Name</Label>
                        <Input
                          value={split.name}
                          onChange={(e) => updateSplitItem(split.id, { name: e.target.value })}
                          placeholder="Description"
                          className="mt-1"
                        />
                      </div>

                      {/* Category */}
                      <div className="lg:col-span-3">
                        <Label className="text-xs text-gray-500">Category</Label>
                        <Select
                          value={split.category}
                          onValueChange={(value) => {
                            const selectedCategory = Array.isArray(categories) ? categories.find((c: any) => c.name === value) : null;
                            updateSplitItem(split.id, { 
                              category: value,
                              categoryId: selectedCategory?.id 
                            });
                          }}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.isArray(categories) && categories.map((category: any) => (
                              <SelectItem key={category.id} value={category.name}>
                                <div className="flex items-center gap-2">
                                  <Receipt className="w-3 h-3" />
                                  {category.name}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Amount/Percentage Input */}
                      <div className="lg:col-span-2">
                        <Label className="text-xs text-gray-500">
                          {splitMethod === 'percentages' ? 'Percentage' : 'Amount'}
                        </Label>
                        <div className="relative mt-1">
                          {splitMethod === 'percentages' ? (
                            <>
                              <Input
                                type="number"
                                value={split.percentage?.toFixed(1) || '0'}
                                onChange={(e) => updateSplitItem(split.id, { percentage: parseFloat(e.target.value) || 0 })}
                                disabled={splitMethod === 'equal-parts'}
                                className="pr-8"
                                step="0.1"
                                min="0"
                                max="100"
                              />
                              <Percent className="absolute right-2 top-2.5 w-4 h-4 text-gray-400" />
                            </>
                          ) : (
                            <>
                              <Input
                                type="number"
                                value={split.amount.toFixed(2)}
                                onChange={(e) => updateSplitItem(split.id, { amount: parseFloat(e.target.value) || 0 })}
                                disabled={splitMethod === 'equal-parts'}
                                className="pr-8"
                                step="0.01"
                                min="0"
                              />
                              <DollarSign className="absolute right-2 top-2.5 w-4 h-4 text-gray-400" />
                            </>
                          )}
                        </div>
                      </div>

                      {/* Calculated Value Display */}
                      <div className="lg:col-span-3 text-right">
                        <div className="text-sm text-gray-500">
                          {splitMethod === 'percentages' ? 'Amount' : 'Percentage'}
                        </div>
                        <div className="font-bold">
                          {splitMethod === 'percentages' 
                            ? formatCurrency(split.amount)
                            : `${split.percentage?.toFixed(1) || '0'}%`
                          }
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Summary */}
          <Card className={`${isValidSplit ? 'border-green-200 bg-green-50 dark:bg-green-900/20' : 'border-red-200 bg-red-50 dark:bg-red-900/20'}`}>
            <CardContent className="p-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Total Amount</div>
                  <div className="text-lg font-bold">{formatCurrency(totalAmount)}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Total Percentage</div>
                  <div className="text-lg font-bold">{totalPercentage.toFixed(1)}%</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Difference</div>
                  <div className={`text-lg font-bold ${
                    isValidSplit ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {formatCurrency(Math.abs(totalAmount - transactionAmount))}
                  </div>
                </div>
              </div>
              
              {!isValidSplit && (
                <div className="text-center mt-3 text-sm text-red-600 dark:text-red-400">
                  Split amounts must equal the original transaction amount
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleSave}
            disabled={!isValidSplit || createSplit.isPending}
            className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600"
          >
            {createSplit.isPending ? 'Saving...' : 'Save Split'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}