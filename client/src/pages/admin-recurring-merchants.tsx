import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Edit, Trash2, Download, Upload, RefreshCw, Building, CreditCard, Zap, Receipt } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { formatDate } from "@/lib/financial-utils";
import { useToast } from "@/hooks/use-toast";

interface RecurringMerchant {
  id: string;
  merchantName: string;
  normalizedName: string;
  category: string;
  transactionType: 'utility' | 'subscription' | 'credit_card' | 'large_recurring' | 'excluded';
  frequency?: string;
  logoUrl?: string;
  isActive: boolean;
  autoDetected: boolean;
  confidence?: 'high' | 'medium' | 'low';
  notes?: string;
  patterns?: string;
  excludeFromBills: boolean;
  notificationDays: string;
  createdAt: string;
  updatedAt: string;
}

const TRANSACTION_TYPES = [
  { value: 'utility', label: 'Utility', icon: Zap, color: 'bg-blue-500' },
  { value: 'subscription', label: 'Subscription', icon: RefreshCw, color: 'bg-purple-500' },
  { value: 'credit_card', label: 'Credit Card', icon: CreditCard, color: 'bg-green-500' },
  { value: 'large_recurring', label: 'Large Recurring', icon: Building, color: 'bg-orange-500' },
  { value: 'excluded', label: 'Excluded', icon: Receipt, color: 'bg-gray-500' },
];

const FREQUENCIES = ['weekly', 'biweekly', 'monthly', 'quarterly', 'yearly'];
const CONFIDENCE_LEVELS = ['high', 'medium', 'low'];

const MERCHANT_CATEGORIES = [
  // Income categories
  'Business Income',
  'Interest',
  'Other Income',
  'Paychecks',
  
  // Expense categories
  'Advertising & Promotion',
  'Auto Maintenance',
  'Auto Payment',
  'Business Auto Expenses',
  'Business Insurance',
  'Business Travel & Meals',
  'Business Utilities & Communication',
  'Cash & ATM',
  'Charity',
  'Check',
  'Child Activities',
  'Child Care',
  'Clothing',
  'Coffee Shops',
  'Dentist',
  'Education',
  'Electronics',
  'Employee Wages & Contract Labor',
  'Entertainment & Recreation',
  'Financial & Legal Services',
  'Financial Fees',
  'Fitness',
  'Fun Money',
  'Furniture & Housewares',
  'Garbage',
  'Gas',
  'Gas & Electric',
  'Gifts',
  'Groceries',
  'Home Improvement',
  'Insurance',
  'Internet & Cable',
  'Loan Repayment',
  'Medical',
  'Miscellaneous',
  'Mortgage',
  'Office Rent',
  'Office Supplies & Expenses',
  'Parking & Tolls',
  'Pets',
  'Phone',
  'Postage & Shipping',
  'Public Transit',
  'Rent',
  'Restaurants & Bars',
  'Student Loans',
  'Taxes',
  'Taxi & Ride Shares',
  'Travel & Vacation',
  'Uncategorized',
  'Water',
  
  // Transfer categories
  'Credit Card Payment',
  'Transfer',
  
  // Adjustment categories
  'Balance Adjustments'
].sort();

