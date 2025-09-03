import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  Plus, 
  Upload, 
  Building2, 
  Car, 
  Wallet, 
  TrendingUp, 
  Home,
  CreditCard,
  GraduationCap,
  Banknote,
  ChevronUp,
  ChevronDown,
  Edit,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  Download,
  FileText,
  AlertCircle,
  CheckCircle,
  Clock,
  Landmark,
  RefreshCw
} from 'lucide-react';
// Format currency function
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { PlaidLink } from '@/components/PlaidLink';

interface Asset {
  id: string;
  name: string;
  type: string;
  subtype: string;
  currentValue: string;
  description?: string;
  includeInNetWorth?: boolean;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

interface Liability {
  id: string;
  name: string;
  type: string;
  subtype: string;
  currentBalance: string;
  interestRate?: string;
  monthlyPayment?: string;
  description?: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

interface Account {
  id: string;
  name: string;
  type: string;
  subtype?: string;
  currentBalance: string;
  mask?: string;
  institutionName?: string;
  isActive: boolean;
  lastSyncAt?: string;
}

const ASSET_TYPES = {
  real_estate: { 
    label: 'Real Estate', 
    icon: Home, 
    color: 'bg-blue-100 text-blue-700',
    subtypes: [
      { value: 'house', label: 'House' },
      { value: 'condo', label: 'Condo' },
      { value: 'land', label: 'Land' },
      { value: 'rental_property', label: 'Rental Property' },
      { value: 'commercial', label: 'Commercial' }
    ]
  },
  vehicle: { 
    label: 'Vehicle', 
    icon: Car, 
    color: 'bg-green-100 text-green-700',
    subtypes: [
      { value: 'car', label: 'Car' },
      { value: 'truck', label: 'Truck' },
      { value: 'motorcycle', label: 'Motorcycle' },
      { value: 'boat', label: 'Boat' },
      { value: 'rv', label: 'RV' }
    ]
  },
  cash_equivalent: { 
    label: 'Cash & Savings', 
    icon: Banknote, 
    color: 'bg-yellow-100 text-yellow-700',
    subtypes: [
      { value: 'cash', label: 'Cash' },
      { value: 'checking', label: 'Checking Account' },
      { value: 'savings', label: 'Savings Account' },
      { value: 'cd', label: 'Certificate of Deposit' },
      { value: 'money_market', label: 'Money Market' }
    ]
  },
  investment: { 
    label: 'Investments', 
    icon: TrendingUp, 
    color: 'bg-purple-100 text-purple-700',
    subtypes: [
      { value: 'stocks', label: 'Stocks' },
      { value: 'bonds', label: 'Bonds' },
      { value: '401k', label: '401(k)' },
      { value: 'ira', label: 'IRA' },
      { value: 'mutual_funds', label: 'Mutual Funds' },
      { value: 'crypto', label: 'Cryptocurrency' }
    ]
  }
};

const LIABILITY_TYPES = {
  mortgage: { 
    label: 'Mortgage', 
    icon: Home, 
    color: 'bg-red-100 text-red-700',
    subtypes: [
      { value: 'primary_mortgage', label: 'Primary Mortgage' },
      { value: 'second_mortgage', label: 'Second Mortgage' },
      { value: 'heloc', label: 'HELOC' },
      { value: 'refinance', label: 'Refinance' }
    ]
  },
  auto_loan: { 
    label: 'Auto Loan', 
    icon: Car, 
    color: 'bg-red-100 text-red-700',
    subtypes: [
      { value: 'car_loan', label: 'Car Loan' },
      { value: 'truck_loan', label: 'Truck Loan' },
      { value: 'motorcycle_loan', label: 'Motorcycle Loan' },
      { value: 'lease', label: 'Vehicle Lease' }
    ]
  },
  credit_card: { 
    label: 'Credit Card', 
    icon: CreditCard, 
    color: 'bg-red-100 text-red-700',
    subtypes: [
      { value: 'visa', label: 'Visa' },
      { value: 'mastercard', label: 'Mastercard' },
      { value: 'amex', label: 'American Express' },
      { value: 'discover', label: 'Discover' },
      { value: 'store_card', label: 'Store Card' }
    ]
  },
  personal_loan: { 
    label: 'Personal Loan', 
    icon: Banknote, 
    color: 'bg-red-100 text-red-700',
    subtypes: [
      { value: 'unsecured_loan', label: 'Unsecured Loan' },
      { value: 'secured_loan', label: 'Secured Loan' },
      { value: 'payday_loan', label: 'Payday Loan' },
      { value: 'installment_loan', label: 'Installment Loan' }
    ]
  },
  student_loan: { 
    label: 'Student Loan', 
    icon: GraduationCap, 
    color: 'bg-red-100 text-red-700',
    subtypes: [
      { value: 'federal_loan', label: 'Federal Loan' },
      { value: 'private_loan', label: 'Private Loan' },
      { value: 'parent_plus', label: 'Parent PLUS' },
      { value: 'grad_plus', label: 'Grad PLUS' }
    ]
  },
  other_debt: { 
    label: 'Other Debt', 
    icon: CreditCard, 
    color: 'bg-red-100 text-red-700',
    subtypes: [
      { value: 'medical_debt', label: 'Medical Debt' },
      { value: 'tax_debt', label: 'Tax Debt' },
      { value: 'family_loan', label: 'Family Loan' },
      { value: 'business_loan', label: 'Business Loan' }
    ]
  }
};

// Form schemas
const assetSchema = z.object({
  name: z.string().min(1, 'Asset name is required').max(100, 'Name too long'),
  type: z.enum(['real_estate', 'vehicle', 'cash_equivalent', 'investment']),
  subtype: z.string().min(1, 'Asset subtype is required'),
  currentValue: z.string().min(1, 'Value is required').transform((val) => {
    const cleaned = val.replace(/[^0-9.-]/g, '');
    const num = parseFloat(cleaned);
    if (isNaN(num) || num < 0) throw new Error('Invalid value');
    return cleaned; // Return as string, not number
  }),
  description: z.string().max(500, 'Description too long').optional(),
  includeInNetWorth: z.boolean().default(true)
});

const liabilitySchema = z.object({
  name: z.string().min(1, 'Liability name is required').max(100, 'Name too long'),
  type: z.enum(['mortgage', 'auto_loan', 'credit_card', 'personal_loan', 'student_loan', 'other_debt']),
  subtype: z.string().min(1, 'Liability subtype is required'),
  currentBalance: z.string().min(1, 'Balance is required').transform((val) => {
    const cleaned = val.replace(/[^0-9.-]/g, '');
    const num = parseFloat(cleaned);
    if (isNaN(num) || num < 0) throw new Error('Invalid balance');
    return cleaned; // Return as string, not number
  }),
  interestRate: z.string().optional().transform((val) => {
    if (!val || val === '') return undefined;
    const num = parseFloat(val);
    if (isNaN(num) || num < 0 || num > 100) throw new Error('Invalid interest rate');
    return num.toString(); // Return as string
  }),
  monthlyPayment: z.string().optional().transform((val) => {
    if (!val || val === '') return undefined;
    const cleaned = val.replace(/[^0-9.-]/g, '');
    const num = parseFloat(cleaned);
    if (isNaN(num) || num < 0) throw new Error('Invalid monthly payment');
    return cleaned; // Return as string
  }),
  description: z.string().max(500, 'Description too long').optional()
});

export default function WealthManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('overview');
  const [showBalances, setShowBalances] = useState(true);
  const [expandedSections, setExpandedSections] = useState({
    assets: true,
    liabilities: true,
    accounts: true,
    upload: false
  });
  
