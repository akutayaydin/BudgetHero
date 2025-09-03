import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import { 
  X, 
  Calendar, 
  DollarSign, 
  Building2, 
  CreditCard, 
  Split, 
  Settings, 
  Receipt, 
  ChevronDown,
  ChevronRight,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  ArrowLeft,
  Tag,
  Edit3,
  Save,
  AlertCircle
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/financial-utils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { TransactionSplitModal } from "./transaction-split-modal";
import { CreateRuleModal } from "./create-rule-modal";

interface Transaction {
  id: string;
  date: string;
  description: string;
  merchant?: string;
  amount: string;
  rawAmount: string;
  type: 'income' | 'expense';
  category: string;
  categoryId?: string;
  accountId: string;
  notes?: string;
  tags?: string[];
  isIgnored?: boolean;
  isTaxDeductible?: boolean;
  plaidAccountId?: string;
  paymentChannel?: string;
  locationJson?: any;
  paymentMetaJson?: any;
}

interface Account {
  id: string;
  name: string;
  type: string;
  subtype: string;
  mask?: string;
}

interface TransactionDetailsModalProps {
  transaction: Transaction | null;
  isOpen: boolean;
  onClose: () => void;
}

export function TransactionDetailsModal({ transaction, isOpen, onClose }: TransactionDetailsModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTransaction, setEditedTransaction] = useState<Transaction | null>(null);
  const [showSplitModal, setShowSplitModal] = useState(false);
  const [showRuleModal, setShowRuleModal] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [editingCategory, setEditingCategory] = useState(false);
  const [showRulePrompt, setShowRulePrompt] = useState(false);
  const [pendingChanges, setPendingChanges] = useState<Partial<Transaction>>({});
  const [showIgnoreOptions, setShowIgnoreOptions] = useState(false);
  const [showBankDetails, setShowBankDetails] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get categories for dropdown
  const { data: categories = [] } = useQuery({
    queryKey: ["/api/admin/categories"],
  });

  // Get account details
  const { data: accounts = [] } = useQuery<Account[]>({
    queryKey: ["/api/accounts"],
  });

  // Reset editing state when transaction changes
  useEffect(() => {
    if (transaction) {
      setEditedTransaction({ ...transaction });
      setIsEditing(false);
      setShowIgnoreOptions(false);
      setShowBankDetails(false);
    }
  }, [transaction]);

  // Update transaction mutation
  const updateTransaction = useMutation({
    mutationFn: async (updatedTransaction: Partial<Transaction>) => {
      return apiRequest(`/api/transactions/${transaction?.id}`, 'PATCH', updatedTransaction);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
      toast({
        title: "Success",
        description: "Transaction updated successfully!"
      });
      setIsEditing(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update transaction",
        variant: "destructive"
      });
    }
  });

  const handleSave = () => {
    if (!editedTransaction) return;
    
    const updates = {
      description: editedTransaction.description,
      merchant: editedTransaction.merchant,
      category: editedTransaction.category,
      categoryId: editedTransaction.categoryId,
      notes: editedTransaction.notes,
      isIgnored: editedTransaction.isIgnored,
      isTaxDeductible: editedTransaction.isTaxDeductible,
      tags: editedTransaction.tags
    };
    
    updateTransaction.mutate(updates);
  };

  const handleIgnore = (ignoreType: 'this' | 'all' | 'future') => {
    if (!editedTransaction) return;
    
    // Implementation would depend on your ignore logic
    const updates = { 
      isIgnored: true,
      ignoreType // You may need to add this field to your schema
    };
    
    updateTransaction.mutate(updates);
    setShowIgnoreOptions(false);
  };

  const currentAccount = accounts.find(acc => acc.id === transaction?.accountId);

  if (!transaction || !editedTransaction) return null;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="border-b pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                  <Receipt className="w-6 h-6 text-white" />
                </div>
                <div>
                  <DialogTitle className="text-xl font-bold">
                    {isEditing ? "Edit Transaction" : "Transaction Details"}
                  </DialogTitle>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-xs">
                      {formatDate(transaction.date)}
                    </Badge>
                    <Badge variant={transaction.type === 'income' ? 'default' : 'secondary'} className="text-xs">
                      {transaction.type.toUpperCase()}
                    </Badge>
                  </div>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Main Transaction Info */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-4">
                {/* Transaction Name - Hover to Edit */}
                <div>
                  <Label htmlFor="description" className="text-sm font-medium">
                    Transaction Name
                  </Label>
                  {editingName ? (
                    <div className="flex items-center gap-2 mt-1">
                      <Input
                        value={editedTransaction.description}
                        onChange={(e) => setEditedTransaction(prev => prev ? { ...prev, description: e.target.value } : null)}
                        onBlur={() => {
                          setEditingName(false);
                          setPendingChanges({...pendingChanges, description: editedTransaction.description});
                          setShowRulePrompt(true);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            setEditingName(false);
                            setPendingChanges({...pendingChanges, description: editedTransaction.description});
                            setShowRulePrompt(true);
                          } else if (e.key === 'Escape') {
                            setEditingName(false);
                            setEditedTransaction(prev => prev ? { ...prev, description: transaction.description } : null);
                          }
                        }}
                        autoFocus
                        className="flex-1"
                      />
                      <Button size="sm" variant="ghost" onClick={() => setEditingName(false)}>
                        <Save className="w-3 h-3" />
                      </Button>
                    </div>
                  ) : (
                    <div
                      className="mt-1 p-2 border border-transparent rounded-md hover:border-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-all group"
                      onClick={() => setEditingName(true)}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm">{editedTransaction.description}</span>
                        <Edit3 className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Merchant */}
                <div>
                  <Label htmlFor="merchant" className="text-sm font-medium">
                    Merchant
                  </Label>
                  <Input
                    id="merchant"
                    value={editedTransaction.merchant || ''}
                    onChange={(e) => setEditedTransaction(prev => prev ? { ...prev, merchant: e.target.value } : null)}
                    disabled={!isEditing}
                    className="mt-1"
                    placeholder="Enter merchant name"
                  />
                </div>

                {/* Category - Hover to Edit */}
                <div>
                  <Label htmlFor="category" className="text-sm font-medium">
                    Category
                  </Label>
                  {editingCategory ? (
                    <div className="mt-1">
                      <Select
                        value={editedTransaction.category}
                        onValueChange={(value) => {
                          const selectedCategory = Array.isArray(categories) ? categories.find((c: any) => c.name === value) : null;
                          setEditedTransaction(prev => prev ? { 
                            ...prev, 
                            category: value,
                            categoryId: selectedCategory?.id 
                          } : null);
                          setEditingCategory(false);
                          setPendingChanges({...pendingChanges, category: value, categoryId: selectedCategory?.id});
                          setShowRulePrompt(true);
                        }}
                        open={true}
                        onOpenChange={() => setEditingCategory(false)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.isArray(categories) && categories.map((category: any) => (
                            <SelectItem key={category.id} value={category.name}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ) : (
                    <div
                      className="mt-1 p-2 border border-transparent rounded-md hover:border-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-all group"
                      onClick={() => setEditingCategory(true)}
                    >
                      <div className="flex items-center justify-between">
                        <Badge variant="secondary" className="text-xs">
                          {editedTransaction.category}
                        </Badge>
                        <Edit3 className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-4">
                {/* Amount Display */}
                <div className="text-center p-6 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-lg">
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    Transaction Amount
                  </div>
                  <div className={`text-4xl font-bold ${
                    transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {transaction.type === 'income' ? '+' : ''}{formatCurrency(parseFloat(transaction.amount))}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Raw: {formatCurrency(parseFloat(transaction.rawAmount))}
                  </div>
                </div>

                {/* Tax Deductible Tag */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Tags</Label>
                  <div className="flex flex-wrap gap-2">
                    <Badge 
                      variant={editedTransaction.isTaxDeductible ? "default" : "outline"}
                      className={`cursor-pointer transition-all ${
                        editedTransaction.isTaxDeductible 
                          ? 'bg-green-600 hover:bg-green-700 text-white' 
                          : 'hover:bg-green-50 hover:border-green-300'
                      }`}
                      onClick={() => {
                        setEditedTransaction(prev => prev ? { ...prev, isTaxDeductible: !prev.isTaxDeductible } : null);
                        setPendingChanges({...pendingChanges, isTaxDeductible: !editedTransaction.isTaxDeductible});
                        setShowRulePrompt(true);
                      }}
                    >
                      <Tag className="w-3 h-3 mr-1" />
                      Tax Deductible
                    </Badge>
                    {editedTransaction.tags?.map((tag, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Notes Section */}
            <div>
              <Label htmlFor="notes" className="text-sm font-medium">
                Notes
              </Label>
              <Textarea
                id="notes"
                value={editedTransaction.notes || ''}
                onChange={(e) => setEditedTransaction(prev => prev ? { ...prev, notes: e.target.value } : null)}
                disabled={!isEditing}
                placeholder="Add a note..."
                className="mt-1 min-h-[80px]"
              />
            </div>

            {/* Actions Section */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">ACTIONS</h3>
              
              {/* Ignore Section */}
              <Card>
                <CardContent className="p-4">
                  <Button
                    variant="ghost"
                    className="w-full justify-between"
                    onClick={() => setShowIgnoreOptions(!showIgnoreOptions)}
                  >
                    <div className="flex items-center gap-2">
                      <EyeOff className="w-4 h-4" />
                      <span>Ignore?</span>
                      <span className="text-sm text-gray-500">
                        {editedTransaction.isIgnored ? 'Currently ignored' : 'Not ignored'}
                      </span>
                    </div>
                    {showIgnoreOptions ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </Button>
                  
                  {showIgnoreOptions && (
                    <div className="mt-3 space-y-2 border-t pt-3">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => handleIgnore('this')}
                      >
                        Ignore this transaction only
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => handleIgnore('all')}
                      >
                        Ignore from all accounts
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => handleIgnore('future')}
                      >
                        Ignore future transactions like this
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Split Transaction */}
              <Card>
                <CardContent className="p-4">
                  <Button
                    variant="ghost"
                    className="w-full justify-between hover:bg-blue-50 dark:hover:bg-blue-900/20"
                    onClick={() => setShowSplitModal(true)}
                  >
                    <div className="flex items-center gap-2">
                      <Split className="w-4 h-4 text-blue-600" />
                      <span>Split Transaction</span>
                      <span className="text-xs text-gray-500">Break into multiple categories</span>
                    </div>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </CardContent>
              </Card>

              {/* Rules */}
              <Card>
                <CardContent className="p-4">
                  <Button
                    variant="ghost"
                    className="w-full justify-between hover:bg-purple-50 dark:hover:bg-purple-900/20"
                    onClick={() => setShowRuleModal(true)}
                  >
                    <div className="flex items-center gap-2">
                      <Settings className="w-4 h-4 text-purple-600" />
                      <span>Create Automation Rule</span>
                      <span className="text-xs text-gray-500">Auto-categorize similar transactions</span>
                    </div>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Bank Details Section */}
            <div>
              <Button
                variant="ghost"
                className="w-full justify-between mb-3"
                onClick={() => setShowBankDetails(!showBankDetails)}
              >
                <span className="text-sm font-medium">Bank Details</span>
                {showBankDetails ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </Button>
              
              {showBankDetails && currentAccount && (
                <Card>
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Account</span>
                      <span className="font-medium">{currentAccount.name}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Type</span>
                      <span className="font-medium">{currentAccount.subtype}</span>
                    </div>
                    {currentAccount.mask && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Account Number</span>
                        <span className="font-medium">****{currentAccount.mask}</span>
                      </div>
                    )}
                    {transaction.paymentChannel && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Payment Channel</span>
                        <span className="font-medium capitalize">{transaction.paymentChannel}</span>
                      </div>
                    )}
                    <div className="text-xs text-gray-500 mt-3 pt-3 border-t">
                      Transaction ID: {transaction.id}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="flex gap-2">
              {isEditing ? (
                <>
                  <Button variant="outline" onClick={() => setIsEditing(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleSave}
                    disabled={updateTransaction.isPending}
                  >
                    {updateTransaction.isPending ? 'Saving...' : 'Save Changes'}
                  </Button>
                </>
              ) : (
                <Button onClick={() => setIsEditing(true)}>
                  Edit Transaction
                </Button>
              )}
            </div>
            <Button variant="ghost" onClick={onClose}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Rule Update Prompt */}
      <Dialog open={showRulePrompt} onOpenChange={setShowRulePrompt}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-600" />
              Update Rule?
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              You've made changes to this transaction. Would you like to create a rule to automatically apply these changes to similar transactions in the future?
            </p>
            <div className="flex gap-2">
              <Button 
                onClick={() => {
                  setShowRulePrompt(false);
                  setShowRuleModal(true);
                }}
                className="flex-1"
              >
                Create Rule
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowRulePrompt(false);
                  handleSave();
                }}
                className="flex-1"
              >
                Just This One
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Transaction Split Modal */}
      {showSplitModal && (
        <TransactionSplitModal
          transaction={transaction}
          isOpen={showSplitModal}
          onClose={() => setShowSplitModal(false)}
        />
      )}

      {/* Create Rule Modal */}
      {showRuleModal && (
        <CreateRuleModal
          transaction={transaction}
          pendingChanges={pendingChanges}
          isOpen={showRuleModal}
          onClose={() => setShowRuleModal(false)}
          onSuccess={() => {
            setShowRuleModal(false);
            onClose(); // Close the parent Transaction Details modal
          }}
        />
      )}
    </>
  );
}