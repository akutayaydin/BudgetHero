import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Plus, AlertCircle, TrendingUp, Bell, Settings, Sparkles, ClipboardList, Eye, MoreHorizontal, History, CheckCircle2, XCircle, Clock } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/financial-utils";
import RecurringCalendar from "@/components/recurring-calendar";
import RecurringList from "@/components/recurring-list";
import RecentRecurringCharges from "@/components/recent-recurring-charges";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { ManualRecurringSelection } from "@/components/manual-recurring-selection";

interface RecurringTransaction {
  id: string;
  name: string;
  merchant?: string;
  category: string;
  amount: number;
  frequency: 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'yearly' | 'irregular';
  nextDueDate?: string;
  lastTransactionDate?: string;
  isActive: boolean;
  autoDetected: boolean;
  confidence?: number;
  tags: string[];
  notes?: string;
  notificationDays: number;
  accountId?: string;
  occurrences: number;
  avgAmount: number;
  amountVariance: number;
  dayOfMonth?: number;
  excludeFromBills?: boolean;
  merchantLogo?: string;
}

interface ManualSubscription {
  id: string;
  name: string;
  amount?: number;
  frequency: string;
  startDate: string;
  endDate?: string;
  isTrial: boolean;
  trialEndsAt?: string;
  category: string;
  notes?: string;
  isActive: boolean;
}

interface MissedPayment extends RecurringTransaction {
  daysPastDue: number;
  status: 'late' | 'overdue';
  urgency: 'low' | 'medium' | 'high';
}

