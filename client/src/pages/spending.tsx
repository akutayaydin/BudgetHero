import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  MoreHorizontal,
  Calendar as CalendarIcon,
  PieChart,
  BarChart2,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  BadgeDollarSign,
} from "lucide-react";

interface CardProps {
  className?: string;
  children: React.ReactNode;
}
const Card: React.FC<CardProps> = ({ className = "", children }) => (
  <div
    className={`relative w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm ${className}`}
  >
    {children}
  </div>
);

interface CardHeaderProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
}
const CardHeader: React.FC<CardHeaderProps> = ({ title, subtitle, action }) => (
  <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-700">
    <div>
      <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wide flex items-center gap-2">{title}</h3>
      {subtitle && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 normal-case">{subtitle}</p>
      )}
    </div>
    {action}
  </div>
);

interface CardBodyProps {
  className?: string;
  children: React.ReactNode;
}
const CardBody: React.FC<CardBodyProps> = ({ className = "", children }) => (
  <div className={`p-6 ${className}`}>{children}</div>
);

interface TagProps {
  children: React.ReactNode;
}
const Tag: React.FC<TagProps> = ({ children }) => (
  <span className="inline-flex items-center gap-1 text-xs rounded-full px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
    {children}
  </span>
);

// Color palette for categories
const categoryColors: string[] = [
  "#3B82F6", "#F59E0B", "#10B981", "#8B5CF6", "#EF4444", 
  "#14B8A6", "#06B6D4", "#F97316", "#84CC16", "#6366F1"
];

interface Category {
  name: string;
  amount: number;
  lastMonth: number;
}

interface Merchant {
  name: string;
  domain: string;
  count: number;
  avg: number;
  amount: number;
}

interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: string;
  category: string;
  type: string;
  merchant?: string;
}

// Format currency
function formatUSD(n: number): string {
  return n.toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

interface ChartPoint {
  label: string;
  income: number;
  spend: number;
}

// Build chart data for various time ranges
const generatePeriodData = (
  transactions: Transaction[],
  period: "week" | "month" | "quarter" | "year"
): ChartPoint[] => {
  const now = new Date();
  const data: ChartPoint[] = [];

  const addPoint = (start: Date, end: Date, label: string) => {
    const periodTx = transactions.filter((t) => {
      const d = new Date(t.date);
      return d >= start && d <= end;
    });
    let income = 0;
    let spend = 0;
    periodTx.forEach((t) => {
      const amt = Math.abs(parseFloat(t.amount));
      if (t.type === "income") {
        income += amt;
        console.log(`✅ Income transaction: ${t.description} - $${amt} (type: ${t.type}, category: ${t.category})`);
      } else {
        spend += amt;
      }
    });
    
    // Debug logging for chart calculation
    console.log(`📊 Chart Debug - Period: ${label}`, {
      dateRange: `${start.toISOString().slice(0, 10)} to ${end.toISOString().slice(0, 10)}`,
      filteredTransactions: periodTx.length,
      totalIncome: income,
      totalSpend: spend,
      sampleTransactions: periodTx.slice(0, 2).map(t => ({
        date: t.date,
        amount: t.amount,
        type: t.type,
        category: t.category
      }))
    });
    
    data.push({ label, income, spend });
  };

  if (period === "week") {
    const startOfWeek = (d: Date) => {
      const s = new Date(d);
      s.setHours(0, 0, 0, 0);
      s.setDate(s.getDate() - s.getDay());
      return s;
    };
    const currentStart = startOfWeek(now);
    for (let i = 7; i >= 0; i--) {
      const start = new Date(currentStart);
      start.setDate(start.getDate() - i * 7);
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);
      const label = `${start.getMonth() + 1}/${start.getDate()}`;
      addPoint(start, end, label);
    }
  } else if (period === "month") {
    for (let i = 11; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const start = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
      const end = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
      end.setHours(23, 59, 59, 999);
      const label = monthDate.toLocaleDateString(undefined, { month: "short" });
      addPoint(start, end, label);
    }
  } else if (period === "quarter") {
    const currentQuarter = Math.floor(now.getMonth() / 3);
    for (let i = 3; i >= 0; i--) {
      const qIndex = currentQuarter - i;
      const year = now.getFullYear() + Math.floor(qIndex / 4);
      const quarter = ((qIndex % 4) + 4) % 4;
      const start = new Date(year, quarter * 3, 1);
      const end = new Date(year, quarter * 3 + 3, 0);
      end.setHours(23, 59, 59, 999);
      const label = `Q${quarter + 1} ${year}`;
      addPoint(start, end, label);
    }
  } else {
    for (let i = 4; i >= 0; i--) {
      const year = now.getFullYear() - i;
      const start = new Date(year, 0, 1);
      const end = new Date(year, 11, 31);
      end.setHours(23, 59, 59, 999);
      addPoint(start, end, `${year}`);
    }
  }

  return data;
};

