import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users, 
  DollarSign, 
  TrendingUp, 
  Activity,
  Shield,
  UserCheck,
  UserX,
  Database,
  RefreshCw,
  Eye,
  CreditCard,
  Receipt,
  Building2,
  Calendar,
  AlertCircle,
  Bot,
  Zap,
  Loader2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";


interface AdminUser {
  id: string;
  email: string;
  username: string;
  onboardingCompleted: boolean;
  onboardingSkipped: boolean;
  isAdmin: boolean;
  createdAt: string;
  transactionCount?: number;
  budgetCount?: number;
  accountCount?: number;
}

interface AdminStats {
  totalUsers: number;
  totalTransactions: number;
  totalBudgets: number;
  totalAccounts: number;
  newUsersThisWeek: number;
  avgTransactionsPerUser: number;
}

interface AdminAnalytics {
  conversionRates: {
    signupToFirstSync: number;
    signupToPaidUser: number;
    freeTrialToSubscription: number;
  };
  engagementPerAccount: {
    averageTransactionsPerAccount: number;
    averageAccountsPerUser: number;
    activeAccountsPercentage: number;
    lastSyncDistribution: Array<{ period: string; count: number }>;
  };
  retentionMetrics: {
    userRetention7Days: number;
    userRetention30Days: number;
    userRetention90Days: number;
    monthlyActiveUsers: number;
    dailyActiveUsers: number;
    averageSessionsPerUser: number;
  };
}

interface UserAccount {
  id: string;
  name: string;
  institutionName: string;
  accountType: string;
  hasAccessToken: boolean;
  lastSyncAt: string | null;
  currentBalance: string;
  plaidAccountId: string;
}

interface UserTransaction {
  id: string;
  date: string;
  description: string;
  amount: string;
  category: string;
  merchant: string;
}

interface UserDetailData {
  user: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    createdAt: string;
  } | null;
  accountCount: number;
  transactionCount: number;
  accounts: UserAccount[];
  recentTransactions: UserTransaction[];
}

