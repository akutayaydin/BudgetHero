import React, { useMemo, useState, useEffect } from "react";
import type { BudgetPlan, Transaction, Budget, AdminCategory } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { getIcon } from "@/lib/category-icons";
import { Check, X, type LucideIcon } from "lucide-react";

interface Props {
  plan: BudgetPlan;
}

const fmt = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

function Ring({ percent }: { percent: number }) {
  const dash = Math.max(0, Math.min(percent, 100));
  return (
    <svg
      viewBox="0 0 36 36"
      className="w-6 h-6"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831"
        fill="none"
        stroke="#e5e7eb"
        strokeWidth="3"
      />
      <path
        d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeDasharray={`${dash}, 100`}
      />
    </svg>
  );
}

interface RowProps {
  id?: string;
  name: string;
  budgeted: number;
  actual: number;
  icon: LucideIcon;
  isIncome?: boolean;
  editable?: boolean;
  onUpdate?: (id: string, value: number) => Promise<void> | void;
}

function BudgetRow({
  id,
  name,
  budgeted,
  actual,
  icon: Icon,
  isIncome,
  editable,
  onUpdate,
}: RowProps) {
  const remaining = budgeted - actual;
  const percent = budgeted > 0 ? (Math.max(remaining, 0) / budgeted) * 100 : 0;
  let color = "text-gray-500";
  if (isIncome) {
    color = remaining < 0 ? "text-green-600" : "text-gray-500";
  } else {
    color = remaining < 0 ? "text-red-500" : remaining > 0 ? "text-green-600" : "text-gray-500";
  }

  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(String(budgeted));

  useEffect(() => {
    if (!isEditing) setEditValue(String(budgeted));
  }, [budgeted, isEditing]);

  const handleSave = async () => {
    const val = parseFloat(editValue);
    if (!isNaN(val) && onUpdate && id) {
      await onUpdate(id, val);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(String(budgeted));
    setIsEditing(false);
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSave();
    if (e.key === "Escape") handleCancel();
  };

  return (
    <tr className="border-b last:border-b-0 hover:bg-muted/50 odd:bg-muted/30">
      <td className="py-2">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-muted-foreground" />
          <span>{name}</span>
        </div>
      </td>
      <td className="py-2 text-right align-top">
        {editable && isEditing ? (
          <div className="flex items-center justify-end gap-1">
            <Input
              type="number"
              value={editValue}
              onChange={e => setEditValue(e.target.value)}
              onKeyDown={handleKey}
              className="w-24 h-7 text-right text-sm"
              step="0.01"
              autoFocus
            />
            <Button
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0 text-green-600 hover:text-green-700"
              onClick={handleSave}
            >
              <Check className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0 text-red-600 hover:text-red-700"
              onClick={handleCancel}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <div>
            {editable ? (
              <button
                onClick={() => setIsEditing(true)}
                className="group flex flex-col items-end text-right"
                title="Click to edit"
              >
                <span
                  className="px-1 pb-[1px] group-hover:border-b group-hover:border-dashed group-hover:border-gray-300 dark:group-hover:border-gray-600"
                >
                  {fmt.format(budgeted)}
                </span>

              </button>
            ) : (
            <div>{fmt.format(budgeted)}</div>
            )}
          <div className="text-right">
        )}
      </td>
      <td className="py-2 text-right align-top">
        <div>{fmt.format(actual)}</div>
      </td>
      <td className="py-2 text-right">
        <div className={`flex items-center justify-end gap-2 ${color}`}>
          <Ring percent={percent} />
          <div>{fmt.format(remaining)}</div>
        </div>
      </td>
    </tr>
  );
}

export default function ManageBudget({ plan }: Props) {
  const queryClient = useQueryClient();
  const { month, expectedEarnings, expectedBills, spendingBudget } = plan;

  const { data: transactions = [] } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions", month],
    queryFn: async () => {
      const [y, m] = month.split("-").map(Number);
      const start = new Date(y, m - 1, 1).toISOString().slice(0, 10);
      const end = new Date(y, m, 0).toISOString().slice(0, 10);
      const res = await fetch(`/api/transactions?startDate=${start}&endDate=${end}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch transactions");
      return res.json();
    },
  });

  const { data: budgets = [] } = useQuery<Budget[]>({
    queryKey: ["/api/budgets"],
    queryFn: async () => {
      const res = await fetch("/api/budgets", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch budgets");
      return res.json();
    },
  });

  const [openAdd, setOpenAdd] = useState(false);
  const [selectedCats, setSelectedCats] = useState<Set<string>>(new Set());
  const { data: adminCats = [] } = useQuery<AdminCategory[]>({
    queryKey: ["/api/admin/categories"],
    queryFn: async () => {
      const res = await fetch("/api/admin/categories", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch categories");
      return res.json();
    },
  });
  const basicsSet = new Set(["income", "bills & utilities"]);
  const availableCategories = Array.from(
    new Map(
      adminCats
        .filter(c => c.ledgerType === "EXPENSE")
        .map(c => [c.name.toLowerCase(), c.name] as const)
    ).values()
  )
    .filter(
      name =>
        !basicsSet.has(name.toLowerCase()) &&
        !budgets.some(
          b => (b.name || "").toLowerCase() === name.toLowerCase()
        )
    )
    .sort();

  async function handleAddCategories() {
    const created: Budget[] = [];
    for (const name of selectedCats) {
      const res = await fetch("/api/budgets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        // Backend expects decimal values as strings (NUMERIC columns).
        body: JSON.stringify({ name, limit: "0", spent: "0" }),
      });
      if (res.ok) {
        const budget = (await res.json()) as Budget;
        created.push(budget);
      }
    }
    if (created.length) {
      queryClient.setQueryData<Budget[]>(["/api/budgets"], old => [
        ...(old || []),
        ...created,
      ]);
    }
    setSelectedCats(new Set());
    setOpenAdd(false);
    await queryClient.invalidateQueries({ queryKey: ["/api/budgets"] });
  }
  
  async function handleBudgetUpdate(id: string, value: number) {
    const res = await fetch(`/api/budgets/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ limit: String(value) }),
    });
    if (res.ok) {
      queryClient.setQueryData<Budget[]>(["/api/budgets"], old =>
        (old || []).map(b =>
          (b as any).id === id ? { ...b, limit: String(value) } : b,
        ),
      );
      await queryClient.invalidateQueries({ queryKey: ["/api/budgets"] });
    }
  }
  
  const { basics, categoryRows, currentSpend, remaining, validationError } = useMemo(() => {
    let income = 0;
    let billsActual = 0;
    let totalExpenses = 0;
    const actualByCat: Record<string, number> = {};

    transactions.forEach((t) => {
      const amt = Number(t.amount) || 0;
      if ((t as any).type === "income") {
        income += amt;
      } else {
        totalExpenses += amt;
        const cat = (t.category || "").toLowerCase();
        if (cat === "bills & utilities") billsActual += amt;
        actualByCat[cat] = (actualByCat[cat] || 0) + amt;
      }
    });

    const categoriesMap = new Map<string, Budget>();
    budgets.forEach(b => {
      const key = (b.name || "").toLowerCase();
      if (!categoriesMap.has(key)) {
        categoriesMap.set(key, b);
      }
    });
    const categories = Array.from(categoriesMap.values()).map(b => ({
      
      id: (b as any).id,
      name: (b as any).name as string,
      budgeted: Number((b as any).limit),
      actual: actualByCat[((b as any).name || "").toLowerCase()] || 0,
      icon: getIcon((b as any).name || ""),
    }));

    const allocated = categories.reduce((s, c) => s + c.budgeted, 0);
    const categoriesSpent = categories.reduce((s, c) => s + c.actual, 0);
    const spendingExpenses = totalExpenses - billsActual;

    const everythingElse = {
      id: "everything-else",
      name: "Everything Else",
      budgeted: Math.max(Number(spendingBudget) - allocated, 0),
      actual: Math.max(spendingExpenses - categoriesSpent, 0),
      icon: getIcon("everything else"),
    };

    const basicsRows: RowProps[] = [
      {
        name: "Income",
        budgeted: Number(expectedEarnings),
        actual: income,
        icon: getIcon("income"),
        isIncome: true,
      },
      {
        name: "Bills & Utilities",
        budgeted: Number(expectedBills),
        actual: billsActual,
        icon: getIcon("bills & utilities"),
      },
    ];

    const currentSpendVal = categoriesSpent + everythingElse.actual;
    const remainingVal = Number(spendingBudget) - currentSpendVal;

    return {
      basics: basicsRows,
      categoryRows: [...categories, everythingElse],
      currentSpend: currentSpendVal,
      remaining: remainingVal,
      validationError: allocated > Number(spendingBudget),
    };
  }, [transactions, budgets, expectedEarnings, expectedBills, spendingBudget]);

  const percentLeft =
    Number(spendingBudget) > 0 ? (remaining / Number(spendingBudget)) * 100 : 0;

  const ringColor =
    remaining < 0
      ? "text-red-500"
      : percentLeft < 10
      ? "text-orange-500"
      : "text-green-600";

  const [yy, mm] = month.split("-").map(Number);
  const endOfMonth = new Date(yy, mm, 0);
  const today = new Date();
  let daysRemaining = endOfMonth.getDate();
  if (today.getFullYear() === yy && today.getMonth() + 1 === mm) {
    daysRemaining = Math.max(endOfMonth.getDate() - today.getDate() + 1, 0);
  }
  const dailyAllowance = daysRemaining > 0 ? remaining / daysRemaining : 0;

  return (
    <div className="grid md:grid-cols-3 gap-4 pb-40 md:pb-0">
      <div className="md:col-span-2 space-y-8">
        <section>
          <h2 className="text-lg font-semibold mb-2">Budget Basics</h2>
          
          <Card>
            <CardContent className="overflow-x-auto p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-muted-foreground border-b">
                    <th className="py-2 text-left">Category</th>
                    <th className="py-2 text-right">Budgeted</th>
                    <th className="py-2 text-right">Actual</th>
                    <th className="py-2 text-right">Remaining</th>
                  </tr>
                </thead>
                <tbody>
                  {basics.map((b) => (
                    <BudgetRow key={b.name} {...b} />
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </section>

        <section>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold">Budget Categories</h2>
            <Dialog open={openAdd} onOpenChange={setOpenAdd}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline">Add Budget</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Add Budget</DialogTitle>
                </DialogHeader>
                <div className="max-h-60 overflow-y-auto space-y-2 py-2">
                  {availableCategories.map(name => {
                    const Icon = getIcon(name);
                    const checked = selectedCats.has(name);
                    return (
                      <div key={name} className="flex items-center justify-between py-1">
                        <div className="flex items-center gap-2">
                          <Icon className="w-4 h-4 text-muted-foreground" />
                          <span>{name}</span>
                        </div>
                        <Switch
                          checked={checked}
                          onCheckedChange={val => {
                            const next = new Set(selectedCats);
                            if (val) next.add(name);
                            else next.delete(name);
                            setSelectedCats(next);
                          }}
                        />
                      </div>
                    );
                  })}
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setSelectedCats(new Set());
                      setOpenAdd(false);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    onClick={handleAddCategories}
                    disabled={selectedCats.size === 0}
                  >
                    Add
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          
          <Card>
            <CardContent className="overflow-x-auto p-0">
              {validationError && (
                <div className="text-red-500 text-sm p-4 pb-2">
                  Category budgets exceed spending budget
                </div>
              )}
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-muted-foreground border-b">
                    <th className="py-2 text-left">Category</th>
                    <th className="py-2 text-right">Budgeted</th>
                    <th className="py-2 text-right">Actual</th>
                    <th className="py-2 text-right">Remaining</th>
                  </tr>
                </thead>
                <tbody>
                      {categoryRows.map((c) => (
                        <BudgetRow
                          key={c.id}
                          id={c.id}
                          name={c.name}
                          budgeted={c.budgeted}
                          actual={c.actual}
                          icon={c.icon}
                          editable={c.id !== "everything-else"}
                          onUpdate={handleBudgetUpdate}
                    />
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </section>
      </div>

      <Card className="md:col-span-1 md:sticky md:top-4 fixed bottom-0 inset-x-0 md:relative rounded-none md:rounded-lg border-t md:border bg-background shadow-md">
        <CardContent className="space-y-4 p-4">
          <h2 className="text-lg font-semibold">Summary</h2>
          <div className="flex flex-col items-center justify-center" aria-label={`Left to spend ${fmt.format(remaining)}`}>
            <svg viewBox="0 0 36 36" className={`w-24 h-24 ${ringColor}`} aria-hidden="true">
              <path
                d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831"
                fill="none"
                stroke="#e5e7eb"
                strokeWidth="3"
              />
              <path
                d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeDasharray={`${Math.max(Math.min(percentLeft, 100), 0)}, 100`}
              />

            </svg>
            <span className="text-xl font-semibold mt-2">{fmt.format(remaining)}</span>
            <span className="text-sm">Left to Spend</span>
            <span className="text-xs text-muted-foreground">
              {daysRemaining > 0 ? `${fmt.format(dailyAllowance)}/day` : ""}
            </span>
          </div>

          <div className="text-sm space-y-1">
            <div className="flex justify-between">
              <span>Spending Budget</span>
              <span>{fmt.format(Number(spendingBudget))}</span>
            </div>
            <div className="flex justify-between">
              <span>Current Spend</span>
              <span>{fmt.format(currentSpend)}</span>
            </div>
            <div className="flex justify-between font-medium">
              <span>Remaining</span>
              <span className={ringColor}>{fmt.format(remaining)}</span>
            
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
