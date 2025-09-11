import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  BarChart2,
  PieChart,
  Wallet,
  CreditCard,
  LineChart,
  Calendar,
  Gauge,
  Goal,
  Sparkles,
  Layers,
  Home,
  List,
  ChartPie,
  Bell,
  GripVertical,
  ArrowRight,
  Plus,
  RefreshCw,
  Loader2,
  Save,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AccountsPanel } from "@/components/accounts-panel";
import QuickCategoryTracker from "@/components/quick-category-tracker";
import { PinBudgetButton } from "@/components/pin-budget-button";
import { cn } from "@/lib/utils";
import { NetWorthGraph, SpendingGraph } from "@/components/dashboard-graphs";
import AccountsCard from "@/components/accounts-card";
import WidgetDrawer from "@/components/widget-drawer";
import { Link } from "wouter";
import { PlaidLink } from "@/components/PlaidLink";
import { useAccountsOverview } from "@/hooks/useAccountsOverview";
import { useLastSynced } from "@/hooks/useLastSynced";
import { useSyncAccounts } from "@/hooks/useSyncAccounts";
import { formatDistanceToNow } from "date-fns";
import { formatCurrency } from "@/lib/financial-utils";
import { MerchantLogo } from "./merchant-logo";

// --- Basic UI primitives using theme variables ---
const Card = ({ children, className = "" }: React.PropsWithChildren<{ className?: string }>) => (
  <div className={cn("rounded-2xl border border-border bg-card text-card-foreground shadow-sm", className)}>
    {children}
  </div>
);

const CardHeader = ({
  title,
  subtitle,
  action,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
}) => (
  <div className="flex items-center justify-between p-4 border-b border-border">
    <div>
      <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">{title}</h3>
      {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
    </div>
    <div className="flex items-center gap-2">
      {action}
      <GripVertical className="w-4 h-4 text-muted-foreground cursor-move" />
    </div>
  </div>
);

const CardBody = ({ children, className = "" }: React.PropsWithChildren<{ className?: string }>) => (
  <div className={cn("p-4", className)}>{children}</div>
);

const MenuItem = ({
  icon: Icon,
  label,
  active = false,
}: {
  icon: React.ComponentType<any>;
  label: string;
  active?: boolean;
}) => (
  <a
    href="#"
    className={cn(
      "flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition",
      active
        ? "bg-primary/10 text-primary"
        : "text-muted-foreground hover:bg-muted"
    )}
  >
    <Icon className={cn("w-4 h-4", active ? "text-primary" : "text-muted-foreground")} />
    <span className="truncate">{label}</span>
  </a>
);

// Simple HTML5 drag-and-drop card wrapper
function DraggableCard({
  id,
  render,
  onMove,
  onDragStart,
  onDragEnd,
  onDragEnter,
}: {
  id: string;
  render: (id: string) => React.ReactNode;
  onMove: (dragId: string, dropId: string | null, container: string) => void;
  onDragStart?: (id: string) => void;
  onDragEnd?: () => void;
  onDragEnter?: (id: string) => void;
}) {
  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("text/plain", id);
        e.dataTransfer.effectAllowed = "move";
        onDragStart?.(id);
      }}
      onDragEnter={(e) => {
        e.preventDefault();
        onDragEnter?.(id);
      }}
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
      }}
      onDrop={(e) => {
        e.preventDefault();
        e.stopPropagation(); // Prevent event bubbling to container
        const dragId = e.dataTransfer.getData("text/plain");
        if (!dragId || dragId === id) return;
        onMove(dragId, id, "");
      }}
      onDragEnd={() => onDragEnd?.()}
    >
      {render(id)}
    </div>
  );
}

const findContainer = (
  id: string,
  cols: Record<string, string[]>,
): string | undefined => {
  return Object.keys(cols).find((key) => cols[key].includes(id));
};

// --- Placeholder graph components ---
const LineSkeleton = () => (
  <div className="h-36 relative">
    <div className="absolute inset-0 bg-gradient-to-b from-muted to-transparent rounded-xl" />
    <svg viewBox="0 0 300 100" className="w-full h-full opacity-70">
      <polyline
        fill="none"
        stroke="#8b5cf6"
        strokeWidth="3"
        points="0,80 30,70 60,72 90,60 120,65 150,50 180,58 210,45 240,55 270,38 300,42"
      />
    </svg>
  </div>
);

