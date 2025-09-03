import React from "react";
import {
  ArrowUpRight,
  ArrowDownRight,
  TrendingDown,
  TrendingUp,
  Wallet,
  Clock,
  Calendar,
  CreditCard,
  Building2,
  PiggyBank,
  LineChart as LineChartIcon,
  Zap,
  ShoppingCart,
  Car,
  Utensils,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  PieChart as RePieChart,
  Pie,
  Cell,
} from "recharts";

interface Transaction {
  id: number;
  title: string;
  date: string;
  amount: number;
  status?: "pending" | "posted";
}

interface UpcomingCharge {
  id: number;
  name: string;
  date: string;
  amount: number;
  dueSoon?: boolean;
}

interface AccountSummary {
  label: string;
  amount: number;
  icon: React.ElementType;
}

interface BudgetCategory {
  label: string;
  amount: number;
  pct: number;
  trend: number;
  icon: React.ElementType;
}

const cashData = [
  { date: "1", current: 2000, previous: 1800 },
  { date: "5", current: 2500, previous: 2000 },
  { date: "10", current: 2300, previous: 2100 },
  { date: "15", current: 2700, previous: 2200 },
  { date: "20", current: 2600, previous: 2300 },
  { date: "25", current: 2800, previous: 2400 },
  { date: "30", current: 2582, previous: 2500 },
];

const recentTransactions: Transaction[] = [
  { id: 1, title: "Trader Joe's", date: "Aug 25", amount: -54.12 },
  { id: 2, title: "Rent", date: "Aug 1", amount: -1200 },
  { id: 3, title: "Paycheck", date: "Aug 30", amount: 3500 },
  {
    id: 4,
    title: "Electric Bill",
    date: "Aug 28",
    amount: -90.2,
    status: "pending",
  },
  { id: 5, title: "Freelance", date: "Aug 27", amount: 600 },
];

const upcomingCharges: UpcomingCharge[] = [
  { id: 1, name: "Netflix", date: "Sep 1", amount: 15.99, dueSoon: true },
  { id: 2, name: "Rent", date: "Sep 1", amount: 1200, dueSoon: true },
  { id: 3, name: "Gym Membership", date: "Sep 12", amount: 45 },
];

const accounts: AccountSummary[] = [
  { label: "Checking", amount: 1520.45, icon: Building2 },
  { label: "Credit Cards", amount: -830.25, icon: CreditCard },
  { label: "Savings", amount: 8000, icon: PiggyBank },
  { label: "Cash", amount: 120, icon: Wallet },
  { label: "Investments", amount: 15000, icon: LineChartIcon },
];

const budgetCategories: BudgetCategory[] = [
  { label: "Groceries", amount: 320, pct: 64, trend: -5, icon: ShoppingCart },
  { label: "Utilities", amount: 150, pct: 50, trend: 2, icon: Zap },
  { label: "Transport", amount: 90, pct: 60, trend: -3, icon: Car },
  { label: "Dining", amount: 120, pct: 40, trend: 4, icon: Utensils },
];

const PIE_COLORS = ["#6366f1", "#f97316", "#10b981", "#ef4444"];

const totalSpent = budgetCategories.reduce((sum, cat) => sum + cat.amount, 0);

const formatCurrency = (value: number) =>
  value.toLocaleString("en-US", { style: "currency", currency: "USD" });

export default function OverviewDashboard() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Net Cash Summary */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Net Cash</CardTitle>
            <Wallet className="h-5 w-5 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <div className="text-4xl font-bold">$2,582</div>
            <p className="text-sm text-muted-foreground">
              You’ve spent $600 more than last month
            </p>
          </div>
          <div className="h-24 w-full sm:w-40">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={cashData} margin={{ left: 0, right: 0 }}>
                <defs>
                  <linearGradient id="lastMonth" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#cbd5e1" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="#cbd5e1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" hide />
                <YAxis hide />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="previous"
                  stroke="transparent"
                  fill="url(#lastMonth)"
                />
                <Line
                  type="monotone"
                  dataKey="current"
                  stroke="#6366f1"
                  strokeWidth={2}
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Accounts Section */}
      <Card>
        <CardHeader>
          <CardTitle>Accounts</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {accounts.map((acc) => (
            <div key={acc.label} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <acc.icon className="h-5 w-5 text-muted-foreground" />
                <span>{acc.label}</span>
              </div>
              <span className="font-medium">{formatCurrency(acc.amount)}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Recent Transactions */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentTransactions.map((tx) => {
              const isExpense = tx.amount < 0;
              const Icon =
                tx.status === "pending"
                  ? Clock
                  : isExpense
                    ? ArrowDownRight
                    : ArrowUpRight;
              const color =
                tx.status === "pending"
                  ? "text-muted-foreground"
                  : isExpense
                    ? "text-red-500"
                    : "text-green-500";
              return (
                <div key={tx.id} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{tx.title}</p>
                    <p className="text-sm text-muted-foreground">{tx.date}</p>
                  </div>
                  <div className={`flex items-center gap-1 ${color}`}>
                    <Icon className="h-4 w-4" />
                    <span className="font-medium">
                      {formatCurrency(Math.abs(tx.amount))}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
          <Button variant="ghost" className="w-full mt-4">
            See all
          </Button>
        </CardContent>
      </Card>

      {/* Upcoming Recurring Charges */}
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Charges</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {upcomingCharges.map((charge) => (
            <div key={charge.id} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="font-medium">{charge.name}</p>
                  <p className="text-sm text-muted-foreground">{charge.date}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {charge.dueSoon && <Badge variant="secondary">Due soon</Badge>}
                <span className="font-medium">
                  {formatCurrency(charge.amount)}
                </span>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Monthly Budget Breakdown */}
      <Card className="lg:col-span-3">
        <CardHeader>
          <CardTitle>Monthly Budget Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="flex items-center justify-center">
            <div className="relative h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RePieChart>
                  <Pie
                    data={budgetCategories}
                    dataKey="amount"
                    nameKey="label"
                    innerRadius={60}
                    outerRadius={80}
                  >
                    {budgetCategories.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={PIE_COLORS[index % PIE_COLORS.length]}
                      />
                    ))}
                  </Pie>
                </RePieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <p className="text-sm text-muted-foreground">Spent</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(totalSpent)}
                </p>
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Total Income</p>
              <p className="text-2xl font-bold">$5,000</p>
            </div>
            {budgetCategories.map((cat) => (
              <div key={cat.label} className="space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <cat.icon className="h-4 w-4 text-muted-foreground" />
                    <span>{cat.label}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {cat.trend >= 0 ? (
                      <TrendingUp className="h-3 w-3 text-green-500" />
                    ) : (
                      <TrendingDown className="h-3 w-3 text-red-500" />
                    )}
                    <span className="text-sm text-muted-foreground">
                      {Math.abs(cat.trend)}%
                    </span>
                  </div>
                </div>
                <Progress value={cat.pct} className="h-2" />
                <p className="text-sm text-muted-foreground">
                  {formatCurrency(cat.amount)}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
