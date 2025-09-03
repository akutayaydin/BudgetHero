import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { PlaidLink } from "@/components/PlaidLink";
import { PlusCircle, RefreshCw, Building, CreditCard, Banknote, TrendingUp, AlertCircle, Link, Download } from "lucide-react";
import type { Account, Institution } from "@shared/schema";

export function AccountsPage() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newAccount, setNewAccount] = useState({
    name: "",
    type: "",
    subtype: "",
    institutionId: "",
    currentBalance: "",
    mask: "",
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: accounts = [], isLoading: accountsLoading } = useQuery<Account[]>({
    queryKey: ["/api/accounts"],
  });

  const { data: institutions = [] } = useQuery<Institution[]>({
    queryKey: ["/api/institutions"],
  });

  const addAccountMutation = useMutation({
    mutationFn: async (account: any) => {
      return apiRequest("POST", "/api/accounts", account);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/accounts"] });
      setIsAddDialogOpen(false);
      setNewAccount({
        name: "",
        type: "",
        subtype: "",
        institutionId: "",
        currentBalance: "",
        mask: "",
      });
      toast({
        title: "Account Added",
        description: "Your account has been successfully added",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add account",
        variant: "destructive",
      });
    },
  });

  const syncAccountMutation = useMutation({
    mutationFn: async (accountId: string) => {
      const response = await apiRequest("POST", `/api/accounts/${accountId}/sync`);
      return response.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/accounts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      toast({
        title: "Account Synced",
        description: `Updated ${data.newTransactions || 0} transactions`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Sync Failed",
        description: error.message || "Failed to sync account",
        variant: "destructive",
      });
    },
  });

  const syncAllMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/accounts/sync-all");
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/accounts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      toast({
        title: "All Accounts Synced",
        description: `Updated ${data.syncedAccounts} connected accounts`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Sync Failed", 
        description: error.message || "Failed to sync accounts",
        variant: "destructive",
      });
    },
  });

  const getAccountTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "checking":
      case "savings":
        return <Banknote className="h-5 w-5" />;
      case "credit":
        return <CreditCard className="h-5 w-5" />;
      case "investment":
        return <TrendingUp className="h-5 w-5" />;
      default:
        return <Building className="h-5 w-5" />;
    }
  };

  const getAccountTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case "checking":
        return "bg-blue-500";
      case "savings":
        return "bg-green-500";
      case "credit":
        return "bg-red-500";
      case "investment":
        return "bg-purple-500";
      case "loan":
        return "bg-orange-500";
      default:
        return "bg-gray-500";
    }
  };

  const formatBalance = (balance: string | null) => {
    if (!balance) return "N/A";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(parseFloat(balance));
  };

  const handleAddAccount = () => {
    if (!newAccount.name || !newAccount.type) {
      toast({
        title: "Error",
        description: "Please fill in required fields",
        variant: "destructive",
      });
      return;
    }

    addAccountMutation.mutate({
      ...newAccount,
      currentBalance: newAccount.currentBalance ? parseFloat(newAccount.currentBalance) : null,
    });
  };

  return (
    <div className="p-4 space-y-6">
      <div className="flex justify-end">
        <div className="flex gap-2">
          <PlaidLink 
            buttonText="+ Add Bank Account"
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold px-6 py-2 shadow-lg"
            size="lg"
            onSuccess={() => {
              toast({
                title: "Account Connected Successfully!",
                description: "Your bank account has been linked and transactions are being imported",
              });
            }}
          />
          
          <Button 
            onClick={() => syncAllMutation.mutate()}
            disabled={syncAllMutation.isPending}
            variant="outline"
            className="border-blue-200 hover:bg-blue-50"
          >
            {syncAllMutation.isPending ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Syncing...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Sync All
              </>
            )}
          </Button>
          
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Manually
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Account</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Account Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., My Checking Account"
                  value={newAccount.name}
                  onChange={(e) => setNewAccount({ ...newAccount, name: e.target.value })}
                />
              </div>
              
              <div>
                <Label htmlFor="type">Account Type *</Label>
                <Select value={newAccount.type} onValueChange={(value) => setNewAccount({ ...newAccount, type: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select account type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="checking">Checking</SelectItem>
                    <SelectItem value="savings">Savings</SelectItem>
                    <SelectItem value="credit">Credit Card</SelectItem>
                    <SelectItem value="loan">Loan</SelectItem>
                    <SelectItem value="investment">Investment</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="institution">Institution</Label>
                <Select value={newAccount.institutionId} onValueChange={(value) => setNewAccount({ ...newAccount, institutionId: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select institution" />
                  </SelectTrigger>
                  <SelectContent>
                    {institutions.map((institution) => (
                      <SelectItem key={institution.id} value={institution.id}>
                        {institution.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="balance">Current Balance</Label>
                <Input
                  id="balance"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={newAccount.currentBalance}
                  onChange={(e) => setNewAccount({ ...newAccount, currentBalance: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="mask">Last 4 Digits</Label>
                <Input
                  id="mask"
                  placeholder="****1234"
                  maxLength={4}
                  value={newAccount.mask}
                  onChange={(e) => setNewAccount({ ...newAccount, mask: e.target.value })}
                />
              </div>

              <Button
                onClick={handleAddAccount}
                disabled={addAccountMutation.isPending}
                className="w-full"
              >
                {addAccountMutation.isPending ? "Adding..." : "Add Account"}
              </Button>
            </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Account Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Total Accounts</p>
                <p className="text-2xl font-bold">{accounts.length}</p>
              </div>
              <Building className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Total Balance</p>
                <p className="text-2xl font-bold">
                  {formatBalance(
                    accounts
                      .reduce((sum, account) => sum + (parseFloat(account.currentBalance || "0")), 0)
                      .toString()
                  )}
                </p>
              </div>
              <Banknote className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Credit Accounts</p>
                <p className="text-2xl font-bold">
                  {accounts.filter(account => account.type === 'credit').length}
                </p>
              </div>
              <CreditCard className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Active Syncs</p>
                <p className="text-2xl font-bold">
                  {accounts.filter(account => account.connectionSource !== 'manual').length}
                </p>
              </div>
              <RefreshCw className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Accounts List */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-6">
          <CardTitle>Your Accounts</CardTitle>
          <div className="flex gap-2">
            <PlaidLink 
              buttonText="Add Account"
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium px-4 py-2 text-sm shadow-md transition-all"
              size="sm"
              onSuccess={() => {
                toast({
                  title: "Account Connected!",
                  description: "Your bank account has been linked successfully",
                });
              }}
            />
          </div>
        </CardHeader>
        <CardContent>
          {accountsLoading ? (
            <div className="text-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-slate-400" />
              <p className="text-slate-600">Loading accounts...</p>
            </div>
          ) : accounts.length === 0 ? (
            <div className="text-center py-16">
              <div className="bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                <Link className="h-12 w-12 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">Ready to connect your banks?</h3>
              <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                Securely link your bank accounts to automatically import transactions and get real-time insights into your spending.
              </p>
              <div className="space-y-4">
                <PlaidLink 
                  buttonText="🏦 Connect Your First Bank Account"
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold px-8 py-3 shadow-lg text-lg"
                  size="lg"
                  onSuccess={() => {
                    toast({
                      title: "🎉 Welcome to BudgetHero!",
                      description: "Your bank account is now connected and transactions are being imported",
                    });
                  }}
                />
                <p className="text-sm text-muted-foreground">
                  <span className="inline-flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    Bank-grade security with 256-bit encryption
                  </span>
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {accounts.map((account) => (
                <div key={account.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50">
                  <div className="flex items-center space-x-4">
                    <div className={`p-2 rounded-full ${getAccountTypeColor(account.type)} text-white`}>
                      {getAccountTypeIcon(account.type)}
                    </div>
                    <div>
                      <h3 className="font-medium text-slate-900">{account.name}</h3>
                      <div className="flex items-center space-x-2 text-sm text-slate-600">
                        <Badge variant="outline">{account.type}</Badge>
                        {account.mask && <span>••••{account.mask}</span>}
                        <Badge variant={account.connectionSource === 'manual' ? 'secondary' : 'default'}>
                          {account.connectionSource}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right space-y-2">
                    <p className="text-lg font-semibold text-slate-900">
                      {formatBalance(account.currentBalance)}
                    </p>
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => syncAccountMutation.mutate(account.id)}
                        disabled={syncAccountMutation.isPending}
                      >
                        <RefreshCw className={`h-3 w-3 mr-1 ${syncAccountMutation.isPending ? 'animate-spin' : ''}`} />
                        Sync
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}