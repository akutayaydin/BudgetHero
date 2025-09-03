import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { 
  Plus, 
  Home, 
  Car, 
  Banknote, 
  TrendingUp, 
  Edit2, 
  Trash2, 
  DollarSign,
  CreditCard,
  Building,
  Boat,
  Bitcoin,
  Briefcase
} from "lucide-react";

interface Asset {
  id: string;
  name: string;
  type: string;
  subtype: string;
  currentValue: string;
  purchaseValue?: string;
  purchaseDate?: string;
  description?: string;
  notes?: string;
}

interface Liability {
  id: string;
  name: string;
  type: string;
  currentBalance: string;
  originalAmount?: string;
  interestRate?: string;
  monthlyPayment?: string;
  minimumPayment?: string;
  dueDate?: string;
  description?: string;
  notes?: string;
}

interface NetWorthData {
  netWorth: number;
  totalAssets: number;
  totalLiabilities: number;
  breakdown: {
    assets: { total: number; items: number };
    accounts: { total: number; items: number };
    liabilities: { total: number; items: number };
  };
}

const assetTypes = {
  "real_estate": {
    label: "Real Estate",
    icon: Home,
    subtypes: ["house", "commercial_property", "land", "rental_property"]
  },
  "vehicle": {
    label: "Vehicles",
    icon: Car,
    subtypes: ["car", "motorcycle", "boat", "rv", "aircraft"]
  },
  "cash_equivalent": {
    label: "Cash & Equivalents",
    icon: Banknote,
    subtypes: ["cash", "savings_account", "money_market", "cd"]
  },
  "investment": {
    label: "Investments",
    icon: TrendingUp,
    subtypes: ["stocks", "bonds", "mutual_funds", "etf", "bitcoin", "crypto", "retirement_401k", "ira"]
  },
  "personal": {
    label: "Personal Property",
    icon: Briefcase,
    subtypes: ["jewelry", "art", "collectibles", "electronics", "furniture"]
  }
};

const liabilityTypes = {
  "mortgage": { label: "Mortgage", icon: Home },
  "auto_loan": { label: "Auto Loan", icon: Car },
  "credit_card": { label: "Credit Card", icon: CreditCard },
  "personal_loan": { label: "Personal Loan", icon: DollarSign },
  "student_loan": { label: "Student Loan", icon: Building },
  "other": { label: "Other Debt", icon: Briefcase }
};

