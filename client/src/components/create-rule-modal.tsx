import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  X, 
  Settings, 
  Search,
  Filter,
  DollarSign,
  Calendar,
  Building2,
  Tag,
  ChevronRight,
  CheckCircle,
  AlertCircle,
  Plus,
  Trash2,
  ArrowLeft,
  Receipt,
  Edit,
  FileText,
  Archive,
  ShieldCheck
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/financial-utils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface Transaction {
  id: string;
  date: string;
  description: string;
  merchant?: string;
  amount: string;
  type: 'income' | 'expense';
  category: string;
  categoryId?: string;
  accountId?: string;
}

interface CreateRuleModalProps {
  transaction: Transaction | null;
  pendingChanges?: Partial<Transaction>;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function CreateRuleModal({ transaction, pendingChanges, isOpen, onClose, onSuccess }: CreateRuleModalProps) {
  const [phase, setPhase] = useState<'definition' | 'actions'>('definition');
  const [ruleName, setRuleName] = useState('');
  
  // Rule definition phase
  const [matchByName, setMatchByName] = useState(true);
  const [nameValue, setNameValue] = useState('');
  const [matchByAmount, setMatchByAmount] = useState(false);
  const [amountValue, setAmountValue] = useState('');
  const [filterByAccount, setFilterByAccount] = useState(false);
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);
  const [matchedTransactions, setMatchedTransactions] = useState<Transaction[]>([]);
  
  // Actions phase
  const [changeCategory, setChangeCategory] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [renameTransactions, setRenameTransactions] = useState(false);
  const [newTransactionName, setNewTransactionName] = useState('');
  const [assignToBill, setAssignToBill] = useState(false);
  const [selectedBillId, setSelectedBillId] = useState('');
  const [ignoreTransactions, setIgnoreTransactions] = useState(false);
  const [markTaxDeductible, setMarkTaxDeductible] = useState(false);
  