// Chart component styled like design reference
const PeriodSpendingChart = ({
  transactions,
}: {
  transactions: Transaction[];
}) => {
  const [period, setPeriod] = useState<
    "week" | "month" | "quarter" | "year"
  >("week");

  const data = useMemo(
    () => generatePeriodData(transactions, period),
    [transactions, period]
  );

  const max = Math.max(
    ...data.map((d) => Math.max(d.income, d.spend)),
    1
  );
  
  console.log('📊 Chart Rendering Debug:', {
    period,
    dataPoints: data.length,
    maxValue: max,
    sampleData: data.slice(0, 3).map(d => ({
      label: d.label,
      income: d.income,
      spend: d.spend,
      incomeHeight: `${(d.income / max) * 100}%`,
      spendHeight: `${(d.spend / max) * 100}%`
    }))
  });

  return (
    <div className="p-4 rounded-xl bg-gradient-to-r from-pink-600 to-rose-500 text-white">
      <div className="flex gap-2 mb-4">
        {["week", "month", "quarter", "year"].map((p) => (
          <button
            key={p}
            className={`px-3 py-1 rounded-full text-sm transition-colors ${
              period === p ? "bg-white text-pink-600" : "bg-white/20"
            }`}
            onClick={() => setPeriod(p as any)}
          >
            {p.charAt(0).toUpperCase() + p.slice(1)}
          </button>
        ))}
      </div>
      <div className="flex items-end justify-between h-40 relative">
        {data.map((d, i) => (
          <div key={i} className="flex flex-col items-center flex-1 mx-1">
            <div className="w-full bg-white/10 rounded-md flex items-end justify-around h-full p-1">
              <div
                className="w-1/2 mx-0.5 bg-white rounded-t-sm min-h-[2px]"
                style={{ 
                  height: d.income > 0 ? `${Math.max((d.income / max) * 100, 5)}%` : '0%'
                }}
                title={`Income: $${d.income.toFixed(2)}`}
              />
              <div
                className="w-1/2 mx-0.5 rounded-t-sm bg-white/20 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:2px_2px] min-h-[2px]"
                style={{ 
                  height: d.spend > 0 ? `${Math.max((d.spend / max) * 100, 5)}%` : '0%'
                }}
                title={`Spend: $${d.spend.toFixed(2)}`}
              />
            </div>
            <span className="text-xs mt-1">{d.label}</span>
          </div>
        ))}
      </div>
      <div className="flex justify-center gap-4 text-xs mt-4">
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-white" /> Income
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-white/20 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:2px_2px]" />
          Total Spend
        </div>
      </div>
    </div>
  );
};

interface DonutSegment {
  label: string;
  value: number;
  ratio: number;
  from: number;
  to: number;
  color: string;
}

interface DonutData {
  segments: DonutSegment[];
  total: number;
}

// Build donut data from categories
const useDonutData = (categories: Category[]): DonutData => {
  return useMemo(() => {
    const total = categories.reduce((s, c) => s + c.amount, 0);
    let acc = 0;
    const segs = categories.slice(0, 8).map((c, index) => {
      const v = c.amount / total;
      const from = acc;
      const to = acc + v;
      acc = to;
      return {
        label: c.name,
        value: c.amount,
        ratio: v,
        from,
        to,
        color: categoryColors[index % categoryColors.length],
      };
    });
    return { segments: segs, total };
  }, [categories]);
};