export default function RecurringPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"upcoming" | "all" | "missed" | "review">("upcoming");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newSubscription, setNewSubscription] = useState({
    name: "",
    amount: "",
    frequency: "monthly",
    type: "", // 'subscription' or 'bill'
    category: "",
    startDate: new Date().toISOString().split('T')[0]
  });
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showMoreReviews, setShowMoreReviews] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [selectedMerchant, setSelectedMerchant] = useState<{name: string, decision: 'recurring' | 'non-recurring'} | null>(null);
  const [relatedTransactionsOpen, setRelatedTransactionsOpen] = useState(false);
  const [selectedMerchantForTransactions, setSelectedMerchantForTransactions] = useState<string | null>(null);
  const [manualSelectionOpen, setManualSelectionOpen] = useState(false);
  const [selectedMerchantForManualSelection, setSelectedMerchantForManualSelection] = useState<string | null>(null);

  // Force fresh data on component mount
  useEffect(() => {
    queryClient.removeQueries({ queryKey: ['/api/manual-subscriptions'] });
    queryClient.removeQueries({ queryKey: ['/api/recurring-transactions'] });
    queryClient.invalidateQueries({ queryKey: ['/api/manual-subscriptions'] });
    queryClient.invalidateQueries({ queryKey: ['/api/recurring-transactions'] });
  }, [queryClient]);

  // Stop the aggressive refetching since we're now unified
  useEffect(() => {
    const timer = setTimeout(() => {
      // Remove aggressive refetching after 10 seconds
      queryClient.setQueryData(['/api/manual-subscriptions'], (old: any) => old);
    }, 10000);
    return () => clearTimeout(timer);
  }, [queryClient]);

  // Mutation for creating new manual subscription
  // Mutation for creating user recurring overrides
  const createOverride = useMutation({
    mutationFn: async (overrideData: {
      merchantName: string;
      recurringStatus: 'recurring' | 'non-recurring';
      applyToAll: boolean;
    }) => {
      return apiRequest('/api/user/recurring-overrides', 'POST', overrideData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user/recurring-overrides'] });
      queryClient.invalidateQueries({ queryKey: ['/api/user/recurring-overrides/summary'] });
      queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
      toast({
        title: "Success",
        description: "Transaction classification updated successfully!"
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update classification. Please try again.",
        variant: "destructive"
      });
    }
  });

  const handleRecurringDecision = (merchantName: string, decision: 'recurring' | 'non-recurring') => {
    if (decision === 'recurring') {
      // For recurring confirmation, open manual selection dialog
      setSelectedMerchantForManualSelection(merchantName);
      setManualSelectionOpen(true);
    } else {
      // For non-recurring, use the existing confirmation flow
      setSelectedMerchant({name: merchantName, decision});
      setConfirmDialogOpen(true);
    }
  };

  const confirmDecision = (applyToAll: boolean) => {
    if (!selectedMerchant) return;
    
    createOverride.mutate({
      merchantName: selectedMerchant.name,
      recurringStatus: selectedMerchant.decision,
      applyToAll
    });
    
    setConfirmDialogOpen(false);
    setSelectedMerchant(null);
  };

  const showRelatedTransactions = (merchantName: string) => {
    setSelectedMerchantForTransactions(merchantName);
    setRelatedTransactionsOpen(true);
  };

  // Handle manual recurring selection results
  const handleManualSelectionConfirm = async (selectedTransactionIds: string[], applyToFuture: boolean) => {
    if (!selectedMerchantForManualSelection) return;

    try {
      const response = await fetch('/api/user/recurring-overrides/manual-selection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          merchantName: selectedMerchantForManualSelection,
          selectedTransactionIds,
          applyToFuture,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to apply manual selection');
      }

      const result = await response.json();
      
      toast({
        title: "Selection Applied",
        description: `Successfully processed ${result.result.selectedCount} transactions. ${
          result.result.rulesCreated ? "Smart rules created for future transactions." : ""
        }`,
      });

      // Invalidate relevant queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/user/recurring-overrides'] });
      queryClient.invalidateQueries({ queryKey: ['/api/user/recurring-overrides/summary'] });
      
      // Close the dialog
      setManualSelectionOpen(false);
      setSelectedMerchantForManualSelection(null);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to apply selection",
        variant: "destructive",
      });
    }
  };

  const createSubscription = useMutation({
    mutationFn: async (subscriptionData: any) => {
      return apiRequest('/api/manual-subscriptions', 'POST', {
        ...subscriptionData,
        amount: parseFloat(subscriptionData.amount),
        isTrial: false,
        isActive: true
      });
    },
    onSuccess: () => {
      // Clear all cache and force immediate refetch
      queryClient.removeQueries({ queryKey: ['/api/manual-subscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/manual-subscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/recurring-transactions'] });
      queryClient.refetchQueries({ queryKey: ['/api/manual-subscriptions'] });
      setIsAddDialogOpen(false);
      setNewSubscription({
        name: "",
        amount: "",
        frequency: "monthly",
        type: "",
        category: "",
        startDate: new Date().toISOString().split('T')[0]
      });
      toast({
        title: "Success",
        description: "New subscription added successfully!"
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add subscription. Please try again.",
        variant: "destructive"
      });
    }
  });

  const handleCreateSubscription = () => {
    if (!newSubscription.name || !newSubscription.amount || !newSubscription.type) {
      toast({
        title: "Error",
        description: "Please fill in all required fields including type.",
        variant: "destructive"
      });
      return;
    }
    createSubscription.mutate(newSubscription);
  };

  // Queries for user overrides and recurring data
  const { data: userOverrides = [] } = useQuery<any[]>({
    queryKey: ['/api/user/recurring-overrides'],
  });

  const { data: overrideSummary = { totalOverrides: 0, merchantCount: 0, transactionCount: 0 } } = useQuery<{
    totalOverrides: number;
    merchantCount: number;
    transactionCount: number;
  }>({
    queryKey: ['/api/user/recurring-overrides/summary'],
  });

  const { data: recurringTransactions = [], isLoading: loadingRecurring } = useQuery<RecurringTransaction[]>({
    queryKey: ["/api/recurring-transactions"],
    refetchOnWindowFocus: false,
    staleTime: 0, // Always fresh data
  });

  const { data: manualSubscriptions = [], isLoading: loadingManual } = useQuery<ManualSubscription[]>({
    queryKey: ["/api/manual-subscriptions"],
    refetchOnWindowFocus: false,
    staleTime: 30000, // 30 seconds
  });

  // Debug the subscription data
  useEffect(() => {
    console.log('Manual subscriptions data:', manualSubscriptions);
  }, [manualSubscriptions]);

  const { data: missedPayments = [], isLoading: loadingMissed } = useQuery<MissedPayment[]>({
    queryKey: ["/api/recurring-transactions/missed"],
    refetchOnWindowFocus: false,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // Query for user overrides (to filter out already reviewed merchants)
  const { data: userRecurringOverrides = [] } = useQuery<any[]>({
    queryKey: ['/api/user/recurring-overrides'],
    enabled: !!user
  });

  // Query for related transactions when viewing merchant details
  const { data: relatedTransactionsData } = useQuery({
    queryKey: ['/api/user/recurring-overrides/related-transactions', selectedMerchantForTransactions],
    enabled: !!selectedMerchantForTransactions,
    queryFn: async () => {
      const response = await fetch(`/api/user/recurring-overrides/related-transactions?merchant=${encodeURIComponent(selectedMerchantForTransactions || '')}`, {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to fetch related transactions');
      }
      return response.json();
    },
    staleTime: 0
  });

  // Query for related transactions for manual selection dialog
  const { data: manualSelectionTransactionsData } = useQuery({
    queryKey: ['/api/user/recurring-overrides/related-transactions', selectedMerchantForManualSelection],
    enabled: !!selectedMerchantForManualSelection,
    queryFn: async () => {
      const response = await fetch(`/api/user/recurring-overrides/related-transactions?merchant=${encodeURIComponent(selectedMerchantForManualSelection || '')}`, {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to fetch related transactions');
      }
      return response.json();
    },
    staleTime: 0
  });

  // Debug the related transactions response
  useEffect(() => {
    if (relatedTransactionsData) {
      console.log('Related transactions parsed data:', relatedTransactionsData);
    }
  }, [relatedTransactionsData]);

  const isLoading = loadingRecurring || loadingManual || loadingMissed;

  // Query for transaction counts for each merchant
  const { data: merchantCounts = {} } = useQuery({
    queryKey: ['/api/user/recurring-overrides/merchant-counts'],
    enabled: !!user,
    staleTime: 5 * 60 * 1000 // 5 minutes
  }) as { data: Record<string, number> };

  // Filter merchants that have already been reviewed
  const reviewedMerchants = userRecurringOverrides.map((override: any) => override.merchantName.toLowerCase());
  const mockPendingReviews = [
    { name: "Netflix", decision: null, transactionCount: merchantCounts['Netflix'] || 0, description: "Netflix subscription" },
    { name: "Uber Eats", decision: null, transactionCount: merchantCounts['Uber Eats'] || 0, description: "Food delivery service" }, 
    { name: "Spotify Premium", decision: null, transactionCount: merchantCounts['Spotify Premium'] || 0, description: "Music streaming service" },
    { name: "Amazon Prime", decision: null, transactionCount: merchantCounts['Amazon Prime'] || 0, description: "Prime membership" },
    { name: "LA Fitness", decision: null, transactionCount: merchantCounts['LA Fitness'] || 0, description: "Gym membership" }
  ].filter(review => !reviewedMerchants.includes(review.name.toLowerCase()));

  const availableReviewsCount = mockPendingReviews.length;
  const displayedReviewsCount = showMoreReviews ? Math.min(availableReviewsCount, 5) : Math.min(availableReviewsCount, 3);

  // Helper function to calculate next due date for manual subscriptions
  const calculateNextDueDate = (startDate: string, frequency: string): Date => {
    const start = new Date(startDate);
    const today = new Date();
    let nextDue = new Date(start);
    
    // If start date is in the future, return it
    if (start > today) return start;
    
    // Calculate next occurrence
    while (nextDue <= today) {
      switch (frequency.toLowerCase()) {
        case 'weekly':
          nextDue.setDate(nextDue.getDate() + 7);
          break;
        case 'biweekly':
          nextDue.setDate(nextDue.getDate() + 14);
          break;
        case 'monthly':
          nextDue.setMonth(nextDue.getMonth() + 1);
          break;
        case 'quarterly':
          nextDue.setMonth(nextDue.getMonth() + 3);
          break;
        case 'yearly':
          nextDue.setFullYear(nextDue.getFullYear() + 1);
          break;
        default:
          return start;
      }
    }
    
    return nextDue;
  };

  // Calculate upcoming bills for next 7 days (all data is now in recurringTransactions)
  const upcomingBills = recurringTransactions
    .filter(item => {
      if (!item.nextDueDate) {
        console.log(`${item.name}: No due date`);
        return false;
      }
      const dueDate = new Date(item.nextDueDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Reset time to start of day for accurate comparison
      const nextWeek = new Date(today);
      nextWeek.setDate(today.getDate() + 7);
      dueDate.setHours(0, 0, 0, 0); // Reset time for comparison
      
      const isUpcoming = dueDate >= today && dueDate <= nextWeek;
      console.log(`Upcoming filter: ${item.name} due ${dueDate.toDateString()} (today: ${today.toDateString()}, nextWeek: ${nextWeek.toDateString()}) -> ${isUpcoming}`);
      
      // Special debug for parking items
      if (item.name && item.name.toLowerCase().includes('parking')) {
        console.log(`PARKING DEBUG: ${item.name} - dueDate: ${dueDate}, today: ${today}, nextWeek: ${nextWeek}, isUpcoming: ${isUpcoming}`);
      }
      
      return isUpcoming;
    })
    .sort((a, b) => new Date(a.nextDueDate!).getTime() - new Date(b.nextDueDate!).getTime());

  const totalUpcoming = upcomingBills.reduce((sum, bill) => {
    const amount = typeof bill.amount === 'string' ? parseFloat(bill.amount) : bill.amount;
    console.log(`Adding upcoming bill ${bill.name}: ${amount} (type: ${typeof bill.amount}) to total ${sum}`);
    return sum + (isNaN(amount) ? 0 : amount);
  }, 0);

  // Get subscriptions and bills categorized (all data is now in recurringTransactions)
  const subscriptions = recurringTransactions.filter(item => 
    item.category.toLowerCase().includes('subscription') ||
    item.category.toLowerCase().includes('streaming') ||
    item.category.toLowerCase().includes('software') ||
    item.category.toLowerCase().includes('entertainment') ||
    item.category.toLowerCase().includes('membership')
  ).map(item => ({
    ...item,
    nextDueDate: item.nextDueDate || undefined // Ensure nextDueDate is properly passed
  }));

  const billsAndUtilities = recurringTransactions.filter(item => {
    const category = item.category.toLowerCase();
    const isBillCategory = category.includes('utilities') ||
      category.includes('bill') ||
      category.includes('insurance') ||
      category.includes('rent') ||
      category.includes('mortgage') ||
      category.includes('parking') ||
      category.includes('housing') ||
      category.includes('transportation');
    console.log(`Category filter: ${item.name} has category "${item.category}" -> ${isBillCategory}`);
    
    // Special debug for parking items
    if (item.name && item.name.toLowerCase().includes('parking')) {
      console.log(`PARKING CATEGORY DEBUG: ${item.name} - category: "${item.category}", lowercase: "${category}", includes parking: ${category.includes('parking')}, final result: ${isBillCategory}`);
    }
    
    return isBillCategory;
  }).map(item => ({
    ...item,
    nextDueDate: item.nextDueDate || undefined // Ensure nextDueDate is properly passed
  }));

  const totalSubscriptions = subscriptions.reduce((sum, item) => {
    const amount = typeof item.amount === 'string' ? parseFloat(item.amount) : item.amount;
    console.log(`Subscription ${item.name}: amount=${amount}, typeof=${typeof item.amount}`);
    return sum + (isNaN(amount) ? 0 : amount);
  }, 0);

  const totalBills = billsAndUtilities.reduce((sum, item) => {
    const amount = typeof item.amount === 'string' ? parseFloat(item.amount) : item.amount;
    return sum + (isNaN(amount) ? 0 : amount);
  }, 0);

  // Debug logging
  console.log('=== DEBUGGING RECURRING TRANSACTIONS ===');
  console.log('Raw API response count:', recurringTransactions.length);
  
  // Check data structure
  if (recurringTransactions.length > 0) {
    const firstItem = recurringTransactions[0];
    console.log('First item structure:', Object.keys(firstItem));
    console.log('First item full data:', firstItem);
  }
  
  // Check for parking items specifically and their structure
  const parkingItems = recurringTransactions.filter(t => t.name && t.name.toLowerCase().includes('parking'));
  console.log('Found parking items:', parkingItems.length);
  parkingItems.forEach(item => {
    console.log(`Parking item: ${item.name}, category: "${item.category}", nextDueDate: ${item.nextDueDate}`);
    console.log('Full parking item structure:', item);
  });
  
  console.log('All transactions:', recurringTransactions.map(t => `${t.name} (${t.category}) due: ${t.nextDueDate}`));
  console.log('Filtered subscriptions:', subscriptions.map(s => `${s.name} (${s.category})`));
  console.log('Filtered bills and utilities:', billsAndUtilities.map(b => `${b.name} (${b.category})`));
  console.log('Upcoming bills:', upcomingBills.map(u => `${u.name} (${u.category}) due: ${u.nextDueDate}`));
  console.log('=== END DEBUG ===');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-3 sm:p-6 space-y-4 sm:space-y-6">
      {/* Modern Header */}
      <div className="bg-gradient-to-r from-purple-600 via-pink-500 to-orange-500 text-white rounded-2xl p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">Bills & Subscriptions 💳</h1>
            <p className="text-purple-100 text-sm sm:text-base">Manage your recurring payments and never miss a due date</p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                variant="secondary" 
                size="sm" 
                className="bg-white/20 hover:bg-white/30 border-white/30"
                data-testid="button-add-new-subscription"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add New
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Add New Bill & Subscription</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="subscription-type">Type *</Label>
                  <Select 
                    value={newSubscription.type} 
                    onValueChange={(value) => setNewSubscription(prev => ({ 
                      ...prev, 
                      type: value,
                      category: value === 'subscription' ? 'Subscriptions & Memberships' : 'Utilities'
                    }))}
                  >
                    <SelectTrigger data-testid="select-subscription-type">
                      <SelectValue placeholder="Select type..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="subscription">🎵 Subscription</SelectItem>
                      <SelectItem value="bill">📄 Bill & Utility</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subscription-name">Name *</Label>
                  <Input
                    id="subscription-name"
                    placeholder={newSubscription.type === 'subscription' ? "e.g., Netflix, Spotify" : "e.g., Electric Bill, Parking Fee"}
                    value={newSubscription.name}
                    onChange={(e) => setNewSubscription(prev => ({ ...prev, name: e.target.value }))}
                    data-testid="input-subscription-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subscription-amount">Amount *</Label>
                  <Input
                    id="subscription-amount"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={newSubscription.amount}
                    onChange={(e) => setNewSubscription(prev => ({ ...prev, amount: e.target.value }))}
                    data-testid="input-subscription-amount"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subscription-frequency">Frequency</Label>
                  <Select 
                    value={newSubscription.frequency} 
                    onValueChange={(value) => setNewSubscription(prev => ({ ...prev, frequency: value }))}
                  >
                    <SelectTrigger data-testid="select-subscription-frequency">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="quarterly">Quarterly</SelectItem>
                      <SelectItem value="yearly">Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subscription-category">Category</Label>
                  <Select 
                    value={newSubscription.category} 
                    onValueChange={(value) => setNewSubscription(prev => ({ ...prev, category: value }))}
                    disabled={!newSubscription.type}
                  >
                    <SelectTrigger data-testid="select-subscription-category">
                      <SelectValue placeholder={newSubscription.type ? "Select category..." : "Select type first"} />
                    </SelectTrigger>
                    <SelectContent>
                      {newSubscription.type === 'subscription' ? (
                        <>
                          <SelectItem value="Subscriptions & Memberships">🎵 Subscriptions & Memberships</SelectItem>
                          <SelectItem value="Software & Services">💻 Software & Services</SelectItem>
                          <SelectItem value="Entertainment & Recreation">🎬 Entertainment & Recreation</SelectItem>
                          <SelectItem value="Education">📚 Education</SelectItem>
                          <SelectItem value="Health & Medical">🏥 Health & Medical</SelectItem>
                          <SelectItem value="Other">📋 Other</SelectItem>
                        </>
                      ) : newSubscription.type === 'bill' ? (
                        <>
                          <SelectItem value="Housing & Rent">🏠 Housing & Rent</SelectItem>
                          <SelectItem value="Utilities">⚡ Utilities</SelectItem>
                          <SelectItem value="Insurance">🛡️ Insurance</SelectItem>
                          <SelectItem value="Transportation">🚗 Transportation</SelectItem>
                          <SelectItem value="Parking & Tools">🅿️ Parking & Tools</SelectItem>
                          <SelectItem value="Food & Groceries">🛒 Food & Groceries</SelectItem>
                          <SelectItem value="Professional Services">💼 Professional Services</SelectItem>
                          <SelectItem value="Financial Services">💳 Financial Services</SelectItem>
                          <SelectItem value="Other">📋 Other</SelectItem>
                        </>
                      ) : (
                        <SelectItem value="placeholder" disabled>Please select a type first</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subscription-start-date">Due Date</Label>
                  <Input
                    id="subscription-start-date"
                    type="date"
                    value={newSubscription.startDate}
                    onChange={(e) => setNewSubscription(prev => ({ ...prev, startDate: e.target.value }))}
                    data-testid="input-subscription-start-date"
                  />
                </div>
                <div className="flex gap-2 pt-4">
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => setIsAddDialogOpen(false)}
                    data-testid="button-cancel-subscription"
                  >
                    Cancel
                  </Button>
                  <Button 
                    className="flex-1"
                    onClick={handleCreateSubscription}
                    disabled={createSubscription.isPending}
                    data-testid="button-save-subscription"
                  >
                    {createSubscription.isPending ? 'Adding...' : 'Add'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        
        {/* Quick Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
          <button 
            className="bg-white/10 rounded-xl p-3 text-center backdrop-blur-sm hover:bg-white/20 transition-colors cursor-pointer"
            onClick={() => setActiveTab("all")}
            data-testid="button-total-items"
          >
            <div className="text-lg font-bold">{recurringTransactions.length + manualSubscriptions.length}</div>
            <div className="text-xs text-purple-100">Total Items</div>
          </button>
          <div className="bg-white/10 rounded-xl p-3 text-center backdrop-blur-sm">
            <div className="text-lg font-bold">{upcomingBills.length}</div>
            <div className="text-xs text-purple-100">Due Soon</div>
          </div>
          <div className="bg-white/10 rounded-xl p-3 text-center backdrop-blur-sm">
            <div className="text-lg font-bold">{formatCurrency(totalUpcoming)}</div>
            <div className="text-xs text-purple-100">Next 7 Days</div>
          </div>
          <div className="bg-white/10 rounded-xl p-3 text-center backdrop-blur-sm">
            <div className="text-lg font-bold">{formatCurrency(totalSubscriptions + totalBills)}</div>
            <div className="text-xs text-purple-100">Monthly Total</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "upcoming" | "all" | "missed" | "review")} className="w-full">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <TabsList className="grid w-full sm:w-auto grid-cols-4 bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
              <TabsTrigger value="upcoming" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg">
                <Calendar className="h-4 w-4" />
                <span className="hidden sm:inline">Upcoming Bills</span>
                <span className="sm:hidden">Upcoming</span>
                {upcomingBills.length > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 text-xs flex items-center justify-center bg-red-100 text-red-800">
                    {upcomingBills.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="missed" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg">
                <AlertCircle className="h-4 w-4" />
                <span className="hidden sm:inline">Missed</span>
                <span className="sm:hidden">Missed</span>
                {missedPayments.length > 0 && (
                  <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 text-xs flex items-center justify-center">
                    {missedPayments.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="review" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg">
                <ClipboardList className="h-4 w-4" />
                <span className="hidden sm:inline">Review</span>
                <span className="sm:hidden">Review</span>
                <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 text-xs flex items-center justify-center bg-blue-100 text-blue-800">
                  {displayedReviewsCount}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="all" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg">
                <TrendingUp className="h-4 w-4" />
                <span className="hidden sm:inline">All Items</span>
                <span className="sm:hidden">All</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="upcoming" className="mt-6 space-y-6">
            {/* Show actionable alerts only when relevant */}
            {missedPayments.length > 0 && (
              <Card className="border-red-200 dark:border-red-700 bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center">
                      <AlertCircle className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-red-800 dark:text-red-200">Missed Payments Alert</div>
                      <div className="text-sm text-red-700 dark:text-red-300">
                        You have {missedPayments.length} overdue payment{missedPayments.length !== 1 ? 's' : ''} that need attention
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="border-red-200 text-red-700 hover:bg-red-50">
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Coming Up Summary */}
            <Card className="bg-gradient-to-br from-orange-50 via-red-50 to-pink-50 dark:from-orange-900/20 dark:via-red-900/20 dark:to-pink-900/20 border-orange-200 dark:border-orange-700 shadow-lg">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl font-bold flex items-center gap-2">
                    <Bell className="h-5 w-5 text-orange-500" />
                    Coming Up
                  </CardTitle>
                  <Badge variant="secondary" className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                    {upcomingBills.length} bills due
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground mb-4 bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                  {formatCurrency(totalUpcoming)} in the next 7 days
                </div>
                <div className="grid grid-cols-7 gap-1 mb-4">
                  {Array.from({ length: 7 }, (_, i) => {
                    const date = new Date();
                    date.setDate(date.getDate() + i);
                    
                    // Get bills for this day (all data is now in recurringTransactions)
                    const dayBills = recurringTransactions.filter(bill => {
                      if (!bill.nextDueDate) return false;
                      const billDate = new Date(bill.nextDueDate);
                      return billDate.toDateString() === date.toDateString();
                    });
                    const isToday = i === 0;
                    
                    return (
                      <div key={i} className={`text-center p-2 rounded-xl text-xs transition-all hover:scale-105 ${
                        isToday ? 'bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-md' : 
                        dayBills.length > 0 ? 'bg-gradient-to-br from-orange-200 to-red-200 dark:from-orange-800 dark:to-red-800 text-orange-900 dark:text-orange-100 shadow-sm' : 
                        'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                      }`}>
                        <div className="font-bold">
                          {date.toLocaleDateString('en', { weekday: 'short' })}
                        </div>
                        <div className="text-xs opacity-75">
                          {date.getDate()}
                        </div>
                        {dayBills.length > 0 && (
                          <div className="text-xs font-bold mt-1 bg-white/20 rounded-full px-1">
                            {dayBills.length}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Calendar View */}
            <RecurringCalendar 
              recurringTransactions={recurringTransactions} 
              manualSubscriptions={[]}
            />

            {/* Due Soon Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <Bell className="h-4 w-4 text-red-500" />
                    Due Soon
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {upcomingBills.slice(0, 5).map((bill) => (
                    <div key={bill.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {bill.merchantLogo ? (
                          <div className="w-10 h-10 rounded-full bg-white border-2 border-gray-100 flex items-center justify-center overflow-hidden">
                            <img 
                              src={bill.merchantLogo} 
                              alt={bill.name}
                              className="w-8 h-8 object-contain"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                const fallback = target.nextSibling as HTMLElement;
                                if (fallback) fallback.style.display = 'flex';
                              }}
                            />
                            <div className={`w-10 h-10 rounded-full hidden items-center justify-center text-white text-xs font-bold ${
                              bill.category.toLowerCase().includes('subscription') ? 'bg-purple-500' :
                              bill.category.toLowerCase().includes('utilities') ? 'bg-blue-500' :
                              'bg-orange-500'
                            }`}>
                              {bill.name.substring(0, 2).toUpperCase()}
                            </div>
                          </div>
                        ) : (
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                            bill.category.toLowerCase().includes('subscription') ? 'bg-purple-500' :
                            bill.category.toLowerCase().includes('utilities') ? 'bg-blue-500' :
                            'bg-orange-500'
                          }`}>
                            {bill.name.substring(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <div className="font-medium">{bill.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {bill.nextDueDate && `in ${Math.ceil((new Date(bill.nextDueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} days`}
                            {bill.confidence && (
                              <span className="ml-2 text-xs text-green-600">
                                {Math.round(bill.confidence * 100)}% confidence
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">{formatCurrency(bill.amount)}</div>
                        <div className="text-xs text-muted-foreground">
                          {bill.frequency} • {bill.occurrences} occurrences
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Recent Charges */}
              <RecentRecurringCharges />
            </div>
          </TabsContent>

          <TabsContent value="missed" className="mt-6 space-y-6">
            {/* Missed Payments Alert */}
            {missedPayments.length > 0 ? (
              <Card className="border-red-200 dark:border-red-700 bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center">
                      <AlertCircle className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <div className="font-semibold text-red-800 dark:text-red-200">Missed Payments Detected</div>
                      <div className="text-sm text-red-700 dark:text-red-300">
                        {missedPayments.length} payment{missedPayments.length !== 1 ? 's' : ''} appear to be overdue. Review and take action.
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-green-200 dark:border-green-700 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center">
                      <Sparkles className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <div className="font-semibold text-green-800 dark:text-green-200">All Caught Up!</div>
                      <div className="text-sm text-green-700 dark:text-green-300">
                        No missed payments detected. Your bills are on track.
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Missed Payments List */}
            {missedPayments.length > 0 && (
              <div className="space-y-4">
                {missedPayments.map((payment) => (
                  <Card key={payment.id} className={`border-2 ${
                    payment.urgency === 'high' ? 'border-red-300 bg-red-50 dark:bg-red-900/10' :
                    payment.urgency === 'medium' ? 'border-orange-300 bg-orange-50 dark:bg-orange-900/10' :
                    'border-yellow-300 bg-yellow-50 dark:bg-yellow-900/10'
                  }`}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {payment.merchantLogo ? (
                            <div className="w-12 h-12 rounded-full bg-white border-2 border-gray-200 flex items-center justify-center overflow-hidden">
                              <img 
                                src={payment.merchantLogo} 
                                alt={payment.name}
                                className="w-10 h-10 object-contain"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                  const fallback = target.nextSibling as HTMLElement;
                                  if (fallback) fallback.style.display = 'flex';
                                }}
                              />
                              <div className="w-12 h-12 rounded-full hidden items-center justify-center text-white text-sm font-bold bg-red-500">
                                {payment.name.substring(0, 2).toUpperCase()}
                              </div>
                            </div>
                          ) : (
                            <div className="w-12 h-12 rounded-full flex items-center justify-center text-white text-sm font-bold bg-red-500">
                              {payment.name.substring(0, 2).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <div className="font-semibold text-lg">{payment.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {payment.daysPastDue} day{payment.daysPastDue !== 1 ? 's' : ''} overdue • {payment.frequency}
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant={payment.urgency === 'high' ? 'destructive' : payment.urgency === 'medium' ? 'secondary' : 'outline'}>
                                {payment.status.toUpperCase()}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {payment.confidence && `${Math.round(payment.confidence * 100)}% confidence`}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold">{formatCurrency(payment.amount)}</div>
                          <div className="text-sm text-muted-foreground">
                            Expected: {payment.nextDueDate && formatDate(new Date(payment.nextDueDate))}
                          </div>
                          <Button size="sm" className="mt-2" variant={payment.urgency === 'high' ? 'destructive' : 'default'}>
                            Take Action
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="all" className="mt-6 space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    {subscriptions.length} Subscriptions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(totalSubscriptions)} per year</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    {billsAndUtilities.length} Bills & Utilities
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(totalBills)} per year</div>
                </CardContent>
              </Card>
            </div>

            {/* Sort Controls */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm">
                  Sort by: Type ▼
                </Button>
              </div>
              
              {/* Tip Banner */}
              <div className="hidden md:block bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20 px-4 py-2 rounded-full text-sm">
                <span className="text-purple-700 dark:text-purple-300">
                  💡 To cancel subscriptions or lower your bills, tap ⋮ on any of the rows to see your options.
                </span>
              </div>
            </div>

            {/* Recurring Items List */}
            <RecurringList 
              subscriptions={subscriptions} 
              billsAndUtilities={billsAndUtilities}
              manualSubscriptions={[]}
            />
          </TabsContent>

          <TabsContent value="review" className="mt-6 space-y-6">
            {/* Review Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <ClipboardList className="h-4 w-4 text-blue-500" />
                    Pending Reviews
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{displayedReviewsCount}</div>
                  <div className="text-sm text-muted-foreground">Transactions need classification</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <History className="h-4 w-4 text-green-500" />
                    Total Overrides
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{overrideSummary.totalOverrides}</div>
                  <div className="text-sm text-muted-foreground">User decisions made</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-purple-500" />
                    Merchants Reviewed
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{overrideSummary.merchantCount}</div>
                  <div className="text-sm text-muted-foreground">Unique merchants classified</div>
                </CardContent>
              </Card>
            </div>

            {/* Pending Reviews Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ClipboardList className="h-5 w-5 text-blue-500" />
                  Transactions Needing Review
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  These transactions have been detected as potentially recurring but need your confirmation.
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                {availableReviewsCount === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle2 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <div className="text-lg font-medium mb-1">All Caught Up!</div>
                    <div className="text-sm">
                      No transactions are pending review at the moment.
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {mockPendingReviews.slice(0, displayedReviewsCount).map((review, index) => {
                      const colors = [
                        { border: 'border-l-blue-500', bg: 'bg-blue-50/50 dark:bg-blue-900/10', avatar: 'bg-blue-500', initials: review.name.substring(0, 2).toUpperCase() },
                        { border: 'border-l-orange-500', bg: 'bg-orange-50/50 dark:bg-orange-900/10', avatar: 'bg-orange-500', initials: review.name.substring(0, 2).toUpperCase() },
                        { border: 'border-l-green-500', bg: 'bg-green-50/50 dark:bg-green-900/10', avatar: 'bg-green-500', initials: review.name.substring(0, 2).toUpperCase() },
                        { border: 'border-l-purple-500', bg: 'bg-purple-50/50 dark:bg-purple-900/10', avatar: 'bg-purple-500', initials: review.name.substring(0, 2).toUpperCase() },
                        { border: 'border-l-pink-500', bg: 'bg-pink-50/50 dark:bg-pink-900/10', avatar: 'bg-pink-500', initials: review.name.substring(0, 2).toUpperCase() }
                      ];
                      const color = colors[index % colors.length];
                      
                      return (
                        <Card key={review.name} className={`border-l-4 ${color.border} ${color.bg}`}>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className={`w-12 h-12 rounded-full ${color.avatar} flex items-center justify-center text-white font-bold text-sm`}>
                                  {color.initials}
                                </div>
                                <div className="flex-1">
                                  <div className="font-semibold">{review.name}</div>
                                  <div className="text-sm text-muted-foreground">
                                    {review.transactionCount} transactions found • Monthly pattern detected
                                  </div>
                                  <div className="flex items-center gap-2 mt-2">
                                    <Badge variant="secondary" className="bg-blue-100 text-blue-800">85% confidence</Badge>
                                    <Badge variant="outline">Entertainment</Badge>
                                  </div>
                                  <div className="mt-3">
                                    <Button 
                                      variant="outline" 
                                      size="sm" 
                                      className="h-8 px-3 text-sm font-medium w-full"
                                      onClick={() => showRelatedTransactions(review.name)}
                                    >
                                      <Eye className="h-4 w-4 mr-2" />
                                      View Related Transactions
                                    </Button>
                                  </div>
                                </div>
                              </div>
                              <div className="flex flex-col items-end gap-2">
                                <div className="text-xl font-bold">$15.99</div>
                                <div className="flex gap-2">
                                  <Button 
                                    size="sm" 
                                    variant="outline" 
                                    className="text-red-600 hover:bg-red-50"
                                    onClick={() => handleRecurringDecision(review.name, "non-recurring")}
                                    disabled={createOverride.isPending}
                                  >
                                    <XCircle className="h-4 w-4 mr-1" />
                                    Not Recurring
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    className="bg-blue-600 hover:bg-blue-700"
                                    onClick={() => handleRecurringDecision(review.name, "recurring")}
                                    disabled={createOverride.isPending}
                                  >
                                    <CheckCircle2 className="h-4 w-4 mr-1" />
                                    Confirm Recurring
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}

                {/* Additional Pending Reviews (Show More) */}
                {showMoreReviews && (
                  <div className="space-y-3 pt-4 border-t">
                    <Card className="border-l-4 border-l-purple-500 bg-purple-50/50 dark:bg-purple-900/10">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-purple-500 flex items-center justify-center text-white font-bold text-sm">
                              AM
                            </div>
                            <div className="flex-1">
                              <div className="font-semibold">Amazon Prime</div>
                              <div className="text-sm text-muted-foreground">
                                8 transactions found • Monthly pattern detected
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="secondary" className="bg-purple-100 text-purple-800">78% confidence</Badge>
                                <Badge variant="outline">Shopping</Badge>
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <div className="text-xl font-bold">$12.99</div>
                            <div className="flex gap-2">
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="text-red-600 hover:bg-red-50"
                                onClick={() => handleRecurringDecision("Amazon Prime", "non-recurring")}
                                disabled={createOverride.isPending}
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                Not Recurring
                              </Button>
                              <Button 
                                size="sm" 
                                className="bg-purple-600 hover:bg-purple-700"
                                onClick={() => handleRecurringDecision("Amazon Prime", "recurring")}
                                disabled={createOverride.isPending}
                              >
                                <CheckCircle2 className="h-4 w-4 mr-1" />
                                Confirm Recurring
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-l-4 border-l-yellow-500 bg-yellow-50/50 dark:bg-yellow-900/10">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-yellow-500 flex items-center justify-center text-white font-bold text-sm">
                              GY
                            </div>
                            <div className="flex-1">
                              <div className="font-semibold">LA Fitness</div>
                              <div className="text-sm text-muted-foreground">
                                6 transactions found • Monthly pattern detected
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">88% confidence</Badge>
                                <Badge variant="outline">Health & Fitness</Badge>
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <div className="text-xl font-bold">$29.99</div>
                            <div className="flex gap-2">
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="text-red-600 hover:bg-red-50"
                                onClick={() => handleRecurringDecision("LA Fitness", "non-recurring")}
                                disabled={createOverride.isPending}
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                Not Recurring
                              </Button>
                              <Button 
                                size="sm" 
                                className="bg-yellow-600 hover:bg-yellow-700"
                                onClick={() => handleRecurringDecision("LA Fitness", "recurring")}
                                disabled={createOverride.isPending}
                              >
                                <CheckCircle2 className="h-4 w-4 mr-1" />
                                Confirm Recurring
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* See More Button */}
                {availableReviewsCount > 3 && (
                  <div className="pt-4 text-center">
                    <Button 
                      variant="outline" 
                      className="gap-2"
                      onClick={() => setShowMoreReviews(!showMoreReviews)}
                    >
                      <Eye className="h-4 w-4" />
                      {showMoreReviews ? 'Show Less' : `See More Pending Reviews (${availableReviewsCount - 3})`}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Audit Trail / Recent Changes */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5 text-green-500" />
                  Recent Changes & Audit Trail
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  History of user overrides and system decisions for transparency.
                </p>
              </CardHeader>
              <CardContent>
                {userRecurringOverrides.length > 0 ? (
                  <div className="space-y-3">
                    {userRecurringOverrides.slice(0, 5).map((override: any, index: number) => (
                      <div key={index} className="flex items-center gap-3 p-3 border rounded-lg bg-gray-50/50 dark:bg-gray-900/20">
                        <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                          {override.decision === 'recurring' ? (
                            <CheckCircle2 className="h-4 w-4 text-blue-600" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-600" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium">{override.merchantName}</div>
                          <div className="text-sm text-muted-foreground">
                            User marked as {override.recurringStatus === 'recurring' ? 'recurring' : 'not recurring'}
                            {override.applyToAll ? ' • Applied to all future transactions' : ' • One-time override created'}
                          </div>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          <Clock className="h-3 w-3 inline mr-1" />
                          {formatDate(new Date(override.createdAt))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <History className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <div className="text-lg font-medium mb-1">No Changes Yet</div>
                    <div className="text-sm">
                      When you review transactions, your decisions will appear here for transparency.
                    </div>
                  </div>
                )}
                
                {userRecurringOverrides.length > 5 && (
                  <div className="pt-4 text-center">
                    <Button variant="outline" size="sm" className="gap-2">
                      <MoreHorizontal className="h-4 w-4" />
                      View All Changes
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Confirmation Dialog for Apply to All vs Just This One */}
      <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {selectedMerchant?.decision === 'recurring' ? 'Confirm Recurring Pattern' : 'Mark as Not Recurring'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              You're about to mark <strong>{selectedMerchant?.name}</strong> as{' '}
              {selectedMerchant?.decision === 'recurring' ? 'a recurring transaction' : 'not recurring'}.
              <br /><br />
              <strong>Apply to All Future Transactions:</strong> This will automatically mark all future {selectedMerchant?.name} transactions as {selectedMerchant?.decision === 'recurring' ? 'recurring' : 'not recurring'}, including the currently selected transaction(s).
              <br /><br />
              <strong>Create One-Time Override:</strong> This creates a single, manual rule for the selected transaction(s) only. You can manage or delete this override in your settings.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel onClick={() => setConfirmDialogOpen(false)}>
              Cancel
            </AlertDialogCancel>
            <Button 
              variant="outline"
              onClick={() => confirmDecision(false)}
              disabled={createOverride.isPending}
            >
              Create One-Time Override
            </Button>
            <AlertDialogAction 
              onClick={() => confirmDecision(true)}
              disabled={createOverride.isPending}
            >
              Apply to All Future Transactions
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Related Transactions Modal */}
      <Dialog open={relatedTransactionsOpen} onOpenChange={setRelatedTransactionsOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Related Transactions - {selectedMerchantForTransactions}</DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto max-h-[60vh] space-y-3">
            {relatedTransactionsData?.transactions?.length > 0 ? (
              <>
                <div className="text-sm text-muted-foreground mb-3">
                  Found {relatedTransactionsData.count} related transactions for {relatedTransactionsData.merchant}
                </div>
                {relatedTransactionsData.transactions.map((transaction: any) => (
                  <Card key={transaction.id} className="p-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-medium">{transaction.description}</div>
                        <div className="text-sm text-muted-foreground">
                          {formatDate(new Date(transaction.date))} • {transaction.category || 'Uncategorized'}
                        </div>
                        {transaction.merchant && transaction.merchant !== transaction.description && (
                          <div className="text-xs text-blue-600">Merchant: {transaction.merchant}</div>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="font-bold">
                          {transaction.type === 'expense' ? '-' : '+'}${Math.abs(parseFloat(transaction.amount || '0')).toFixed(2)}
                        </div>
                        <div className="text-xs text-muted-foreground">{transaction.source || 'Manual'}</div>
                      </div>
                    </div>
                  </Card>
                ))}
              </>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <div className="text-lg font-medium mb-1">No Related Transactions Found</div>
                <div className="text-sm">
                  {relatedTransactionsData ? 
                    `Searched for "${selectedMerchantForTransactions}" but no matches found.` : 
                    'Loading transactions...'
                  }
                </div>
                {relatedTransactionsData && (
                  <div className="text-xs mt-2 p-2 bg-gray-100 rounded text-left">
                    <pre>{JSON.stringify(relatedTransactionsData, null, 2)}</pre>
                  </div>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRelatedTransactionsOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manual Recurring Selection Dialog */}
      {selectedMerchantForManualSelection && manualSelectionTransactionsData?.transactions && (
        <ManualRecurringSelection
          isOpen={manualSelectionOpen}
          onClose={() => {
            setManualSelectionOpen(false);
            setSelectedMerchantForManualSelection(null);
          }}
          transactions={manualSelectionTransactionsData.transactions}
          merchant={selectedMerchantForManualSelection}
          onConfirm={handleManualSelectionConfirm}
        />
      )}
    </div>
  );
}