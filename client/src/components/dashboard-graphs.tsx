import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import React, { useState, useMemo, useEffect } from "react";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import {
  TrendingUp,
  TrendingDown,
  PieChart,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  ComposedChart,
  Area,
  Tooltip,
  Legend,
} from "recharts";

type Period = "1M" | "3M" | "6M" | "1Y";

interface NetWorthData {
  totalAssets: number;
  totalLiabilities: number;
  totalNetWorth: number;
}

/* ---------- Helpers ---------- */

const generateNetWorthData = (
  current: number,
  period: Period,
  firstDataDate?: Date,
) => {
  const days = { "1M": 30, "3M": 90, "6M": 180, "1Y": 365 }[period];
  const now = new Date();

  // Use a realistic first data date if not provided (simulate account linking ~45 days ago)
  const actualFirstDate =
    firstDataDate || new Date(now.getTime() - 45 * 24 * 60 * 60 * 1000);
  const periodStartDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

  // Determine the actual start date for data generation
  const dataStartDate =
    actualFirstDate > periodStartDate ? actualFirstDate : periodStartDate;
  const daysWithData =
    Math.floor(
      (now.getTime() - dataStartDate.getTime()) / (24 * 60 * 60 * 1000),
    ) + 1;

  const growth = {
    "1Y": 0.08,
    "6M": 0.06,
    "3M": 0.04,
    "1M": 0.02,
  }[period];

  // Calculate start value based on actual time period with data
  const actualGrowthRate = growth * (daysWithData / days);
  const start = current / (1 + actualGrowthRate);

  // Generate data points only for the period with actual data
  const dataPoints = Array.from({ length: daysWithData }, (_, i) => {
    const t = i / (daysWithData - 1);
    const date = new Date(dataStartDate.getTime() + i * 24 * 60 * 60 * 1000);

    // Create label based on period for internal use
    let label: string;
    if (period === "1M") {
      label = `${date.getMonth() + 1}/${date.getDate()}`;
    } else {
      label = date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    }

    // Add some realistic daily variance while maintaining overall growth trend
    const dailyVariance = (Math.random() - 0.5) * 0.01 * start; // 1% daily variance
    const baseValue = start + (current - start) * t;
    const netWorth = Math.round(baseValue + dailyVariance);

    return {
      label,
      netWorth,
      date: new Date(date),
      isValidData: true,
    };
  });

  // Add empty data points before the first valid date if the period extends earlier
  const emptyDaysBefore = Math.max(
    0,
    Math.floor(
      (dataStartDate.getTime() - periodStartDate.getTime()) /
        (24 * 60 * 60 * 1000),
    ),
  );
  const emptyPoints = Array.from({ length: emptyDaysBefore }, (_, i) => {
    const date = new Date(periodStartDate.getTime() + i * 24 * 60 * 60 * 1000);
    let label: string;
    if (period === "1M") {
      label = `${date.getMonth() + 1}/${date.getDate()}`;
    } else {
      label = date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    }

    return {
      label,
      netWorth: null, // No data available
      date: new Date(date),
      isValidData: false,
    };
  });

  return [...emptyPoints, ...dataPoints];
};

const formatFullCurrency = (value: number): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const formatTooltipDate = (dataPoint: any): string => {
  const date = dataPoint.date || new Date();
  return date.toLocaleDateString("en-US", { month: "long", day: "numeric" });
};

/* ---------- Component ---------- */