// Convert [0..1] arc to SVG path
function arcPath(cx: number, cy: number, r: number, from: number, to: number): string {
  const tau = Math.PI * 2;
  const start = angleToPoint(cx, cy, r, tau * from);
  const end = angleToPoint(cx, cy, r, tau * to);
  const large = to - from > 0.5 ? 1 : 0;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${large} 1 ${end.x} ${end.y}`;
}

function angleToPoint(cx: number, cy: number, r: number, a: number): { x: number; y: number } {
  return {
    x: cx + r * Math.cos(a - Math.PI / 2),
    y: cy + r * Math.sin(a - Math.PI / 2),
  };
}

// Donut Chart Component
interface DonutChartProps {
  data: DonutData;
  active: number | null;
  setActive: (index: number | null) => void;
}

const DonutChart: React.FC<DonutChartProps> = ({ data, active, setActive }) => {
  const size = 200;
  const center = size / 2;
  const radius = 75;
  
  return (
    <svg width={size} height={size} className="select-none">
      {/* Background ring */}
      <circle
        cx={center}
        cy={center}
        r={radius}
        className="fill-none stroke-gray-100 dark:stroke-gray-700"
        strokeWidth={20}
      />
      {/* Data segments */}
      {data.segments.map((s, i) => {
        const d = arcPath(center, center, radius, s.from, s.to);
        const isActive = active === i;
        return (
          <g key={i} onMouseEnter={() => setActive(i)} onMouseLeave={() => setActive(null)}>
            <path
              d={d}
              stroke={s.color}
              strokeWidth={isActive ? 22 : 20}
              className={`fill-none transition-all duration-200 ${
                active !== null && !isActive ? "opacity-40" : "opacity-100"
              }`}
              strokeLinecap="round"
            />
          </g>
        );
      })}
      {/* Inner circle */}
      <circle cx={center} cy={center} r={55} className="fill-white dark:fill-gray-800" />
    </svg>
  );
};

// Main Spending Page Component
export default function SpendingPage() {
  const [mode, setMode] = useState("pie");
  const [range, setRange] = useState("This Month");
  const [active, setActive] = useState<number | null>(null);
  
  const { data: transactions = [] } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions"],
  });

  // Debug: Log transaction data
  console.log("Spending Chart Debug - Transactions:", {
    totalTransactions: transactions.length,
    sampleTransactions: transactions.slice(0, 3),
    incomeCount: transactions.filter(t => t.type === "income").length,
    expenseCount: transactions.filter(t => t.type === "expense").length,
  });

  const expenseTransactions = useMemo(
    () => (transactions || []).filter((t) => t.type === "expense"),
    [transactions]
  );

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const lastMonthDate = new Date(currentYear, currentMonth - 1, 1);

  const currentMonthTx = useMemo(
    () =>
      expenseTransactions.filter((t) => {
        const d = new Date(t.date);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      }),
    [expenseTransactions, currentMonth, currentYear]
  );

  const lastMonthTx = useMemo(
    () =>
      expenseTransactions.filter((t) => {
        const d = new Date(t.date);
        return (
          d.getMonth() === lastMonthDate.getMonth() &&
          d.getFullYear() === lastMonthDate.getFullYear()
        );
      }),
    [expenseTransactions, lastMonthDate]
  );

  const categories = useMemo(() => {
    const mapCurrent: Record<string, number> = {};
    const mapLast: Record<string, number> = {};
    
    currentMonthTx.forEach((t) => {
      const c = t.category || "Uncategorized";
      const amt = Math.abs(parseFloat(t.amount));
      mapCurrent[c] = (mapCurrent[c] || 0) + amt;
    });
    
    lastMonthTx.forEach((t) => {
      const c = t.category || "Uncategorized";
      const amt = Math.abs(parseFloat(t.amount));
      mapLast[c] = (mapLast[c] || 0) + amt;
    });
    
    const names = Array.from(
      new Set([...Object.keys(mapCurrent), ...Object.keys(mapLast)])
    );
    
    return names
      .map((name) => ({
        name,
        amount: mapCurrent[name] || 0,
        lastMonth: mapLast[name] || 0,
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [currentMonthTx, lastMonthTx]);

  const donut = useDonutData(categories);
  const totalSpend = donut.total;
  const lastMonthTotal = categories.reduce((s, c) => s + c.lastMonth, 0);
  const delta = totalSpend - lastMonthTotal;
  const deltaPct = Math.abs(delta) / (lastMonthTotal || 1);

  const merchants = useMemo(() => {
    const map = new Map<string, { amount: number; count: number; domain: string }>();
    currentMonthTx.forEach((t) => {
      const name = t.merchant || t.description;
      if (!name) return;
      const amount = Math.abs(parseFloat(t.amount));
      const domain = (t.merchant || "").toLowerCase().replace(/\s+/g, "") + ".com";
      const entry = map.get(name) || { amount: 0, count: 0, domain };
      entry.amount += amount;
      entry.count += 1;
      entry.domain = domain;
      map.set(name, entry);
    });
    return Array.from(map.entries())
      .map(([name, info]) => ({
        name,
        domain: info.domain,
        count: info.count,
        avg: info.count ? +(info.amount / info.count).toFixed(0) : 0,
        amount: info.amount,
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 4);
  }, [currentMonthTx]);

  const largestPurchases = useMemo(
    () =>
      currentMonthTx
        .slice()
        .sort(
          (a, b) =>
            Math.abs(parseFloat(b.amount)) - Math.abs(parseFloat(a.amount))
        )
        .slice(0, 4)
        .map((t) => ({
          name: t.merchant || t.description,
          date: new Date(t.date).toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
          }),
          amount: Math.abs(parseFloat(t.amount)),
          domain: (t.merchant || "").toLowerCase().replace(/\s+/g, "") + ".com",
        })),
    [currentMonthTx]
  );

  const uncategorizedCount = useMemo(
    () =>
      expenseTransactions.filter(
        (t) => !t.category || t.category === "Other" || t.category === "Uncategorized"
      ).length,
    [expenseTransactions]
  );

  return (
    <div className="min-h-screen w-full bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-semibold">Spending</h1>
            <div className="hidden md:flex items-center gap-2">
              {["Last Month", "This Month", "Custom"].map((r) => (
                <button
                  key={r}
                  onClick={() => setRange(r)}
                  className={`text-sm rounded-md px-4 py-2 border transition ${
                    range === r
                      ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300"
                      : "border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="inline-flex items-center gap-2 text-sm rounded-md px-4 py-2 border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800">
              <CalendarIcon className="h-4 w-4" /> {range}
            </button>
            <div className="flex rounded-md border border-gray-200 dark:border-gray-600 overflow-hidden">
              <button
                onClick={() => setMode("pie")}
                className={`px-4 py-2 text-sm flex items-center gap-2 ${
                  mode === "pie"
                    ? "bg-blue-500 text-white"
                    : "hover:bg-gray-50 dark:hover:bg-gray-800"
                }`}
              >
                <PieChart className="h-4 w-4" />Pie
              </button>
              <button
                onClick={() => setMode("bar")}
                className={`px-4 py-2 text-sm flex items-center gap-2 ${
                  mode === "bar"
                    ? "bg-blue-500 text-white"
                    : "hover:bg-gray-50 dark:hover:bg-gray-800"
                }`}
              >
                <BarChart2 className="h-4 w-4" />Bars
              </button>
            </div>
          </div>
        </div>

        {/* Spending Trends Chart */}
        <div className="mb-6">
          <Card>
            <CardBody className="py-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">Spending Overview</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Track your spending patterns</p>
                </div>
              </div>
              <PeriodSpendingChart transactions={transactions || []} />
            </CardBody>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* LEFT: Breakdown & Categories (3/5) */}
          <div className="lg:col-span-3 space-y-6">
            {/* Spending Breakdown */}
            <Card>
              <CardHeader
                title="Spending Breakdown"
                subtitle={
                  <div className="flex items-center gap-2 mt-2">
                    <Tag>
                      {delta === 0 ? (
                        "No change"
                      ) : delta > 0 ? (
                        <span className="inline-flex items-center gap-1 text-red-600">
                          <TrendingUp className="h-3 w-3" /> +{Math.round(deltaPct * 100)}% vs last month
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-green-600">
                          <TrendingDown className="h-3 w-3" /> {Math.round(deltaPct * 100)}% vs last month
                        </span>
                      )}
                    </Tag>
                  </div>
                }
                action={
                  <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                    <MoreHorizontal className="h-5 w-5" />
                  </button>
                }
              />
              <CardBody>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Donut Chart */}
                  <div className="relative flex items-center justify-center">
                    <DonutChart data={donut} active={active} setActive={setActive} />
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="text-center">
                        <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Total Spend</div>
                        <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{formatUSD(totalSpend)}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">All categories</div>
                      </div>
                    </div>
                  </div>

                  {/* Category Legend */}
                  <div className="space-y-3">
                    {donut.segments.map((s, i) => {
                      const pct = Math.round(s.ratio * 100);
                      return (
                        <div
                          key={i}
                          onMouseEnter={() => setActive(i)}
                          onMouseLeave={() => setActive(null)}
                          className={`p-3 rounded-lg transition cursor-pointer ${
                            active === i
                              ? "bg-gray-50 dark:bg-gray-700"
                              : "hover:bg-gray-25 dark:hover:bg-gray-800"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: s.color }}
                              />
                              <span className="text-sm font-medium">{s.label}</span>
                            </div>
                            <div className="text-sm font-semibold">{formatUSD(s.value)}</div>
                          </div>
                          <div className="ml-6 text-xs text-gray-500 dark:text-gray-400">
                            {pct}% of total spending
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CardBody>
            </Card>

            {/* Categories Table */}
            <Card>
              <CardHeader 
                title="Categories" 
                subtitle="Percent of spend • Change vs last month"
              />
              <CardBody className="p-0">
                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                  {categories.slice(0, 10).map((c, idx) => {
                    const pct = Math.round((c.amount / totalSpend) * 100);
                    const diff = c.amount - c.lastMonth;
                    const diffPct = Math.abs(Math.round((diff / (c.lastMonth || 1)) * 100));
                    const color = categoryColors[idx % categoryColors.length];
                    
                    return (
                      <div key={idx} className="px-6 py-4 hover:bg-gray-25 dark:hover:bg-gray-800/50">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: color }}
                            />
                            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {c.name}
                            </span>
                          </div>
                          <div className="flex items-center gap-6">
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {pct}% of spend
                            </div>
                            <div className={`text-sm font-medium ${
                              diff > 0 ? "text-red-600" : diff < 0 ? "text-green-600" : "text-gray-500 dark:text-gray-400"
                            }`}>
                              {diff === 0 ? "—" : `${diff > 0 ? "+" : ""}${diffPct}%`}
                            </div>
                            <div className="text-sm font-semibold text-gray-900 dark:text-gray-100 w-20 text-right">
                              {formatUSD(c.amount)}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardBody>
            </Card>
          </div>

          {/* RIGHT: Most Categorization (2/5) */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader title="Most Categorization" />
              <CardBody>
                {/* Needs Categorization Alert */}
                {uncategorizedCount > 0 && (
                  <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                    <div className="flex items-center gap-3">
                      <AlertCircle className="h-5 w-5 text-amber-600" />
                      <div>
                        <div className="text-sm font-medium text-amber-800 dark:text-amber-200">
                          {uncategorizedCount} transactions need categorization
                        </div>
                        <div className="text-xs text-amber-600 dark:text-amber-300 mt-1">
                          Update to improve insights
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Frequent Spend */}
                <div className="mb-8">
                  <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-4">
                    Frequent Spend
                  </h4>
                  <div className="space-y-3">
                    {merchants.map((m, idx) => (
                      <div key={idx} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <img
                            className="h-6 w-6 rounded"
                            alt={m.name}
                            src={`https://logo.clearbit.com/${m.domain}`}
                            onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                              e.currentTarget.src = "https://dummyimage.com/24x24/eee/aaa.png&text=?";
                            }}
                          />
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{m.name}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {m.count} transactions
                            </div>
                          </div>
                        </div>
                        <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                          {formatUSD(m.amount)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Largest Purchases */}
                <div>
                  <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-4">
                    Largest Purchases
                  </h4>
                  <div className="space-y-3">
                    {largestPurchases.map((purchase, idx) => (
                      <div key={idx} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <img
                            className="h-6 w-6 rounded"
                            alt={purchase.name}
                            src={`https://logo.clearbit.com/${purchase.domain}`}
                            onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                              e.currentTarget.src = "https://dummyimage.com/24x24/eee/aaa.png&text=?";
                            }}
                          />
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{purchase.name}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">{purchase.date}</div>
                          </div>
                        </div>
                        <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                          {formatUSD(purchase.amount)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* CTA */}
                <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-700">
                  <div className="flex items-center gap-3 mb-4">
                    <BadgeDollarSign className="h-5 w-5 text-blue-600" />
                    <div>
                      <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                        Want to spend less next month?
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Create category budgets to track your spending goals.
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button className="text-sm px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition">
                      Set Budget
                    </button>
                    <button className="text-sm px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                      Learn More
                    </button>
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}