import React, { useMemo, useState } from "react";
import {
  MoreHorizontal,
  Calendar as CalendarIcon,
  PieChart,
  BarChart2,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  BadgeDollarSign,
  XCircle,
  CheckCircle2,
} from "lucide-react";
import IncomeExpenseBarChart from "@/components/charts/income-expense-bar-chart";

interface CardProps {
  className?: string;
  children: React.ReactNode;
}
const Card: React.FC<CardProps> = ({ className = "", children }) => (
  <div className={`rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-zinc-900 shadow-sm ${className}`}>
    {children}
  </div>
);

interface CardHeaderProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
}
const CardHeader: React.FC<CardHeaderProps> = ({ title, subtitle, action }) => (
  <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-zinc-800">
    <div>
      <h3 className="text-sm font-semibold text-gray-900 dark:text-zinc-100 flex items-center gap-2">{title}</h3>
      {subtitle && <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">{subtitle}</p>}
    </div>
    {action}
  </div>
);

interface CardBodyProps {
  className?: string;
  children: React.ReactNode;
}
const CardBody: React.FC<CardBodyProps> = ({ className = "", children }) => (
  <div className={`p-4 ${className}`}>{children}</div>
);

interface TagProps {
  children: React.ReactNode;
}
const Tag: React.FC<TagProps> = ({ children }) => (
  <span className="inline-flex items-center gap-1 text-xs rounded-full px-2 py-1 bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-200">{children}</span>
);

interface SmallStatProps {
  label: string;
  value: React.ReactNode;
  tone?: "neutral" | "up" | "down";
}
const SmallStat: React.FC<SmallStatProps> = ({ label, value, tone = "neutral" }) => (
  <div className="flex items-center justify-between text-sm py-1">
    <span className="text-gray-500 dark:text-zinc-400">{label}</span>
    <span
      className={
        tone === "up"
          ? "text-emerald-600"
          : tone === "down"
          ? "text-rose-600"
          : "text-gray-900 dark:text-zinc-100"
      }
    >
      {value}
    </span>
  </div>
);

// ---------- Demo data ----------
const categoryPalette: { key: string; color: string; icon: string }[] = [
  { key: "Bills & Utilities", color: "#3B82F6", icon: "💡" },
  { key: "Shopping", color: "#F59E0B", icon: "🛍️" },
  { key: "Groceries", color: "#10B981", icon: "🛒" },
  { key: "Auto & Transport", color: "#8B5CF6", icon: "🚗" },
  { key: "Dining", color: "#EF4444", icon: "🍽️" },
  { key: "Personal Care", color: "#14B8A6", icon: "🧴" },
  { key: "Software & Tech", color: "#06B6D4", icon: "💾" },
  { key: "Uncategorized", color: "#9CA3AF", icon: "❓" },
];

interface Category {
  name: string;
  amount: number;
  lastMonth: number;
}

const sampleCategories: Category[] = [
  { name: "Bills & Utilities", amount: 1325.64, lastMonth: 1203.11 },
  { name: "Shopping", amount: 960.03, lastMonth: 1020.9 },
  { name: "Groceries", amount: 446.23, lastMonth: 430.11 },
  { name: "Auto & Transport", amount: 328.56, lastMonth: 210.38 },
  { name: "Dining", amount: 287.31, lastMonth: 300.2 },
  { name: "Software & Tech", amount: 240.7, lastMonth: 199.99 },
  { name: "Personal Care", amount: 200, lastMonth: 185.5 },
  { name: "Uncategorized", amount: 226.36, lastMonth: 50.0 },
];

interface Merchant {
  name: string;
  domain: string;
  count: number;
  avg: number;
  amount: number;
}

const merchants: Merchant[] = [
  { name: "Tesla Supercharging", domain: "tesla.com", count: 11, avg: 18.7, amount: 288.38 },
  { name: "Trader Joe's", domain: "traderjoes.com", count: 5, avg: 45.9, amount: 275.0 },
  { name: "Target", domain: "target.com", count: 3, avg: 63.5, amount: 151.6 },
];

// ---------- Helpers ----------
function formatUSD(n: number): string {
  return n.toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

interface DonutSegment {
  label: string;
  value: number;
  ratio: number;
  from: number;
  to: number;
  color: string;
  icon: string;
}

interface DonutData {
  segments: DonutSegment[];
  total: number;
}

// Build segments derived from categories + colors
const useDonutData = (categories: Category[]): DonutData => {
  return useMemo(() => {
    const total = categories.reduce((s, c) => s + c.amount, 0);
    let acc = 0;
    const segs = categories.map((c) => {
      const pal = categoryPalette.find((p) => p.key === c.name) || categoryPalette[0];
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
        color: pal.color,
        icon: pal.icon,
      };
    });
    return { segments: segs, total };
  }, [categories]);
};

// Convert [0..1] arc to SVG polar path
function arcPath(cx: number, cy: number, r: number, from: number, to: number): string {
  const start = angleToPoint(cx, cy, r, tau * from);
  const end = angleToPoint(cx, cy, r, tau * to);
  const large = to - from > 0.5 ? 1 : 0;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${large} 1 ${end.x} ${end.y}`;
}
const tau = Math.PI * 2;
function angleToPoint(cx: number, cy: number, r: number, a: number): { x: number; y: number } {
  return {
    x: cx + r * Math.cos(a - Math.PI / 2),
    y: cy + r * Math.sin(a - Math.PI / 2),
  };
}

// ---------- Donut Chart ----------
interface DonutChartProps {
  data: DonutData;
  active: number | null;
  setActive: (index: number | null) => void;
}

const DonutChart: React.FC<DonutChartProps> = ({ data, active, setActive }) => {
  const size = 220;
  const center = size / 2;
  const radius = 90;
  return (
    <svg width={size} height={size} className="select-none">
      {/* background ring */}
      <circle
        cx={center}
        cy={center}
        r={radius}
        className="fill-none stroke-gray-200 dark:stroke-zinc-800"
        strokeWidth={24}
      />
      {data.segments.map((s, i) => {
        const d = arcPath(center, center, radius, s.from, s.to);
        const isActive = active === i;
        return (
          <g key={i} onMouseEnter={() => setActive(i)} onMouseLeave={() => setActive(null)}>
            <path
              d={d}
              stroke={s.color}
              strokeWidth={isActive ? 26 : 24}
              className={`fill-none transition-all duration-200 ${
                active !== null && !isActive ? "opacity-30" : "opacity-100"
              }`}
              strokeLinecap="round"
            />
          </g>
        );
      })}
      {/* inner disc */}
      <circle cx={center} cy={center} r={64} className="fill-white dark:fill-zinc-900" />
    </svg>
  );
};

// ---------- Main Page ----------
export default function SpendingPage() {
  const [mode, setMode] = useState("pie");
  const [range, setRange] = useState("This Month");
  const [active, setActive] = useState<number | null>(null);

  const donut = useDonutData(sampleCategories);
  const totalSpend = donut.total;
  const lastMonthTotal = sampleCategories.reduce((s, c) => s + c.lastMonth, 0);
  const delta = totalSpend - lastMonthTotal;
  const deltaPct = Math.abs(delta) / (lastMonthTotal || 1);
  const trendingTone = delta > 0 ? "down" : delta < 0 ? "up" : "neutral";

  return (
    <div className="min-h-screen w-full bg-gray-50 dark:bg-zinc-950 text-gray-900 dark:text-zinc-100">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold">Spending</h1>
            <div className="hidden md:flex items-center gap-2">
              {["Last Month", "This Month", "Custom"].map((r) => (
                <button
                  key={r}
                  onClick={() => setRange(r)}
                  className={`text-xs rounded-full px-3 py-1 border transition ${
                    range === r
                      ? "border-gray-900 dark:border-zinc-300 bg-gray-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                      : "border-gray-200 dark:border-zinc-800 hover:bg-gray-100/60 dark:hover:bg-zinc-800/60"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className={`inline-flex items-center gap-2 text-xs rounded-full px-3 py-1 border border-gray-200 dark:border-zinc-800 hover:bg-gray-100/60 dark:hover:bg-zinc-800/60`}>
              <CalendarIcon className="h-4 w-4" /> {range}
            </button>
            <div className="flex rounded-full border border-gray-200 dark:border-zinc-800 overflow-hidden">
              <button
                onClick={() => setMode("pie")}
                className={`px-3 py-1 text-xs flex items-center gap-1 ${
                  mode === "pie"
                    ? "bg-gray-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                    : "hover:bg-gray-100/60 dark:hover:bg-zinc-800/60"
                }`}
              >
                <PieChart className="h-4 w-4" />Pie
              </button>
              <button
                onClick={() => setMode("bar")}
                className={`px-3 py-1 text-xs flex items-center gap-1 ${
                  mode === "bar"
                    ? "bg-gray-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                    : "hover:bg-gray-100/60 dark:hover:bg-zinc-800/60"
                }`}
              >
                <BarChart2 className="h-4 w-4" />Bars
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* LEFT: Breakdown & table */}
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader
                title={
                  <span className="flex items-center gap-2">
                    Spending Breakdown
                    <Tag>
                      {delta === 0 ? (
                        "no change"
                      ) : delta > 0 ? (
                        <span className="inline-flex items-center gap-1">
                          <TrendingUp className="h-3 w-3" /> {Math.round(deltaPct * 100)}% ↑ vs last month
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1">
                          <TrendingDown className="h-3 w-3" /> {Math.round(deltaPct * 100)}% ↓ vs last month
                        </span>
                      )}
                    </Tag>
                  </span>
                }
                action={
                  <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800">
                    <MoreHorizontal className="h-5 w-5" />
                  </button>
                }
              />
              <CardBody>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Donut + center total */}
                  <div className="relative flex items-center justify-center">
                    <DonutChart data={donut} active={active} setActive={setActive} />
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="text-center">
                        <div className="text-xs text-gray-500 dark:text-zinc-400">TOTAL SPEND</div>
                        <div className="text-2xl font-semibold">{formatUSD(totalSpend)}</div>
                        <div className="mt-1 text-[11px] text-gray-500 dark:text-zinc-400">
                          {active !== null ? donut.segments[active].label : "All categories"}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Legend / mini bars */}
                  <div className="flex flex-col gap-2">
                    {donut.segments.map((s, i) => {
                      const pct = Math.round(s.ratio * 100);
                      return (
                        <button
                          key={i}
                          onMouseEnter={() => setActive(i)}
                          onMouseLeave={() => setActive(null)}
                          className={`w-full text-left rounded-xl p-2 transition ${
                            active === i
                              ? "bg-gray-100 dark:bg-zinc-800"
                              : "hover:bg-gray-50 dark:hover:bg-zinc-900"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-lg" aria-hidden>
                                {s.icon}
                              </span>
                              <span className="text-sm">{s.label}</span>
                            </div>
                            <div className="text-sm font-medium">{formatUSD(s.value)}</div>
                          </div>
                          <div className="mt-2 h-2 rounded-full bg-gray-100 dark:bg-zinc-800 overflow-hidden">
                            <div className="h-2" style={{ width: `${pct}%`, background: s.color }} />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </CardBody>
            </Card>

            {/* Category Table */}
            <Card>
              <CardHeader title="Categories" subtitle="Percent of spend · vs last month" />
              <CardBody className="p-0">
                <div className="p-4">
                  <IncomeExpenseBarChart />
                </div>
                <div className="divide-y divide-gray-100 dark:divide-zinc-800">
                  {sampleCategories.map((c, idx) => {
                    const pal =
                      categoryPalette.find((p) => p.key === c.name) || categoryPalette[0];
                    const pct = Math.round((c.amount / totalSpend) * 100);
                    const diff = c.amount - c.lastMonth;
                    const tone = diff > 0 ? "down" : diff < 0 ? "up" : "neutral";
                    return (
                      <div
                        key={idx}
                        className="p-3 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-zinc-900/60"
                      >
                        <div
                          className="h-8 w-8 rounded-full flex items-center justify-center text-sm"
                          style={{ background: pal.color + "22", color: pal.color }}
                        >
                          {pal.icon}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <div className="text-sm font-medium">{c.name}</div>
                            <div className="text-sm font-semibold">{formatUSD(c.amount)}</div>
                          </div>
                          <div className="mt-1 flex items-center justify-between text-xs text-gray-500 dark:text-zinc-400">
                            <div className="flex items-center gap-2">
                              <div className="w-24 h-1.5 rounded-full bg-gray-100 dark:bg-zinc-800 overflow-hidden">
                                <div
                                  className="h-1.5"
                                  style={{ width: `${pct}%`, background: pal.color }}
                                />
                              </div>
                              <span>{pct}% of spend</span>
                            </div>
                            <div
                              className={`inline-flex items-center gap-1 ${
                                tone === "down"
                                  ? "text-rose-600"
                                  : tone === "up"
                                  ? "text-emerald-600"
                                  : "text-gray-500 dark:text-zinc-400"
                              }`}
                            >
                              {tone === "down" ? (
                                <TrendingUp className="h-3 w-3" />
                              ) : tone === "up" ? (
                                <TrendingDown className="h-3 w-3" />
                              ) : null}
                              {tone === "neutral"
                                ? "–"
                                : `${Math.abs(Math.round((diff / (c.lastMonth || 1)) * 100))}%`}
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

          {/* RIGHT: Insights */}
          <div className="space-y-4">
            <Card>
              <CardHeader
                title="Needs Categorization"
                action={
                  <button className="text-xs px-2 py-1 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
                    Update {6}
                  </button>
                }
              />
              <CardBody>
                <div className="flex items-start gap-3 text-sm">
                  <AlertCircle className="h-5 w-5 text-amber-500" />
                  <p className="text-gray-600 dark:text-zinc-300">
                    You have 6 uncategorized transactions. Review them to improve insights.
                  </p>
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardHeader title="Summary" subtitle="Aug 1 – Aug 31" />
              <CardBody>
                <SmallStat label="Income" value={`+ ${formatUSD(3482)}`} tone="up" />
                <SmallStat label="Bills" value={`${formatUSD(3254)}`} />
                <SmallStat
                  label="Spending"
                  value={`${formatUSD(totalSpend)}`}
                  tone={trendingTone as "neutral" | "up" | "down"}
                />
                <div className="mt-3 text-xs text-gray-500 dark:text-zinc-400">Left for Savings</div>
                <div className="flex items-center justify-between mt-1">
                  <div className="text-sm font-medium">You saved 40% more than you expected</div>
                  <div className="text-sm text-emerald-600">{formatUSD(4273)}</div>
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardHeader title="Frequent Spend" subtitle="This month" />
              <CardBody className="space-y-3">
                {merchants.map((m) => (
                  <div key={m.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img
                        className="h-6 w-6 rounded"
                        alt={m.name}
                        src={`https://logo.clearbit.com/${m.domain}`}
                        onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                          e.currentTarget.src =
                            "https://dummyimage.com/48x48/eee/aaa.png&text=%F0%9F%92%B0";
                        }}
                      />
                      <div>
                        <div className="text-sm font-medium">{m.name}</div>
                        <div className="text-xs text-gray-500 dark:text-zinc-400">
                          {m.count} tx · avg ${m.avg}
                        </div>
                      </div>
                    </div>
                    <div className="text-sm font-semibold">{formatUSD(m.amount)}</div>
                  </div>
                ))}
              </CardBody>
            </Card>

            <Card>
              <CardHeader title="Largest Purchases" />
              <CardBody className="space-y-3">
                {[
                  { n: "Trader Joe's", d: "Aug 26", a: 63.9, domain: "traderjoes.com" },
                  { n: "Flight Tickets", d: "Aug 18", a: 252.5, domain: "delta.com" },
                  { n: "Target", d: "Aug 05", a: 151.6, domain: "target.com" },
                ].map((x) => (
                  <div key={x.n} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img
                        className="h-6 w-6 rounded"
                        alt={x.n}
                        src={`https://logo.clearbit.com/${x.domain}`}
                        onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                          e.currentTarget.src =
                            "https://dummyimage.com/48x48/eee/aaa.png&text=%F0%9F%93%A6";
                        }}
                      />
                      <div>
                        <div className="text-sm font-medium">{x.n}</div>
                        <div className="text-xs text-gray-500 dark:text-zinc-400">{x.d}</div>
                      </div>
                    </div>
                    <div className="text-sm font-semibold">{formatUSD(x.a)}</div>
                  </div>
                ))}
              </CardBody>
            </Card>

            <Card>
              <CardBody>
                <div className="flex items-center gap-3">
                  <BadgeDollarSign className="h-5 w-5 text-emerald-600" />
                  <div>
                    <div className="text-sm font-semibold">
                      Want to spend less next month?
                    </div>
                    <div className="text-xs text-gray-500 dark:text-zinc-400">
                      Create a category budget and track during the month.
                    </div>
                  </div>
                </div>
                <div className="mt-3 flex gap-2">
                  <button className="text-sm px-3 py-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700">
                    Set a Budget
                  </button>
                  <button className="text-sm px-3 py-1.5 rounded-lg border border-gray-200 dark:border-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-900">
                    Learn More
                  </button>
                </div>
              </CardBody>
            </Card>
          </div>
        </div>

        {/* Footer CTA / Data controls */}
        <div className="mt-6 flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="text-xs text-gray-500 dark:text-zinc-400">
            It’s important to keep your data accurate for better insights.
          </div>
          <div className="flex gap-2">
            <button className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 dark:border-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-900 flex items-center gap-1">
              <CheckCircle2 className="h-4 w-4" />Adjust your data
            </button>
            <button className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 dark:border-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-900 flex items-center gap-1">
              <XCircle className="h-4 w-4" />Report a problem
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
