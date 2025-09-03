import React, { useState } from "react";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChevronDown,
  ChevronRight,
  RefreshCw,
  Loader2,
  Building2,
  CreditCard,
  PiggyBank,
  Wallet,
  LineChart,
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
const groupIcons: Record<
  string,
  React.ComponentType<{ className?: string }>
> = {
  checking: Building2,
  creditCards: CreditCard,
  savings: PiggyBank,
  investments: LineChart,
  netCash: Wallet,
};

export function AccountsPanel({ onAddAccount }: AccountsPanelProps) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const { data: overview, isLoading, isError, refetch } = useAccountsOverview();
  const {
    data: lastSynced,
    isLoading: lastSyncedLoading,
    isError: lastSyncedError,
    refetch: refetchLastSynced,
  } = useLastSynced();
  const syncMutation = useSyncAccounts();

  const toggle = (id: string) =>
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));

  const relativeTime = lastSynced
    ? formatDistanceToNow(new Date(lastSynced.lastSyncedAt), {
        addSuffix: true,
      })
    : "";

  const handleSync = () => {
    syncMutation.mutate(undefined, {
      onError: () => {
        // no-op, error handled via state
      },
    });
  };

  const renderGroup = (group: AccountGroup) => {
    const Icon = groupIcons[group.id] || Wallet;
    const hasChildren = Boolean(group.children && group.children.length);
    const isExpanded = expanded[group.id];

    return (
      <div key={group.id} className="border-b last:border-b-0">
        <button
          className="flex w-full items-center justify-between px-4 py-3 focus:outline-none"
          onClick={hasChildren ? () => toggle(group.id) : undefined}
          aria-expanded={hasChildren ? isExpanded : undefined}
        >
          <div className="flex items-center gap-2">
            <Icon className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{group.label}</span>
          </div>
          <div className="flex items-center gap-2">
            {group.action ? (
              <Button
                variant="link"
                className="p-0 text-red-600"
                onClick={(e) => {
                  e.stopPropagation();
                  onAddAccount?.(group.id);
                }}
              >
                {group.action.label} +
              </Button>
            ) : (
              <span
                className={
                  group.tone === "positive"
                    ? "text-green-600"
                    : group.tone === "negative"
                      ? "text-red-600"
                      : ""
                }
              >
                {group.total !== undefined ? formatCurrency(group.total) : ""}
              </span>
            )}
            {hasChildren &&
              (isExpanded ? (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              ))}
          </div>
        </button>
        {hasChildren && isExpanded && (
          <div className="divide-y">
            {group.children!.map((child) => (
              <div
                key={child.id}
                className="flex items-center justify-between px-8 py-3"
              >
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{child.name}</span>
                  {child.subtitle && (
                    <span className="text-xs text-muted-foreground">
                      {child.subtitle}
                    </span>
                  )}
                </div>
                <span className="text-sm font-medium">
                  {formatCurrency(child.amount)}
                </span>
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
            <Skeleton className="h-3 w-20" />
          ) : lastSyncedError ? (
            <Button
              variant="link"
              className="h-auto p-0 text-xs"
              onClick={() => refetchLastSynced()}
            >
              Retry
            </Button>
          ) : (
            <span>{relativeTime}</span>
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
      <CardContent className="p-0">
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
                refetchLastSynced();
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
