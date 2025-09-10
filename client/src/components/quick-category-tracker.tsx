import React, { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { startOfMonth, startOfWeek, formatISO } from "date-fns";
import { getIcon } from "@/lib/category-icons";
import { formatCurrency } from "@/lib/financial-utils";
import type { LucideIcon } from "lucide-react";

interface BudgetApi {
  id: string;
  name?: string;
  category?: string | null;
  limit: string | number;
  spent?: string | number | null;
}

interface TransactionApi {
  amount: number | string;
  date: string;
}

type Timeframe = "week" | "month";

export default function QuickCategoryTracker() {
  const { data: budgets = [] } = useQuery<BudgetApi[]>({
    queryKey: ["/api/budgets"],
  });

  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [timeframe, setTimeframe] = useState<Timeframe>("month");
  const [spending, setSpending] = useState<Record<string, { week: number; month: number }>>({});

  const availableCategories = useMemo(() => {
    return budgets
      .map((b) => b.category || b.name || "")
      .filter((c) => c && !selectedCategories.includes(c));
  }, [budgets, selectedCategories]);

  useEffect(() => {
    const fetchSpending = async (cat: string) => {
      try {
        const startMonth = startOfMonth(new Date());
        const params = new URLSearchParams({
          category: cat,
          startDate: formatISO(startMonth, { representation: "date" }),
        });
        const res = await fetch(`/api/transactions?${params.toString()}`);
        if (!res.ok) return;
        const txs: TransactionApi[] = await res.json();
        const weekStart = startOfWeek(new Date());
        let monthTotal = 0;
        let weekTotal = 0;
        for (const tx of txs) {
          const amt = Number(tx.amount);
          if (amt < 0) {
            const val = -amt;
            monthTotal += val;
            if (new Date(tx.date) >= weekStart) {
              weekTotal += val;
            }
          }
        }
        setSpending((prev) => ({ ...prev, [cat]: { week: weekTotal, month: monthTotal } }));
      } catch (err) {
        console.error("Failed to fetch spending", err);
      }
    };

    selectedCategories.forEach((cat) => {
      if (!spending[cat]) fetchSpending(cat);
    });
  }, [selectedCategories, spending]);

  const handleAdd = (cat: string) => {
    if (selectedCategories.length >= 5) return;
    setSelectedCategories((prev) => [...prev, cat]);
  };

  const handleRemove = (cat: string) => {
    setSelectedCategories((prev) => prev.filter((c) => c !== cat));
  };

  const renderCategory = (cat: string) => {
    const Icon: LucideIcon = getIcon(cat);
    const budgetEntry = budgets.find((b) => (b.category || b.name) === cat);
    const monthBudget = Number(budgetEntry?.limit || 0);
    const weekBudget = monthBudget / 4;
    const spent = spending[cat]?.[timeframe] || 0;
    const budget = timeframe === "week" ? weekBudget : monthBudget;
    const remaining = budget - spent;
    const pct = budget > 0 ? Math.min(100, (spent / budget) * 100) : 0;
    return (
      <div key={cat} className="border rounded-md p-3 space-y-1">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Icon className="w-4 h-4" />
            <span className="font-medium text-sm">{cat}</span>
          </div>
          <button
            className="text-xs text-muted-foreground hover:text-red-500"
            onClick={() => handleRemove(cat)}
            aria-label="Remove category"
          >
            ✕
          </button>
        </div>
        <Progress value={pct} className="h-2" />
        <div className="flex justify-between text-xs font-mono">
          <span>{formatCurrency(spent)}</span>
          <span>{formatCurrency(budget)}</span>
        </div>
        <div className={`text-xs font-mono ${remaining < 0 ? "text-red-600" : "text-green-600"}`}>
          {remaining < 0 ? "Over by " : "Remaining "}{formatCurrency(Math.abs(remaining))}
        </div>
      </div>
    );
  };

  return (
    <Card className="mb-6">
      <CardHeader className="pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <CardTitle className="text-lg font-semibold">Quick Category Tracker</CardTitle>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant={timeframe === "week" ? "default" : "outline"}
            onClick={() => setTimeframe("week")}
          >
            Week
          </Button>
          <Button
            size="sm"
            variant={timeframe === "month" ? "default" : "outline"}
            onClick={() => setTimeframe("month")}
          >
            Month
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {selectedCategories.length < 5 && (
          <Select onValueChange={handleAdd}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Add category" />
            </SelectTrigger>
            <SelectContent>
              {availableCategories.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <div className="grid gap-3">
          {selectedCategories.map((cat) => renderCategory(cat))}
        </div>
      </CardContent>
    </Card>
  );
}