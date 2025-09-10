import React, { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { startOfMonth, startOfWeek, formatISO } from "date-fns";
import { getIcon } from "@/lib/category-icons";
import { formatCurrency } from "@/lib/financial-utils";
import { Plus } from "lucide-react";
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
    const pct = budget > 0 ? (spent / budget) * 100 : 0;
    const isOverspent = pct > 100;
    const displayPct = Math.min(100, pct);
    const overspendPct = Math.max(0, pct - 100);
    
    return (
      <div key={cat} className="border rounded-md p-3 space-y-2">
        <div className="flex justify-between items-center">
          <span className="font-medium text-sm">{cat}</span>
          <button
            className="text-xs text-muted-foreground hover:text-red-500 w-4 h-4 flex items-center justify-center"
            onClick={() => handleRemove(cat)}
            aria-label="Remove category"
          >
            ✕
          </button>
        </div>
        
        {/* Fancy Progress Bar */}
        <div className="relative">
          <div className="w-full h-3 bg-gray-200 rounded-full shadow-inner overflow-hidden">
            {/* Main progress bar with gradient */}
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-500 to-green-500 transition-all duration-300 ease-out"
              style={{ 
                width: `${displayPct}%`,
                background: isOverspent 
                  ? 'linear-gradient(to right, #ef4444, #dc2626)' 
                  : 'linear-gradient(to right, #3b82f6, #10b981)'
              }}
            />
            
            {/* Overspend indicator */}
            {isOverspent && (
              <div
                className="absolute top-0 h-full bg-red-500 rounded-r-full opacity-80"
                style={{ 
                  left: '100%',
                  width: `${Math.min(overspendPct, 50)}%`,
                  marginLeft: '-2px'
                }}
              />
            )}
          </div>
        </div>
        
        {/* Amount display in specified format */}
        <div className="flex justify-between items-center text-sm font-mono">
          <span className={isOverspent ? "text-red-600" : "text-gray-700"}>
            {formatCurrency(spent)} / {formatCurrency(budget)}
          </span>
        </div>
      </div>
    );
  };

  return (
    <Card className="mb-6">
      <CardHeader className="pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <CardTitle className="text-lg font-semibold">Quick Category Tracker</CardTitle>
        
        {/* Pill-style segmented toggle */}
        <div className="relative bg-gray-100 p-1 rounded-full">
          <div className="grid grid-cols-2 relative">
            {/* Active state background */}
            <div
              className={`absolute top-1 bottom-1 bg-blue-500 rounded-full transition-transform duration-200 ease-out`}
              style={{
                width: 'calc(50% - 4px)',
                transform: timeframe === "week" ? 'translateX(2px)' : 'translateX(calc(100% + 2px))'
              }}
            />
            
            {/* Week button */}
            <button
              className={`relative z-10 px-4 py-1.5 text-sm font-medium rounded-full transition-colors duration-200 ${
                timeframe === "week" ? "text-white" : "text-gray-600 hover:text-gray-800"
              }`}
              onClick={() => setTimeframe("week")}
            >
              Week
            </button>
            
            {/* Month button */}
            <button
              className={`relative z-10 px-4 py-1.5 text-sm font-medium rounded-full transition-colors duration-200 ${
                timeframe === "month" ? "text-white" : "text-gray-600 hover:text-gray-800"
              }`}
              onClick={() => setTimeframe("month")}
            >
              Month
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {selectedCategories.length < 5 && availableCategories.length > 0 && (
          <Select onValueChange={handleAdd}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder={(
                <div className="flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Add Category
                </div>
              )} />
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