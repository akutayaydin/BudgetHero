import React, { useState } from "react";
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
  Receipt,
  Settings,
  Bell,
  MoreHorizontal,
  GripVertical,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { NetWorthGraph, SpendingGraph } from "@/components/dashboard-graphs";

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

interface AccountData {
  id: string;
  name: string;
  type: string;
  subtype?: string;
  currentBalance: string | number;
  balance?: string | number;
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
}

// --- Main component ---
export default function OverviewDashboard() {
  const { data: user } = useQuery<{ name?: string }>({
    queryKey: ["/api/auth/user"],
  });

  // Real data queries
  const { data: netWorthData } = useQuery<NetWorthData>({
    queryKey: ["/api/net-worth"],
  });

  const { data: accountsData = [] } = useQuery<AccountData[]>({
    queryKey: ["/api/accounts"],
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

  const initialColumns: Record<string, string[]> = {
    left: ["netWorth", "accounts", "transactions"],
    right: ["bills", "budgets", "spending"],
    bottom: ["cashflow", "tracker", "goals", "netIncome", "insights"],
  };

  const [columns, setColumns] = useState<Record<string, string[]>>(initialColumns);
  const used = [
    ...initialColumns.left,
    ...initialColumns.right,
    ...initialColumns.bottom,
  ];
  const [unused, setUnused] = useState<string[]>(
    allWidgets.filter((id) => !used.includes(id)),
  );
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
      const fromItems = [...next[from]];
      const dragIndex = fromItems.indexOf(dragId);
      fromItems.splice(dragIndex, 1);

      let to: string;
      let toItems: string[];

      if (dropId) {
        to = findContainer(dropId, next) || from;
        toItems = [...next[to]];
        const dropIndex = toItems.indexOf(dropId);
        toItems.splice(dropIndex, 0, dragId);
      } else if (container) {
        to = container;
        toItems = [...next[to]];
        toItems.push(dragId);
      } else {
        to = from;
        toItems = [...fromItems];
        toItems.push(dragId);
      }

      next[from] = fromItems;
      next[to] = toItems;
      return next;
    });
  };

  const removeCard = (id: string) => {
    setColumns((prev) => {
      const next = { ...prev };
      const from = findContainer(id, next);
      if (!from) return prev;
      next[from] = next[from].filter((w) => w !== id);
      return next;
    });
    setUnused((prev) => [...prev, id]);
  };

  const addCard = (id: string) => {
    setUnused((prev) => prev.filter((w) => w !== id));
    setColumns((prev) => ({
      ...prev,
      left: [...prev.left, id],
    }));
  };

  const renderCard = (id: string) => {
    switch (id) {
      case "spending":
        return <SpendingGraph />;
      case "netWorth":
        return <NetWorthGraph />;
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
                          <div className="w-7 h-7 rounded-lg bg-muted grid place-items-center text-xs">
                            {merchantName ? merchantName[0].toUpperCase() : 'T'}
                          </div>
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
              subtitle="Groceries • Week / Month"
              action={
                <div className="flex gap-1">
                  <button className="text-xs px-2 py-1 rounded-md border border-border bg-foreground text-background">
                    Week
                  </button>
                  <button className="text-xs px-2 py-1 rounded-md border border-border">Month</button>
                  <button
                    onClick={() => removeCard("tracker")}
                    className="text-xs px-2 py-1 rounded-md border border-border"
                  >
                    Remove
                  </button>
                </div>
              }
            />
            <CardBody>
              <div className="grid grid-cols-3 gap-3 text-sm">
                <div className="p-3 rounded-xl bg-muted border border-border">
                  <div className="text-xs text-muted-foreground">Spent</div>
                  <div className="font-mono">$146.22</div>
                </div>
                <div className="p-3 rounded-xl bg-muted border border-border">
                  <div className="text-xs text-muted-foreground">Budget</div>
                  <div className="font-mono">$200.00</div>
                </div>
                <div className="p-3 rounded-xl bg-muted border border-border">
                  <div className="text-xs text-muted-foreground">Left</div>
                  <div className="font-mono text-emerald-600">$53.78</div>
                </div>
              </div>
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
        // Group accounts by type
        const checkingAccounts = accountsData.filter(
          (acc) => acc.type === "depository" && acc.subtype !== "savings"
        );
        const creditAccounts = accountsData.filter((acc) => acc.type === "credit");
        const savingsAccounts = accountsData.filter(
          (acc) => acc.type === "depository" && acc.subtype === "savings"
        );
        const investmentAccounts = accountsData.filter((acc) => acc.type === "investment");

        // Calculate totals
        const totalChecking = checkingAccounts.reduce((sum: number, acc) => {
          const balance = typeof acc.currentBalance === "string" ? parseFloat(acc.currentBalance) : acc.currentBalance;
          return sum + (isNaN(Number(balance)) ? 0 : Number(balance));
        }, 0);

        const totalCredit = creditAccounts.reduce((sum: number, acc) => {
          const balance = typeof acc.currentBalance === "string" ? parseFloat(acc.currentBalance) : acc.currentBalance;
          return sum + Math.abs(isNaN(Number(balance)) ? 0 : Number(balance));
        }, 0);

        const totalSavings = savingsAccounts.reduce((sum: number, acc) => {
          const balance = typeof acc.currentBalance === "string" ? parseFloat(acc.currentBalance) : acc.currentBalance;
          return sum + (isNaN(Number(balance)) ? 0 : Number(balance));
        }, 0);

        const totalInvestments = investmentAccounts.reduce((sum: number, acc) => {
          const balance = typeof acc.currentBalance === "string" ? parseFloat(acc.currentBalance) : acc.currentBalance;
          return sum + (isNaN(Number(balance)) ? 0 : Number(balance));
        }, 0);

        const netCash = totalChecking - totalCredit;
        
        return (
          <Card>
            <CardHeader
              title={
                <span className="flex items-center gap-2">
                  <Layers className="w-4 h-4" />Accounts Summary
                </span>
              }
              subtitle="Checking • Credit • Savings • Investments"
              action={
                <button
                  onClick={() => removeCard("accounts")}
                  className="text-xs px-2 py-1 rounded-md border border-border"
                >
                  Remove
                </button>
              }
            />
            <CardBody>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                <div className="p-3 rounded-xl bg-card border border-border">
                  <div className="text-xs text-muted-foreground">Checking</div>
                  <div className="font-mono font-semibold">${totalChecking.toLocaleString()}</div>
                </div>
                <div className="p-3 rounded-xl bg-card border border-border">
                  <div className="text-xs text-muted-foreground">Credit Cards</div>
                  <div className="font-mono font-semibold">${totalCredit.toLocaleString()}</div>
                </div>
                <div className="p-3 rounded-xl bg-card border border-border">
                  <div className="text-xs text-muted-foreground">Net Cash</div>
                  <div className={`font-mono font-semibold ${netCash >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    ${netCash.toLocaleString()}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-card border border-border">
                  <div className="text-xs text-muted-foreground">Savings</div>
                  <div className="font-mono font-semibold">${totalSavings.toLocaleString()}</div>
                </div>
                <div className="p-3 rounded-xl bg-card border border-border">
                  <div className="text-xs text-muted-foreground">Investments</div>
                  <div className="font-mono font-semibold">
                    {totalInvestments > 0 ? `$${totalInvestments.toLocaleString()}` : "—"}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-card border border-border">
                  <div className="text-xs text-muted-foreground">Total Accounts</div>
                  <div className="font-mono font-semibold">{accountsData.length}</div>
                </div>
              </div>
            </CardBody>
          </Card>
        );
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
        // Calculate upcoming bills for next 7 days
        const upcomingBills = recurringTransactions
          .filter(item => {
            if (!item.nextDueDate || item.excludeFromBills) return false;
            const dueDate = new Date(item.nextDueDate);
            const today = new Date();
            const nextWeek = new Date();
            nextWeek.setDate(today.getDate() + 7);
            return dueDate >= today && dueDate <= nextWeek;
          })
          .map(item => {
            const dueDate = new Date(item.nextDueDate!);
            const today = new Date();
            const diffTime = dueDate.getTime() - today.getTime();
            const daysUntilDue = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            return {
              ...item,
              daysUntilDue
            };
          })
          .sort((a, b) => a.daysUntilDue - b.daysUntilDue)
          .slice(0, 4); // Show max 4 bills

        return (
          <Card>
            <CardHeader
              title={
                <span className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />Upcoming Bills
                </span>
              }
              subtitle="Next 7 days"
              action={
                <button
                  onClick={() => removeCard("bills")}
                  className="text-xs px-2 py-1 rounded-md border border-border"
                >
                  Remove
                </button>
              }
            />
            <CardBody>
              {upcomingBills.length > 0 ? (
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {upcomingBills.map((bill) => (
                    <div key={bill.id} className="p-3 rounded-xl bg-card border border-border">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs font-semibold">
                            {bill.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="font-medium truncate">{bill.name}</div>
                      </div>
                      <div className="text-lg font-bold">${bill.amount.toLocaleString()}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        IN {bill.daysUntilDue} DAY{bill.daysUntilDue !== 1 ? 'S' : ''}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {bill.category}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No bills due soon</p>
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
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-primary grid place-items-center text-primary-foreground font-bold">BH</div>
            <div>
              <div className="font-semibold tracking-tight">BudgetHero</div>
              <div className="text-xs text-muted-foreground">Level Up Your Money</div>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <ThemeToggle />
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
            </Button>
            {user?.name && <span className="px-2">{user.name}</span>}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreHorizontal className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>Personal</DropdownMenuItem>
                <DropdownMenuItem>Household</DropdownMenuItem>
                <DropdownMenuItem>Customize Layout</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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
                const dragId = e.dataTransfer.getData("text/plain");
                // Only move if dropping on empty container space (not on another widget)
                if (dragId && e.target === e.currentTarget) {
                  moveCard(dragId, null, "left");
                }
                setDragging(null);
                setOverId(null);
                setOverContainer(null);
              }}
              className="space-y-4"
            >
              {columns.left.map((id) => (
                <React.Fragment key={id}>
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
                </React.Fragment>
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
                const dragId = e.dataTransfer.getData("text/plain");
                // Only move if dropping on empty container space (not on another widget)
                if (dragId && e.target === e.currentTarget) {
                  moveCard(dragId, null, "right");
                }
                setDragging(null);
                setOverId(null);
                setOverContainer(null);
              }}
              className="space-y-4"
            >
              {columns.right.map((id) => (
                <React.Fragment key={id}>
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
                </React.Fragment>
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
              const dragId = e.dataTransfer.getData("text/plain");
              if (dragId) moveCard(dragId, null, "bottom");
              setDragging(null);
              setOverId(null);
              setOverContainer(null);
            }}
            className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-4"
          >
            {columns.bottom.map((id) => (
              <React.Fragment key={id}>
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
              </React.Fragment>
            ))}
            {dragging && overContainer === "bottom" && (
              <div className="h-32 border-2 border-dashed rounded-xl" />
            )}
          </div>

          {unused.length > 0 && (
            <div className="mt-8">
              <h3 className="text-sm font-medium mb-2">Unused Widgets</h3>
              <div className="flex flex-wrap gap-2">
                {unused.map((id) => (
                  <button
                    key={id}
                    onClick={() => addCard(id)}
                    className="px-3 py-2 rounded-md border border-border text-sm"
                  >
                    Add {widgetLabels[id]}
                  </button>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

