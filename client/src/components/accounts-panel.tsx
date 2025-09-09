import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Wallet,
  Building2,
  CreditCard,
  PiggyBank,
  LineChart,
  ChevronDown,
  ChevronRight,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { formatCurrency } from "@/lib/financial-utils";
import { useAccountsOverview } from "@/hooks/useAccountsOverview";
import { useLastSynced } from "@/hooks/useLastSynced";
import { useSyncAccounts } from "@/hooks/useSyncAccounts";
import { formatDistanceToNow } from "date-fns";
import type { AccountGroup } from "@/types/accounts";

interface AccountsPanelProps {
  onAddAccount?: (type: string) => void;
}

// Map account group identifiers to icons. Extend this object to support new groups.
const groupIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  checking: Building2,
  creditCards: CreditCard,
  savings: PiggyBank,
  investments: LineChart,
  netCash: Wallet,
};

export function AccountsPanel({ onAddAccount }: AccountsPanelProps) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const { data: overview, isLoading, isError, refetch } = useAccountsOverview();
  const { data: lastSynced, isLoading: lastSyncedLoading } = useLastSynced();
  const syncMutation = useSyncAccounts();

  const toggle = (id: string) =>
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));

  const lastSyncedText = lastSynced?.lastSyncedAt
    ? `Last synced ${formatDistanceToNow(new Date(lastSynced.lastSyncedAt), {
        addSuffix: true,
      })}`
    : "Last synced never";

  const handleSync = () => {
    syncMutation.mutate();
  };

  const renderGroup = (group: AccountGroup) => {
    const Icon = groupIcons[group.id] || Wallet;
    const hasChildren = Boolean(group.children && group.children.length);
    const isOpen = !!expanded[group.id];

    return (
      <div key={group.id} className="border-b last:border-b-0">
        <button
          className="flex w-full items-center justify-between px-4 py-3 focus:outline-none"
          onClick={hasChildren ? () => toggle(group.id) : undefined}
          aria-expanded={hasChildren ? isOpen : undefined}
        >
          <div className="flex items-center gap-2">
            <Icon className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{group.label}</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-gray-900 dark:text-white">
              {formatCurrency(group.amount)}
            </span>
            {hasChildren &&
              (isOpen ? (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              ))}
          </div>
        </button>

        {hasChildren && isOpen && (
          <div className="bg-muted/30">
            {group.children!.map((child) => (
              <div
                key={child.id}
                className="flex items-center justify-between px-4 py-3"
              >
                <div className="text-sm text-muted-foreground">
                  {child.label}
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
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-2">
          <CardTitle className="text-sm font-medium uppercase">
            Accounts
          </CardTitle>
          <RefreshCw className="h-4 w-4 text-muted-foreground" />
        </div>

        <div
          className="flex items-center gap-1 text-xs text-muted-foreground"
          aria-live="polite"
        >
          {lastSyncedLoading ? (
            <Skeleton className="h-3 w-24" />
          ) : (
            <span>{lastSyncedText}</span>
          )}
          <span aria-hidden="true">|</span>
          <Button
            variant="link"
            className="h-auto p-0 text-xs"
            onClick={handleSync}
            disabled={syncMutation.isPending}
            aria-busy={syncMutation.isPending}
          >
            {syncMutation.isPending && (
              <Loader2 className="mr-1 h-3 w-3 animate-spin" />
            )}
            Sync now
          </Button>
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

      <CardContent className="p-0 border-t border-border">
        {isLoading ? (
          <div className="divide-y">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center justify-between px-4 py-3"
              >
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
        ) : isError || !overview ? (
          <div className="p-4 text-sm text-red-600">
            Failed to load accounts.{" "}
            <Button
              variant="link"
              className="p-0 text-sm"
              onClick={() => {
                refetch();
              }}
            >
              Retry
            </Button>
          </div>
        ) : overview.groups.length === 0 ? (
          <div className="p-4 text-sm text-muted-foreground">No accounts</div>
        ) : (
          <div className="divide-y">
            {overview.groups.map((group) => renderGroup(group))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
