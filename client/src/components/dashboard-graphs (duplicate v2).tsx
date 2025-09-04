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

// Build net-worth data for a given period
const generateNetWorthData = (
  currentNetWorth: number,
  period: "1M" | "3M" | "6M" | "1Y",
) => {
  const dataPoints = { "1M": 4, "3M": 12, "6M": 24, "1Y": 12 } as const;
  const points = dataPoints[period];
  const data: {
    label: string;
    netWorth: number;
    assets: number;
    liabilities: number;
  }[] = [];
  const now = new Date();
  const growthRate =
    period === "1Y"
      ? 0.08
      : period === "6M"
        ? 0.06
        : period === "3M"
          ? 0.04
          : 0.02;
  const start = currentNetWorth / (1 + growthRate);

  for (let i = 0; i < points; i++) {
    let label = "";
    let date: Date;

    if (period === "6M") {
      date = new Date(
        now.getTime() - (points - 1 - i) * 14 * 24 * 60 * 60 * 1000,
      );
      label = `${date.getMonth() + 1}/${date.getDate()}`;
    } else if (period === "1Y") {
      date = new Date(now.getFullYear(), now.getMonth() - (points - 1 - i), 1);
      label = date.toLocaleDateString("en-US", { month: "short" });
    } else {
      date = new Date(
        now.getTime() - (points - 1 - i) * 7 * 24 * 60 * 60 * 1000,
      );
      label = `${date.getMonth() + 1}/${date.getDate()}`;
    }

    const t = i / (points - 1);
    const base = start + (currentNetWorth - start) * t;
    const variance = (Math.random() - 0.5) * 0.1 * base;
    const netWorth = Math.max(0, base + variance);

    data.push({
      label,
      netWorth: Math.round(netWorth),
      assets: Math.round(netWorth * 1.2),
      liabilities: Math.round(netWorth * 0.2),
    });
  }

  if (data.length) {
    data[data.length - 1].netWorth = currentNetWorth;
    data[data.length - 1].assets = Math.round(currentNetWorth * 1.2);
    data[data.length - 1].liabilities = Math.round(currentNetWorth * 0.2);
  }

  return data;
};

// Merge current and previous month net-worth lines
const generateNetWorthComparisonData = (
  current: number,
  previous: number,
  period: "1M" | "3M" | "6M" | "1Y",
) => {
  const currentData = generateNetWorthData(current, period);
  const previousData = generateNetWorthData(previous, period);

  return currentData.map((d, i) => ({
    label: d.label,
    current: d.netWorth,
    previous:
      previousData[i]?.netWorth ??
      previousData[previousData.length - 1]?.netWorth ??
      0,
  }));
};

interface NetWorthData {
  totalAssets: number;
  totalLiabilities: number;
  totalNetWorth: number;
}

export function DashboardGraphs() {
  const [activeGraph, setActiveGraph] = useState<"networth" | "spending">(
    "networth",
  );
  const [netWorthPeriod, setNetWorthPeriod] = useState<
    "1M" | "3M" | "6M" | "1Y"
  >("1M");
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const { data: netWorthSummary } = useQuery<NetWorthData>({
    queryKey: ["/api/net-worth"],
  });
  const { data: transactions } = useQuery<any[]>({
    queryKey: ["/api/transactions"],
  });

  const currentNetWorth = netWorthSummary?.totalNetWorth || 51000;
  const netWorthChange = 2500;
  const previousNetWorth = currentNetWorth - netWorthChange;

  const netWorthComparisonData = useMemo(
    () =>
      generateNetWorthComparisonData(
        currentNetWorth,
        previousNetWorth,
        netWorthPeriod,
      ),
    [currentNetWorth, previousNetWorth, netWorthPeriod],
  );

  const monthlySpendingComparison = useMemo(() => {
    if (!transactions) return { current: 0, previous: 0, change: 0 };

    const now = new Date();
    const thisStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const lastStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    const expenses = transactions.filter((t) => t.type === "expense");

    const currentSpending = expenses
      .filter((t) => {
        const d = new Date(t.date);
        return d >= thisStart && d <= thisEnd;
      })
      .reduce((s, t) => s + Math.abs(parseFloat(t.amount)), 0);

    const previousSpending = expenses
      .filter((t) => {
        const d = new Date(t.date);
        return d >= lastStart && d <= lastEnd;
      })
      .reduce((s, t) => s + Math.abs(parseFloat(t.amount)), 0);

    return {
      current: Math.round(currentSpending),
      previous: Math.round(previousSpending),
      change: Math.round(currentSpending - previousSpending),
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
    const thisStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const nextStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const lastStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const thisDays = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
    ).getDate();
    const lastDays = new Date(now.getFullYear(), now.getMonth(), 0).getDate();

    const expenses = transactions.filter((t) => t.type === "expense");
    const currentDaily = Array(thisDays).fill(0);
    const lastDaily = Array(lastDays).fill(0);

    expenses.forEach((t) => {
      const date = new Date(t.date);
      const amt = Math.abs(parseFloat(t.amount));
      if (date >= thisStart && date < nextStart) {
        currentDaily[date.getDate() - 1] += amt;
      } else if (date >= lastStart && date < thisStart) {
        lastDaily[date.getDate() - 1] += amt;
      }
    });

    const maxDays = Math.max(thisDays, lastDays);
    const data: { day: number; current: number; previous: number }[] = [];
    let currentRun = 0;
    let lastRun = 0;
    for (let i = 0; i < maxDays; i++) {
      if (i < thisDays) currentRun += currentDaily[i];
      if (i < lastDays) lastRun += lastDaily[i];
      data.push({
        day: i + 1,
        current: Math.round(currentRun),
        previous: Math.round(lastRun),
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

  // swipe support
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };
  const onTouchMove = (e: React.TouchEvent) =>
    setTouchEnd(e.targetTouches[0].clientX);
  const onTouchEnd = () => {
    if (!touchStart || touchEnd === null) return;
    const distance = touchStart - touchEnd;
    if (distance > 50) handleNext();
    if (distance < -50) handlePrev();
  };

  // keyboard navigation
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") handlePrev();
      if (e.key === "ArrowRight") handleNext();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const renderNetWorthGraph = () => (
    <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-purple-600" />
            Net Worth Overview
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
              ${(currentNetWorth || 0).toLocaleString()}
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
                {netWorthChange >= 0 ? "+" : ""}$
                {Math.abs(netWorthChange || 0).toLocaleString()} this month
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            {(["1M", "3M", "6M", "1Y"] as const).map((p) => (
              <Button
                key={p}
                variant={netWorthPeriod === p ? "default" : "ghost"}
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
            <LineChart data={netWorthComparisonData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis
                dataKey="label"
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
                labelStyle={{ color: "#374151" }}
              />
              <Area
                type="monotone"
                dataKey="previous"
                name="Last Month"
                fill="#EDE9FE"
                stroke="#EDE9FE"
                fillOpacity={0.5}
              />
              <Line
                type="monotone"
                dataKey="current"
                name="This Month"
                stroke="#8B5CF6"
                strokeWidth={3}
                dot={{ fill: "#8B5CF6", strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: "#8B5CF6", strokeWidth: 2 }}
              />
              <Legend />
            </LineChart>
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
            <PieChart className="h-5 w-5 text-blue-600" />
            Spending Analysis
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
              ${(totalSpending || 0).toLocaleString()}
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
                {spendingChange >= 0 ? "+" : ""}$
                {Math.abs(spendingChange || 0).toLocaleString()} vs last month
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
                activeDot={{ r: 4 }}
              />
              <Legend />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );

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
