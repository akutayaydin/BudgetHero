import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import {
  ChevronDown,
  ChevronUp,
  Wallet,
  CreditCard,
  Building2,
  DollarSign,
  LineChart,
  PiggyBank,
  Plus,
  Loader2,
  Info,
} from "lucide-react";
import { PlaidLink } from "@/components/PlaidLink";
import { useToast } from "@/hooks/use-toast";
import { useLastSynced } from "@/hooks/useLastSynced";
import { useSyncAccounts } from "@/hooks/useSyncAccounts";
import { formatDistanceToNow } from "date-fns";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Account {
  id: string;
  name: string;
  type: string;
  subtype?: string;
  currentBalance: string | number;
  availableBalance?: string | number;
  officialName?: string;
  mask?: string;
}

interface AccountsSectionProps {
  className?: string;
}

export function AccountsSection({ className }: AccountsSectionProps) {
  const [expandedSections, setExpandedSections] = useState<string[]>([]);
  const { toast } = useToast();

  const {
    data: accounts = [],
    isLoading,
    isError,
    refetch,
  } = useQuery<Account[]>({
    queryKey: ["/api/accounts"],
  });

  const { data: lastSynced, isLoading: lastSyncedLoading } = useLastSynced();
  const syncMutation = useSyncAccounts();

  const handlePlaidSuccess = () => {
    toast({
      title: "Account Connected!",
      description: "Your bank account has been linked successfully",
    });
  };

  const toggleSection = (section: string) => {
    setExpandedSections((prev) =>
      prev.includes(section) ? prev.filter((s) => s !== section) : [...prev, section]
    );
  };

  // Group accounts
  const checkingAccounts = accounts.filter(
    (acc) => acc.type === "depository" && acc.subtype !== "savings"
  );
  const creditAccounts = accounts.filter((acc) => acc.type === "credit");
  const savingsAccounts = accounts.filter(
    (acc) => acc.type === "depository" && acc.subtype === "savings"
  );
  const investmentAccounts = accounts.filter((acc) => acc.type === "investment");

  // Totals
  const totalChecking = checkingAccounts.reduce((sum, acc) => {
    const balance =
      typeof acc.currentBalance === "string"
        ? parseFloat(acc.currentBalance)
        : acc.currentBalance;
    return sum + (isNaN(balance) ? 0 : balance);
  }, 0);

  const totalCredit = creditAccounts.reduce((sum, acc) => {
    const balance =
      typeof acc.currentBalance === "string"
        ? parseFloat(acc.currentBalance)
        : acc.currentBalance;
    return sum + Math.abs(isNaN(balance) ? 0 : balance);
  }, 0);

  const totalSavings = savingsAccounts.reduce((sum, acc) => {
    const balance =
      typeof acc.currentBalance === "string"
        ? parseFloat(acc.currentBalance)
        : acc.currentBalance;
    return sum + (isNaN(balance) ? 0 : balance);
  }, 0);

  const totalInvestments = investmentAccounts.reduce((sum, acc) => {
    const balance =
      typeof acc.currentBalance === "string"
        ? parseFloat(acc.currentBalance)
        : acc.currentBalance;
    return sum + (isNaN(balance) ? 0 : balance);
  }, 0);

  const netCash = totalChecking - totalCredit;

  const isCheckingEmpty = checkingAccounts.length === 0;
  const isCreditEmpty = creditAccounts.length === 0;
  const isSavingsEmpty = savingsAccounts.length === 0;
  const isInvestmentsEmpty = investmentAccounts.length === 0;
  const hasAnyAccount = !isCheckingEmpty || !isCreditEmpty;

  const isExpanded = (section: string) => expandedSections.includes(section);

  // Show "1 minute ago" style (no "about", no "Last synced")
  const lastSyncedText = lastSynced?.lastSyncedAt
    ? formatDistanceToNow(new Date(lastSynced.lastSyncedAt), { addSuffix: true }).replace(
        /^about\s+/i,
        ""
      )
    : "never";

  const handleSync = () => {
    syncMutation.mutate();
  };

  return (
    <Card className={className}>
      {/* Header: single row; title left, status right, CTA still available */}
      <CardHeader className="pb-4 space-y-4 sm:space-y-0 sm:flex sm:items-center sm:justify-between">
        <div className="flex w-full items-center justify-between">
          <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Wallet className="w-5 h-5" />
            Accounts
          </CardTitle>

          <div
            className="ml-auto flex items-center gap-1 text-xs text-muted-foreground"
            aria-live="polite"
          >
            {lastSyncedLoading ? <Skeleton className="h-3 w-24" /> : <span>{lastSyncedText}</span>}
            <span aria-hidden="true">|</span>
            <Button
              variant="link"
              className="h-auto p-0 text-xs"
              onClick={handleSync}
              disabled={syncMutation.isPending}
              aria-busy={syncMutation.isPending}
            >
              {syncMutation.isPending && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
              Sync now
            </Button>
          </div>
        </div>

        <div className="flex w-full justify-end">
          <PlaidLink
            buttonText="Add Account"
            className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium px-3 py-1.5 text-xs shadow-md transition-all"
            size="sm"
            onSuccess={handlePlaidSuccess}
          />
        </div>
      </CardHeader>

      {syncMutation.isError && (
        <div className="px-4 text-xs text-red-600">
          Sync failed.{" "}
          <Button variant="link" className="p-0 text-xs" onClick={handleSync}>
            Try again.
          </Button>
        </div>
      )}

      <CardContent className="p-4 space-y-6">
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        ) : isError ? (
          <div className="text-sm text-red-600">
            Failed to load accounts.{" "}
            <Button variant="link" className="p-0 text-sm" onClick={() => refetch()}>
              Retry
            </Button>
          </div>
        ) : (
          <>
            {/* Checking */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg">
              <Button
                variant="ghost"
                className="w-full justify-between p-4 h-auto"
                onClick={() => !isCheckingEmpty && toggleSection("checking")}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-950/30 rounded-lg flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="text-left">
                    <h4 className="font-medium text-gray-900 dark:text-white">Checking</h4>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {isCheckingEmpty ? (
                    <PlaidLink
                      icon={<Plus className="h-4 w-4" />}
                      buttonText=""
                      variant="outline"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onSuccess={handlePlaidSuccess}
                    />
                  ) : (
                    <>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        ${totalChecking.toLocaleString()}
                      </span>
                      {isExpanded("checking") ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </>
                  )}
                </div>
              </Button>

              {isExpanded("checking") && !isCheckingEmpty && (
                <div className="border-t border-gray-200 dark:border-gray-700 p-4 space-y-3">
                  {checkingAccounts.map((account) => (
                    <div key={account.id} className="flex items-center gap-3 py-2">
                      <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-semibold text-gray-600 dark:text-gray-300">
                          {account.name.charAt(0).toUpperCase()}
                        </span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div
                          className="text-sm font-semibold text-gray-900 dark:text-white truncate"
                          title={account.name}
                        >
                          {account.name}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {account.mask && (

                      <span>{`• • ${account.mask}`}</span>
                          )}
                          {account.mask && account.officialName ? " | " : ""}
                          {account.officialName || ""}
                        </div>
                      </div>

                      <div className="text-sm font-semibold text-gray-900 dark:text-white text-right">
                        $
                        {(
                          (typeof account.currentBalance === "string"
                            ? parseFloat(account.currentBalance)
                            : account.currentBalance) || 0
                        ).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Credit Cards */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg">
              <Button
                variant="ghost"
                className="w-full justify-between p-4 h-auto"
                onClick={() => !isCreditEmpty && toggleSection("credit")}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-100 dark:bg-red-950/30 rounded-lg flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-red-600 dark:text-red-400" />
                  </div>
                  <div className="text-left">
                    <h4 className="font-medium text-gray-900 dark:text-white">Credit Cards</h4>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {isCreditEmpty ? (
                    <PlaidLink
                      icon={<Plus className="h-4 w-4" />}
                      buttonText=""
                      variant="outline"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onSuccess={handlePlaidSuccess}
                    />
                  ) : (
                    <>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        ${totalCredit.toLocaleString()}
                      </span>
                      {isExpanded("credit") ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </>
                  )}
                </div>
              </Button>

              {isExpanded("credit") && !isCreditEmpty && (
                <div className="border-t border-gray-200 dark:border-gray-700 p-4 space-y-3">
                  {creditAccounts.map((account) => (
                    <div key={account.id} className="flex items-center gap-3 py-2">
                      <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-semibold text-gray-600 dark:text-gray-300">
                          {account.name.charAt(0).toUpperCase()}
                        </span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div
                          className="text-sm font-semibold text-gray-900 dark:text-white truncate"
                          title={account.name}
                        >
                          {account.name}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {account.mask && (

                      <span>{`• • ${account.mask}`}</span>
                          )}
                          {account.mask && account.officialName ? " | " : ""}
                          {account.officialName || ""}
                        </div>
                      </div>

                      <div className="text-sm font-semibold text-gray-900 dark:text-white text-right">
                        $
                        {(
                          (typeof account.currentBalance === "string"
                            ? parseFloat(account.currentBalance)
                            : account.currentBalance) || 0
                        ).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Net Cash Summary (small card with tooltip) */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 dark:bg-green-950/30 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <div className="flex items-center gap-1">
                  <h4 className="font-medium text-gray-900 dark:text-white">Net Cash</h4>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-4 w-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent side="top">Checking minus credit balances</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
              {hasAnyAccount && (
                <span
                  className={`font-semibold ${
                    netCash >= 0
                      ? "text-green-600 dark:text-green-400"
                      : "text-red-600 dark:text-red-400"
                  } `}
                >
                  ${netCash.toLocaleString()}
                </span>
              )}
            </div>

            {/* Savings */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg">
              <Button
                variant="ghost"
                className="w-full justify-between p-4 h-auto"
                onClick={() => !isSavingsEmpty && toggleSection("savings")}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-950/30 rounded-lg flex items-center justify-center">
                    <PiggyBank className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div className="text-left">
                    <h4 className="font-medium text-gray-900 dark:text-white">Savings</h4>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {isSavingsEmpty ? (
                    <PlaidLink
                      icon={<Plus className="h-4 w-4" />}
                      buttonText=""
                      variant="outline"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onSuccess={handlePlaidSuccess}
                    />
                  ) : (
                    <>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        ${totalSavings.toLocaleString()}
                      </span>
                      {isExpanded("savings") ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </>
                  )}
                </div>
              </Button>

              {isExpanded("savings") && !isSavingsEmpty && (
                <div className="border-t border-gray-200 dark:border-gray-700 p-4 space-y-3">
                  {savingsAccounts.map((account) => (
                    <div key={account.id} className="flex items-center gap-3 py-2">
                      <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-semibold text-gray-600 dark:text-gray-300">
                          {account.name.charAt(0).toUpperCase()}
                        </span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div
                          className="text-sm font-semibold text-gray-900 dark:text-white truncate"
                          title={account.name}
                        >
                          {account.name}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {account.mask && (

                      <span>{`• • ${account.mask}`}</span>
                          )}
                          {account.mask && account.officialName ? " | " : ""}
                          {account.officialName || ""}
                        </div>
                      </div>

                      <div className="text-sm font-semibold text-gray-900 dark:text-white text-right">
                        $
                        {(
                          (typeof account.currentBalance === "string"
                            ? parseFloat(account.currentBalance)
                            : account.currentBalance) || 0
                        ).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Investments (inline empty state) */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg">
              {isInvestmentsEmpty ? (
                <div className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-100 dark:bg-purple-950/30 rounded-lg flex items-center justify-center">
                      <LineChart className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">No investment accounts yet</p>
                  </div>
                  <PlaidLink
                    icon={<Plus className="h-4 w-4" />}
                    buttonText=""
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onSuccess={handlePlaidSuccess}
                  />
                </div>
              ) : (
                <>
                  <Button
                    variant="ghost"
                    className="w-full justify-between p-4 h-auto"
                    onClick={() => toggleSection("investments")}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-100 dark:bg-purple-950/30 rounded-lg flex items-center justify-center">
                        <LineChart className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div className="text-left">
                        <h4 className="font-medium text-gray-900 dark:text-white">Investments</h4>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900 dark:text-white">
                        ${totalInvestments.toLocaleString()}
                      </span>
                      {isExpanded("investments") ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </div>
                  </Button>

                  {isExpanded("investments") && (
                    <div className="border-t border-gray-200 dark:border-gray-700 p-4 space-y-3">
                      {investmentAccounts.map((account) => (
                        <div key={account.id} className="flex items-center gap-3 py-2">
                          <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                            <span className="text-sm font-semibold text-gray-600 dark:text-gray-300">
                              {account.name.charAt(0).toUpperCase()}
                            </span>
                          </div>

                          <div className="flex-1 min-w-0">
                            <div
                              className="text-sm font-semibold text-gray-900 dark:text-white truncate"
                              title={account.name}
                            >
                              {account.name}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {account.mask && (

                          <span>{`• • ${account.mask}`}</span>
                              )}
                              {account.mask && account.officialName ? " | " : ""}
                              {account.officialName || ""}
                            </div>
                          </div>

                          <div className="text-sm font-semibold text-gray-900 dark:text-white text-right">
                            $
                            {(
                              (typeof account.currentBalance === "string"
                                ? parseFloat(account.currentBalance)
                                : account.currentBalance) || 0
                            ).toLocaleString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