export default function AdminRecurringMerchantsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [showDialog, setShowDialog] = useState(false);
  const [editingMerchant, setEditingMerchant] = useState<RecurringMerchant | null>(null);
  const [formData, setFormData] = useState<Partial<RecurringMerchant>>({});
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [bulkImportText, setBulkImportText] = useState('');
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 25;

  const { data: merchants = [], isLoading, refetch } = useQuery<RecurringMerchant[]>({
    queryKey: ["/api/admin/recurring-merchants"],
    refetchOnWindowFocus: false,
  });

  const filteredMerchants = merchants.filter(merchant => {
    const matchesSearch = merchant.merchantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         merchant.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = !selectedType || selectedType === "all" || merchant.transactionType === selectedType;
    return matchesSearch && matchesType;
  });

  const totalPages = Math.ceil(filteredMerchants.length / itemsPerPage);
  const paginatedMerchants = filteredMerchants.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );



  const createMerchantMutation = useMutation({
    mutationFn: (data: Partial<RecurringMerchant>) => 
      apiRequest("POST", "/api/admin/recurring-merchants", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/recurring-merchants"] });
      setShowDialog(false);
      setFormData({});
      toast({ title: "Success", description: "Merchant created successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create merchant", variant: "destructive" });
    },
  });

  const updateMerchantMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<RecurringMerchant> }) =>
      apiRequest("PUT", `/api/admin/recurring-merchants/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/recurring-merchants"] });
      setShowDialog(false);
      setEditingMerchant(null);
      setFormData({});
      toast({ title: "Success", description: "Merchant updated successfully" });
    },
    onError: (error: any) => {
      console.error("Update merchant error:", error);
      const errorMessage = error?.response?.data?.details || error?.message || "Failed to update merchant";
      toast({ title: "Error", description: errorMessage, variant: "destructive" });
    },
  });

  const deleteMerchantMutation = useMutation({
    mutationFn: (id: string) => 
      apiRequest("DELETE", `/api/admin/recurring-merchants/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/recurring-merchants"] });
      toast({ title: "Success", description: "Merchant deleted successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete merchant", variant: "destructive" });
    },
  });

  const autoPopulateMutation = useMutation({
    mutationFn: () => 
      apiRequest("POST", "/api/admin/recurring-merchants/auto-populate"),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/recurring-merchants"] });
      toast({ 
        title: "Success", 
        description: `Auto-populated ${data.merchants?.length || 0} merchants from transaction data`
      });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to auto-populate merchants", variant: "destructive" });
    },
  });

  const getTypeIcon = (type: string) => {
    const typeConfig = TRANSACTION_TYPES.find(t => t.value === type);
    return typeConfig ? typeConfig.icon : Receipt;
  };

  const getTypeColor = (type: string) => {
    const typeConfig = TRANSACTION_TYPES.find(t => t.value === type);
    return typeConfig ? typeConfig.color : 'bg-gray-500';
  };

  const handleEdit = (merchant: RecurringMerchant) => {
    setEditingMerchant(merchant);
    setFormData({
      merchantName: merchant.merchantName,
      category: merchant.category,
      transactionType: merchant.transactionType,
      frequency: merchant.frequency,
      logoUrl: merchant.logoUrl,
      isActive: merchant.isActive,
      confidence: merchant.confidence,
      notes: merchant.notes,
      patterns: merchant.patterns,
      excludeFromBills: merchant.excludeFromBills,
      notificationDays: merchant.notificationDays,
    });
    setShowDialog(true);
  };

  const handleSubmit = () => {
    if (editingMerchant) {
      updateMerchantMutation.mutate({ id: editingMerchant.id, data: formData });
    } else {
      createMerchantMutation.mutate(formData);
    }
  };

  const handleNewMerchant = () => {
    setEditingMerchant(null);
    setFormData({
      merchantName: "",
      category: "",
      transactionType: "subscription",
      frequency: "monthly",
      isActive: true,
      autoDetected: false,
      confidence: "medium",
      excludeFromBills: false,
      notificationDays: "3",
    });
    setShowDialog(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-3 sm:p-6 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 via-pink-500 to-orange-500 text-white rounded-2xl p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">Recurring Merchants Admin 🏪</h1>
            <p className="text-purple-100 text-sm sm:text-base">
              Manage merchant categorization and transaction types for improved detection
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="secondary" 
              size="sm" 
              className="bg-green-600/80 hover:bg-green-600 border-white/30 text-white"
              onClick={async () => {
                try {
                  const response = await fetch('/api/admin/recurring-merchants/seed-new', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' }
                  });
                  const result = await response.json();
                  if (result.success) {
                    toast({ 
                      title: "Success", 
                      description: result.message 
                    });
                    queryClient.invalidateQueries({ queryKey: ["/api/admin/recurring-merchants"] });
                  } else {
                    toast({ 
                      title: "Error", 
                      description: result.error,
                      variant: "destructive" 
                    });
                  }
                } catch (error) {
                  toast({ 
                    title: "Error", 
                    description: `Failed to seed merchants: ${error}`,
                    variant: "destructive" 
                  });
                }
              }}
              data-testid="button-seed-merchants"
            >
              <Download className="h-4 w-4 mr-2" />
              Seed New Merchants
            </Button>
            <Button 
              variant="secondary" 
              size="sm" 
              className="bg-orange-600/80 hover:bg-orange-600 border-white/30 text-white"
              onClick={() => setShowBulkImport(true)}
              data-testid="button-bulk-import"
            >
              <Upload className="h-4 w-4 mr-2" />
              Bulk Import
            </Button>
            <Button 
              variant="secondary" 
              size="sm" 
              className="bg-white/20 hover:bg-white/30 border-white/30"
              onClick={() => autoPopulateMutation.mutate()}
              disabled={autoPopulateMutation.isPending}
            >
              <Upload className="h-4 w-4 mr-2" />
              Auto-Populate
            </Button>
            <Button 
              variant="secondary" 
              size="sm" 
              className="bg-white/20 hover:bg-white/30 border-white/30"
              onClick={handleNewMerchant}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Merchant
            </Button>
          </div>
        </div>
        
        {/* Quick Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mt-4">
          {TRANSACTION_TYPES.map(type => {
            const count = merchants.filter(m => m.transactionType === type.value).length;
            return (
              <div key={type.value} className="bg-white/10 rounded-xl p-3 text-center backdrop-blur-sm">
                <div className="text-lg font-bold">{count}</div>
                <div className="text-xs text-purple-100">{type.label}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search merchants or categories..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {TRANSACTION_TYPES.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Merchants Table */}
      <Card>
        <CardHeader>
          <CardTitle>Merchants ({filteredMerchants.length}) - Page {currentPage} of {totalPages}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Merchant</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Frequency</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Confidence</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedMerchants.map((merchant) => {
                  const TypeIcon = getTypeIcon(merchant.transactionType);
                  return (
                    <TableRow key={merchant.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {merchant.logoUrl ? (
                            <img 
                              src={merchant.logoUrl} 
                              alt={merchant.merchantName}
                              className="w-8 h-8 rounded border bg-white object-contain"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          ) : (
                            <div className={`w-8 h-8 rounded ${getTypeColor(merchant.transactionType)} flex items-center justify-center`}>
                              <TypeIcon className="h-4 w-4 text-white" />
                            </div>
                          )}
                          <div>
                            <div className="font-medium">{merchant.merchantName}</div>
                            <div className="text-xs text-muted-foreground">
                              {merchant.normalizedName}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{merchant.category}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`${getTypeColor(merchant.transactionType)} text-white border-0`}>
                          {TRANSACTION_TYPES.find(t => t.value === merchant.transactionType)?.label}
                        </Badge>
                      </TableCell>
                      <TableCell>{merchant.frequency || 'N/A'}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge variant={merchant.isActive ? "default" : "secondary"}>
                            {merchant.isActive ? "Active" : "Inactive"}
                          </Badge>
                          {merchant.autoDetected && (
                            <Badge variant="outline" className="text-xs">Auto</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {merchant.confidence && (
                          <Badge variant={
                            merchant.confidence === 'high' ? 'default' :
                            merchant.confidence === 'medium' ? 'secondary' : 'outline'
                          }>
                            {merchant.confidence}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(merchant)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteMerchantMutation.mutate(merchant.id)}
                            disabled={deleteMerchantMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          
          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4">
              <div className="text-sm text-muted-foreground">
                Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredMerchants.length)} of {filteredMerchants.length} merchants
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pageNum = i + 1;
                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(pageNum)}
                    >
                      {pageNum}
                    </Button>
                  );
                })}
                {totalPages > 5 && currentPage < totalPages - 2 && (
                  <>
                    <span>...</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(totalPages)}
                    >
                      {totalPages}
                    </Button>
                  </>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingMerchant ? "Edit Merchant" : "Add New Merchant"}
            </DialogTitle>
            <DialogDescription>
              {editingMerchant ? "Update merchant details and recurring transaction settings" : "Add a new merchant with recurring transaction patterns"}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="merchantName">Merchant Name</Label>
                <Input
                  id="merchantName"
                  value={formData.merchantName || ""}
                  onChange={(e) => setFormData({ ...formData, merchantName: e.target.value })}
                  placeholder="e.g., Netflix"
                />
              </div>
              <div>
                <Label htmlFor="category">Category</Label>
                <Select 
                  value={formData.category || "Entertainment"} 
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {MERCHANT_CATEGORIES.map(category => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="transactionType">Transaction Type</Label>
                <Select 
                  value={formData.transactionType || "subscription"} 
                  onValueChange={(value) => setFormData({ ...formData, transactionType: value as any })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {TRANSACTION_TYPES.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="frequency">Frequency</Label>
                <Select 
                  value={formData.frequency || "monthly"} 
                  onValueChange={(value) => setFormData({ ...formData, frequency: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    {FREQUENCIES.map(freq => (
                      <SelectItem key={freq} value={freq}>
                        {freq.charAt(0).toUpperCase() + freq.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="confidence">Confidence Level</Label>
                <Select 
                  value={formData.confidence || "medium"} 
                  onValueChange={(value) => setFormData({ ...formData, confidence: value as any })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select confidence" />
                  </SelectTrigger>
                  <SelectContent>
                    {CONFIDENCE_LEVELS.map(level => (
                      <SelectItem key={level} value={level}>
                        {level.charAt(0).toUpperCase() + level.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="notificationDays">Notification Days</Label>
                <Input
                  id="notificationDays"
                  type="number"
                  value={formData.notificationDays || 3}
                  onChange={(e) => setFormData({ ...formData, notificationDays: e.target.value })}
                  min="1"
                  max="30"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="logoUrl">Logo URL</Label>
              <Input
                id="logoUrl"
                value={formData.logoUrl || ""}
                onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                placeholder="https://logo.clearbit.com/example.com"
              />
            </div>

            <div>
              <Label htmlFor="patterns">Matching Patterns (JSON array)</Label>
              <Textarea
                id="patterns"
                value={formData.patterns || ""}
                onChange={(e) => setFormData({ ...formData, patterns: e.target.value })}
                placeholder='["netflix", "netflix.*", "streaming service"]'
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes || ""}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Additional notes about this merchant..."
                rows={2}
              />
            </div>

            <div className="flex gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isActive"
                  checked={formData.isActive ?? true}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked as boolean })}
                />
                <Label htmlFor="isActive">Active</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="excludeFromBills"
                  checked={formData.excludeFromBills ?? false}
                  onCheckedChange={(checked) => setFormData({ ...formData, excludeFromBills: checked as boolean })}
                />
                <Label htmlFor="excludeFromBills">Exclude from Bills</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="autoDetected"
                  checked={formData.autoDetected ?? false}
                  onCheckedChange={(checked) => setFormData({ ...formData, autoDetected: checked as boolean })}
                />
                <Label htmlFor="autoDetected">Auto Detected</Label>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={createMerchantMutation.isPending || updateMerchantMutation.isPending}
            >
              {editingMerchant ? "Update" : "Create"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bulk Import Dialog */}
      <Dialog open={showBulkImport} onOpenChange={setShowBulkImport}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Bulk Import Merchants
            </DialogTitle>
            <DialogDescription>
              Import multiple merchants at once using the specified format. Each line should contain merchant details separated by hyphens.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="bulk-text">Paste merchant data (one per line)</Label>
              <Textarea
                id="bulk-text"
                placeholder={`Example format:
Amazon - Shopping - subscription - monthly - active - high
Netflix - Entertainment - subscription - monthly - active - high
Starbucks - Restaurants & Bars - occasional - weekly - active - medium

Format: Merchant Name - Category - Type - Frequency - Status - Confidence`}
                value={bulkImportText}
                onChange={(e) => setBulkImportText(e.target.value)}
                className="min-h-[300px] font-mono text-sm"
              />
            </div>
            <div className="flex justify-between items-center">
              <div className="text-sm text-muted-foreground">
                Lines to process: {bulkImportText.split('\n').filter(line => line.trim()).length}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowBulkImport(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={async () => {
                    const lines = bulkImportText.split('\n').filter(line => line.trim());
                    const merchants = lines.map(line => {
                      const parts = line.split(' - ').map(p => p.trim());
                      return {
                        name: parts[0] || '',
                        category: parts[1] || 'Miscellaneous',
                        type: parts[2] || 'subscription',
                        frequency: parts[3] || 'monthly',
                        status: parts[4] || 'active',
                        confidence: parts[5] || 'medium'
                      };
                    }).filter(m => m.name);

                    try {
                      const response = await fetch('/api/admin/recurring-merchants/bulk-import', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ merchants })
                      });
                      const result = await response.json();
                      if (result.success) {
                        toast({
                          title: "Bulk Import Success",
                          description: `✅ Added ${result.added} merchants, skipped ${result.skipped} duplicates`
                        });
                        queryClient.invalidateQueries({ queryKey: ["/api/admin/recurring-merchants"] });
                        setShowBulkImport(false);
                        setBulkImportText('');
                      } else {
                        toast({
                          title: "Bulk Import Error",
                          description: result.error,
                          variant: "destructive"
                        });
                      }
                    } catch (error) {
                      toast({
                        title: "Import Error",
                        description: `Failed: ${error}`,
                        variant: "destructive"
                      });
                    }
                  }}
                  disabled={!bulkImportText.trim()}
                >
                  Import {bulkImportText.split('\n').filter(line => line.trim()).length} Merchants
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}