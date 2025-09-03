import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import React, { useState, useMemo, useEffect } from "react";
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

const generateNetWorthData = (current: number, period: Period) => {
  const points = { "1M": 4, "3M": 12, "6M": 24, "1Y": 12 }[period];
  const now = new Date();
  const growth = {
    "1Y": 0.08,
    "6M": 0.06,
    "3M": 0.04,
    "1M": 0.02
  }[period];
  const start = current / (1 + growth);

  return Array.from({ length: points }, (_, i) => {
    const t = i / (points - 1);
    let date: Date;
    let label: string;
    
    if (period === "1Y") {
      date = new Date(now.getFullYear(), now.getMonth() - (points - 1 - i), 1);
      label = date.toLocaleDateString("en-US", { month: "short" });
    } else if (period === "6M" || period === "3M") {
      const weeksBack = period === "6M" ? (points - 1 - i) : (points - 1 - i) / 2;
      date = new Date(now.getTime() - weeksBack * 7 * 24 * 60 * 60 * 1000);
      label = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    } else {
      date = new Date(now.getTime() - (points - 1 - i) * 7 * 24 * 60 * 60 * 1000);
      label = `${date.getMonth() + 1}/${date.getDate()}`;
    }
    
    const variance = (Math.random() - 0.5) * 0.05 * start;
    const netWorth = Math.round(start + (current - start) * t + variance);
    return { label, netWorth };
  });
};

const formatCompactCurrency = (value: number): string => {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`;
  } else if (value >= 1000) {
    return `$${(value / 1000).toFixed(0)}k`;
  }
  return `$${value.toLocaleString()}`;
};

const formatTooltipDate = (label: string, period: Period): string => {
  const now = new Date();
  if (period === "1M") {
    // For 1M, assume label is in format "M/D"
    const [month, day] = label.split('/');
    const date = new Date(now.getFullYear(), parseInt(month) - 1, parseInt(day));
    return date.toLocaleDateString("en-US", { month: "long", day: "numeric" });
  } else {
    // For other periods, the label should be more descriptive already
    return label;
  }
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
      "1Y": 6
    }[netWorthPeriod];
    return Math.round(baseChange * periodMultiplier);
  }, [currentNetWorth, netWorthPeriod]);
  
  const previousNetWorth = currentNetWorth - netWorthChange;

  const netWorthData = useMemo(
    () => generateNetWorthData(currentNetWorth, netWorthPeriod),
    [currentNetWorth, netWorthPeriod],
  );

  const monthlySpendingComparison = useMemo(() => {
    if (!transactions) return { current: 0, previous: 0, change: 0 };
    const now = new Date();
    const curStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const curEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const prevStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevEnd = new Date(now.getFullYear(), now.getMonth(), 0);
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
        day: i + 1,
        current: Math.round((i + 1) * 200),
        previous: Math.round((i + 1) * 180),
      }));
    }

    const now = new Date();
    const curStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const nextStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const prevStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const curDays = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
    ).getDate();
    const prevDays = new Date(now.getFullYear(), now.getMonth(), 0).getDate();

    const expenses = transactions.filter((t) => t.type === "expense");
    const curDaily = Array(curDays).fill(0);
    const prevDaily = Array(prevDays).fill(0);

    expenses.forEach((t) => {
      const d = new Date(t.date);
      const amt = Math.abs(parseFloat(t.amount));
      if (d >= curStart && d < nextStart) curDaily[d.getDate() - 1] += amt;
      else if (d >= prevStart && d < curStart)
        prevDaily[d.getDate() - 1] += amt;
    });

    const max = Math.max(curDays, prevDays);
    const data: { day: number; current: number; previous: number }[] = [];
    let curRun = 0;
    let prevRun = 0;
    for (let i = 0; i < max; i++) {
      if (i < curDays) curRun += curDaily[i];
      if (i < prevDays) prevRun += prevDaily[i];
      data.push({
        day: i + 1,
        current: Math.round(curRun),
        previous: Math.round(prevRun),
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
          <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            
            Total Net Worth
          </CardTitle>
          <Link href="/wealth-management">
            <Button
              variant="ghost"
              size="sm"
              className="text-purple-600 hover:text-purple-700 dark:text-purple-400"
            >
              View Net Worth <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {formatCompactCurrency(currentNetWorth)}
            </p>
            <div className="flex items-center gap-2 mt-1">
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
                {netWorthChange >= 0 ? "+" : "-"}{formatCompactCurrency(Math.abs(netWorthChange))} vs {netWorthPeriod === "1M" ? "last month" : netWorthPeriod === "3M" ? "previous 3 months" : netWorthPeriod === "6M" ? "previous 6 months" : "last year"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            {(["1M", "3M", "6M", "1Y"] as const).map((p) => (
              <Button
                key={p}
                variant="ghost"
                size="sm"
                onClick={() => setNetWorthPeriod(p)}
                className={`px-3 py-1 text-xs font-medium transition-all duration-200 ${
                  netWorthPeriod === p
                    ? "bg-purple-600 hover:bg-purple-700 text-white shadow-sm"
                    : "text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                }`}
              >
                {p}
              </Button>
            ))}
          </div>
        </div>

        <div className="h-48">
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
                tickFormatter={(v) => {
                  if (v >= 1000000) {
                    return `$${(v / 1000000).toFixed(0)}M`;
                  } else if (v >= 1000) {
                    return `$${(v / 1000).toFixed(0)}k`;
                  }
                  return `$${v}`;
                }}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const value = payload[0].value as number;
                    const formattedDate = formatTooltipDate(label, netWorthPeriod);
                    return (
                      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3">
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                          {formattedDate}
                        </p>
                        <p className="text-lg font-semibold text-gray-900 dark:text-white">
                          {formatCompactCurrency(value)}
                        </p>
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
                activeDot={{ r: 4, fill: "#8B5CF6", stroke: "#fff", strokeWidth: 2 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
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
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              ${totalSpending.toLocaleString()}
            </p>
            <div className="flex items-center gap-2 mt-1">
              {spendingChange >= 0 ? (
                <TrendingUp className="h-4 w-4 text-red-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-green-500" />
              )}
              <span
                className={`text-sm font-medium ${
                  spendingChange >= 0
                    ? "text-red-600 dark:text-red-400"
                    : "text-green-600 dark:text-green-400"
                }`}
              >
                {spendingChange >= 0 ? "+" : "-"}$
                {Math.abs(spendingChange).toLocaleString()} vs last month
              </span>
            </div>
          </div>
        </div>

        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={spendingComparisonData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis
                dataKey="day"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#6B7280", fontSize: 12 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#6B7280", fontSize: 12 }}
                tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip
                formatter={(v: any, name: string) => [
                  `$${v.toLocaleString()}`,
                  name === "current" ? "This Month" : "Last Month",
                ]}
                labelFormatter={(l) => `Day ${l}`}
                labelStyle={{ color: "#374151" }}
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
              <Legend />
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

        <Button
          variant="ghost"
          size="icon"
          onClick={handlePrev}
          disabled={activeGraph === "networth"}
          className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/70 dark:bg-gray-800/70"
          aria-label="Previous graph"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleNext}
          disabled={activeGraph === "spending"}
          className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/70 dark:bg-gray-800/70"
          aria-label="Next graph"
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
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