  // Conflict resolution state
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [conflictingRule, setConflictingRule] = useState<any>(null);
  const [pendingRuleData, setPendingRuleData] = useState<any>(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get all transactions for preview
  const { data: allTransactions = [] } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions"],
    enabled: isOpen,
  });

  // Get categories for dropdown
  const { data: categories = [] } = useQuery({
    queryKey: ["/api/admin/categories"],
    enabled: isOpen,
  });

  // Get accounts for filtering
  const { data: accounts = [] } = useQuery({
    queryKey: ["/api/accounts"],
    enabled: isOpen,
  });

  // Get bills/subscriptions for assignment
  const { data: bills = [] } = useQuery({
    queryKey: ["/api/bills"],
    enabled: isOpen,
  });

  // Get existing automation rules for conflict detection
  const { data: existingRules = [] } = useQuery({
    queryKey: ["/api/automation-rules"],
    enabled: isOpen,
  });

  // Initialize form with current transaction data
  useEffect(() => {
    if (transaction && isOpen) {
      setRuleName(`Auto-categorize ${transaction.merchant || transaction.description.split(' ')[0]} transactions`);
      setNameValue(transaction.merchant || transaction.description || '');
      setAmountValue(transaction.amount);
      if (pendingChanges?.category) {
        setSelectedCategoryId(pendingChanges.categoryId || '');
      }
      if (pendingChanges?.description) {
        setNewTransactionName(pendingChanges.description);
      }
    }
  }, [transaction, pendingChanges, isOpen]);

  // Dynamic preview update
  useEffect(() => {
    if (allTransactions.length > 0 && phase === 'definition') {
      const matched = allTransactions.filter(tx => {
        let matches = true;

        // Match by name
        if (matchByName && nameValue.trim()) {
          const txName = (tx.merchant || tx.description || '').toLowerCase();
          const searchName = nameValue.toLowerCase().trim();
          matches = matches && txName.includes(searchName);
        }

        // Match by amount
        if (matchByAmount && amountValue.trim()) {
          const txAmount = parseFloat(tx.amount);
          const searchAmount = parseFloat(amountValue);
          matches = matches && Math.abs(txAmount - searchAmount) < 0.01;
        }

        // Filter by account
        if (filterByAccount && selectedAccounts.length > 0) {
          matches = matches && selectedAccounts.includes(tx.accountId || '');
        }

        return matches;
      });
      
      setMatchedTransactions(matched.slice(0, 50)); // Limit to 50 for performance
    }
  }, [matchByName, nameValue, matchByAmount, amountValue, filterByAccount, selectedAccounts, allTransactions, phase]);

  // Check for conflicting rules
  const checkForConflicts = (ruleData: any) => {
    if (!existingRules?.length) return null;
    
    const conflicts = existingRules.filter((rule: any) => {
      if (!rule.isActive) return false;
      
      // Check for name pattern conflicts
      if (ruleData.conditions.some((c: any) => c.field === 'name')) {
        const nameCondition = ruleData.conditions.find((c: any) => c.field === 'name');
        if (rule.merchantPattern && nameCondition) {
          return rule.merchantPattern.toLowerCase().includes(nameCondition.value.toLowerCase()) ||
                 nameCondition.value.toLowerCase().includes(rule.merchantPattern.toLowerCase());
        }
      }
      
      // Check for amount conflicts
      if (ruleData.conditions.some((c: any) => c.field === 'amount')) {
        const amountCondition = ruleData.conditions.find((c: any) => c.field === 'amount');
        if (rule.amountMin && rule.amountMax && amountCondition) {
          const amount = parseFloat(amountCondition.value);
          return amount >= parseFloat(rule.amountMin) && amount <= parseFloat(rule.amountMax);
        }
      }
      
      return false;
    });
    
    return conflicts.length > 0 ? conflicts[0] : null;
  };

  // Delete rule mutation
  const deleteRule = useMutation({
    mutationFn: async (ruleId: string) => {
      return apiRequest(`/api/automation-rules/${ruleId}`, 'DELETE');
    },
    onSuccess: () => {
      console.log('✅ Rule deleted successfully, closing modals...');
      queryClient.invalidateQueries({ queryKey: ['/api/automation-rules'] });
      queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
      toast({
        title: "Success",
        description: "Automation rule deleted successfully!"
      });
      
      // Always close the conflict modal first
      setShowConflictModal(false);
      
      // Always close all modals after deletion - user just wanted to delete the rule
      console.log('🚪 Rule deleted, closing all modals and returning to main interface...');
      
      // Reset all modal states immediately
      setPendingRuleData(null);
      setConflictingRule(null);
      
      // Force close all modals
      setTimeout(() => {
        console.log('🔚 Force closing main modal after rule deletion');
        if (onSuccess) {
          onSuccess();
        } else {
          onClose();
        }
      }, 300);
    },
    onError: (error: any) => {
      toast({
        title: "Error", 
        description: error.message || "Failed to delete rule",
        variant: "destructive"
      });
    }
  });

  // Update rule mutation
  const updateRule = useMutation({
    mutationFn: async ({ ruleId, updates }: { ruleId: string; updates: any }) => {
      return apiRequest(`/api/automation-rules/${ruleId}`, 'PATCH', updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/automation-rules'] });
      queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
      toast({
        title: "Success",
        description: "Automation rule updated successfully!"
      });
      setShowConflictModal(false);
      if (onSuccess) {
        onSuccess();
      } else {
        onClose();
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error", 
        description: error.message || "Failed to update rule",
        variant: "destructive"
      });
    }
  });

  // Create rule mutation
  const createRule = useMutation({
    mutationFn: async (ruleData: any) => {
      // Check for conflicts before creating
      const conflict = checkForConflicts(ruleData);
      if (conflict) {
        // Show conflict resolution modal instead of throwing error
        setConflictingRule(conflict);
        setPendingRuleData(ruleData);
        setShowConflictModal(true);
        throw new Error('CONFLICT_DETECTED'); // Special error to handle silently
      }
      return apiRequest('/api/automation-rules', 'POST', ruleData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/automation-rules'] });
      queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
      toast({
        title: "Success",
        description: "Automation rule created successfully!"
      });
      if (onSuccess) {
        onSuccess();
      } else {
        onClose();
      }
    },
    onError: (error: any) => {
      // Don't show toast for conflict detection, modal will handle it
      if (error.message !== 'CONFLICT_DETECTED') {
        toast({
          title: "Error", 
          description: error.message || "Failed to create rule",
          variant: "destructive"
        });
      }
    }
  });

  const handleContinue = () => {
    if (!ruleName.trim()) {
      toast({
        title: "Missing Rule Name",
        description: "Please provide a name for this rule",
        variant: "destructive"
      });
      return;
    }

    if (!matchByName && !matchByAmount) {
      toast({
        title: "No Matching Criteria",
        description: "Please select at least one matching criteria",
        variant: "destructive"
      });
      return;
    }

    if (matchByName && !nameValue.trim()) {
      toast({
        title: "Missing Name Value",
        description: "Please provide a name to match against",
        variant: "destructive"
      });
      return;
    }

    if (matchByAmount && !amountValue.trim()) {
      toast({
        title: "Missing Amount Value",
        description: "Please provide an amount to match against",
        variant: "destructive"
      });
      return;
    }

    setPhase('actions');
  };

  const handleSaveRule = () => {
    if (!changeCategory && !renameTransactions && !assignToBill && !ignoreTransactions && !markTaxDeductible) {
      toast({
        title: "No Actions Selected",
        description: "Please select at least one action to apply",
        variant: "destructive"
      });
      return;
    }

    const actions = [];
    
    if (changeCategory && selectedCategoryId) {
      actions.push({
        type: 'set_category',
        value: selectedCategoryId
      });
    }
    
    if (renameTransactions && newTransactionName.trim()) {
      actions.push({
        type: 'rename_transaction',
        value: newTransactionName.trim()
      });
    }
    
    if (assignToBill && selectedBillId) {
      actions.push({
        type: 'assign_to_bill',
        value: selectedBillId
      });
    }
    
    if (ignoreTransactions) {
      actions.push({
        type: 'ignore_transaction',
        value: 'true'
      });
    }
    
    if (markTaxDeductible) {
      actions.push({
        type: 'mark_tax_deductible',
        value: 'true'
      });
    }

    const conditions = [];
    
    if (matchByName && nameValue.trim()) {
      conditions.push({
        field: 'name',
        operator: 'contains',
        value: nameValue.trim()
      });
    }
    
    if (matchByAmount && amountValue.trim()) {
      conditions.push({
        field: 'amount',
        operator: 'equals',
        value: amountValue.trim()
      });
    }
    
    if (filterByAccount && selectedAccounts.length > 0) {
      conditions.push({
        field: 'account',
        operator: 'in',
        value: selectedAccounts.join(',')
      });
    }

    const ruleData = {
      name: ruleName,
      isActive: true,
      conditions,
      actions,
      createdFromTransactionId: transaction?.id
    };

    createRule.mutate(ruleData);
  };

  const handleBack = () => {
    if (phase === 'actions') {
      setPhase('definition');
    } else {
      onClose();
    }
  };

  const resetModal = () => {
    setPhase('definition');
    setRuleName('');
    setMatchByName(true);
    setNameValue('');
    setMatchByAmount(false);
    setAmountValue('');
    setFilterByAccount(false);
    setSelectedAccounts([]);
    setMatchedTransactions([]);
    setChangeCategory(false);
    setSelectedCategoryId('');
    setRenameTransactions(false);
    setNewTransactionName('');
    setAssignToBill(false);
    setSelectedBillId('');
    setIgnoreTransactions(false);
    setMarkTaxDeductible(false);
  };

  useEffect(() => {
    if (!isOpen) {
      resetModal();
    }
  }, [isOpen]);

  if (!transaction) return null;

  return (
    <>
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="border-b pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost" 
                size="sm"
                onClick={handleBack}
                className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                <Settings className="w-5 h-5 text-white" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold">
                  {phase === 'definition' ? 'Create Automation Rule' : 'Apply Updates'}
                </DialogTitle>
                <div className="text-sm text-gray-600 mt-1">
                  {phase === 'definition' 
                    ? 'Define how to identify transactions'
                    : 'Select the updates you\'d like to apply to all matched transactions'
                  }
                </div>
              </div>
            </div>
            <Button variant="outline" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>

        {phase === 'definition' ? (
          <div className="space-y-6 p-6">
            {/* Rule Name */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Rule Name</Label>
              <Input
                value={ruleName}
                onChange={(e) => setRuleName(e.target.value)}
                placeholder="Enter a name for this rule"
                className="w-full"
              />
            </div>

            {/* Matching Options */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Define Matching Criteria</h3>
              
              {/* Match by Name */}
              <div className="flex items-start space-x-3">
                <Checkbox
                  checked={matchByName}
                  onCheckedChange={(checked) => setMatchByName(checked === true)}
                  className="mt-1"
                />
                <div className="flex-1 space-y-2">
                  <Label className="text-sm font-medium">Match by Name</Label>
                  <Input
                    value={nameValue}
                    onChange={(e) => setNameValue(e.target.value)}
                    placeholder="Enter transaction name or merchant"
                    disabled={!matchByName}
                    className="w-full"
                  />
                  <p className="text-xs text-gray-500">
                    Matches transactions containing this text in name or merchant
                  </p>
                </div>
              </div>

              {/* Match by Amount */}
              <div className="flex items-start space-x-3">
                <Checkbox
                  checked={matchByAmount}
                  onCheckedChange={(checked) => setMatchByAmount(checked === true)}
                  className="mt-1"
                />
                <div className="flex-1 space-y-2">
                  <Label className="text-sm font-medium">Match by Amount</Label>
                  <Input
                    type="number"
                    value={amountValue}
                    onChange={(e) => setAmountValue(e.target.value)}
                    placeholder="Enter exact amount"
                    disabled={!matchByAmount}
                    className="w-full"
                    step="0.01"
                  />
                  <p className="text-xs text-gray-500">
                    Matches transactions with this exact amount
                  </p>
                </div>
              </div>

              {/* Filter by Account */}
              <div className="flex items-start space-x-3">
                <Checkbox
                  checked={filterByAccount}
                  onCheckedChange={(checked) => setFilterByAccount(checked === true)}
                  className="mt-1"
                />
                <div className="flex-1 space-y-2">
                  <Label className="text-sm font-medium">Filter by Account</Label>
                  <Select
                    value={selectedAccounts[0] || ''}
                    onValueChange={(value) => setSelectedAccounts([value])}
                    disabled={!filterByAccount}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select account" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.isArray(accounts) && accounts.map((account: any) => (
                        <SelectItem key={account.id} value={account.id}>
                          <div className="flex items-center gap-2">
                            <Building2 className="w-3 h-3" />
                            {account.name || `Account ending in ${account.mask}`}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500">
                    Only match transactions from selected accounts
                  </p>
                </div>
              </div>
            </div>

            {/* Preview */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Preview</h3>
                <Badge variant="secondary" className="text-xs">
                  {matchedTransactions.length} transactions match
                </Badge>
              </div>
              
              <ScrollArea className="h-64 border rounded-lg">
                <div className="p-4 space-y-2">
                  {matchedTransactions.length === 0 ? (
                    <div className="text-center text-gray-500 py-8">
                      <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p>No transactions match your criteria</p>
                      <p className="text-sm">Try adjusting your matching options</p>
                    </div>
                  ) : (
                    matchedTransactions.map((tx) => (
                      <div key={tx.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <div className="font-medium text-sm truncate">{tx.merchant || tx.description}</div>
                            <Badge variant="outline" className="text-xs">{tx.category}</Badge>
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {formatDate(tx.date)}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium text-sm">
                            {formatCurrency(parseFloat(tx.amount))}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </div>

            {/* Continue Button */}
            <div className="flex justify-end pt-4">
              <Button onClick={handleContinue} className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
                Continue
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6 p-6">
            {/* Summary */}
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <div className="text-sm text-gray-600 mb-2">
                Select the updates you'd like to apply to all of the transactions that matched your rule. You may go back to adjust your rule at any time.
              </div>
              <Badge className="bg-black text-white text-sm px-4 py-1">
                These will apply to {matchedTransactions.length} transactions
              </Badge>
            </div>

            {/* Action Options */}
            <div className="space-y-4">
              {/* Change Category */}
              <Card className="border-2 border-purple-100">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={changeCategory}
                        onCheckedChange={(checked) => setChangeCategory(checked === true)}
                      />
                      <Receipt className="w-5 h-5 text-gray-400" />
                      <div>
                        <div className="font-medium">Change Category</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {changeCategory ? (
                        <Select
                          value={selectedCategoryId}
                          onValueChange={setSelectedCategoryId}
                        >
                          <SelectTrigger className="w-48">
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.isArray(categories) && categories.map((category: any) => (
                              <SelectItem key={category.id} value={category.id}>
                                {category.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Badge className="bg-black text-white">No category selected</Badge>
                      )}
                      <Button variant="outline" size="sm">Change</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Rename Transactions */}
              <Card className="border-2 border-purple-100">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={renameTransactions}
                        onCheckedChange={(checked) => setRenameTransactions(checked === true)}
                      />
                      <Edit className="w-5 h-5 text-gray-400" />
                      <div>
                        <div className="font-medium">Rename Transactions</div>
                      </div>
                    </div>
                    <div className="flex-1 max-w-xs ml-4">
                      {renameTransactions ? (
                        <Input
                          value={newTransactionName}
                          onChange={(e) => setNewTransactionName(e.target.value)}
                          placeholder="Enter new name"
                          className="w-full"
                        />
                      ) : (
                        <div className="text-sm text-gray-500">Miscellaneous</div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Assign to Bill/Subscription */}
              <Card className="border-2 border-purple-100">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={assignToBill}
                        onCheckedChange={(checked) => setAssignToBill(checked === true)}
                      />
                      <FileText className="w-5 h-5 text-gray-400" />
                      <div>
                        <div className="font-medium">Assign to Bill/Subscription</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {assignToBill ? (
                        <Select
                          value={selectedBillId}
                          onValueChange={setSelectedBillId}
                        >
                          <SelectTrigger className="w-48">
                            <SelectValue placeholder="Select bill" />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.isArray(bills) && bills.map((bill: any) => (
                              <SelectItem key={bill.id} value={bill.id}>
                                {bill.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Badge className="bg-black text-white">No bill/subscription selected</Badge>
                      )}
                      <Button variant="outline" size="sm">Change</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Ignore Transactions */}
              <Card className="border-2 border-purple-100">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={ignoreTransactions}
                        onCheckedChange={(checked) => setIgnoreTransactions(checked === true)}
                      />
                      <Archive className="w-5 h-5 text-gray-400" />
                      <div>
                        <div className="font-medium">Ignore Transactions</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {ignoreTransactions ? (
                        <Badge className="bg-green-500 text-white">Will ignore</Badge>
                      ) : (
                        <Badge className="bg-black text-white">No option selected</Badge>
                      )}
                      <Button variant="outline" size="sm">Change</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Mark as Tax Deductible */}
              <Card className="border-2 border-purple-100">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={markTaxDeductible}
                      onCheckedChange={(checked) => setMarkTaxDeductible(checked === true)}
                    />
                    <ShieldCheck className="w-5 h-5 text-gray-400" />
                    <div>
                      <div className="font-medium">Mark as Tax Deductible</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Save Button */}
            <div className="flex justify-end pt-4">
              <Button 
                onClick={handleSaveRule}
                disabled={createRule.isPending}
                className="bg-black text-white hover:bg-gray-800"
              >
                {createRule.isPending ? 'Saving...' : 'Save Rule'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>

    {/* Conflict Resolution Modal */}
    <Dialog open={showConflictModal} onOpenChange={setShowConflictModal}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-yellow-600" />
            Conflicting Rule Detected
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            You already have a rule that affects similar transactions:
          </p>
          
          {conflictingRule && (
            <Card>
              <CardContent className="p-4">
                <div className="space-y-2">
                  <div className="font-semibold text-sm">{conflictingRule.name}</div>
                  {conflictingRule.description && (
                    <div className="text-xs text-gray-500">{conflictingRule.description}</div>
                  )}
                  <div className="flex flex-wrap gap-1 mt-2">
                    {conflictingRule.merchantPattern && (
                      <Badge variant="outline" className="text-xs">
                        Name: {conflictingRule.merchantPattern}
                      </Badge>
                    )}
                    {conflictingRule.amountMin && conflictingRule.amountMax && (
                      <Badge variant="outline" className="text-xs">
                        Amount: ${conflictingRule.amountMin} - ${conflictingRule.amountMax}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          
          <p className="text-sm text-gray-600">
            Choose an option:
          </p>
          
          <div className="space-y-2">
            <Button 
              onClick={() => {
                // Replace the existing rule with new rule logic
                if (conflictingRule && pendingRuleData) {
                  updateRule.mutate({
                    ruleId: conflictingRule.id,
                    updates: {
                      name: pendingRuleData.name,
                      merchantPattern: pendingRuleData.conditions.find((c: any) => c.field === 'name')?.value,
                      descriptionPattern: pendingRuleData.conditions.find((c: any) => c.field === 'name')?.value,
                      renameTransactionTo: pendingRuleData.actions.find((a: any) => a.type === 'rename_transaction')?.value,
                      setCategoryId: pendingRuleData.actions.find((a: any) => a.type === 'set_category')?.value,
                      enableRename: pendingRuleData.actions.some((a: any) => a.type === 'rename_transaction'),
                      enableCategoryChange: pendingRuleData.actions.some((a: any) => a.type === 'set_category'),
                    }
                  });
                }
              }}
              className="w-full"
              disabled={updateRule.isPending}
            >
              {updateRule.isPending ? 'Updating...' : 'Update Existing Rule'}
            </Button>
            
            <Button 
              onClick={() => {
                console.log('🗑️ User clicked Delete Existing Rule button');
                console.log('🔍 Current state:', {
                  conflictingRule: conflictingRule?.id,
                  pendingRuleData: !!pendingRuleData,
                  showConflictModal
                });
                if (conflictingRule) {
                  deleteRule.mutate(conflictingRule.id);
                }
              }}
              variant="destructive"
              className="w-full"
              disabled={deleteRule.isPending}
            >
              {deleteRule.isPending ? 'Deleting...' : 'Delete Existing Rule'}
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => {
                setShowConflictModal(false);
                setConflictingRule(null);
                setPendingRuleData(null);
              }}
              className="w-full"
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
}