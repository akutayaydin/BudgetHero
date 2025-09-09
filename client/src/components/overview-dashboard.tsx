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
}: {
  id: string;
  render: (id: string) => React.ReactNode;
  onMove: (dragId: string, dropId: string | null, container: string) => void;
}) {
  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("text/plain", id);
      }}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        const dragId = e.dataTransfer.getData("text/plain");
        if (!dragId || dragId === id) return;
        onMove(dragId, id, "");
      }}
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

// --- Main mock component ---
export default function OverviewDashboard() {
  const { data: user } = useQuery<{ name?: string }>({
    queryKey: ["/api/auth/user"],
  });

  const [columns, setColumns] = useState<Record<string, string[]>>({
    left: ["spending", "netWorth", "transactions"],
    right: ["budgets", "cashflow", "tracker", "goals"],
    bottom: ["accounts", "netIncome", "insights"],
  });

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

  const renderCard = (id: string) => {
    switch (id) {
      case "spending":
        return (
          <Card>
            <CardHeader
              title={
                <span className="flex items-center gap-2">
                  <PieChart className="w-4 h-4" />Spending (Donut)
                </span>
              }
              subtitle="This month • Include bills"
              action={<button className="text-xs px-2 py-1 rounded-md border border-border">Month ▾</button>}
            />
            <CardBody>
              <DonutSkeleton />
              <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                <div className="p-2 rounded-lg bg-muted">Dining <div className="font-mono">$412</div></div>
                <div className="p-2 rounded-lg bg-muted">Groceries <div className="font-mono">$603</div></div>
                <div className="p-2 rounded-lg bg-muted">Transport <div className="font-mono">$128</div></div>
              </div>
            </CardBody>
          </Card>
        );
      case "netWorth":
        return (
          <Card>
            <CardHeader
              title={
                <span className="flex items-center gap-2">
                  <LineChart className="w-4 h-4" />Net Worth (Graph)
                </span>
              }
              subtitle="1Y trend"
              action={
                <div className="flex gap-1">
                  <button className="text-xs px-2 py-1 rounded-md border border-border">1M</button>
                  <button className="text-xs px-2 py-1 rounded-md border border-border bg-foreground text-background">
                    1Y
                  </button>
                </div>
              }
            />
            <CardBody>
              <LineSkeleton />
            </CardBody>
          </Card>
        );
      case "transactions":
        return (
          <Card>
            <CardHeader
              title={
                <span className="flex items-center gap-2">
                  <List className="w-4 h-4" />Recent Transactions
                </span>
              }
              subtitle="Latest 6"
              action={<button className="text-xs px-2 py-1 rounded-md border border-border">See all</button>}
            />
            <CardBody>
              <ul className="text-sm divide-y">
                {[
                  { m: "Whole Foods", a: "-$56.78", t: "Groceries" },
                  { m: "Blue Shield", a: "-$485.00", t: "Medical" },
                  { m: "Salary", a: "+$4,200.00", t: "Income" },
                  { m: "Uber", a: "-$18.40", t: "Transport" },
                  { m: "Netflix", a: "-$15.99", t: "Subscription" },
                  { m: "Rent", a: "-$1,950.00", t: "Housing" },
                ].map((row, i) => (
                  <li key={i} className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-lg bg-muted grid place-items-center text-xs">
                        {row.m[0]}
                      </div>
                      <div>
                        <div className="font-medium">{row.m}</div>
                        <div className="text-xs text-muted-foreground">{row.t}</div>
                      </div>
                    </div>
                    <div className={cn("font-mono", row.a.startsWith("+") ? "text-emerald-600" : "text-foreground")}>
                      {row.a}
                    </div>
                  </li>
                ))}
              </ul>
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
              action={<button className="text-xs px-2 py-1 rounded-md border border-border">Manage</button>}
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
              action={<button className="text-xs px-2 py-1 rounded-md border border-border">Calendar</button>}
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
        return (
          <Card>
            <CardHeader
              title={
                <span className="flex items-center gap-2">
                  <Layers className="w-4 h-4" />Accounts (Snapshot)
                </span>
              }
              subtitle="Checking • Credit • Net Cash • Savings • Investments"
            />
            <CardBody>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                <div className="p-3 rounded-xl bg-card border border-border">
                  <div className="text-xs text-muted-foreground">Checking</div>
                  <div className="font-mono font-semibold">$17,130</div>
                </div>
                <div className="p-3 rounded-xl bg-card border border-border">
                  <div className="text-xs text-muted-foreground">Credit Cards</div>
                  <div className="font-mono font-semibold">$2,250</div>
                </div>
                <div className="p-3 rounded-xl bg-card border border-border">
                  <div className="text-xs text-muted-foreground">Net Cash</div>
                  <div className="font-mono font-semibold">$14,880</div>
                </div>
                <div className="p-3 rounded-xl bg-card border border-border">
                  <div className="text-xs text-muted-foreground">Savings</div>
                  <div className="font-mono font-semibold">$16,170</div>
                </div>
                <div className="p-3 rounded-xl bg-card border border-border">
                  <div className="text-xs text-muted-foreground">Investments</div>
                  <div className="font-mono font-semibold">—</div>
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

      <div className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-12 gap-4">
        {/* Sidebar */}
        <aside className="col-span-12 md:col-span-3 lg:col-span-2">
          <Card>
            <CardBody>
              <nav className="space-y-1">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground px-2 mb-1">Menu</div>
                <MenuItem icon={Home} label="Dashboard" active />
                <MenuItem icon={List} label="Transactions" />
                <MenuItem icon={ChartPie} label="Spending" />
                <MenuItem icon={Wallet} label="Budgets" />
                <MenuItem icon={Gauge} label="Cash Flow (Days Safe)" />
                <MenuItem icon={Receipt} label="Bills & Subscriptions" />
                <MenuItem icon={Goal} label="Goals & Reports" />
                <MenuItem icon={Sparkles} label="Insights (AI Coach)" />
                <div className="pt-2 border-t border-border mt-2" />
                <MenuItem icon={Settings} label="More ▾" />
              </nav>
            </CardBody>
          </Card>
        </aside>

        {/* Main content */}
        <main className="col-span-12 md:col-span-9 lg:col-span-10">
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
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const dragId = e.dataTransfer.getData("text/plain");
                if (dragId) moveCard(dragId, null, "left");
              }}
              className="space-y-4"
            >
              {columns.left.map((id) => (
                <DraggableCard key={id} id={id} render={renderCard} onMove={moveCard} />
              ))}
            </div>

            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const dragId = e.dataTransfer.getData("text/plain");
                if (dragId) moveCard(dragId, null, "right");
              }}
              className="space-y-4"
            >
              {columns.right.map((id) => (
                <DraggableCard key={id} id={id} render={renderCard} onMove={moveCard} />
              ))}
            </div>
          </div>

          {/* Today snapshot row */}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const dragId = e.dataTransfer.getData("text/plain");
              if (dragId) moveCard(dragId, null, "bottom");
            }}
            className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-4"
          >
            {columns.bottom.map((id) => (
              <DraggableCard key={id} id={id} render={renderCard} onMove={moveCard} />
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}