export default function AdminPanel() {
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [viewingUserId, setViewingUserId] = useState<string>("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Check if current user is admin
  const { data: currentUser } = useQuery({
    queryKey: ["/api/auth/user"],
  });

  const isCurrentUserAdmin = Boolean(currentUser && typeof currentUser === 'object' && 'isAdmin' in currentUser && (currentUser as any).isAdmin === true);

  // Auto-categorization mutations
  const [categorizationResults, setCategorizationResults] = useState<any>(null);
  const [showCategorizationDialog, setShowCategorizationDialog] = useState(false);

  const adminAutoCategorizeMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/admin/auto-categorize-transactions', {
        method: 'POST',
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return response.json();
    },
    onSuccess: (data) => {
      setCategorizationResults(data);
      setShowCategorizationDialog(true);
      toast({
        title: "Auto-Categorization Complete",
        description: `Successfully categorized ${data.updatedCount} out of ${data.totalProcessed} transactions using import algorithm`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
    },
    onError: (error) => {
      console.error('Admin auto-categorization error:', error);
      toast({
        title: "Auto-Categorization Failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    },
  });

  const isCategorizationLoading = adminAutoCategorizeMutation.isPending;

  const { data: adminStats, isLoading: statsLoading } = useQuery<AdminStats>({
    queryKey: ["/api/admin/stats"],
    enabled: isCurrentUserAdmin,
  });

  const { data: adminAnalytics, isLoading: analyticsLoading } = useQuery<AdminAnalytics>({
    queryKey: ["/api/admin/analytics"],
    enabled: isCurrentUserAdmin,
  });

  const { data: users, isLoading: usersLoading } = useQuery<AdminUser[]>({
    queryKey: ["/api/admin/users"],
    enabled: isCurrentUserAdmin,
  });

  const { data: userDetail, isLoading: userDetailLoading } = useQuery<UserDetailData>({
    queryKey: ["/api/admin/user", viewingUserId],
    enabled: isCurrentUserAdmin && !!viewingUserId,
  });

  const resetUserDataMutation = useMutation({
    mutationFn: (userId: string) => 
      apiRequest(`/api/admin/users/${userId}/reset`, "POST"),
    onSuccess: () => {
      toast({ description: "User data reset successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
    },
    onError: () => {
      toast({ variant: "destructive", description: "Failed to reset user data" });
    },
  });

  const toggleAdminMutation = useMutation({
    mutationFn: ({ userId, isAdmin }: { userId: string; isAdmin: boolean }) => 
      apiRequest(`/api/admin/users/${userId}/admin`, "PATCH", { isAdmin }),
    onSuccess: () => {
      toast({ description: "Admin status updated successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
    },
    onError: () => {
      toast({ variant: "destructive", description: "Failed to update admin status" });
    },
  });

  const syncAccountMutation = useMutation({
    mutationFn: (accountId: string) => 
      apiRequest(`/api/admin/sync-account/${accountId}`, "POST"),
    onSuccess: () => {
      toast({ description: "Account synced successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/user", viewingUserId] });
    },
    onError: () => {
      toast({ variant: "destructive", description: "Failed to sync account" });
    },
  });

  // Redirect if not admin
  if (currentUser && !isCurrentUserAdmin) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Shield className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
              <p className="text-gray-600">You need administrator privileges to access this page.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isCurrentUserAdmin) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Admin Panel</h1>
          <p className="text-gray-600">Manage users and system statistics</p>
        </div>
        <Badge variant="secondary" className="flex items-center gap-2">
          <Shield className="h-4 w-4" />
          Administrator
        </Badge>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? "..." : adminStats?.totalUsers || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              +{adminStats?.newUsersThisWeek || 0} this week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? "..." : adminStats?.totalTransactions || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Avg {adminStats?.avgTransactionsPerUser || 0} per user
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Budgets</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? "..." : adminStats?.totalBudgets || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Accounts</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? "..." : adminStats?.totalAccounts || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-4">
          <Button asChild>
            <a href="/admin/categories">Manage Categories</a>
          </Button>
          <Button asChild>
            <a href="/admin/recurring-merchants">Recurring Merchants</a>
          </Button>
          <Button asChild>
            <a href="/settings">System Settings</a>
          </Button>
          <Button asChild>
            <a href="/reports">View Reports</a>
          </Button>
          <Dialog open={showCategorizationDialog} onOpenChange={setShowCategorizationDialog}>
            <DialogTrigger asChild>
              <Button 
                variant="outline" 
                className="gap-2"
                disabled={isCategorizationLoading}
                data-testid="button-auto-categorization"
              >
                {isCategorizationLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Bot className="w-4 h-4" />
                )}
                {isCategorizationLoading ? "Processing..." : "Auto-Categorization"}
              </Button>
            </DialogTrigger>
            
            <DialogContent className="sm:max-w-lg" aria-describedby="auto-categorization-description">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Bot className="w-5 h-5" />
                  Auto-Categorization Testing Tool
                </DialogTitle>
                <DialogDescription id="auto-categorization-description">
                  Admin-only testing tool for auto-categorization of your current user transactions
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                {!categorizationResults && !isCategorizationLoading && (
                  <div className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Bot className="w-4 h-4 text-green-600" />
                          Auto-Categorization
                        </CardTitle>
                        <CardDescription className="text-xs">
                          Uses the exact same categorization algorithm as transaction import (manual/Plaid). Only categorizes transactions marked as "Other" or "Uncategorized".
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Button 
                          onClick={() => adminAutoCategorizeMutation.mutate()}
                          disabled={isCategorizationLoading}
                          className="w-full"
                          data-testid="button-run-auto-categorization"
                        >
                          <Bot className="w-4 h-4 mr-2" />
                          Run Auto-Categorization
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {isCategorizationLoading && (
                  <div className="text-center py-8">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
                    <p className="text-sm text-muted-foreground">
                      Processing transactions... This may take a moment.
                    </p>
                  </div>
                )}

                {categorizationResults && (
                  <div className="space-y-4">
                    <div className="text-center">
                      <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-2">
                        <Bot className="w-6 h-6 text-green-600 dark:text-green-400" />
                      </div>
                      <h3 className="text-lg font-semibold">Processing Complete!</h3>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                          {categorizationResults.categorized || categorizationResults.updated || categorizationResults.updatedCount || 0}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {categorizationResults.categorized ? 'Categorized' : 'Updated'}
                        </p>
                      </div>
                      <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                          {categorizationResults.total || categorizationResults.detected || categorizationResults.totalProcessed || 0}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {categorizationResults.total ? 'Total Processed' : categorizationResults.totalProcessed ? 'Total Processed' : 'Detected'}
                        </p>
                      </div>
                    </div>

                    {categorizationResults.results && categorizationResults.results.length > 0 && (
                      <div className="mt-4">
                        <h4 className="text-sm font-medium mb-2">Recent Updates:</h4>
                        <div className="max-h-32 overflow-y-auto space-y-1">
                          {categorizationResults.results.slice(0, 5).map((result: any, index: number) => (
                            <div key={index} className="text-xs p-2 bg-gray-50 dark:bg-gray-900/20 rounded">
                              <div className="font-medium truncate">{result.description}</div>
                              <div className="text-muted-foreground">
                                {result.oldCategory || 'Uncategorized'} → {result.newCategory || result.detectedCategory}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex justify-center">
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          setShowCategorizationDialog(false);
                          setCategorizationResults(null);
                        }}
                      >
                        Close
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Main Admin Tabs */}
      <Tabs defaultValue="analytics" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="analytics">📊 Analytics & Insights</TabsTrigger>
          <TabsTrigger value="users">👥 User Management</TabsTrigger>
        </TabsList>

        <TabsContent value="analytics" className="space-y-6">
          {/* Conversion Rates */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Conversion Rates
              </CardTitle>
              <CardDescription>
                Track how users convert from signup to active engagement
              </CardDescription>
            </CardHeader>
            <CardContent>
              {analyticsLoading ? (
                <div className="text-center py-8">Loading analytics...</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {adminAnalytics?.conversionRates.signupToFirstSync || 0}%
                    </div>
                    <p className="text-sm text-muted-foreground">Signup → First Sync</p>
                  </div>
                  <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {adminAnalytics?.conversionRates.signupToPaidUser || 0}%
                    </div>
                    <p className="text-sm text-muted-foreground">Signup → Paid User</p>
                  </div>
                  <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                      {adminAnalytics?.conversionRates.freeTrialToSubscription || 0}%
                    </div>
                    <p className="text-sm text-muted-foreground">Trial → Subscription</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Engagement Per Account */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Engagement Per Account
              </CardTitle>
              <CardDescription>
                Analyze user engagement with connected accounts
              </CardDescription>
            </CardHeader>
            <CardContent>
              {analyticsLoading ? (
                <div className="text-center py-8">Loading engagement data...</div>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                      <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                        {adminAnalytics?.engagementPerAccount.averageTransactionsPerAccount || 0}
                      </div>
                      <p className="text-sm text-muted-foreground">Avg Transactions/Account</p>
                    </div>
                    <div className="text-center p-4 bg-cyan-50 dark:bg-cyan-900/20 rounded-lg">
                      <div className="text-2xl font-bold text-cyan-600 dark:text-cyan-400">
                        {adminAnalytics?.engagementPerAccount.averageAccountsPerUser || 0}
                      </div>
                      <p className="text-sm text-muted-foreground">Avg Accounts/User</p>
                    </div>
                    <div className="text-center p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
                      <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                        {adminAnalytics?.engagementPerAccount.activeAccountsPercentage || 0}%
                      </div>
                      <p className="text-sm text-muted-foreground">Active Accounts (30d)</p>
                    </div>
                  </div>
                  
                  {/* Last Sync Distribution */}
                  <div>
                    <h4 className="font-semibold mb-3">Account Sync Distribution</h4>
                    <div className="space-y-2">
                      {adminAnalytics?.engagementPerAccount.lastSyncDistribution.map((item, index) => (
                        <div key={index} className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-800 rounded">
                          <span className="text-sm">{item.period}</span>
                          <span className="font-semibold">{item.count} accounts</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Retention Metrics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Retention Metrics
              </CardTitle>
              <CardDescription>
                Track user retention and activity over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              {analyticsLoading ? (
                <div className="text-center py-8">Loading retention data...</div>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                      <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                        {adminAnalytics?.retentionMetrics.userRetention7Days || 0}%
                      </div>
                      <p className="text-sm text-muted-foreground">7-Day Retention</p>
                    </div>
                    <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                      <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                        {adminAnalytics?.retentionMetrics.userRetention30Days || 0}%
                      </div>
                      <p className="text-sm text-muted-foreground">30-Day Retention</p>
                    </div>
                    <div className="text-center p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                      <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                        {adminAnalytics?.retentionMetrics.userRetention90Days || 0}%
                      </div>
                      <p className="text-sm text-muted-foreground">90-Day Retention</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-teal-50 dark:bg-teal-900/20 rounded-lg">
                      <div className="text-2xl font-bold text-teal-600 dark:text-teal-400">
                        {adminAnalytics?.retentionMetrics.dailyActiveUsers || 0}
                      </div>
                      <p className="text-sm text-muted-foreground">Daily Active Users</p>
                    </div>
                    <div className="text-center p-4 bg-pink-50 dark:bg-pink-900/20 rounded-lg">
                      <div className="text-2xl font-bold text-pink-600 dark:text-pink-400">
                        {adminAnalytics?.retentionMetrics.monthlyActiveUsers || 0}
                      </div>
                      <p className="text-sm text-muted-foreground">Monthly Active Users</p>
                    </div>
                    <div className="text-center p-4 bg-violet-50 dark:bg-violet-900/20 rounded-lg">
                      <div className="text-2xl font-bold text-violet-600 dark:text-violet-400">
                        {adminAnalytics?.retentionMetrics.averageSessionsPerUser || 0}
                      </div>
                      <p className="text-sm text-muted-foreground">Avg Sessions/User</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>
                Manage user accounts, permissions, and data
              </CardDescription>
            </CardHeader>
            <CardContent>
          {usersLoading ? (
            <div className="text-center py-8">Loading users...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Username</TableHead>
                  <TableHead>Onboarding</TableHead>
                  <TableHead>Admin</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users?.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.email}</TableCell>
                    <TableCell>{user.username}</TableCell>
                    <TableCell>
                      {user.onboardingCompleted ? (
                        <Badge variant="secondary">Completed</Badge>
                      ) : user.onboardingSkipped ? (
                        <Badge variant="outline">Skipped</Badge>
                      ) : (
                        <Badge variant="destructive">Pending</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {user.isAdmin ? (
                        <Badge variant="default">Admin</Badge>
                      ) : (
                        <Badge variant="outline">User</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-gray-600">
                        T:{user.transactionCount || 0} | B:{user.budgetCount || 0} | A:{user.accountCount || 0}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setViewingUserId(user.id)}
                            >
                              <Eye className="h-4 w-4" />
                              View Details
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>User Support Dashboard</DialogTitle>
                              <DialogDescription>
                                View user data, transactions, and accounts for customer support
                              </DialogDescription>
                            </DialogHeader>
                            
                            {userDetailLoading ? (
                              <div className="text-center py-8">Loading user details...</div>
                            ) : userDetail ? (
                              <Tabs defaultValue="overview" className="w-full">
                                <TabsList className="grid w-full grid-cols-4">
                                  <TabsTrigger value="overview">Overview</TabsTrigger>
                                  <TabsTrigger value="accounts">Accounts</TabsTrigger>
                                  <TabsTrigger value="transactions">Transactions</TabsTrigger>
                                  <TabsTrigger value="actions">Actions</TabsTrigger>
                                </TabsList>
                                
                                <TabsContent value="overview" className="space-y-4">
                                  <Card>
                                    <CardHeader>
                                      <CardTitle className="flex items-center gap-2">
                                        <Users className="h-5 w-5" />
                                        User Information
                                      </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                      {userDetail.user ? (
                                        <>
                                          <div className="grid grid-cols-2 gap-4">
                                            <div>
                                              <Label className="text-sm font-medium">Email</Label>
                                              <p className="text-sm text-gray-600">{userDetail.user.email}</p>
                                            </div>
                                            <div>
                                              <Label className="text-sm font-medium">User ID</Label>
                                              <p className="text-sm font-mono text-gray-600">{userDetail.user.id}</p>
                                            </div>
                                            <div>
                                              <Label className="text-sm font-medium">Name</Label>
                                              <p className="text-sm text-gray-600">
                                                {userDetail.user.firstName || userDetail.user.lastName ? 
                                                  `${userDetail.user.firstName || ''} ${userDetail.user.lastName || ''}`.trim() : 
                                                  'Not provided'
                                                }
                                              </p>
                                            </div>
                                            <div>
                                              <Label className="text-sm font-medium">Joined</Label>
                                              <p className="text-sm text-gray-600">
                                                {format(new Date(userDetail.user.createdAt), 'MMM dd, yyyy')}
                                              </p>
                                            </div>
                                          </div>
                                          
                                          <div className="grid grid-cols-3 gap-4 pt-4">
                                            <div className="text-center">
                                              <div className="text-2xl font-bold text-blue-600">{userDetail.accountCount}</div>
                                              <div className="text-sm text-gray-500">Connected Accounts</div>
                                            </div>
                                            <div className="text-center">
                                              <div className="text-2xl font-bold text-green-600">{userDetail.transactionCount}</div>
                                              <div className="text-sm text-gray-500">Total Transactions</div>
                                            </div>
                                            <div className="text-center">
                                              <div className="text-2xl font-bold text-purple-600">
                                                {userDetail.recentTransactions.length}
                                              </div>
                                              <div className="text-sm text-gray-500">Recent Transactions</div>
                                            </div>
                                          </div>
                                        </>
                                      ) : (
                                        <div className="text-center py-4">
                                          <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
                                          <p className="text-red-600">User not found</p>
                                        </div>
                                      )}
                                    </CardContent>
                                  </Card>
                                </TabsContent>
                                
                                <TabsContent value="accounts" className="space-y-4">
                                  <Card>
                                    <CardHeader>
                                      <CardTitle className="flex items-center gap-2">
                                        <CreditCard className="h-5 w-5" />
                                        Connected Accounts ({userDetail.accountCount})
                                      </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                      {userDetail.accounts.length > 0 ? (
                                        <div className="space-y-4">
                                          {userDetail.accounts.map((account) => (
                                            <div key={account.id} className="border rounded-lg p-4">
                                              <div className="flex justify-between items-start mb-3">
                                                <div>
                                                  <h4 className="font-medium">{account.name}</h4>
                                                  <p className="text-sm text-gray-500">{account.institutionName}</p>
                                                  <Badge variant="outline" className="mt-1">
                                                    {account.accountType}
                                                  </Badge>
                                                </div>
                                                <div className="text-right">
                                                  <div className="text-lg font-semibold">
                                                    ${parseFloat(account.currentBalance || '0').toLocaleString()}
                                                  </div>
                                                  {account.hasAccessToken ? (
                                                    <Badge variant="default">Connected</Badge>
                                                  ) : (
                                                    <Badge variant="destructive">Disconnected</Badge>
                                                  )}
                                                </div>
                                              </div>
                                              
                                              <div className="grid grid-cols-2 gap-4 text-sm">
                                                <div>
                                                  <Label className="text-xs text-gray-500">Account ID</Label>
                                                  <p className="font-mono text-xs break-all">{account.id}</p>
                                                </div>
                                                <div>
                                                  <Label className="text-xs text-gray-500">Plaid Account ID</Label>
                                                  <p className="font-mono text-xs break-all">{account.plaidAccountId}</p>
                                                </div>
                                                <div>
                                                  <Label className="text-xs text-gray-500">Last Sync</Label>
                                                  <p className="text-xs">
                                                    {account.lastSyncAt ? 
                                                      format(new Date(account.lastSyncAt), 'MMM dd, yyyy HH:mm') : 
                                                      'Never'
                                                    }
                                                  </p>
                                                </div>
                                                <div className="flex justify-end">
                                                  <Button
                                                    size="sm"
                                                    onClick={() => syncAccountMutation.mutate(account.id)}
                                                    disabled={syncAccountMutation.isPending}
                                                  >
                                                    <RefreshCw className="h-3 w-3 mr-1" />
                                                    Force Sync
                                                  </Button>
                                                </div>
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      ) : (
                                        <div className="text-center py-8">
                                          <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                                          <p className="text-gray-500">No connected accounts</p>
                                        </div>
                                      )}
                                    </CardContent>
                                  </Card>
                                </TabsContent>
                                
                                <TabsContent value="transactions" className="space-y-4">
                                  <Card>
                                    <CardHeader>
                                      <CardTitle className="flex items-center gap-2">
                                        <Receipt className="h-5 w-5" />
                                        Recent Transactions ({userDetail.recentTransactions.length})
                                      </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                      {userDetail.recentTransactions.length > 0 ? (
                                        <Table>
                                          <TableHeader>
                                            <TableRow>
                                              <TableHead>Date</TableHead>
                                              <TableHead>Description</TableHead>
                                              <TableHead>Merchant</TableHead>
                                              <TableHead>Category</TableHead>
                                              <TableHead className="text-right">Amount</TableHead>
                                            </TableRow>
                                          </TableHeader>
                                          <TableBody>
                                            {userDetail.recentTransactions.map((transaction) => (
                                              <TableRow key={transaction.id}>
                                                <TableCell>
                                                  {format(new Date(transaction.date), 'MMM dd')}
                                                </TableCell>
                                                <TableCell className="max-w-[200px] truncate">
                                                  {transaction.description}
                                                </TableCell>
                                                <TableCell>{transaction.merchant || '-'}</TableCell>
                                                <TableCell>
                                                  <Badge variant="outline">{transaction.category}</Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                  <span className={parseFloat(transaction.amount) < 0 ? "text-red-600" : "text-green-600"}>
                                                    ${Math.abs(parseFloat(transaction.amount)).toLocaleString()}
                                                  </span>
                                                </TableCell>
                                              </TableRow>
                                            ))}
                                          </TableBody>
                                        </Table>
                                      ) : (
                                        <div className="text-center py-8">
                                          <Receipt className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                                          <p className="text-gray-500">No transactions found</p>
                                          <p className="text-sm text-gray-400 mt-1">
                                            This could indicate a sync issue or the account has no recent activity
                                          </p>
                                        </div>
                                      )}
                                    </CardContent>
                                  </Card>
                                </TabsContent>
                                
                                <TabsContent value="actions" className="space-y-4">
                                  <Card>
                                    <CardHeader>
                                      <CardTitle>Support Actions</CardTitle>
                                      <CardDescription>
                                        Administrative actions for customer support
                                      </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <Button
                                          variant="outline"
                                          onClick={() => 
                                            toggleAdminMutation.mutate({
                                              userId: user.id,
                                              isAdmin: !user.isAdmin
                                            })
                                          }
                                          disabled={toggleAdminMutation.isPending}
                                          className="justify-start"
                                        >
                                          {user.isAdmin ? <UserX className="h-4 w-4 mr-2" /> : <UserCheck className="h-4 w-4 mr-2" />}
                                          {user.isAdmin ? "Remove Admin" : "Make Admin"}
                                        </Button>
                                        
                                        <Button
                                          variant="destructive"
                                          onClick={() => resetUserDataMutation.mutate(user.id)}
                                          disabled={resetUserDataMutation.isPending}
                                          className="justify-start"
                                        >
                                          <RefreshCw className="h-4 w-4 mr-2" />
                                          Reset All Data
                                        </Button>
                                      </div>
                                      
                                      <div className="pt-4 border-t">
                                        <h4 className="font-medium mb-3">Account Sync Actions</h4>
                                        <div className="space-y-2">
                                          {userDetail.accounts.map((account) => (
                                            <div key={account.id} className="flex justify-between items-center p-3 border rounded">
                                              <div>
                                                <p className="font-medium">{account.name}</p>
                                                <p className="text-sm text-gray-500">{account.institutionName}</p>
                                              </div>
                                              <Button
                                                size="sm"
                                                onClick={() => syncAccountMutation.mutate(account.id)}
                                                disabled={syncAccountMutation.isPending}
                                              >
                                                <RefreshCw className="h-3 w-3 mr-1" />
                                                Sync
                                              </Button>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    </CardContent>
                                  </Card>
                                </TabsContent>
                              </Tabs>
                            ) : (
                              <div className="text-center py-8">
                                <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-2" />
                                <p className="text-red-600">Failed to load user details</p>
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                        
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => resetUserDataMutation.mutate(user.id)}
                          disabled={resetUserDataMutation.isPending}
                        >
                          <RefreshCw className="h-4 w-4" />
                          Reset Data
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}