export default function AssetsLiabilities() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("overview");
  const [assetDialogOpen, setAssetDialogOpen] = useState(false);
  const [liabilityDialogOpen, setLiabilityDialogOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [editingLiability, setEditingLiability] = useState<Liability | null>(null);

  // Asset form state
  const [assetForm, setAssetForm] = useState({
    name: "",
    type: "",
    subtype: "",
    currentValue: "",
    purchaseValue: "",
    purchaseDate: "",
    description: "",
    notes: ""
  });

  // Liability form state
  const [liabilityForm, setLiabilityForm] = useState({
    name: "",
    type: "",
    currentBalance: "",
    originalAmount: "",
    interestRate: "",
    monthlyPayment: "",
    minimumPayment: "",
    dueDate: "",
    description: "",
    notes: ""
  });

  // Data queries
  const { data: assets = [], isLoading: assetsLoading } = useQuery<Asset[]>({
    queryKey: ["/api/assets"],
  });

  const { data: liabilities = [], isLoading: liabilitiesLoading } = useQuery<Liability[]>({
    queryKey: ["/api/liabilities"],
  });

  const { data: netWorth, isLoading: netWorthLoading } = useQuery<NetWorthData>({
    queryKey: ["/api/net-worth"],
  });

  // Mutations
  const createAssetMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/assets", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/assets"] });
      queryClient.invalidateQueries({ queryKey: ["/api/net-worth"] });
      setAssetDialogOpen(false);
      resetAssetForm();
      toast({ title: "Asset added successfully!" });
    },
    onError: () => {
      toast({ title: "Failed to add asset", variant: "destructive" });
    }
  });

  const updateAssetMutation = useMutation({
    mutationFn: ({ id, ...data }: any) => apiRequest("PUT", `/api/assets/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/assets"] });
      queryClient.invalidateQueries({ queryKey: ["/api/net-worth"] });
      setAssetDialogOpen(false);
      setEditingAsset(null);
      resetAssetForm();
      toast({ title: "Asset updated successfully!" });
    },
    onError: () => {
      toast({ title: "Failed to update asset", variant: "destructive" });
    }
  });

  const deleteAssetMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/assets/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/assets"] });
      queryClient.invalidateQueries({ queryKey: ["/api/net-worth"] });
      toast({ title: "Asset deleted successfully!" });
    },
    onError: () => {
      toast({ title: "Failed to delete asset", variant: "destructive" });
    }
  });

  const createLiabilityMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/liabilities", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/liabilities"] });
      queryClient.invalidateQueries({ queryKey: ["/api/net-worth"] });
      setLiabilityDialogOpen(false);
      resetLiabilityForm();
      toast({ title: "Liability added successfully!" });
    },
    onError: () => {
      toast({ title: "Failed to add liability", variant: "destructive" });
    }
  });

  const updateLiabilityMutation = useMutation({
    mutationFn: ({ id, ...data }: any) => apiRequest("PUT", `/api/liabilities/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/liabilities"] });
      queryClient.invalidateQueries({ queryKey: ["/api/net-worth"] });
      setLiabilityDialogOpen(false);
      setEditingLiability(null);
      resetLiabilityForm();
      toast({ title: "Liability updated successfully!" });
    },
    onError: () => {
      toast({ title: "Failed to update liability", variant: "destructive" });
    }
  });

  const deleteLiabilityMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/liabilities/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/liabilities"] });
      queryClient.invalidateQueries({ queryKey: ["/api/net-worth"] });
      toast({ title: "Liability deleted successfully!" });
    },
    onError: () => {
      toast({ title: "Failed to delete liability", variant: "destructive" });
    }
  });

  const resetAssetForm = () => {
    setAssetForm({
      name: "",
      type: "",
      subtype: "",
      currentValue: "",
      purchaseValue: "",
      purchaseDate: "",
      description: "",
      notes: ""
    });
  };

  const resetLiabilityForm = () => {
    setLiabilityForm({
      name: "",
      type: "",
      currentBalance: "",
      originalAmount: "",
      interestRate: "",
      monthlyPayment: "",
      minimumPayment: "",
      dueDate: "",
      description: "",
      notes: ""
    });
  };

  const handleEditAsset = (asset: Asset) => {
    setEditingAsset(asset);
    setAssetForm({
      name: asset.name,
      type: asset.type,
      subtype: asset.subtype,
      currentValue: asset.currentValue,
      purchaseValue: asset.purchaseValue || "",
      purchaseDate: asset.purchaseDate ? asset.purchaseDate.split('T')[0] : "",
      description: asset.description || "",
      notes: asset.notes || ""
    });
    setAssetDialogOpen(true);
  };

  const handleEditLiability = (liability: Liability) => {
    setEditingLiability(liability);
    setLiabilityForm({
      name: liability.name,
      type: liability.type,
      currentBalance: liability.currentBalance,
      originalAmount: liability.originalAmount || "",
      interestRate: liability.interestRate || "",
      monthlyPayment: liability.monthlyPayment || "",
      minimumPayment: liability.minimumPayment || "",
      dueDate: liability.dueDate ? liability.dueDate.split('T')[0] : "",
      description: liability.description || "",
      notes: liability.notes || ""
    });
    setLiabilityDialogOpen(true);
  };

  const handleAssetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingAsset) {
      updateAssetMutation.mutate({ id: editingAsset.id, ...assetForm });
    } else {
      createAssetMutation.mutate(assetForm);
    }
  };

  const handleLiabilitySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingLiability) {
      updateLiabilityMutation.mutate({ id: editingLiability.id, ...liabilityForm });
    } else {
      createLiabilityMutation.mutate(liabilityForm);
    }
  };

  const formatCurrency = (amount: string | number) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(num);
  };

  const getAssetIcon = (type: string) => {
    const assetType = assetTypes[type as keyof typeof assetTypes];
    return assetType ? assetType.icon : Briefcase;
  };

  const getLiabilityIcon = (type: string) => {
    const liabilityType = liabilityTypes[type as keyof typeof liabilityTypes];
    return liabilityType ? liabilityType.icon : CreditCard;
  };

  if (assetsLoading || liabilitiesLoading || netWorthLoading) {
    return (
      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 pt-16 md:pt-6">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 pt-16 md:pt-6">
      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
          Assets & Liabilities
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Track what you own and what you owe to get a complete picture of your net worth
        </p>
      </div>

      {/* Net Worth Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/50 dark:to-emerald-950/50 border-green-200 dark:border-green-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600 dark:text-green-400">Net Worth</p>
                <p className="text-3xl font-bold text-green-700 dark:text-green-300">
                  {formatCurrency(netWorth?.netWorth || 0)}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/50 dark:to-cyan-950/50 border-blue-200 dark:border-blue-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Total Assets</p>
                <p className="text-3xl font-bold text-blue-700 dark:text-blue-300">
                  {formatCurrency(netWorth?.totalAssets || 0)}
                </p>
              </div>
              <Building className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-950/50 dark:to-pink-950/50 border-red-200 dark:border-red-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-600 dark:text-red-400">Total Liabilities</p>
                <p className="text-3xl font-bold text-red-700 dark:text-red-300">
                  {formatCurrency(netWorth?.totalLiabilities || 0)}
                </p>
              </div>
              <CreditCard className="h-8 w-8 text-red-600 dark:text-red-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="assets">Assets ({assets.length})</TabsTrigger>
          <TabsTrigger value="liabilities">Liabilities ({liabilities.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="assets" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Your Assets</h2>
            <Dialog open={assetDialogOpen} onOpenChange={setAssetDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => { setEditingAsset(null); resetAssetForm(); }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Asset
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingAsset ? "Edit Asset" : "Add New Asset"}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleAssetSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="asset-name">Asset Name</Label>
                      <Input
                        id="asset-name"
                        value={assetForm.name}
                        onChange={(e) => setAssetForm({ ...assetForm, name: e.target.value })}
                        placeholder="e.g., Primary Residence"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="asset-type">Type</Label>
                      <Select value={assetForm.type} onValueChange={(value) => setAssetForm({ ...assetForm, type: value, subtype: "" })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select asset type" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(assetTypes).map(([key, type]) => (
                            <SelectItem key={key} value={key}>{type.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {assetForm.type && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="asset-subtype">Subtype</Label>
                        <Select value={assetForm.subtype} onValueChange={(value) => setAssetForm({ ...assetForm, subtype: value })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select subtype" />
                          </SelectTrigger>
                          <SelectContent>
                            {assetTypes[assetForm.type as keyof typeof assetTypes]?.subtypes.map((subtype) => (
                              <SelectItem key={subtype} value={subtype}>
                                {subtype.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="asset-value">Current Value ($)</Label>
                        <Input
                          id="asset-value"
                          type="number"
                          step="0.01"
                          value={assetForm.currentValue}
                          onChange={(e) => setAssetForm({ ...assetForm, currentValue: e.target.value })}
                          placeholder="0.00"
                          required
                        />
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="asset-purchase-value">Purchase Value ($)</Label>
                      <Input
                        id="asset-purchase-value"
                        type="number"
                        step="0.01"
                        value={assetForm.purchaseValue}
                        onChange={(e) => setAssetForm({ ...assetForm, purchaseValue: e.target.value })}
                        placeholder="0.00"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="asset-purchase-date">Purchase Date</Label>
                      <Input
                        id="asset-purchase-date"
                        type="date"
                        value={assetForm.purchaseDate}
                        onChange={(e) => setAssetForm({ ...assetForm, purchaseDate: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="asset-description">Description</Label>
                    <Input
                      id="asset-description"
                      value={assetForm.description}
                      onChange={(e) => setAssetForm({ ...assetForm, description: e.target.value })}
                      placeholder="Brief description"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="asset-notes">Notes</Label>
                    <Textarea
                      id="asset-notes"
                      value={assetForm.notes}
                      onChange={(e) => setAssetForm({ ...assetForm, notes: e.target.value })}
                      placeholder="Additional notes"
                      rows={3}
                    />
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setAssetDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={createAssetMutation.isPending || updateAssetMutation.isPending}>
                      {editingAsset ? "Update Asset" : "Add Asset"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {assets.map((asset) => {
              const IconComponent = getAssetIcon(asset.type);
              return (
                <Card key={asset.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        <IconComponent className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-1" />
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900 dark:text-white">{asset.name}</h3>
                          <Badge variant="secondary" className="text-xs mt-1">
                            {asset.subtype.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </Badge>
                          <p className="text-lg font-semibold text-green-600 dark:text-green-400 mt-2">
                            {formatCurrency(asset.currentValue)}
                          </p>
                          {asset.description && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              {asset.description}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex space-x-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEditAsset(asset)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteAssetMutation.mutate(asset.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            {assets.length === 0 && (
              <Card className="col-span-full">
                <CardContent className="p-8 text-center">
                  <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No assets yet</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Start by adding your first asset to track your net worth
                  </p>
                  <Button onClick={() => setAssetDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Your First Asset
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="liabilities" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Your Liabilities</h2>
            <Dialog open={liabilityDialogOpen} onOpenChange={setLiabilityDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => { setEditingLiability(null); resetLiabilityForm(); }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Liability
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingLiability ? "Edit Liability" : "Add New Liability"}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleLiabilitySubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="liability-name">Liability Name</Label>
                      <Input
                        id="liability-name"
                        value={liabilityForm.name}
                        onChange={(e) => setLiabilityForm({ ...liabilityForm, name: e.target.value })}
                        placeholder="e.g., Primary Mortgage"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="liability-type">Type</Label>
                      <Select value={liabilityForm.type} onValueChange={(value) => setLiabilityForm({ ...liabilityForm, type: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select liability type" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(liabilityTypes).map(([key, type]) => (
                            <SelectItem key={key} value={key}>{type.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="liability-balance">Current Balance ($)</Label>
                      <Input
                        id="liability-balance"
                        type="number"
                        step="0.01"
                        value={liabilityForm.currentBalance}
                        onChange={(e) => setLiabilityForm({ ...liabilityForm, currentBalance: e.target.value })}
                        placeholder="0.00"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="liability-original">Original Amount ($)</Label>
                      <Input
                        id="liability-original"
                        type="number"
                        step="0.01"
                        value={liabilityForm.originalAmount}
                        onChange={(e) => setLiabilityForm({ ...liabilityForm, originalAmount: e.target.value })}
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="liability-rate">Interest Rate (%)</Label>
                      <Input
                        id="liability-rate"
                        type="number"
                        step="0.01"
                        value={liabilityForm.interestRate}
                        onChange={(e) => setLiabilityForm({ ...liabilityForm, interestRate: e.target.value })}
                        placeholder="0.00"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="liability-payment">Monthly Payment ($)</Label>
                      <Input
                        id="liability-payment"
                        type="number"
                        step="0.01"
                        value={liabilityForm.monthlyPayment}
                        onChange={(e) => setLiabilityForm({ ...liabilityForm, monthlyPayment: e.target.value })}
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="liability-minimum">Minimum Payment ($)</Label>
                      <Input
                        id="liability-minimum"
                        type="number"
                        step="0.01"
                        value={liabilityForm.minimumPayment}
                        onChange={(e) => setLiabilityForm({ ...liabilityForm, minimumPayment: e.target.value })}
                        placeholder="0.00"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="liability-due">Due Date</Label>
                      <Input
                        id="liability-due"
                        type="date"
                        value={liabilityForm.dueDate}
                        onChange={(e) => setLiabilityForm({ ...liabilityForm, dueDate: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="liability-description">Description</Label>
                    <Input
                      id="liability-description"
                      value={liabilityForm.description}
                      onChange={(e) => setLiabilityForm({ ...liabilityForm, description: e.target.value })}
                      placeholder="Brief description"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="liability-notes">Notes</Label>
                    <Textarea
                      id="liability-notes"
                      value={liabilityForm.notes}
                      onChange={(e) => setLiabilityForm({ ...liabilityForm, notes: e.target.value })}
                      placeholder="Additional notes"
                      rows={3}
                    />
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setLiabilityDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={createLiabilityMutation.isPending || updateLiabilityMutation.isPending}>
                      {editingLiability ? "Update Liability" : "Add Liability"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {liabilities.map((liability) => {
              const IconComponent = getLiabilityIcon(liability.type);
              return (
                <Card key={liability.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        <IconComponent className="h-5 w-5 text-red-600 dark:text-red-400 mt-1" />
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900 dark:text-white">{liability.name}</h3>
                          <Badge variant="secondary" className="text-xs mt-1">
                            {liabilityTypes[liability.type as keyof typeof liabilityTypes]?.label}
                          </Badge>
                          <p className="text-lg font-semibold text-red-600 dark:text-red-400 mt-2">
                            {formatCurrency(liability.currentBalance)}
                          </p>
                          {liability.monthlyPayment && (
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {formatCurrency(liability.monthlyPayment)}/month
                            </p>
                          )}
                          {liability.description && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              {liability.description}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex space-x-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEditLiability(liability)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteLiabilityMutation.mutate(liability.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            {liabilities.length === 0 && (
              <Card className="col-span-full">
                <CardContent className="p-8 text-center">
                  <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No liabilities yet</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Add your debts and loans to get a complete picture of your financial situation
                  </p>
                  <Button onClick={() => setLiabilityDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Your First Liability
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}