const DonutSkeleton = () => (
  <div className="h-36 flex items-center justify-center">
    <div className="relative">
      <div className="w-28 h-28 rounded-full border-[14px] border-muted" />
      <div className="absolute inset-0 m-1 rounded-full border-[14px] border-indigo-400 clip-path-[polygon(50%_0,100%_0,100%_100%,0_100%,0_0)] rotate-45" />
      <div className="absolute inset-8 bg-card rounded-full flex items-center justify-center">
        <div className="text-center">
          <div className="text-xs text-muted-foreground">Spent</div>
          <div className="text-sm font-semibold">$2,874</div>
        </div>
      </div>
    </div>
  </div>
);

// Type definitions
interface NetWorthData {
  totalNetWorth: number;
  totalAssets: number;
  totalLiabilities: number;
  totalBankAccounts: number;
}

interface TransactionData {
  id: string;
  description: string;
  amount: string;
  date: string;
  category: string;
  type: string;
  merchant: string;
}

interface RecurringTransactionData {
  id: string;
  name: string;
  merchant: string;
  category: string;
  amount: number;
  frequency: string;
  nextDueDate?: string;
  excludeFromBills?: boolean;
  merchantLogo?: string;
}

// --- Main component ---
export default function OverviewDashboard() {
  const { data: user } = useQuery<{ name?: string }>({
    queryKey: ["/api/auth/user"],
  });
  
  const { toast } = useToast();

  // Real data queries
  const { data: netWorthData } = useQuery<NetWorthData>({
    queryKey: ["/api/net-worth"],
  });


  const { data: transactionsData = [] } = useQuery<TransactionData[]>({
    queryKey: ["/api/transactions"],
  });

  const { data: recurringTransactions = [] } = useQuery<RecurringTransactionData[]>({
    queryKey: ["/api/recurring-transactions"],
  });

  const { data: financialHealth } = useQuery({
    queryKey: ["/api/financial-health"],
  });

  // Simple device type detection
  const getDeviceType = () => {
    const isMobile = window.innerWidth <= 768;
    const isTablet = window.innerWidth > 768 && window.innerWidth <= 1024;
    
    if (isMobile) return 'mobile';
    if (isTablet) return 'tablet';
    return 'desktop';
  };

  const deviceType = useMemo(() => getDeviceType(), []);

  // Load saved widget layout
  const { data: savedLayout } = useQuery({
    queryKey: ["/api/widget-layout", deviceType],
    queryFn: async () => {
      const res = await apiRequest(
        `/api/widget-layout?deviceId=${deviceType}`,
        "GET",
      );
      return await res.json();
    },
    retry: false,
  });

  const queryClient = useQueryClient();

  const [layoutChanged, setLayoutChanged] = useState(false);
  const [savePromptShown, setSavePromptShown] = useState(false);

  // Save widget layout mutation
  const saveLayoutMutation = useMutation({
    mutationFn: async (payload: { layoutData: any; deviceId: string }) => {
      return await apiRequest("/api/widget-layout", "POST", payload);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["/api/widget-layout", deviceType],
      });
      setLayoutChanged(false);
      setSavePromptShown(false);
      toast({
        title: "Layout Saved",
        description: "Your widget layout has been saved successfully.",
      });
    },
    onError: (error) => {
      console.error("Failed to save widget layout:", error);
      toast({
        title: "Save Failed",
        description: "Could not save your widget layout. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Manual save function for the save button
  const handleSaveLayout = () => {
    if (user) {
      const layoutPayload = {
        layoutData: columns,
        deviceId: deviceType
      };
      saveLayoutMutation.mutate(layoutPayload);
    }
  };

  const markLayoutChanged = () => {
    setLayoutChanged(true);
    if (!savePromptShown) {
      const { dismiss } = toast({
        description: "Layout updated. Don't forget to save.",
        action: (
          <div className="flex gap-2">
            <Button size="sm" onClick={() => { dismiss(); handleSaveLayout(); }}>Save now</Button>
            <Button size="sm" variant="outline" onClick={() => dismiss()}>Dismiss</Button>
          </div>
        ) as any,
      });
      setSavePromptShown(true);
    }
  };

  const allWidgets = [
    "spending",
    "netWorth",
    "transactions",
    "budgets",
    "cashflow",
    "tracker",
    "goals",
    "accounts",
    "netIncome",
    "insights",
    "bills",
  ];

  const widgetLabels: Record<string, string> = {
    spending: "Spending",
    netWorth: "Net Worth",
    transactions: "Recent Transactions",
    budgets: "Budgets",
    cashflow: "Cash Flow",
    tracker: "Category Tracker",
    goals: "Goals",
    accounts: "Accounts",
    netIncome: "Net Income",
    insights: "AI Insights",
    bills: "Upcoming Bills",
  };

  // Device-specific default layouts
  const getInitialColumns = () => {
    const isMobile = window.innerWidth <= 768;
    const isTablet = window.innerWidth > 768 && window.innerWidth <= 1024;
    
    if (isMobile) {
      // Mobile: Single column, most important widgets first
      return {
        left: ["netWorth", "spending", "transactions", "accounts"],
        right: [],
        bottom: ["bills", "budgets", "cashflow", "tracker", "goals", "netIncome", "insights"],
      };
    } else if (isTablet) {
      // Tablet: Two columns, balanced layout
      return {
        left: ["netWorth", "accounts", "bills"],
        right: ["spending", "transactions", "budgets"],
        bottom: ["cashflow", "tracker", "goals", "netIncome", "insights"],
      };
    } else {
      // Desktop: Three columns, full layout
      return {
        left: ["netWorth", "accounts", "transactions"],
        right: ["bills", "budgets", "spending"],
        bottom: ["cashflow", "tracker", "goals", "netIncome", "insights"],
      };
    }
  };

  const [columns, setColumns] = useState<Record<string, string[]>>(getInitialColumns);
  const [drawerExpanded, setDrawerExpanded] = useState(false);

  // Load saved layout when data is available
  useEffect(() => {
    if (savedLayout && savedLayout.layoutData) {
      setIsLoadingLayout(true);
      setColumns(savedLayout.layoutData);
      previousColumnsRef.current = JSON.stringify(savedLayout.layoutData);
      // Allow saving again after layout is loaded
      setTimeout(() => setIsLoadingLayout(false), 100);
    }
  }, [savedLayout]);

  // Track if we're loading a saved layout to prevent immediate save
  const [isLoadingLayout, setIsLoadingLayout] = useState(false);
  const previousColumnsRef = useRef<string>('');
  
  // Initialize the ref once
  useEffect(() => {
    if (previousColumnsRef.current === '') {
      previousColumnsRef.current = JSON.stringify(getInitialColumns());
    }
  }, []);

  // Disable auto-save - user now controls when to save with the save button
  // This prevents the infinite loop and gives users more control
  
  const used = [
    ...columns.left,
    ...columns.right,
    ...columns.bottom,
  ];
  
  const availableWidgets = allWidgets.filter((id) => !used.includes(id));
  const [dragging, setDragging] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const [overContainer, setOverContainer] = useState<string | null>(null);

  const moveCard = (
    dragId: string,
    dropId: string | null,
    container?: string,
  ) => {
    setColumns((prev) => {
      const next = { ...prev };
      const from = findContainer(dragId, next);
      if (!from) return prev;
      
      // Remove item from source first
      const fromItems = [...next[from]];
      const dragIndex = fromItems.indexOf(dragId);
      if (dragIndex === -1) return prev; // Item not found, avoid duplication
      fromItems.splice(dragIndex, 1);

      let to: string;
      let toItems: string[];

      if (dropId) {
        to = findContainer(dropId, next) || from;
        if (to === from) {
          // Dropping in same container, use updated fromItems
          toItems = [...fromItems];
          const originalDropIndex = toItems.indexOf(dropId);
          if (originalDropIndex !== -1) {
            toItems.splice(originalDropIndex, 0, dragId);
          } else {
            toItems.push(dragId);
          }
        } else {
          // Dropping in different container
          toItems = [...next[to]];
          const dropIndex = toItems.indexOf(dropId);
          if (dropIndex !== -1) {
            toItems.splice(dropIndex, 0, dragId);
          } else {
            toItems.push(dragId);
          }
        }
      } else if (container) {
        to = container;
        if (to === from) {
          // Adding to same container, use updated fromItems
          toItems = [...fromItems, dragId];
        } else {
          // Adding to different container
          toItems = [...next[to], dragId];
        }
      } else {
        // Default case - keep in same container
        to = from;
        toItems = [...fromItems, dragId];
      }

      // Update state
      next[from] = fromItems;
      next[to] = toItems;
      return next;
    });
    markLayoutChanged();
  };

  const removeCard = (id: string) => {
    setColumns((prev) => {
      const next = { ...prev };
      const from = findContainer(id, next);
      if (!from) return prev;
      next[from] = next[from].filter((w) => w !== id);
      return next;
    });
    markLayoutChanged();
  };

  const addCard = (id: string, targetColumn: string = "left") => {
    setColumns((prev) => ({
      ...prev,
      [targetColumn]: [...prev[targetColumn], id],
    }));
    markLayoutChanged();
  };

  const AccountsSummaryCard = ({ onRemove }: { onRemove: () => void }) => {
    const { data: accountsData, isLoading, error, refetch } = useAccountsOverview();
    const { data: lastSynced, isLoading: lastSyncedLoading } = useLastSynced();
    const syncMutation = useSyncAccounts();
    const { toast } = useToast();

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

    const lastSyncedText = lastSynced?.lastSyncedAt
      ? `Synced ${formatDistanceToNow(new Date(lastSynced.lastSyncedAt))} ago`
      : "Never synced";

    return (
      <Card>
        <CardHeader
          title={
            <span className="flex items-center gap-2">
              <Layers className="w-4 h-4" />Accounts Summary
            </span>
          }
          subtitle={lastSyncedLoading ? "Syncing..." : lastSyncedText}
          action={
            <div className="flex gap-1">
              <PlaidLink
                onSuccess={handlePlaidSuccess}
                className="text-xs px-2 py-1 rounded-md border border-border flex items-center"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Account
              </PlaidLink>
              <button
                onClick={handleSync}
                disabled={syncMutation.isPending}
                className="text-xs px-2 py-1 rounded-md border border-border flex items-center"
              >
                {syncMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-1" />
                )}
                Sync Now
              </button>
              <button
                onClick={onRemove}
                className="text-xs px-2 py-1 rounded-md border border-border"
              >
                Remove
              </button>
            </div>
          }
        />
        <CardBody>
          <AccountsCard accountsData={accountsData} isLoading={isLoading} error={error} />
        </CardBody>
      </Card>
    );
  };

  const renderCard = (id: string) => {
    switch (id) {
      case "spending":
        return (
          <Card>
            <CardHeader
              title={
                <span className="flex items-center gap-2">
                  <PieChart className="w-4 h-4" />Current Spend This Month
                </span>
              }
              subtitle="Monthly spending overview"
              action={
                <>
                  <Link href="/spending">
                    <button className="text-xs px-2 py-1 rounded-md border border-border flex items-center">
                      View Spending
                    </button>
                  </Link>
                  <button
                    onClick={() => removeCard("spending")}
                    className="text-xs px-2 py-1 rounded-md border border-border"
                  >
                    Remove
                  </button>
                </>
              }
            />
            <CardBody className="pt-2">
              <SpendingGraph />
            </CardBody>
          </Card>
        );
      case "netWorth":
        return (
          <Card>
            <CardHeader
              title={
                <span className="flex items-center gap-2">
                  <LineChart className="w-4 h-4" />Total Net Worth
                </span>
              }
              subtitle="Net worth over time"
              action={
                <>
                  <Link href="/wealth-management">
                    <button className="text-xs px-2 py-1 rounded-md border border-border flex items-center">
                      View Net Worth
                    </button>
                  </Link>
                  <button
                    onClick={() => removeCard("netWorth")}
                    className="text-xs px-2 py-1 rounded-md border border-border"
                  >
                    Remove
                  </button>
                </>
              }
            />
            <CardBody className="pt-2">
              <NetWorthGraph />
            </CardBody>
          </Card>
        );
      case "transactions":
        // Get the 6 most recent transactions
        const recentTransactions = transactionsData
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .slice(0, 6);

        const formatDate = (dateString: string) => {
          const date = new Date(dateString);
          const today = new Date();
          const yesterday = new Date(today);
          yesterday.setDate(yesterday.getDate() - 1);

          if (date.toDateString() === today.toDateString()) {
            return 'Today';
          } else if (date.toDateString() === yesterday.toDateString()) {
            return 'Yesterday';
          } else {
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          }
        };

        return (
          <Card>
            <CardHeader
              title={
                <span className="flex items-center gap-2">
                  <List className="w-4 h-4" />Recent Transactions
                </span>
              }
              subtitle="Latest 6 transactions"
              action={
                <div className="flex gap-1">
                  <button className="text-xs px-2 py-1 rounded-md border border-border">See all</button>
                  <button
                    onClick={() => removeCard("transactions")}
                    className="text-xs px-2 py-1 rounded-md border border-border"
                  >
                    Remove
                  </button>
                </div>
              }
            />
            <CardBody>
              {recentTransactions.length > 0 ? (
                <ul className="text-sm divide-y">
                  {recentTransactions.map((transaction) => {
                    const isIncome = transaction.type === 'income';
                    const amount = parseFloat(transaction.amount || '0');
                    const merchantName = transaction.merchant || transaction.description;
                    
                    return (
                      <li key={transaction.id} className="flex items-center justify-between py-2">
                        <div className="flex items-center gap-3">
                          <MerchantLogo merchant={merchantName} size={7} />
                          <div>
                            <div className="font-medium">{merchantName}</div>
                            <div className="text-xs text-muted-foreground">
                              {transaction.category} • {formatDate(transaction.date)}
                            </div>
                          </div>
                        </div>
                        <div className={cn("font-mono", isIncome ? "text-emerald-600" : "text-foreground")}>
                          {isIncome ? '+' : ''}${amount.toLocaleString()}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  No transactions yet
                </div>
              )}
            </CardBody>
          </Card>
        );
      case "budgets":
        return (
          <Card>
            <CardHeader
              title={
                <span className="flex items-center gap-2">
                  <Wallet className="w-4 h-4" />Budgets (Left to Spend)
                </span>
              }
              subtitle="This month"
              action={
                <div className="flex gap-1">
                  <button className="text-xs px-2 py-1 rounded-md border border-border">Manage</button>
                  <button
                    onClick={() => removeCard("budgets")}
                    className="text-xs px-2 py-1 rounded-md border border-border"
                  >
                    Remove
                  </button>
                </div>
              }
            />
            <CardBody>
              <div className="grid grid-cols-3 gap-3 text-sm">
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100">
                  <div className="text-xs text-emerald-700">Left to Spend</div>
                  <div className="text-xl font-extrabold">$563</div>
                </div>
                <div className="p-3 rounded-xl bg-muted border border-border">
                  <div className="text-xs text-muted-foreground">Budgeted</div>
                  <div className="font-semibold">$720</div>
                </div>
                <div className="p-3 rounded-xl bg-muted border border-border">
                  <div className="text-xs text-muted-foreground">Current Spend</div>
                  <div className="font-semibold">$157</div>
                </div>
              </div>
            </CardBody>
          </Card>
        );
      case "cashflow":
        return (
          <Card>
            <CardHeader
              title={
                <span className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />Cash‑Flow & Days Safe
                </span>
              }
              subtitle="30‑day projection"
              action={
                <div className="flex gap-1">
                  <button className="text-xs px-2 py-1 rounded-md border border-border">Calendar</button>
                  <button
                    onClick={() => removeCard("cashflow")}
                    className="text-xs px-2 py-1 rounded-md border border-border"
                  >
                    Remove
                  </button>
                </div>
              }
            />
            <CardBody>
              <div className="grid grid-cols-3 gap-3 text-sm">
                <div className="col-span-2">
                  <LineSkeleton />
                </div>
                <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-100">
                  <div className="text-xs text-indigo-700">Days Safe</div>
                  <div className="text-2xl font-extrabold">12</div>
                  <div className="text-xs text-muted-foreground">until $0 balance</div>
                </div>
              </div>
            </CardBody>
          </Card>
        );
      case "tracker":
        return (
          <Card>
            <CardHeader
              title={
                <span className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4" />Quick Category Tracker
                </span>
              }
              subtitle="Track your spending by category"
              action={
                <div className="flex gap-1">
                  <PinBudgetButton className="text-xs px-2 py-1 rounded-md border border-border" />
                  <button
                    onClick={() => removeCard("tracker")}
                    className="text-xs px-2 py-1 rounded-md border border-border"
                    data-testid="button-remove-tracker"
                  >
                    Remove
                  </button>
                </div>
              }
            />
            <CardBody>
              <QuickCategoryTracker onRemove={() => removeCard("tracker")} />
            </CardBody>
          </Card>
        );
      case "goals":
        return (
          <Card>
            <CardHeader
              title={
                <span className="flex items-center gap-2">
                  <Goal className="w-4 h-4" />Goals Progress
                </span>
              }
              subtitle="Emergency • Vacation • Debt"
              action={
                <button
                  onClick={() => removeCard("goals")}
                  className="text-xs px-2 py-1 rounded-md border border-border"
                >
                  Remove
                </button>
              }
            />
            <CardBody>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span>Emergency Fund</span>
                  <span className="font-mono">$2,300 / $5,000</span>
                </div>
                <div className="w-full h-2 bg-muted rounded-full">
                  <div className="h-2 bg-emerald-500 rounded-full w-[46%]" />
                </div>
                <div className="flex items-center justify-between">
                  <span>Vacation</span>
                  <span className="font-mono">$900 / $1,500</span>
                </div>
                <div className="w-full h-2 bg-muted rounded-full">
                  <div className="h-2 bg-indigo-500 rounded-full w-[60%]" />
                </div>
              </div>
            </CardBody>
          </Card>
        );
      case "accounts":
        return <AccountsSummaryCard onRemove={() => removeCard("accounts")} />;
      case "netIncome":
        return (
          <Card>
            <CardHeader
              title={
                <span className="flex items-center gap-2">
                  <BarChart2 className="w-4 h-4" />Net Income (This Month)
                </span>
              }
              subtitle="Income – Expenses = Net"
              action={
                <button
                  onClick={() => removeCard("netIncome")}
                  className="text-xs px-2 py-1 rounded-md border border-border"
                >
                  Remove
                </button>
              }
            />
            <CardBody>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100">
                  <div className="text-xs text-emerald-700">Income</div>
                  <div className="text-lg font-bold">$4,500</div>
                </div>
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-100">
                  <div className="text-xs text-rose-700">Expenses</div>
                  <div className="text-lg font-bold">$3,800</div>
                </div>
                <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-100">
                  <div className="text-xs text-indigo-700">Net Income</div>
                  <div className="text-lg font-bold">$700</div>
                </div>
              </div>
            </CardBody>
          </Card>
        );
      case "insights":
        return (
          <Card>
            <CardHeader
              title={
                <span className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />AI Insights
                </span>
              }
              subtitle="Nudges • Anomalies • Tips"
              action={
                <button
                  onClick={() => removeCard("insights")}
                  className="text-xs px-2 py-1 rounded-md border border-border"
                >
                  Remove
                </button>
              }
            />
            <CardBody>
              <ul className="space-y-2 text-sm">
                <li>💡 Dining is 18% lower than last month — nice!</li>
                <li>⚠️ Free trial ends in 3 days: Acme Music</li>
                <li>🎯 Move $50 to savings to hit goal on time</li>
              </ul>
            </CardBody>
          </Card>
        );
      case "bills":
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const twoWeeksOut = new Date(today);
        twoWeeksOut.setDate(today.getDate() + 13);

        const upcomingBills = recurringTransactions
          .filter(item => {
            if (!item.nextDueDate || item.excludeFromBills) return false;
            const dueDate = new Date(item.nextDueDate);
            dueDate.setHours(0, 0, 0, 0);
            return dueDate >= today && dueDate <= twoWeeksOut;
          })
          .map(item => {
            const dueDate = new Date(item.nextDueDate!);
            dueDate.setHours(0, 0, 0, 0);
            const diffTime = dueDate.getTime() - today.getTime();
            const daysUntilDue = Math.round(diffTime / (1000 * 60 * 60 * 24));
            return { ...item, daysUntilDue, dueDate };
          })
          .sort((a, b) => a.daysUntilDue - b.daysUntilDue);

        const totalAmount = upcomingBills.reduce((sum, b) => sum + b.amount, 0);
        const maxDays = upcomingBills.reduce((max, b) => Math.max(max, b.daysUntilDue), 0);

        const startDate = new Date(today);
        startDate.setDate(today.getDate() - today.getDay());

        const calendarDays = Array.from({ length: 14 }, (_, i) => {
          const date = new Date(startDate);
          date.setDate(startDate.getDate() + i);
          const billsForDay = upcomingBills.filter(b => b.dueDate.getTime() === date.getTime());
          return { date, billsForDay };
        });

        return (
          <Card>
            <CardHeader
              title={
                <span className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />Coming Up
                </span>
              }
              action={
                <button
                  onClick={() => removeCard("bills")}
                  className="text-xs px-2 py-1 rounded-md border border-border"
                >
                  Remove
                </button>
              }
            />
            <CardBody className="space-y-4">
              {upcomingBills.length > 0 ? (
                <>
                  <p className="text-sm text-muted-foreground">
                    You have {upcomingBills.length} recurring charge{upcomingBills.length !== 1 ? 's' : ''} due within the next {maxDays} day{maxDays !== 1 ? 's' : ''} for {formatCurrency(totalAmount)}.
                  </p>
                  <div className="grid grid-cols-7 gap-1 text-center text-xs">
                    {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
                      <div key={d} className="font-medium text-muted-foreground">{d}</div>
                    ))}
                    {calendarDays.map(({ date, billsForDay }, idx) => {
                      const isToday = date.getTime() === today.getTime();
                      const hasBills = billsForDay.length > 0;
                      return (
                        <div key={idx} className="flex justify-center">
                          <div
                            className={cn(
                              'w-8 h-8 flex items-center justify-center rounded-full',
                              isToday && hasBills
                                ? 'bg-blue-600 text-white'
                                : isToday
                                ? 'border border-blue-600 text-blue-600'
                                : hasBills
                                ? 'bg-blue-100 text-blue-600'
                                : 'text-muted-foreground'
                            )}
                          >
                            {date.getDate()}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="text-sm divide-y">
                  
                    {upcomingBills.map(bill => (
                      <div key={bill.id} className="flex items-center justify-between py-2">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center overflow-hidden">
                            {bill.merchantLogo ? (
                              <img
                                src={bill.merchantLogo}
                                alt={`${bill.name} logo`}
                                className="w-8 h-8 object-contain"
                              />
                            ) : (
                              <span className="text-xs font-semibold">
                                {bill.name.charAt(0).toUpperCase()}
                              </span>
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="font-medium truncate">{bill.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {bill.daysUntilDue === 0
                                ? 'today'
                                : `in ${bill.daysUntilDue} day${bill.daysUntilDue !== 1 ? 's' : ''}`}
                            </div>
                          </div>
                        </div>
                        <div className="text-sm font-medium">
                          {formatCurrency(bill.amount)}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No upcoming bills</p>
                </div>
              )}
            </CardBody>
          </Card>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background text-foreground">
      {/* Top bar */}
      <header className="sticky top-0 z-40 bg-background/70 backdrop-blur border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-end">
          <div className="flex items-center gap-2 text-sm">
            <ThemeToggle />
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
            </Button>
            {layoutChanged && (
              <Button
                onClick={handleSaveLayout}
                variant="default"
                size="sm"
                disabled={saveLayoutMutation.isPending}
                className="gap-2"
              >
                {saveLayoutMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save Layout
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Main content */}
        <main>
          {/* Split headers */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
            <Card>
              <CardHeader
                title={
                  <span className="flex items-center gap-2">
                    <span className="inline-flex w-6 h-6 rounded-full bg-blue-50 text-blue-600 items-center justify-center">
                      🪞
                    </span>
                    Where Your Money Went
                  </span>
                }
                subtitle="Past • Rearview"
              />
              <CardBody>
                <div className="text-xs text-muted-foreground">
                  Historical insights: Spending, Net Worth trend, Transactions.
                </div>
              </CardBody>
            </Card>
            <Card>
              <CardHeader
                title={
                  <span className="flex items-center gap-2">
                    <span className="inline-flex w-6 h-6 rounded-full bg-emerald-50 text-emerald-600 items-center justify-center">
                      🔮
                    </span>
                    Where You're Headed
                  </span>
                }
                subtitle="Future • Windshield"
              />
              <CardBody>
                <div className="text-xs text-muted-foreground">
                  Budgets, Cash‑flow & Days Safe, Goals, Quick Trackers.
                </div>
              </CardBody>
            </Card>
          </div>

          {/* Draggable card layout */}
          <div className={cn(
            "grid gap-4",
            deviceType === 'mobile' ? "grid-cols-1" : 
            deviceType === 'tablet' ? "grid-cols-1 lg:grid-cols-2" :
            "grid-cols-1 lg:grid-cols-2"
          )}>
            <div
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = "move";
                if (dragging) {
                  setOverContainer("left");
                  setOverId(null);
                }
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                const dragId = e.dataTransfer.getData("text/plain");
                const isFromDrawer = e.dataTransfer.getData("application/x-widget-source") === "drawer";
                
                // Allow drops when overContainer is set (indicating drop zone is active)
                if (dragId && overContainer === "left") {
                  if (isFromDrawer) {
                    addCard(dragId, "left");
                  } else {
                    moveCard(dragId, null, "left");
                  }
                }
                setDragging(null);
                setOverId(null);
                setOverContainer(null);
              }}
              className="space-y-4"
            >
              {columns.left.map((id) => (
                <div key={id}>
                  {dragging && overId === id && (
                    <div className="h-32 border-2 border-dashed rounded-xl" />
                  )}
                  <DraggableCard
                    id={id}
                    render={renderCard}
                    onMove={moveCard}
                    onDragStart={(id) => setDragging(id)}
                    onDragEnd={() => {
                      setDragging(null);
                      setOverId(null);
                      setOverContainer(null);
                    }}
                    onDragEnter={(id) => {
                      if (dragging && id !== dragging) {
                        setOverId(id);
                        setOverContainer(null);
                      }
                    }}
                  />
                </div>
              ))}
              {dragging && overContainer === "left" && (
                <div className="h-32 border-2 border-dashed rounded-xl" />
              )}
            </div>

            <div
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = "move";
                if (dragging) {
                  setOverContainer("right");
                  setOverId(null);
                }
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                const dragId = e.dataTransfer.getData("text/plain");
                const isFromDrawer = e.dataTransfer.getData("application/x-widget-source") === "drawer";
                
                // Allow drops when overContainer is set (indicating drop zone is active)
                if (dragId && overContainer === "right") {
                  if (isFromDrawer) {
                    addCard(dragId, "right");
                  } else {
                    moveCard(dragId, null, "right");
                  }
                }
                setDragging(null);
                setOverId(null);
                setOverContainer(null);
              }}
              className="space-y-4"
            >
              {columns.right.map((id) => (
                <div key={id}>
                  {dragging && overId === id && (
                    <div className="h-32 border-2 border-dashed rounded-xl" />
                  )}
                  <DraggableCard
                    id={id}
                    render={renderCard}
                    onMove={moveCard}
                    onDragStart={(id) => setDragging(id)}
                    onDragEnd={() => {
                      setDragging(null);
                      setOverId(null);
                      setOverContainer(null);
                    }}
                    onDragEnter={(id) => {
                      if (dragging && id !== dragging) {
                        setOverId(id);
                        setOverContainer(null);
                      }
                    }}
                  />
                </div>
              ))}
              {dragging && overContainer === "right" && (
                <div className="h-32 border-2 border-dashed rounded-xl" />
              )}
            </div>
          </div>

          {/* Today snapshot row */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              if (dragging) {
                setOverContainer("bottom");
                setOverId(null);
              }
            }}
            onDrop={(e) => {
              e.preventDefault();
              e.stopPropagation();
              const dragId = e.dataTransfer.getData("text/plain");
              const isFromDrawer = e.dataTransfer.getData("application/x-widget-source") === "drawer";
              
              // Allow drops when overContainer is set (indicating drop zone is active)
              if (dragId && overContainer === "bottom") {
                if (isFromDrawer) {
                  addCard(dragId, "bottom");
                } else {
                  moveCard(dragId, null, "bottom");
                }
              }
              setDragging(null);
              setOverId(null);
              setOverContainer(null);
            }}
            className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-4"
          >
            {columns.bottom.map((id) => (
              <div key={id}>
                {dragging && overId === id && (
                  <div className="h-32 border-2 border-dashed rounded-xl" />
                )}
                <DraggableCard
                  id={id}
                  render={renderCard}
                  onMove={moveCard}
                  onDragStart={(id) => setDragging(id)}
                  onDragEnd={() => {
                    setDragging(null);
                    setOverId(null);
                    setOverContainer(null);
                  }}
                  onDragEnter={(id) => {
                    if (dragging && id !== dragging) {
                      setOverId(id);
                      setOverContainer(null);
                    }
                  }}
                />
              </div>
            ))}
            {dragging && overContainer === "bottom" && (
              <div className="h-32 border-2 border-dashed rounded-xl" />
            )}
          </div>

          <WidgetDrawer
            availableWidgets={availableWidgets}
            widgetLabels={widgetLabels}
            isExpanded={drawerExpanded}
            onToggle={() => setDrawerExpanded(!drawerExpanded)}
          />
        </main>
      </div>
    </div>
  );
}