  const [modals, setModals] = useState({
    addAsset: false,
    addLiability: false
  });

  // Data fetching
  const { data: assets = [], isLoading: assetsLoading } = useQuery<Asset[]>({
    queryKey: ['/api/assets']
  });

  const { data: liabilities = [], isLoading: liabilitiesLoading } = useQuery<Liability[]>({
    queryKey: ['/api/liabilities']
  });

  const { data: accounts = [], isLoading: accountsLoading } = useQuery<Account[]>({
    queryKey: ['/api/accounts']
  });

  const { data: netWorth } = useQuery({
    queryKey: ['/api/net-worth']
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const openModal = (modalName: keyof typeof modals) => {
    setModals(prev => ({ ...prev, [modalName]: true }));
  };

  const closeModal = (modalName: keyof typeof modals) => {
    setModals(prev => ({ ...prev, [modalName]: false }));
  };

  // Asset form
  const assetForm = useForm<z.infer<typeof assetSchema>>({
    resolver: zodResolver(assetSchema),
    defaultValues: {
      name: '',
      type: 'real_estate',
      subtype: '',
      currentValue: '',
      description: '',
      includeInNetWorth: true
    }
  });

  // Liability form
  const liabilityForm = useForm<z.infer<typeof liabilitySchema>>({
    resolver: zodResolver(liabilitySchema),
    defaultValues: {
      name: '',
      type: 'mortgage',
      subtype: '',
      currentBalance: '',
      interestRate: '',
      monthlyPayment: '',
      description: ''
    }
  });

  // Asset mutation
  const addAssetMutation = useMutation({
    mutationFn: async (data: z.infer<typeof assetSchema>) => {
      console.log('Sending asset data:', data);
      return apiRequest('/api/assets', 'POST', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/assets'] });
      queryClient.invalidateQueries({ queryKey: ['/api/net-worth'] });
      closeModal('addAsset');
      assetForm.reset();
      toast({
        title: "Asset Added",
        description: "Your asset has been successfully added to your portfolio.",
      });
    },
    onError: (error: any) => {
      console.error('Asset creation error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to add asset. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Liability mutation
  const addLiabilityMutation = useMutation({
    mutationFn: async (data: z.infer<typeof liabilitySchema>) => {
      return apiRequest('/api/liabilities', 'POST', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/liabilities'] });
      queryClient.invalidateQueries({ queryKey: ['/api/net-worth'] });
      closeModal('addLiability');
      liabilityForm.reset();
      toast({
        title: "Liability Added",
        description: "Your liability has been successfully added to your portfolio.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add liability. Please try again.",
        variant: "destructive",
      });
    }
  });

  const onAssetSubmit = (data: z.infer<typeof assetSchema>) => {
    if (editingAsset) {
      updateAssetMutation.mutate({ id: editingAsset.id, data });
    } else {
      addAssetMutation.mutate(data);
    }
  };
  
  const handleEditAsset = (asset: Asset) => {
    setEditingAsset(asset);
    assetForm.reset({
      name: asset.name,
      type: asset.type as any,
      subtype: asset.subtype,
      currentValue: asset.currentValue,
      description: asset.description || '',
      includeInNetWorth: asset.includeInNetWorth ?? true
    });
    openModal('addAsset');
  };
  
  const handleDeleteAsset = (assetId: string) => {
    if (window.confirm('Are you sure you want to delete this asset? This action cannot be undone.')) {
      deleteAssetMutation.mutate(assetId);
    }
  };
  
  const handleCloseAssetModal = () => {
    closeModal('addAsset');
    setEditingAsset(null);
    assetForm.reset();
  };

  const onLiabilitySubmit = (data: z.infer<typeof liabilitySchema>) => {
    addLiabilityMutation.mutate(data);
  };

  // Edit and Delete Asset mutations
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  
  const updateAssetMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: z.infer<typeof assetSchema> }) => {
      return apiRequest(`/api/assets/${id}`, 'PUT', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/assets'] });
      queryClient.invalidateQueries({ queryKey: ['/api/net-worth'] });
      closeModal('addAsset');
      setEditingAsset(null);
      assetForm.reset();
      toast({
        title: "Asset Updated",
        description: "Your asset has been successfully updated.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update asset. Please try again.",
        variant: "destructive",
      });
    }
  });
  
  const deleteAssetMutation = useMutation({
    mutationFn: async (assetId: string) => {
      return apiRequest(`/api/assets/${assetId}`, 'DELETE');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/assets'] });
      queryClient.invalidateQueries({ queryKey: ['/api/net-worth'] });
      toast({
        title: "Asset Deleted",
        description: "Your asset has been successfully deleted.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete asset. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Account management mutations
  const syncAccountMutation = useMutation({
    mutationFn: (accountId: string) => apiRequest('POST', `/api/accounts/${accountId}/sync`, {}),
    onSuccess: () => {
      toast({
        title: "Account Synced",
        description: "Account balance has been updated.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/accounts'] });
    },
    onError: () => {
      toast({
        title: "Sync Failed",
        description: "Failed to sync account. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteAccountMutation = useMutation({
    mutationFn: (accountId: string) => apiRequest('DELETE', `/api/accounts/${accountId}`, {}),
    onSuccess: () => {
      toast({
        title: "Account Deleted",
        description: "Account has been removed successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/accounts'] });
    },
    onError: () => {
      toast({
        title: "Delete Failed",
        description: "Failed to delete account. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Calculate totals for net worth - handle string values from database
  const totalAssets = (assets as Asset[]).reduce((sum: number, asset: Asset) => {
    const value = typeof asset.currentValue === 'string' ? parseFloat(asset.currentValue) : asset.currentValue;
    return sum + (isNaN(value) ? 0 : value);
  }, 0);
  const totalLiabilities = (liabilities as Liability[]).reduce((sum: number, liability: Liability) => {
    const balance = typeof liability.currentBalance === 'string' ? parseFloat(liability.currentBalance) : liability.currentBalance;
    return sum + (isNaN(balance) ? 0 : balance);
  }, 0);
  const netWorthValue = totalAssets - totalLiabilities;

  const isLoading = assetsLoading || liabilitiesLoading || accountsLoading;

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto space-y-6 p-4 sm:p-6" role="status" aria-label="Loading wealth management">
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-32 bg-slate-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
        <span className="sr-only">Loading your wealth management dashboard...</span>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 p-4 sm:p-6">
      {/* Page Header */}
      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
          Wealth Management
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Track your complete financial picture - assets, liabilities, and connected accounts
        </p>
      </div>

      {/* Net Worth Summary Card */}
      <Card className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-blue-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-8 w-8 text-blue-600" aria-hidden="true" />
              <div>
                <CardTitle className="text-xl text-blue-900 dark:text-blue-100">Total Net Worth</CardTitle>
                <p className="text-sm text-blue-700 dark:text-blue-300">Assets minus liabilities</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className={`text-3xl font-bold ${netWorthValue >= 0 ? 'text-green-600' : 'text-red-600'}`}
                   aria-label={`Net worth: ${showBalances ? formatCurrency(netWorthValue) : 'Hidden'}`}>
                  {showBalances ? formatCurrency(netWorthValue) : '••••••'}
                </p>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-green-600">
                    Assets: {showBalances ? formatCurrency(totalAssets) : '••••'}
                  </span>
                  <span className="text-red-600">
                    Debts: {showBalances ? formatCurrency(totalLiabilities) : '••••'}
                  </span>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowBalances(!showBalances)}
                className="p-2"
                aria-label={showBalances ? "Hide balances" : "Show balances"}
              >
                {showBalances ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Main Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:grid-cols-3">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            <span className="hidden sm:inline">Assets & Liabilities</span>
          </TabsTrigger>
          <TabsTrigger value="accounts" className="flex items-center gap-2">
            <Landmark className="h-4 w-4" />
            <span className="hidden sm:inline">Accounts</span>
          </TabsTrigger>
          <TabsTrigger value="data" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            <span className="hidden sm:inline">Financial Data</span>
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Assets Summary */}
            <Collapsible 
              open={expandedSections.assets} 
              onOpenChange={() => toggleSection('assets')}
            >
              <CollapsibleTrigger asChild>
                <Card className="cursor-pointer hover:shadow-lg transition-all duration-200 bg-gradient-to-br from-green-50 to-emerald-50 border-green-200"
                      role="button" 
                      tabIndex={0}
                      aria-expanded={expandedSections.assets}
                      aria-label="Toggle assets section">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Building2 className="h-6 w-6 text-green-600" aria-hidden="true" />
                        <div>
                          <CardTitle className="text-green-900">Assets</CardTitle>
                          <p className="text-sm text-green-700">What you own</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="text-2xl font-bold text-green-900">
                            {showBalances ? formatCurrency(totalAssets) : '••••••'}
                          </p>
                          <p className="text-sm text-green-700">{(assets as Asset[]).length} items</p>
                        </div>
                        {expandedSections.assets ? 
                          <ChevronUp className="h-5 w-5 text-green-600" /> : 
                          <ChevronDown className="h-5 w-5 text-green-600" />
                        }
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              </CollapsibleTrigger>

              <CollapsibleContent className="mt-4 space-y-3">
                {(assets as Asset[]).length === 0 ? (
                  <Card className="text-center py-8">
                    <CardContent>
                      <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No Assets Added</h3>
                      <p className="text-gray-500 mb-4">
                        Add your assets to track your complete net worth.
                      </p>
                      <Button onClick={() => openModal('addAsset')}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add First Asset
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-2">
                    {Object.entries(ASSET_TYPES).map(([type, config]) => {
                      const typeAssets = (assets as Asset[]).filter((asset: Asset) => asset.type === type);
                      const typeTotal = typeAssets.reduce((sum: number, asset: Asset) => {
                        const value = typeof asset.currentValue === 'string' ? parseFloat(asset.currentValue) : asset.currentValue;
                        return sum + (isNaN(value) ? 0 : value);
                      }, 0);
                      
                      if (typeAssets.length === 0) return null;
                      
                      return (
                        <Card key={type} className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <Badge className={config.color}>
                                <config.icon className="h-4 w-4 mr-1" />
                                {config.label}
                              </Badge>
                              <span className="text-sm text-gray-600">{typeAssets.length} items</span>
                            </div>
                            <span className="font-semibold">
                              {showBalances ? formatCurrency(typeTotal) : '••••'}
                            </span>
                          </div>
                          {/* Individual asset items */}
                          <div className="space-y-2">
                            {typeAssets.map((asset) => {
                              const assetValue = typeof asset.currentValue === 'string' ? parseFloat(asset.currentValue) : asset.currentValue;
                              return (
                                <div key={asset.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                  <div className="flex-1">
                                    <h4 className="font-medium text-gray-900">{asset.name}</h4>
                                    {asset.description && (
                                      <p className="text-sm text-gray-600">{asset.description}</p>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <span className="font-semibold text-green-700">
                                      {showBalances ? formatCurrency(assetValue) : '••••'}
                                    </span>
                                    <div className="flex gap-1">
                                      <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        className="h-8 w-8 p-0"
                                        onClick={() => handleEditAsset(asset)}
                                        data-testid={`edit-asset-${asset.id}`}
                                      >
                                        <Edit2 className="h-4 w-4" />
                                      </Button>
                                      <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                                        onClick={() => handleDeleteAsset(asset.id)}
                                        data-testid={`delete-asset-${asset.id}`}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </Card>
                      );
                    })}
                    
                    {/* Add more assets button */}
                    <Button 
                      onClick={() => openModal('addAsset')}
                      variant="outline"
                      className="w-full"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Another Asset
                    </Button>
                  </div>
                )}
              </CollapsibleContent>
            </Collapsible>

            {/* Liabilities Summary */}
            <Collapsible 
              open={expandedSections.liabilities} 
              onOpenChange={() => toggleSection('liabilities')}
            >
              <CollapsibleTrigger asChild>
                <Card className="cursor-pointer hover:shadow-lg transition-all duration-200 bg-gradient-to-br from-red-50 to-pink-50 border-red-200"
                      role="button" 
                      tabIndex={0}
                      aria-expanded={expandedSections.liabilities}
                      aria-label="Toggle liabilities section">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <CreditCard className="h-6 w-6 text-red-600" aria-hidden="true" />
                        <div>
                          <CardTitle className="text-red-900">Liabilities</CardTitle>
                          <p className="text-sm text-red-700">What you owe</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="text-2xl font-bold text-red-900">
                            {showBalances ? formatCurrency(totalLiabilities) : '••••••'}
                          </p>
                          <p className="text-sm text-red-700">{(liabilities as Liability[]).length} items</p>
                        </div>
                        {expandedSections.liabilities ? 
                          <ChevronUp className="h-5 w-5 text-red-600" /> : 
                          <ChevronDown className="h-5 w-5 text-red-600" />
                        }
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              </CollapsibleTrigger>

              <CollapsibleContent className="mt-4 space-y-3">
                {(liabilities as Liability[]).length === 0 ? (
                  <Card className="text-center py-8">
                    <CardContent>
                      <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No Liabilities Added</h3>
                      <p className="text-gray-500 mb-4">
                        Add your debts and loans to track your complete financial picture.
                      </p>
                      <Button onClick={() => openModal('addLiability')}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add First Liability
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-2">
                    {Object.entries(LIABILITY_TYPES).map(([type, config]) => {
                      const typeLiabilities = (liabilities as Liability[]).filter((liability: Liability) => liability.type === type);
                      const typeTotal = typeLiabilities.reduce((sum: number, liability: Liability) => {
                        const balance = typeof liability.currentBalance === 'string' ? parseFloat(liability.currentBalance) : liability.currentBalance;
                        return sum + (isNaN(balance) ? 0 : balance);
                      }, 0);
                      
                      if (typeLiabilities.length === 0) return null;
                      
                      return (
                        <Card key={type} className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <Badge className={config.color}>
                                <config.icon className="h-4 w-4 mr-1" />
                                {config.label}
                              </Badge>
                              <span className="text-sm text-gray-600">{typeLiabilities.length} items</span>
                            </div>
                            <span className="font-semibold">
                              {showBalances ? formatCurrency(typeTotal) : '••••'}
                            </span>
                          </div>
                          {/* Individual liability items */}
                          <div className="space-y-2">
                            {typeLiabilities.map((liability) => {
                              const liabilityBalance = typeof liability.currentBalance === 'string' ? parseFloat(liability.currentBalance) : liability.currentBalance;
                              return (
                                <div key={liability.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                  <div className="flex-1">
                                    <h4 className="font-medium text-gray-900">{liability.name}</h4>
                                    {liability.description && (
                                      <p className="text-sm text-gray-600">{liability.description}</p>
                                    )}
                                    {liability.interestRate && (
                                      <p className="text-sm text-gray-500">Interest: {liability.interestRate}%</p>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <span className="font-semibold text-red-700">
                                      {showBalances ? formatCurrency(liabilityBalance) : '••••'}
                                    </span>
                                    <div className="flex gap-1">
                                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                        <Edit2 className="h-4 w-4" />
                                      </Button>
                                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-600 hover:text-red-700">
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </Card>
                      );
                    })}
                    
                    {/* Add more liabilities button */}
                    <Button 
                      onClick={() => openModal('addLiability')}
                      variant="outline"
                      className="w-full"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Another Liability
                    </Button>
                  </div>
                )}
              </CollapsibleContent>
            </Collapsible>
          </div>
        </TabsContent>



        {/* Connected Accounts Tab */}
        <TabsContent value="accounts" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Connected Bank Accounts</h2>
            <PlaidLink 
              buttonText="Link New Account"
              variant="default"
              size="default"
              className="bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white border-0"
              onSuccess={() => {
                toast({
                  title: "Accounts Connected!",
                  description: "Your bank accounts have been successfully linked",
                });
                queryClient.invalidateQueries({ queryKey: ['/api/accounts'] });
              }}
            />
          </div>

          <Collapsible 
            open={expandedSections.accounts} 
            onOpenChange={() => toggleSection('accounts')}
          >
            <CollapsibleTrigger asChild>
              <Card className="cursor-pointer hover:shadow-lg transition-all duration-200">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Landmark className="h-6 w-6 text-blue-600" />
                      <div>
                        <CardTitle>Bank Accounts</CardTitle>
                        <p className="text-sm text-gray-600">Connected financial institutions</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="secondary">{(accounts as Account[]).length} accounts</Badge>
                      {expandedSections.accounts ? 
                        <ChevronUp className="h-5 w-5" /> : 
                        <ChevronDown className="h-5 w-5" />
                      }
                    </div>
                  </div>
                </CardHeader>
              </Card>
            </CollapsibleTrigger>

            <CollapsibleContent className="mt-4 space-y-4">
              {(accounts as Account[]).length === 0 ? (
                <Card className="text-center py-8">
                  <CardContent>
                    <Landmark className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Accounts Connected</h3>
                    <p className="text-gray-500 mb-4">
                      Connect your bank accounts to automatically sync transactions and balances.
                    </p>
                    <PlaidLink 
                      buttonText="Connect First Account"
                      variant="default"
                      size="default"
                      className="bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white border-0"
                      onSuccess={() => {
                        toast({
                          title: "Accounts Connected!",
                          description: "Your bank accounts have been successfully linked",
                        });
                        queryClient.invalidateQueries({ queryKey: ['/api/accounts'] });
                      }}
                    />
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(accounts as Account[]).map((account: Account) => (
                    <Card key={account.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              account.isActive ? 'bg-green-100' : 'bg-gray-100'
                            }`}>
                              <Landmark className={`h-5 w-5 ${
                                account.isActive ? 'text-green-600' : 'text-gray-600'
                              }`} />
                            </div>
                            <div>
                              <p className="font-medium">{account.name}</p>
                              <p className="text-sm text-gray-500">
                                {account.mask ? `••••${account.mask}` : (account.institutionName || 'Manual Account')}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <p className="font-semibold">
                                {showBalances ? formatCurrency(
                                  typeof account.currentBalance === 'string' 
                                    ? parseFloat(account.currentBalance) 
                                    : (account.currentBalance || 0)
                                ) : '••••'}
                              </p>
                              <div className="flex items-center gap-1">
                                {account.isActive ? (
                                  <CheckCircle className="h-3 w-3 text-green-500" />
                                ) : (
                                  <AlertCircle className="h-3 w-3 text-orange-500" />
                                )}
                                <span className={`text-xs ${
                                  account.isActive ? 'text-green-600' : 'text-orange-600'
                                }`}>
                                  {account.isActive ? 'Active' : 'Inactive'}
                                </span>
                              </div>
                            </div>
                            <div className="flex gap-1">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-8 w-8 p-0" 
                                title="Sync account"
                                onClick={() => syncAccountMutation.mutate(account.id)}
                                disabled={syncAccountMutation.isPending}
                              >
                                <RefreshCw className={`h-4 w-4 ${syncAccountMutation.isPending ? 'animate-spin' : ''}`} />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-8 w-8 p-0 text-red-600 hover:text-red-700" 
                                title="Delete account"
                                onClick={() => deleteAccountMutation.mutate(account.id)}
                                disabled={deleteAccountMutation.isPending}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                        {account.lastSynced && (
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <Clock className="h-3 w-3" />
                            Last synced: {new Date(account.lastSynced).toLocaleDateString()}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                  
                  {/* Add more accounts button */}
                  <Button 
                    onClick={() => window.location.href = '/connect-bank'}
                    variant="outline"
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Connect Another Account
                  </Button>
                </div>
              )}
            </CollapsibleContent>
          </Collapsible>
        </TabsContent>

        {/* Data Upload Tab */}
        <TabsContent value="data" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Upload & Manage Data</h2>
            <Button onClick={() => window.location.href = '/upload'}>
              <Upload className="h-4 w-4 mr-2" />
              Upload New File
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* CSV Upload */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <FileText className="h-6 w-6 text-blue-600" />
                  <div>
                    <CardTitle>CSV Upload</CardTitle>
                    <p className="text-sm text-gray-600">Import transaction data from CSV files</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-sm text-gray-500">
                    Upload bank statements, credit card statements, or any financial data in CSV format.
                  </p>
                  <Button onClick={() => window.location.href = '/upload'} className="w-full">
                    <Upload className="h-4 w-4 mr-2" />
                    Upload CSV File
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Export Data */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Download className="h-6 w-6 text-green-600" />
                  <div>
                    <CardTitle>Export Data</CardTitle>
                    <p className="text-sm text-gray-600">Download your financial data</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-sm text-gray-500">
                    Export your transactions, budgets, and financial data for backup or analysis.
                  </p>
                  <Button variant="outline" className="w-full">
                    <Download className="h-4 w-4 mr-2" />
                    Export All Data
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <p className="text-sm text-gray-600">Common data management tasks</p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Button variant="outline" onClick={() => window.location.href = '/transactions'}>
                  <FileText className="h-4 w-4 mr-2" />
                  View Transactions
                </Button>
                <Button variant="outline" onClick={() => window.location.href = '/categorization'}>
                  <Edit className="h-4 w-4 mr-2" />
                  Categorize Data
                </Button>
                <Button variant="outline" onClick={() => window.location.href = '/wealth-management?tab=accounts'}>
                  <Landmark className="h-4 w-4 mr-2" />
                  Link Bank Account
                </Button>
                <Button variant="outline" onClick={() => window.location.href = '/budgets'}>
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Manage Budgets
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Asset Modal */}
      <Dialog open={modals.addAsset} onOpenChange={(open) => !open && handleCloseAssetModal()}>
        <DialogContent className="sm:max-w-md" aria-describedby="add-asset-description">
          <DialogHeader>
            <DialogTitle>{editingAsset ? 'Edit Asset' : 'Add New Asset'}</DialogTitle>
            <DialogDescription id="add-asset-description">
              {editingAsset 
                ? 'Update your asset details to keep your net worth accurate.'
                : 'Add an asset to track your total net worth. Assets include property, vehicles, investments, and cash.'
              }
            </DialogDescription>
          </DialogHeader>
          
          <Form {...assetForm}>
            <form onSubmit={assetForm.handleSubmit(onAssetSubmit)} className="space-y-4">
              <FormField
                control={assetForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Asset Name</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="e.g., Primary Residence, Toyota Camry, Savings Account" 
                        {...field} 
                        aria-describedby="asset-name-error"
                      />
                    </FormControl>
                    <FormMessage id="asset-name-error" />
                  </FormItem>
                )}
              />

              <FormField
                control={assetForm.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Asset Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger aria-describedby="asset-type-error">
                          <SelectValue placeholder="Select asset type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(ASSET_TYPES).map(([value, config]) => (
                          <SelectItem key={value} value={value}>
                            {config.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage id="asset-type-error" />
                  </FormItem>
                )}
              />

              <FormField
                control={assetForm.control}
                name="subtype"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Asset Subtype</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger aria-describedby="asset-subtype-error">
                          <SelectValue placeholder="Select asset subtype" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {assetForm.watch('type') && ASSET_TYPES[assetForm.watch('type') as keyof typeof ASSET_TYPES]?.subtypes?.map((subtype) => (
                          <SelectItem key={subtype.value} value={subtype.value}>
                            {subtype.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage id="asset-subtype-error" />
                  </FormItem>
                )}
              />

              <FormField
                control={assetForm.control}
                name="currentValue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Current Value</FormLabel>
                    <FormControl>
                      <Input 
                        type="text"
                        placeholder="$0.00" 
                        {...field}
                        onChange={(e) => {
                          const value = e.target.value;
                          // Allow numbers, decimal points, and commas
                          const cleaned = value.replace(/[^0-9.,]/g, '');
                          field.onChange(cleaned);
                        }}
                        aria-describedby="asset-value-error"
                      />
                    </FormControl>
                    <FormMessage id="asset-value-error" />
                  </FormItem>
                )}
              />

              <FormField
                control={assetForm.control}
                name="includeInNetWorth"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 bg-gray-50 dark:bg-gray-800">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base font-medium">
                        Include this value in Net Worth
                      </FormLabel>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Switching this on will add the value of this asset to your total Net Worth.
                      </div>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        aria-describedby="asset-include-error"
                      />
                    </FormControl>
                    <FormMessage id="asset-include-error" />
                  </FormItem>
                )}
              />

              <FormField
                control={assetForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Additional details about this asset..."
                        rows={3}
                        {...field}
                        aria-describedby="asset-description-error"
                      />
                    </FormControl>
                    <FormMessage id="asset-description-error" />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-3 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => closeModal('addAsset')}
                  disabled={addAssetMutation.isPending}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={addAssetMutation.isPending}
                  aria-describedby="add-asset-submit-status"
                >
                  {addAssetMutation.isPending ? (
                    <>
                      <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Asset
                    </>
                  )}
                </Button>
              </div>
              <div id="add-asset-submit-status" className="sr-only">
                {addAssetMutation.isPending ? 'Adding asset, please wait...' : ''}
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Add Liability Modal */}
      <Dialog open={modals.addLiability} onOpenChange={(open) => !open && closeModal('addLiability')}>
        <DialogContent className="sm:max-w-md" aria-describedby="add-liability-description">
          <DialogHeader>
            <DialogTitle>Add New Liability</DialogTitle>
            <DialogDescription id="add-liability-description">
              Add a debt or liability to track your complete financial picture. This includes loans, credit cards, and other debts.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...liabilityForm}>
            <form onSubmit={liabilityForm.handleSubmit(onLiabilitySubmit)} className="space-y-4">
              <FormField
                control={liabilityForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Liability Name</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="e.g., Home Mortgage, Car Loan, Credit Card"
                        {...field}
                        aria-describedby="liability-name-error"
                      />
                    </FormControl>
                    <FormMessage id="liability-name-error" />
                  </FormItem>
                )}
              />

              <FormField
                control={liabilityForm.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Liability Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger aria-describedby="liability-type-error">
                          <SelectValue placeholder="Select liability type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(LIABILITY_TYPES).map(([value, config]) => (
                          <SelectItem key={value} value={value}>
                            {config.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage id="liability-type-error" />
                  </FormItem>
                )}
              />

              <FormField
                control={liabilityForm.control}
                name="subtype"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Liability Subtype</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger aria-describedby="liability-subtype-error">
                          <SelectValue placeholder="Select liability subtype" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {liabilityForm.watch('type') && LIABILITY_TYPES[liabilityForm.watch('type') as keyof typeof LIABILITY_TYPES]?.subtypes?.map((subtype) => (
                          <SelectItem key={subtype.value} value={subtype.value}>
                            {subtype.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage id="liability-subtype-error" />
                  </FormItem>
                )}
              />

              <FormField
                control={liabilityForm.control}
                name="currentBalance"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Current Balance</FormLabel>
                    <FormControl>
                      <Input 
                        type="text"
                        placeholder="$0.00"
                        {...field}
                        onChange={(e) => {
                          const value = e.target.value;
                          const cleaned = value.replace(/[^0-9.,]/g, '');
                          field.onChange(cleaned);
                        }}
                        aria-describedby="liability-balance-error"
                      />
                    </FormControl>
                    <FormMessage id="liability-balance-error" />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={liabilityForm.control}
                  name="interestRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Interest Rate (%)</FormLabel>
                      <FormControl>
                        <Input 
                          type="text"
                          placeholder="0.00"
                          {...field}
                          onChange={(e) => {
                            const value = e.target.value;
                            const cleaned = value.replace(/[^0-9.]/g, '');
                            field.onChange(cleaned);
                          }}
                          aria-describedby="liability-rate-error"
                        />
                      </FormControl>
                      <FormMessage id="liability-rate-error" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={liabilityForm.control}
                  name="monthlyPayment"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Monthly Payment</FormLabel>
                      <FormControl>
                        <Input 
                          type="text"
                          placeholder="$0.00"
                          {...field}
                          onChange={(e) => {
                            const value = e.target.value;
                            const cleaned = value.replace(/[^0-9.,]/g, '');
                            field.onChange(cleaned);
                          }}
                          aria-describedby="liability-payment-error"
                        />
                      </FormControl>
                      <FormMessage id="liability-payment-error" />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={liabilityForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Additional details about this liability..."
                        rows={3}
                        {...field}
                        aria-describedby="liability-description-error"
                      />
                    </FormControl>
                    <FormMessage id="liability-description-error" />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-3 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => closeModal('addLiability')}
                  disabled={addLiabilityMutation.isPending}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={addLiabilityMutation.isPending}
                  aria-describedby="add-liability-submit-status"
                >
                  {addLiabilityMutation.isPending ? (
                    <>
                      <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Liability
                    </>
                  )}
                </Button>
              </div>
              <div id="add-liability-submit-status" className="sr-only">
                {addLiabilityMutation.isPending ? 'Adding liability, please wait...' : ''}
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}