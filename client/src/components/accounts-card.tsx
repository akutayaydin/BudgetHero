import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAccountsOverview } from "@/hooks/useAccountsOverview";
import { Link } from "wouter";
import { 
  ArrowRight, 
  GripVertical, 
  X, 
  CreditCard, 
  PiggyBank, 
  Landmark,
  TrendingUp,
  Plus
} from "lucide-react";
import { formatCurrency } from "@/lib/financial-utils";

// Account type icons mapping
const getAccountIcon = (groupId: string) => {
  switch (groupId) {
    case 'checking':
      return <Landmark className="h-4 w-4 text-blue-600" />;
    case 'savings':
      return <PiggyBank className="h-4 w-4 text-green-600" />;
    case 'creditCards':
      return <CreditCard className="h-4 w-4 text-red-600" />;
    case 'investments':
      return <TrendingUp className="h-4 w-4 text-purple-600" />;
    default:
      return <Landmark className="h-4 w-4 text-gray-600" />;
  }
};

interface AccountsCardProps {
  onRemove?: () => void;
  isDragging?: boolean;
}

export default function AccountsCard({ onRemove, isDragging }: AccountsCardProps) {
  const { data: accountsData, isLoading, error } = useAccountsOverview();

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
                  className="h-8 w-8 p-0 text-gray-400 hover:text-gray-600"
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
                  className="h-8 w-8 p-0 text-gray-400 hover:text-gray-600"
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
                Connect Bank Account
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
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-semibold text-gray-900 dark:text-white">
            Accounts
          </CardTitle>
          <div className="flex items-center gap-2">
            <Link href="/wealth-management?tab=accounts">
              <Button
                variant="ghost"
                size="sm"
                className="text-purple-600 hover:text-purple-700 dark:text-purple-400 font-medium"
              >
                View All <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
            <div className="cursor-grab active:cursor-grabbing">
              <GripVertical className="h-4 w-4 text-gray-400" />
            </div>
            {onRemove && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onRemove}
                className="h-8 w-8 p-0 text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="mb-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-600 dark:text-gray-400">Total Balance</span>
            <span className={`text-2xl font-bold ${
              totalBalance >= 0 
                ? 'text-green-600 dark:text-green-400' 
                : 'text-red-600 dark:text-red-400'
            }`}>
              {formatCurrency(totalBalance)}
            </span>
          </div>
        </div>

        <div className="space-y-3">
          {accountsData.groups.slice(0, 4).map((group) => (
            <div key={group.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
              <div className="flex items-center gap-3">
                {getAccountIcon(group.id)}
                <div>
                  <p className="font-medium text-gray-900 dark:text-white text-sm">
                    {group.label}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {group.children?.length || 0} account{group.children?.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              <div className="text-right">
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
              </div>
            </div>
          ))}
        </div>

        {accountsData.groups.length === 0 && (
          <div className="text-center py-6">
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              No accounts found
            </p>
            <Link href="/connect-bank">
              <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
                <Plus className="h-4 w-4 mr-2" />
                Connect Bank Account
              </Button>
            </Link>
          </div>
        )}

        {accountsData.groups.length > 4 && (
          <div className="mt-4 text-center">
            <Link href="/wealth-management?tab=accounts">
              <Button variant="outline" size="sm" className="w-full">
                View {accountsData.groups.length - 4} More Account{accountsData.groups.length - 4 !== 1 ? 's' : ''}
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}