import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useAccountsOverview } from "@/hooks/useAccountsOverview";
import { useLastSynced } from "@/hooks/useLastSynced";
import { useSyncAccounts } from "@/hooks/useSyncAccounts";
import { PlaidLink } from "@/components/PlaidLink";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { Link } from "wouter";
import {
  ArrowRight,
  GripVertical,
  X,
  CreditCard,
  PiggyBank, 
  Landmark,
  TrendingUp,
  Plus,
  ChevronDown,
  ChevronRight,
  RefreshCw,
  Loader2,
  Building2,
  Wallet
} from "lucide-react";
import { formatCurrency } from "@/lib/financial-utils";

// Account type icons mapping
const getAccountIcon = (groupId: string) => {
  switch (groupId) {
    case 'checking':
      return <Building2 className="h-4 w-4 text-blue-600" />;
    case 'savings':
      return <PiggyBank className="h-4 w-4 text-green-600" />;
    case 'creditCards':
      return <CreditCard className="h-4 w-4 text-red-600" />;
    case 'investments':
      return <TrendingUp className="h-4 w-4 text-purple-600" />;
    case 'netCash':
      return <Wallet className="h-4 w-4 text-blue-600" />;
    default:
      return <Landmark className="h-4 w-4 text-gray-600" />;
  }
};


interface AccountsCardProps {
  onRemove?: () => void;
  isDragging?: boolean;
}

export default function AccountsCard({ onRemove, isDragging }: AccountsCardProps) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const { data: accountsData, isLoading, error, refetch } = useAccountsOverview();
  const { data: lastSynced, isLoading: lastSyncedLoading } = useLastSynced();
  const syncMutation = useSyncAccounts();
  const { toast } = useToast();

  const toggle = (id: string) =>
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));

  const lastSyncedText = lastSynced?.lastSyncedAt
    ? `Last synced ${formatDistanceToNow(new Date(lastSynced.lastSyncedAt), {
        addSuffix: true,
      })}`
    : "Never synced";

  const handleSync = () => {
    syncMutation.mutate();
  };

  const handlePlaidSuccess = () => {
    toast({
      title: "Account Connected!",
      description: "Your bank account has been linked successfully",
    });
    refetch();
  };

  if (isLoading) {
    return (
      <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-semibold text-gray-900 dark:text-white">
              Accounts
            </CardTitle>
            <div className="flex items-center gap-2">
              <div className="cursor-grab active:cursor-grabbing">
                <GripVertical className="h-4 w-4 text-gray-400" />
              </div>
              {onRemove && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onRemove}
                  className="h-8 w-8 p-0 rounded-full bg-gray-700 text-white hover:bg-gray-600"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !accountsData) {
    return (
      <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-semibold text-gray-900 dark:text-white">
              Accounts
            </CardTitle>
            <div className="flex items-center gap-2">
              <div className="cursor-grab active:cursor-grabbing">
                <GripVertical className="h-4 w-4 text-gray-400" />
              </div>
              {onRemove && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onRemove}
                  className="h-8 w-8 p-0 rounded-full bg-gray-700 text-white hover:bg-gray-600"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              No accounts connected
            </p>
            <Link href="/connect-bank">
              <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
                <Plus className="h-4 w-4 mr-2" />
                Add Account
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate total balance across all account groups
  const totalBalance = accountsData.groups.reduce((total, group) => {
    const groupTotal = group.total || 0;
    // For credit cards, use negative values as they represent debt
    return total + (group.id === 'creditCards' ? -Math.abs(groupTotal) : groupTotal);
  }, 0);

  return (
    <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
      <CardContent className="pt-0">
        <div className="mb-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-600 dark:text-gray-400"></span>
          </div>
        </div>

        <div className="space-y-2">
          {accountsData.groups.map((group) => {
            const hasChildren = Boolean(group.children && group.children.length > 0);
            const isOpen = !!expanded[group.id];
            
            return (
              <div key={group.id} className="border border-gray-200 dark:border-gray-700 rounded-lg">
                <button
                  className="flex w-full items-center justify-between p-3 focus:outline-none hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg"
                  onClick={hasChildren ? () => toggle(group.id) : undefined}
                  aria-expanded={hasChildren ? isOpen : undefined}
                >
                  <div className="flex items-center gap-3">
                    {getAccountIcon(group.id)}
                    <div className="text-left">
                      <p className="font-medium text-gray-900 dark:text-white text-sm">
                        {group.label}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {group.children?.length || 0} account{group.children?.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className={`font-semibold text-sm ${
                      group.id === 'creditCards' 
                        ? 'text-red-600 dark:text-red-400' 
                        : 'text-gray-900 dark:text-white'
                    }`}>
                      {group.id === 'creditCards' && group.total 
                        ? `-${formatCurrency(Math.abs(group.total))}`
                        : formatCurrency(group.total || 0)
                      }
                    </p>
                    {hasChildren && (
                      isOpen ? (
                        <ChevronDown className="h-4 w-4 text-gray-400" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-gray-400" />
                      )
                    )}
                  </div>
                </button>

                {hasChildren && isOpen && (
                  <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30">
                    {group.children!.map((child) => (
                      <div
                        key={child.id}
                        className="flex items-center justify-between px-4 py-3 border-b last:border-b-0 border-gray-200 dark:border-gray-600"
                      >
                        <div className="text-sm text-gray-600 dark:text-gray-300">
                          <p className="font-medium">{child.name}</p>
                          {child.mask && (
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              •••• {child.mask}
                            </p>
                          )}
                        </div>
                        <div className="text-sm font-semibold text-gray-900 dark:text-white text-right">
                          {formatCurrency(child.amount)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {accountsData.groups.length === 0 && (
          <div className="text-center py-6">
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              No accounts connected
            </p>
            <PlaidLink onSuccess={handlePlaidSuccess}>
              <Plus className="h-4 w-4 mr-2" />
              Connect Your First Account
            </PlaidLink>
          </div>
        )}
      </CardContent>
    </Card>
  );
}