export function DashboardGraphs() {
  const [activeGraph, setActiveGraph] = useState<"networth" | "spending">(
    "networth",
  );
  const [netWorthPeriod, setNetWorthPeriod] = useState<Period>("1M");
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const { data: netWorthSummary } = useQuery<NetWorthData>({
    queryKey: ["/api/net-worth"],
  });
  const { data: transactions } = useQuery<any[]>({
    queryKey: ["/api/transactions"],
  });

  const currentNetWorth = netWorthSummary?.totalNetWorth ?? 0;

  // Calculate net worth change based on selected period
  const netWorthChange = useMemo(() => {
    const baseChange = currentNetWorth * 0.02; // 2% base change
    const periodMultiplier = {
      "1M": 1,
      "3M": 2.5,
      "6M": 4,
      "1Y": 6,
    }[netWorthPeriod];
    return Math.round(baseChange * periodMultiplier);
  }, [currentNetWorth, netWorthPeriod]);

  const previousNetWorth = currentNetWorth - netWorthChange;

  const netWorthData = useMemo(() => {
    // Simulate first data date - in a real app, this would come from when accounts were first linked
    const firstDataDate = new Date(
      new Date().getTime() - 45 * 24 * 60 * 60 * 1000,
    ); // 45 days ago
    return generateNetWorthData(currentNetWorth, netWorthPeriod, firstDataDate);
  }, [currentNetWorth, netWorthPeriod]);

  const monthlySpendingComparison = useMemo(() => {
    if (!transactions) return { current: 0, previous: 0, change: 0 };

    const now = new Date();
    const today = now.getDate(); // e.g., 3rd
    const thisMonth = now.getMonth();
    const lastMonth = now.getMonth() - 1;
    const year = now.getFullYear();

    const curStart = new Date(year, thisMonth, 1);
    const curEnd = new Date(year, thisMonth, today);

    const prevStart = new Date(year, lastMonth, 1);
    const prevEnd = new Date(year, lastMonth, today);

    const expenses = transactions.filter((t) => t.type === "expense");

    const current = expenses
      .filter((t) => {
        const d = new Date(t.date);
        return d >= curStart && d <= curEnd;
      })
      .reduce((s, t) => s + Math.abs(parseFloat(t.amount)), 0);

    const previous = expenses
      .filter((t) => {
        const d = new Date(t.date);
        return d >= prevStart && d <= prevEnd;
      })
      .reduce((s, t) => s + Math.abs(parseFloat(t.amount)), 0);

    return {
      current: Math.round(current),
      previous: Math.round(previous),
      change: Math.round(current - previous),
    };
  }, [transactions]);

  const spendingComparisonData = useMemo(() => {
    if (!transactions || transactions.length === 0) {
      return Array.from({ length: 30 }, (_, i) => ({
        date: `Day ${i + 1}`,
        current: Math.round((i + 1) * 200),
        previous: Math.round((i + 1) * 180),
      }));
    }

    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();

    const curStart = new Date(year, month, 1);
    const nextStart = new Date(year, month + 1, 1);
    const prevStart = new Date(year, month - 1, 1);

    const curDays = new Date(year, month + 1, 0).getDate();
    const prevDays = new Date(year, month, 0).getDate();

    const expenses = transactions.filter((t) => t.type === "expense");
    const curDaily = Array(curDays).fill(0);
    const prevDaily = Array(prevDays).fill(0);

    expenses.forEach((t) => {
      const d = new Date(t.date);
      const amt = Math.abs(parseFloat(t.amount));
      if (d >= curStart && d < nextStart) {
        curDaily[d.getDate() - 1] += amt;
      } else if (d >= prevStart && d < curStart) {
        prevDaily[d.getDate() - 1] += amt;
      }
    });

    const max = Math.max(curDays, prevDays);
    const today = now.getDate();

    const data: { date: string; current?: number; previous: number }[] = [];
    let curRun = 0;
    let prevRun = 0;

    for (let i = 0; i < max; i++) {
      let currentDateLabel: string | undefined;
      let previousDateLabel: string | undefined;

      // Format current month date (only if within current days)
      if (i < curDays) {
        const curDate = new Date(year, month, i + 1);
        currentDateLabel = curDate.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });
      }

      // Format previous month date (only if within previous days)
      if (i < prevDays) {
        const prevDate = new Date(year, month - 1, i + 1);
        previousDateLabel = prevDate.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });
      }

      if (i < curDays) curRun += curDaily[i];
      if (i < prevDays) prevRun += prevDaily[i];

      data.push({
        day: currentDateLabel || previousDateLabel || `Day ${i + 1}`,
        current: i < today ? Math.round(curRun) : undefined,
        previous: Math.round(prevRun),
        currentLabel: currentDateLabel,
        previousLabel: previousDateLabel,
        index: i, // optional, helpful for debugging
      });
    }

    return data;
  }, [transactions]);

  const totalSpending = monthlySpendingComparison.current;
  const spendingChange = monthlySpendingComparison.change;

  const handleNext = () =>
    setActiveGraph((g) => (g === "networth" ? "spending" : "networth"));
  const handlePrev = () =>
    setActiveGraph((g) => (g === "spending" ? "networth" : "spending"));

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };
  const onTouchMove = (e: React.TouchEvent) =>
    setTouchEnd(e.targetTouches[0].clientX);
  const onTouchEnd = () => {
    if (!touchStart || touchEnd === null) return;
    const dist = touchStart - touchEnd;
    if (dist > 50) handleNext();
    if (dist < -50) handlePrev();
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") handlePrev();
      if (e.key === "ArrowRight") handleNext();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  /* ---------- Graphs ---------- */

  const renderNetWorthGraph = () => (
    <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-semibold text-gray-900 dark:text-white">
            Total Net Worth
          </CardTitle>
          <Link href="/wealth-management">
            <Button
              variant="ghost"
              size="sm"
              className="text-purple-600 hover:text-purple-700 dark:text-purple-400 font-medium"
            >
              View Net Worth <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="mb-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-4xl font-bold text-gray-900 dark:text-white mb-3">
                {formatFullCurrency(currentNetWorth)}
              </p>
              <div className="flex items-center gap-2">
                {netWorthChange >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-green-500" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-500" />
                )}
                <span
                  className={`text-sm font-medium ${
                    netWorthChange >= 0
                      ? "text-green-600 dark:text-green-400"
                      : "text-red-600 dark:text-red-400"
                  }`}
                >
                  {netWorthChange >= 0 ? "Up " : "Down "}
                  {formatFullCurrency(Math.abs(netWorthChange))} over the{" "}
                  {netWorthPeriod === "1M"
                    ? "last month"
                    : netWorthPeriod === "3M"
                      ? "last 3 months"
                      : netWorthPeriod === "6M"
                        ? "last 6 months"
                        : "last year"}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {(["1M", "3M", "6M", "1Y"] as const).map((p) => (
                <Button
                  key={p}
                  variant="ghost"
                  size="sm"
                  onClick={() => setNetWorthPeriod(p)}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                    netWorthPeriod === p
                      ? "bg-purple-600 hover:bg-purple-700 text-white shadow-sm"
                      : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  }`}
                >
                  {p}
                </Button>
              ))}
            </div>
          </div>
        </div>

        <div className="relative">
          {/* Navigation Arrows */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handlePrev}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 p-0 bg-white/80 hover:bg-white shadow-sm border border-gray-200"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleNext}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 p-0 bg-white/80 hover:bg-white shadow-sm border border-gray-200"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          
          <div className="h-48 px-8">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={netWorthData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis
                dataKey="label"
                axisLine={false}
                tickLine={false}
                tick={false}
                hide
              />

              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#6B7280", fontSize: 12 }}
                domain={[
                  (dataMin) => dataMin * 0.99,
                  (dataMax) => dataMax * 1.01,
                ]}
                tickFormatter={(v) => {
                  return new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: "USD",
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                    notation: "compact",
                  }).format(v);
                }}
              />

              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const dataPoint = payload[0].payload;
                    const value = dataPoint.netWorth;

                    if (value === undefined) return null;

                    // 🗓️ Reconstruct date from `day` field
                    const now = new Date();
                    const reconstructedDate = new Date(
                      now.getFullYear(),
                      now.getMonth(),
                      dataPoint.label,
                    );

                    // Format as "Aug 10"
                    const formattedDate = new Date(
                      dataPoint.date,
                    ).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    });

                    return (
                      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3 min-w-[140px]">
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                          {formattedDate}
                        </p>
                        <div className="flex justify-between">
                          <span className="text-xs text-gray-500 dark:text-gray-300">
                            Net Worth
                          </span>
                          <span className="text-xs font-medium text-gray-900 dark:text-white ">
                            {formatFullCurrency(value)}
                          </span>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />

              <Area
                type="monotone"
                dataKey="netWorth"
                fill="#8B5CF6"
                stroke="#8B5CF6"
                fillOpacity={0.1}
                strokeWidth={3}
                dot={false}
                activeDot={{
                  r: 4,
                  fill: "#8B5CF6",
                  stroke: "#fff",
                  strokeWidth: 2,
                }}
                connectNulls={false}
              />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderSpendingGraph = () => (
    <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            Current Spend This Month
          </CardTitle>
          <Link href="/spending">
            <Button
              variant="ghost"
              size="sm"
              className="text-blue-600 hover:text-blue-700 dark:text-blue-400"
            >
              View Spending <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white ">
              ${(totalSpending || 0).toLocaleString()}
            </p>
            <div className="flex items-center gap-2 mt-1">
              {spendingChange >= 0 ? (
                <ArrowUpRight className="h-4 w-4 text-red-500" />
              ) : (
                <ArrowDownRight className="h-4 w-4 text-green-500" />
              )}
              <span
                className={`text-sm font-medium ${
                  spendingChange >= 0
                    ? "text-red-600 dark:text-red-400"
                    : "text-green-600 dark:text-green-400"
                }`}
              >
                {spendingChange >= 0 ? "You've spent" : "You've spent"} $
                <span>{Math.abs(spendingChange || 0).toLocaleString()}</span>{" "}
                {spendingChange >= 0 ? "more" : "less"} than last month
              </span>
            </div>
          </div>
        </div>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={spendingComparisonData}>
              <CartesianGrid
                vertical={false}
                horizontal={true}
                stroke="#E5E7EB"
              />
              <defs>
                <linearGradient
                  id="previousGradient"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="0%" stopColor="#BFDBFE" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#BFDBFE" stopOpacity={0.05} />
                </linearGradient>
              </defs>

              <XAxis
                dataKey="day"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#6B7280", fontSize: 12 }}
                hide
              />

              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#6B7280", fontSize: 12 }}
                tickFormatter={(v) => `$${(v / 1000).toFixed(2)}k`}
                domain={[
                  "dataMin",
                  (dataMax: number) => Math.ceil(dataMax * 1.1),
                ]}
              />

              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;

                  const dp = payload[0].payload;
                  const today = new Date().getDate();
                  const showBoth = dp.index < today; // index is 0-based

                  return (
                    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3 min-w-[160px]">
                      {showBoth && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                          {dp.currentLabel}
                        </p>
                      )}

                      {showBoth ? (
                        // ✅ Up to today → show both series
                        <div className="flex flex-col gap-1">
                          {["current", "previous"].map((key) => {
                            const entry = payload.find(
                              (e) => e.dataKey === key,
                            );
                            if (!entry || typeof entry.value !== "number")
                              return null;
                            return (
                              <div
                                key={key}
                                className="flex justify-between text-xs text-gray-900 dark:text-white"
                              >
                                <span className="text-gray-500 dark:text-gray-300">
                                  {key === "current"
                                    ? "This Month"
                                    : "Last Month"}
                                </span>
                                <span>
                                  {formatFullCurrency(entry.value as number)}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        // ✅ After today → only the last month sentence, no header
                        <p className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                          Last month, by {dp.previousLabel}, you <br />
                          spent <b>{formatFullCurrency(dp.previous)}</b>.
                        </p>
                      )}
                    </div>
                  );
                }}
              />

              <Area
                type="monotone"
                dataKey="previous"
                name="Last Month"
                fill="#BFDBFE"
                stroke="#BFDBFE"
                fillOpacity={0.4}
              />

              <Line
                type="monotone"
                dataKey="current"
                name="This Month"
                stroke="#3B82F6"
                strokeWidth={3}
                dot={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );

  /* ---------- Render ---------- */

  return (
    <div className="space-y-4">
      <div
        className="relative"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        data-testid="graph-container"
      >
        {activeGraph === "networth"
          ? renderNetWorthGraph()
          : renderSpendingGraph()}

        <button
          onClick={handlePrev}
          disabled={activeGraph === "networth"}
          aria-label="Previous graph"
          className="p-1 rounded-full bg-black/5 hover:bg-black/10 disabled:opacity-30 absolute left-2 top-1/2 -translate-y-1/2 transition"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        <button
          onClick={handleNext}
          disabled={activeGraph === "spending"}
          aria-label="Next graph"
          className="p-1 rounded-full bg-black/5 hover:bg-black/10 disabled:opacity-30 absolute right-2 top-1/2 -translate-y-1/2 transition"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      <div className="flex items-center justify-center gap-2">
        <button
          onClick={() => setActiveGraph("networth")}
          className={`h-2 w-8 rounded-full transition-all duration-200 ${
            activeGraph === "networth"
              ? "bg-purple-600"
              : "bg-gray-300 dark:bg-gray-600 hover:bg-gray-400"
          }`}
          aria-label="Show net worth graph"
        />
        <button
          onClick={() => setActiveGraph("spending")}
          className={`h-2 w-8 rounded-full transition-all duration-200 ${
            activeGraph === "spending"
              ? "bg-blue-600"
              : "bg-gray-300 dark:bg-gray-600 hover:bg-gray-400"
          }`}
          aria-label="Show spending graph"
        />
      </div>
    </div>
  );
}

export default DashboardGraphs;
